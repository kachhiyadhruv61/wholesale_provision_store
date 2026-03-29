const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');
const { isServiceablePincode, sanitizePincode } = require('../utils/serviceablePincodes');
const { queueWhatsAppDeliveryConfirmation } = require('../utils/whatsappDelivery');
const sendEmail = require('../utils/sendEmail');

const DISPATCH_STATUS_SET = new Set(['processing', 'shipped', 'out for delivery', 'dispatched']);
const BUSINESS_ORDER_NUMBER = '9313616159';
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_SMS_FROM = process.env.TWILIO_SMS_FROM || '';
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || '';
const ORDER_CONFIRM_BASE_URL = process.env.ORDER_CONFIRM_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

const GST_RULES = {
  Grocery: 5,
  'Pan Center': 28,
  'Masala Spices': 5,
  'Daily Used Product': 12,
  Snacks: 5,
  Biscuits: 5,
  Chocolates: 12,
};

const CATEGORY_ALIASES = {
  grains: 'Grocery',
  grocery: 'Grocery',
  grocerry: 'Grocery',
  'pan center': 'Pan Center',
  'masala spices': 'Masala Spices',
  'daily used product': 'Daily Used Product',
  snacks: 'Snacks',
  biscuit: 'Biscuits',
  biscuits: 'Biscuits',
  chocolate: 'Chocolates',
  chocolates: 'Chocolates',
};

const toMoney = (value) => Number(Number(value || 0).toFixed(2));

const normalizeCategory = (category) => {
  const key = String(category || '').trim().toLowerCase();
  if (!key) return '';
  return CATEGORY_ALIASES[key] || String(category || '').trim();
};

const getGstRateByCategory = (category) => Number(GST_RULES[normalizeCategory(category)] || 0);

const buildBilledItem = (item = {}) => {
  const quantity = Number(item.quantity || 1);
  const price = Number(item.price || 0);
  const category = normalizeCategory(item.category || '');
  const gstPercent = Number(item.gstPercent != null ? item.gstPercent : getGstRateByCategory(category));
  const subtotal = toMoney(price * quantity);
  const gstAmount = toMoney((subtotal * gstPercent) / 100);
  const total = toMoney(subtotal + gstAmount);

  return {
    ...item,
    name: String(item.name || ''),
    category,
    quantity,
    price,
    gstPercent,
    subtotal,
    gstAmount,
    total,
  };
};

const buildOrderBilling = (items = [], deliveryCharge = 0) => {
  const billedItems = Array.isArray(items) ? items.map(buildBilledItem) : [];
  const totalAmountBeforeGst = toMoney(billedItems.reduce((sum, item) => sum + item.subtotal, 0));
  const totalGst = toMoney(billedItems.reduce((sum, item) => sum + item.gstAmount, 0));
  const subtotalAfterGst = toMoney(totalAmountBeforeGst + totalGst);
  const safeDeliveryCharge = toMoney(deliveryCharge);
  const finalPayableAmount = toMoney(subtotalAfterGst + safeDeliveryCharge);

  return {
    items: billedItems,
    totalAmountBeforeGst,
    totalGst,
    subtotalAfterGst,
    deliveryCharge: safeDeliveryCharge,
    finalPayableAmount,
  };
};

const normalizePhoneNumber = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.startsWith('+')) return digits;
  return `+${digits}`;
};

const BUSINESS_SENDER_NUMBER = '+919313616159';
const TWILIO_READY = Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN);

const isDispatchLikeStatus = (value) => DISPATCH_STATUS_SET.has(String(value || '').trim().toLowerCase());
const CANCELLABLE_STATUS_SET = new Set(['pending', 'confirmed']);
const NON_CANCELLABLE_STATUS_SET = new Set(['shipped', 'delivered', 'cancelled']);

const isOnlinePaymentMethod = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return ['upi', 'card', 'bank', 'net banking'].includes(normalized);
};

const resolvePhoneFromAnyRecord = (record) => {
  if (!record) return '';
  return normalizePhoneNumber(
    record.phone ||
      record.phonenumber ||
      record.mobile ||
      record.whatsappNumber ||
      record.phoneNumber
  );
};

const extractCustomerPhone = async (db, order) => {
  const directPhone =
    order?.customerPhone ||
    order?.phone ||
    order?.mobile ||
    order?.whatsappNumber;

  const normalizedDirect = normalizePhoneNumber(directPhone);
  if (normalizedDirect) return normalizedDirect;

  const userIdRaw = String(order?.userId || order?.customerId || '').trim();
  const email = String(order?.email || order?.customerEmail || '').trim().toLowerCase();

  if (ObjectId.isValid(userIdRaw)) {
    const userById = await db.collection('users').findOne(
      { _id: new ObjectId(userIdRaw) },
      { projection: { phone: 1, phonenumber: 1, mobile: 1, whatsappNumber: 1 } }
    );
    const normalizedById = resolvePhoneFromAnyRecord(userById);
    if (normalizedById) return normalizedById;

    const registerById = await db.collection('registers').findOne(
      { _id: new ObjectId(userIdRaw) },
      { projection: { phone: 1, phonenumber: 1, mobile: 1, whatsappNumber: 1, phoneNumber: 1 } }
    );
    const normalizedRegisterById = resolvePhoneFromAnyRecord(registerById);
    if (normalizedRegisterById) return normalizedRegisterById;

    const loginById = await db.collection('logins').findOne(
      { _id: new ObjectId(userIdRaw) },
      { projection: { phone: 1, phonenumber: 1, mobile: 1, whatsappNumber: 1, phoneNumber: 1 } }
    );
    const normalizedLoginById = resolvePhoneFromAnyRecord(loginById);
    if (normalizedLoginById) return normalizedLoginById;
  }

  if (email) {
    const userByEmail = await db.collection('users').findOne(
      { email },
      { projection: { phone: 1, phonenumber: 1, mobile: 1, whatsappNumber: 1 } }
    );
    const normalizedByEmail = resolvePhoneFromAnyRecord(userByEmail);
    if (normalizedByEmail) return normalizedByEmail;

    const registerByEmail = await db.collection('registers').findOne(
      { email },
      { projection: { phone: 1, phonenumber: 1, mobile: 1, whatsappNumber: 1, phoneNumber: 1 } }
    );
    const normalizedRegisterByEmail = resolvePhoneFromAnyRecord(registerByEmail);
    if (normalizedRegisterByEmail) return normalizedRegisterByEmail;

    const loginByEmail = await db.collection('logins').findOne(
      { email },
      { projection: { phone: 1, phonenumber: 1, mobile: 1, whatsappNumber: 1, phoneNumber: 1 } }
    );
    const normalizedLoginByEmail = resolvePhoneFromAnyRecord(loginByEmail);
    if (normalizedLoginByEmail) return normalizedLoginByEmail;
  }

  return '';
};

const resolveEmailFromAnyRecord = (record) => {
  return String(record?.email || '').trim().toLowerCase();
};

const extractCustomerEmail = async (db, order) => {
  const directEmail = String(order?.customerEmail || order?.email || '').trim().toLowerCase();
  if (directEmail) return directEmail;

  const userIdRaw = String(order?.userId || order?.customerId || '').trim();
  if (userIdRaw.includes('@')) {
    return userIdRaw.toLowerCase();
  }

  if (ObjectId.isValid(userIdRaw)) {
    const userById = await db.collection('users').findOne(
      { _id: new ObjectId(userIdRaw) },
      { projection: { email: 1 } }
    );
    const emailById = resolveEmailFromAnyRecord(userById);
    if (emailById) return emailById;

    const registerById = await db.collection('registers').findOne(
      { _id: new ObjectId(userIdRaw) },
      { projection: { email: 1 } }
    );
    const registerEmailById = resolveEmailFromAnyRecord(registerById);
    if (registerEmailById) return registerEmailById;

    const loginById = await db.collection('logins').findOne(
      { _id: new ObjectId(userIdRaw) },
      { projection: { email: 1 } }
    );
    const loginEmailById = resolveEmailFromAnyRecord(loginById);
    if (loginEmailById) return loginEmailById;
  }

  if (userIdRaw) {
    const escapedUserId = userIdRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const userByUsername = await db.collection('users').findOne(
      {
        $or: [
          { username: { $regex: `^${escapedUserId}$`, $options: 'i' } },
          { email: { $regex: `^${escapedUserId}$`, $options: 'i' } },
        ],
      },
      { projection: { email: 1 } }
    );
    const userNameEmail = resolveEmailFromAnyRecord(userByUsername);
    if (userNameEmail) return userNameEmail;

    const registerByUsername = await db.collection('registers').findOne(
      {
        $or: [
          { username: { $regex: `^${escapedUserId}$`, $options: 'i' } },
          { email: { $regex: `^${escapedUserId}$`, $options: 'i' } },
        ],
      },
      { projection: { email: 1 } }
    );
    const registerUserEmail = resolveEmailFromAnyRecord(registerByUsername);
    if (registerUserEmail) return registerUserEmail;

    const loginByUsername = await db.collection('logins').findOne(
      {
        $or: [
          { username: { $regex: `^${escapedUserId}$`, $options: 'i' } },
          { email: { $regex: `^${escapedUserId}$`, $options: 'i' } },
        ],
      },
      { projection: { email: 1 } }
    );
    const loginUserEmail = resolveEmailFromAnyRecord(loginByUsername);
    if (loginUserEmail) return loginUserEmail;
  }

  return '';
};

const sendViaTwilio = async ({ channel, to, message }) => {
  if (!TWILIO_READY) {
    return { sent: false, reason: 'twilio-not-configured' };
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

  const isWhatsapp = channel === 'whatsapp';
  const fromNumber = isWhatsapp
    ? (TWILIO_WHATSAPP_FROM || `whatsapp:${BUSINESS_SENDER_NUMBER}`)
    : (TWILIO_SMS_FROM || BUSINESS_SENDER_NUMBER);

  if (!fromNumber) {
    return { sent: false, reason: 'missing-from-number' };
  }

  const twilioTo = isWhatsapp ? `whatsapp:${to}` : to;
  const body = new URLSearchParams({
    To: twilioTo,
    From: fromNumber,
    Body: message,
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const payload = await response.json();
  if (!response.ok) {
    return {
      sent: false,
      reason: payload?.message || `twilio-http-${response.status}`,
      provider: payload,
    };
  }

  return {
    sent: true,
    providerMessageId: payload?.sid || null,
    provider: payload,
  };
};

const createAndAttemptNotification = async (db, notification) => {
  const now = new Date();
  const insertResult = await db.collection('notifications').insertOne({
    ...notification,
    status: notification.status || 'queued',
    createdAt: notification.createdAt || now,
  });

  const delivery = await sendViaTwilio({
    channel: notification.channel,
    to: notification.to,
    message: notification.message,
  });

  if (delivery.sent) {
    await db.collection('notifications').updateOne(
      { _id: insertResult.insertedId },
      {
        $set: {
          status: 'sent',
          sentAt: new Date(),
          providerMessageId: delivery.providerMessageId,
          providerResponse: delivery.provider,
        },
      }
    );
    return { insertedId: insertResult.insertedId, status: 'sent' };
  }

  await db.collection('notifications').updateOne(
    { _id: insertResult.insertedId },
    {
      $set: {
        status: 'queued',
        deliveryReason: delivery.reason,
        providerResponse: delivery.provider || null,
      },
    }
  );
  return { insertedId: insertResult.insertedId, status: 'queued', reason: delivery.reason };
};

const queueDispatchConfirmation = async ({ db, orderId, order, force = false }) => {
  const shouldQueue = force || isDispatchLikeStatus(order?.status);
  if (!shouldQueue) {
    return { queued: false, reason: 'status-not-dispatch' };
  }

  const phone = await extractCustomerPhone(db, order);
  if (!phone) {
    return { queued: false, reason: 'phone-not-found' };
  }

  if (!force && order?.dispatchConfirmation?.requestedAt) {
    return { queued: false, reason: 'already-requested' };
  }

  const message = 'Tamaro order mali gayo? YES/NO reply karo';
  const now = new Date();
  const channels = ['whatsapp', 'sms'];

  for (const channel of channels) {
    await createAndAttemptNotification(db, {
      channel,
      to: phone,
      message,
      from: BUSINESS_SENDER_NUMBER,
      orderId: String(orderId),
      type: 'dispatch_confirmation',
      status: 'queued',
      createdAt: now,
      meta: { quickReplies: ['YES', 'NO'] },
    });
  }

  await db.collection('orders').updateOne(
    { _id: new ObjectId(orderId) },
    {
      $set: {
        dispatchConfirmation: {
          requestedAt: now,
          message,
          channels,
          phone,
          deliveryConfirmed: null,
          replyText: null,
          repliedAt: null,
        },
      },
      $push: {
        statusHistory: {
          status: 'Dispatch Confirmation Sent',
          at: now,
        },
      },
    }
  );

  return { queued: true, phone, channels, message };
};

const createOrderInvoice = async (db, orderDoc) => {
  const now = new Date();
  const billing = buildOrderBilling(orderDoc.items, orderDoc.deliveryCharge);
  const invoice = {
    invoiceId: `INV-${String(orderDoc.orderId || orderDoc._id || Date.now())}`,
    orderId: String(orderDoc._id),
    customerName: String(orderDoc.name || orderDoc.customerName || 'Customer'),
    customerPhone: String(orderDoc.customerPhone || ''),
    totalAmountBeforeGst: Number(orderDoc.totalAmountBeforeGst || billing.totalAmountBeforeGst || 0),
    totalGst: Number(orderDoc.totalGst || billing.totalGst || 0),
    subtotalAfterGst: Number(orderDoc.subtotalAfterGst || billing.subtotalAfterGst || 0),
    deliveryCharge: Number(orderDoc.deliveryCharge || billing.deliveryCharge || 0),
    finalPayableAmount: Number(orderDoc.finalPayableAmount || orderDoc.totalAmount || billing.finalPayableAmount || 0),
    totalAmount: Number(orderDoc.totalAmount || orderDoc.finalPayableAmount || billing.finalPayableAmount || 0),
    paymentMethod: String(orderDoc.payment || 'Unknown'),
    status: 'Generated',
    items: billing.items.map((item) => ({
      name: String(item.name || ''),
      category: String(item.category || ''),
      quantity: Number(item.quantity || 0),
      price: Number(item.price || 0),
      gstPercent: Number(item.gstPercent || 0),
      subtotal: Number(item.subtotal || 0),
      gstAmount: Number(item.gstAmount || 0),
      total: Number(item.total || 0),
    })),
    generatedAt: now,
    createdAt: now,
  };

  await db.collection('invoices').insertOne(invoice);
  return invoice;
};

const getOrCreateInvoiceForOrder = async (db, orderDoc) => {
  const existingInvoice = await db.collection('invoices').findOne({
    orderId: String(orderDoc._id),
  });

  if (existingInvoice) {
    return existingInvoice;
  }

  return createOrderInvoice(db, orderDoc);
};

const sendConfirmedOrderInvoiceEmail = async ({ db, orderDoc }) => {
  const email = await extractCustomerEmail(db, orderDoc);
  if (!email) {
    return { sent: false, reason: 'email-not-found' };
  }

  const invoice = await getOrCreateInvoiceForOrder(db, orderDoc);
  const amount = Number(orderDoc.finalPayableAmount || orderDoc.totalAmount || invoice?.totalAmount || 0).toFixed(2);
  const orderRef = String(orderDoc.orderId || orderDoc._id || 'N/A');
  const customerName = String(orderDoc.name || orderDoc.customerName || 'Customer');
  const confirmationToken = crypto.randomBytes(20).toString('hex');
  const orderObjectId = new ObjectId(String(orderDoc._id));
  const yesLink = `${ORDER_CONFIRM_BASE_URL}/orders/${String(orderDoc._id)}/email-confirmation?reply=YES&token=${confirmationToken}`;
  const noLink = `${ORDER_CONFIRM_BASE_URL}/orders/${String(orderDoc._id)}/email-confirmation?reply=NO&token=${confirmationToken}`;

  const itemRows = Array.isArray(invoice?.items)
    ? invoice.items.map((item) => {
      const lineTotal = Number(item?.total || 0).toFixed(2);
      return `<tr>
        <td style="padding:8px;border:1px solid #e5e7eb;">${String(item?.name || '')}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${Number(item?.quantity || 0)}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">Rs ${lineTotal}</td>
      </tr>`;
    }).join('')
    : '';

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="margin-bottom: 8px;">Order Confirmed</h2>
      <p>Hello ${customerName},</p>
      <p>Your order has been confirmed. Please find your invoice details below.</p>

      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin:14px 0;">
        <p style="margin:4px 0;"><strong>Order ID:</strong> ${orderRef}</p>
        <p style="margin:4px 0;"><strong>Invoice ID:</strong> ${String(invoice?.invoiceId || 'N/A')}</p>
        <p style="margin:4px 0;"><strong>Final Amount:</strong> Rs ${amount}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin:12px 0 16px;">
        <thead>
          <tr>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;background:#f3f4f6;">Item</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:center;background:#f3f4f6;">Qty</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;background:#f3f4f6;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows || '<tr><td colspan="3" style="padding:8px;border:1px solid #e5e7eb;">Invoice items will be shared soon.</td></tr>'}
        </tbody>
      </table>

      <p style="margin: 0 0 8px;"><strong>Order Received:</strong> please confirm below.</p>
      <div style="margin: 8px 0 14px; display: flex; gap: 10px; flex-wrap: wrap;">
        <a href="${yesLink}" style="display:inline-block;padding:10px 16px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">YES, Received</a>
        <a href="${noLink}" style="display:inline-block;padding:10px 16px;background:#dc2626;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">NO, Not Received</a>
      </div>
      <p style="margin: 0 0 8px;">If buttons do not work, reply to this email with <strong>YES</strong> or <strong>NO</strong>.</p>

      <p style="color:#6b7280;font-size:13px;">For support, call ${BUSINESS_ORDER_NUMBER}</p>
    </div>
  `;

  await sendEmail(email, `Order Confirmed - Invoice ${String(invoice?.invoiceId || '')}`, html);

  const now = new Date();
  await db.collection('orders').updateOne(
    { _id: orderObjectId },
    {
      $set: {
        customerEmail: email,
        invoiceId: String(invoice?.invoiceId || orderDoc.invoiceId || ''),
        invoiceGeneratedAt: invoice?.generatedAt || orderDoc.invoiceGeneratedAt || now,
        confirmationEmailSentAt: now,
        confirmationEmailToken: confirmationToken,
      },
      $push: {
        statusHistory: {
          status: 'Confirmation Email Sent',
          at: now,
        },
      },
    }
  );

  return { sent: true, email, invoiceId: String(invoice?.invoiceId || '') };
};

const renderEmailReplyHtml = ({ title, message, isSuccess }) => {
  const color = isSuccess ? '#166534' : '#991b1b';
  const bg = isSuccess ? '#ecfdf3' : '#fef2f2';
  const border = isSuccess ? '#bbf7d0' : '#fecaca';
  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;">
      <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:18px;">
        <h2 style="margin:0 0 8px;color:#111827;">${title}</h2>
        <p style="margin:0;padding:10px 12px;border-radius:8px;background:${bg};color:${color};border:1px solid ${border};">${message}</p>
      </div>
    </body>
  </html>`;
};

const recordEmailOrderReply = async (req, res, next) => {
  try {
    const db = getDB();
    const orderId = String(req.params.id || '').trim();
    const reply = String(req.query.reply || '').trim().toUpperCase();
    const token = String(req.query.token || '').trim();

    if (!ObjectId.isValid(orderId)) {
      return res.status(400).send(renderEmailReplyHtml({
        title: 'Invalid Link',
        message: 'Order ID is invalid.',
        isSuccess: false,
      }));
    }

    if (!['YES', 'NO'].includes(reply)) {
      return res.status(400).send(renderEmailReplyHtml({
        title: 'Invalid Response',
        message: 'Reply must be YES or NO.',
        isSuccess: false,
      }));
    }

    const orderObjectId = new ObjectId(orderId);
    const order = await db.collection('orders').findOne({ _id: orderObjectId });
    if (!order) {
      return res.status(404).send(renderEmailReplyHtml({
        title: 'Order Not Found',
        message: 'This order does not exist.',
        isSuccess: false,
      }));
    }

    if (!token || token !== String(order.confirmationEmailToken || '')) {
      return res.status(401).send(renderEmailReplyHtml({
        title: 'Unauthorized',
        message: 'This confirmation link is invalid or expired.',
        isSuccess: false,
      }));
    }

    const isReceived = reply === 'YES';
    const now = new Date();
    const updatePayload = {
      $set: {
        orderReceivedConfirmation: {
          source: 'email-link',
          reply,
          received: isReceived,
          repliedAt: now,
        },
        'dispatchConfirmation.deliveryConfirmed': isReceived,
        'dispatchConfirmation.replyText': reply,
        'dispatchConfirmation.repliedAt': now,
      },
      $push: {
        statusHistory: {
          status: isReceived ? 'Order Received Confirmed (Email)' : 'Order Not Received (Email)',
          at: now,
        },
      },
    };

    if (!isReceived) {
      updatePayload.$set.status = 'Issue Reported';
      updatePayload.$set.action = 'Customer marked not received via email';
      await db.collection('notifications').insertOne({
        channel: 'internal',
        type: 'order_received_email_escalation',
        orderId,
        message: 'Customer clicked NO on order received email confirmation.',
        status: 'queued',
        createdAt: now,
      });
    }

    await db.collection('orders').updateOne({ _id: orderObjectId }, updatePayload);

    return res.status(200).send(renderEmailReplyHtml({
      title: 'Thank You',
      message: isReceived
        ? 'We have recorded your YES response. Thank you for confirming delivery.'
        : 'We have recorded your NO response. Our team will contact you shortly.',
      isSuccess: true,
    }));
  } catch (error) {
    next(error);
  }
};

const queueOrderPlacedMessageAndInvoice = async ({ db, orderDoc, invoice, destinationPhone }) => {
  if (!destinationPhone) {
    return { queued: false, reason: 'phone-not-found' };
  }

  const message = [
    'Order placed successfully.',
    `Order ID: ${orderDoc.orderId || orderDoc._id}`,
    `Invoice: ${invoice.invoiceId}`,
    `Amount: Rs ${Number(orderDoc.totalAmount || 0).toFixed(2)}`,
    `For support call ${BUSINESS_ORDER_NUMBER}`,
  ].join(' ');

  const now = new Date();
  await createAndAttemptNotification(db, {
    channel: 'sms',
    to: destinationPhone,
    from: BUSINESS_SENDER_NUMBER,
    type: 'order_confirmation',
    orderId: String(orderDoc._id),
    invoiceId: invoice.invoiceId,
    message,
    status: 'queued',
    createdAt: now,
  });

  await createAndAttemptNotification(db, {
    channel: 'whatsapp',
    to: destinationPhone,
    from: BUSINESS_SENDER_NUMBER,
    type: 'invoice_notification',
    orderId: String(orderDoc._id),
    invoiceId: invoice.invoiceId,
    message,
    status: 'queued',
    createdAt: now,
    meta: {
      invoice: {
        invoiceId: invoice.invoiceId,
        totalAmount: invoice.totalAmount,
        generatedAt: invoice.generatedAt,
      },
    },
  });

  await createAndAttemptNotification(db, {
    channel: 'sms',
    to: destinationPhone,
    from: BUSINESS_SENDER_NUMBER,
    type: 'order_received_check',
    orderId: String(orderDoc._id),
    message: 'Tamaro order mali gayo? YES/NO reply karo',
    status: 'queued',
    createdAt: now,
    meta: { quickReplies: ['YES', 'NO'] },
  });

  await db.collection('orders').updateOne(
    { _id: new ObjectId(String(orderDoc._id)) },
    {
      $set: {
        customerPhone: destinationPhone,
        invoiceId: invoice.invoiceId,
        invoiceGeneratedAt: invoice.generatedAt,
      },
      $push: {
        statusHistory: {
          status: 'Invoice Sent',
          at: now,
        },
      },
    }
  );

  return { queued: true, destinationPhone, invoiceId: invoice.invoiceId };
};

// ✅ GET ALL ORDERS
const getOrders = async (req, res, next) => {
  try {
    const db = getDB();
    const orders = await db.collection("orders").find().toArray();

    res.json({ success: true, data: orders });

  } catch (error) {
    next(error);
  }
};

// ✅ GET ORDER BY ID
const getOrderById = async (req, res, next) => {
  try {
    const db = getDB();
    const order = await db.collection("orders").findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.json({ success: true, data: order });

  } catch (error) {
    next(error);
  }
};

// ✅ CREATE ORDER
const createOrder = async (req, res, next) => {
  try {
    const db = getDB();
    const normalizedPincode = sanitizePincode(req.body.pincode || req.body.deliveryPincode || '');

    if (!isServiceablePincode(normalizedPincode)) {
      return res.status(400).json({
        success: false,
        message: 'Sorry, delivery is not available in your area yet.',
        data: {
          pincode: normalizedPincode,
          serviceable: false,
        },
      });
    }

    const rawItems = Array.isArray(req.body.items) ? req.body.items : [];

    const quantityByProductId = rawItems.reduce((acc, item) => {
      const productId = String(item?.id || item?.productId || item?._id || "").trim();
      const qty = Number(item?.quantity || 0);
      if (!ObjectId.isValid(productId) || !Number.isFinite(qty) || qty <= 0) {
        return acc;
      }
      acc[productId] = (acc[productId] || 0) + qty;
      return acc;
    }, {});

    const stockReservations = [];
    const reservedEntries = Object.entries(quantityByProductId);

    for (const [productId, qty] of reservedEntries) {
      const reserveResult = await db.collection("products").updateOne(
        { _id: new ObjectId(productId), stock: { $gte: qty } },
        { $inc: { stock: -qty }, $set: { updatedAt: new Date() } }
      );

      if (reserveResult.modifiedCount === 0) {
        for (const reservation of stockReservations) {
          await db.collection("products").updateOne(
            { _id: new ObjectId(reservation.productId) },
            { $inc: { stock: reservation.qty }, $set: { updatedAt: new Date() } }
          );
        }

        const product = await db.collection("products").findOne({ _id: new ObjectId(productId) });
        const available = Number(product?.stock || 0);
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product?.name || "product"}. Available: ${available}, Requested: ${qty}`,
          data: {
            productId,
            available,
            requested: qty,
          },
        });
      }

      stockReservations.push({ productId, qty });
    }

    const billing = buildOrderBilling(rawItems, req.body.deliveryCharge || 0);

    const orderData = {
      ...req.body,
      orderId: req.body.orderId,
      userId: req.body.userId,
      date: req.body.date || new Date(),
      pincode: normalizedPincode,
      items: billing.items,
      totalAmountBeforeGst: Number(req.body.totalAmountBeforeGst || req.body.subtotal || billing.totalAmountBeforeGst),
      totalGst: Number(req.body.totalGst || billing.totalGst),
      subtotalAfterGst: Number(req.body.subtotalAfterGst || billing.subtotalAfterGst),
      deliveryCharge: Number(req.body.deliveryCharge || billing.deliveryCharge),
      finalPayableAmount: Number(req.body.finalPayableAmount || req.body.totalAmount || req.body.total || billing.finalPayableAmount),
      totalAmount: Number(req.body.totalAmount || req.body.total || req.body.finalPayableAmount || billing.finalPayableAmount),
      payment: req.body.payment,
      paymentStatus: req.body.paymentStatus || 'Pending',
      transactionId: String(req.body.transactionId || ''),
      status: req.body.status,
      action: req.body.action
    };

    let result;
    try {
      result = await db.collection("orders").insertOne(orderData);
    } catch (insertError) {
      for (const reservation of stockReservations) {
        await db.collection("products").updateOne(
          { _id: new ObjectId(reservation.productId) },
          { $inc: { stock: reservation.qty }, $set: { updatedAt: new Date() } }
        );
      }
      throw insertError;
    }

    const savedOrder = { ...orderData, _id: result.insertedId };

    let invoice = null;
    let notification = { queued: false, reason: 'not-attempted' };
    let destinationPhone = '';
    try {
      destinationPhone = await extractCustomerPhone(db, savedOrder);
      invoice = await createOrderInvoice(db, {
        ...savedOrder,
        customerPhone: destinationPhone,
      });

      // Immediately update order with invoice details
      if (invoice) {
        await db.collection('orders').updateOne(
          { _id: new ObjectId(String(result.insertedId)) },
          {
            $set: {
              invoiceId: invoice.invoiceId,
              invoiceGeneratedAt: invoice.generatedAt,
              customerPhone: destinationPhone,
              status: orderData.status || 'Pending'
            }
          }
        );
      }

      notification = await queueOrderPlacedMessageAndInvoice({
        db,
        orderDoc: { ...savedOrder, customerPhone: destinationPhone },
        invoice,
        destinationPhone,
      });
    } catch (notifyError) {
      console.error('Order notification/invoice flow failed:', notifyError.message);
    }

    // Return saved order with invoice details included
    const finalOrder = {
      ...savedOrder,
      invoiceId: invoice?.invoiceId || null,
      invoiceGeneratedAt: invoice?.generatedAt || null,
      customerPhone: destinationPhone || "",
    };

    res.status(201).json({
      success: true,
      message: "Order created",
      insertedId: result.insertedId,
      data: finalOrder,
      invoice,
      notification
    });

  } catch (error) {
    next(error);
  }
};

// ✅ UPDATE ORDER
const updateOrder = async (req, res, next) => {
  try {
    const db = getDB();
    const orderId = req.params.id;

    const existingOrder = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const previousStatus = String(existingOrder.status || '');
    const nextStatus = String(req.body.status || existingOrder.status || '');

    const result = await db.collection("orders").updateOne(
      { _id: new ObjectId(orderId) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    let confirmationEmail = null;
    const movedToConfirmed = nextStatus.toLowerCase() === 'confirmed' && previousStatus.toLowerCase() !== 'confirmed';
    const movedToDelivered = nextStatus.toLowerCase() === 'delivered' && previousStatus.toLowerCase() !== 'delivered';
    const shouldSendConfirmationEmail = movedToConfirmed || (movedToDelivered && !existingOrder?.confirmationEmailSentAt);
    if (shouldSendConfirmationEmail) {
      const refreshedOrder = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
      if (refreshedOrder) {
        try {
          confirmationEmail = await sendConfirmedOrderInvoiceEmail({ db, orderDoc: refreshedOrder });
        } catch (emailError) {
          confirmationEmail = { sent: false, reason: emailError.message || 'email-send-failed' };
        }
      }
    }

    let dispatchConfirmation = null;
    const movedToDispatch = isDispatchLikeStatus(nextStatus) && !isDispatchLikeStatus(previousStatus);
    if (movedToDispatch) {
      const refreshedOrder = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
      dispatchConfirmation = await queueDispatchConfirmation({
        db,
        orderId,
        order: refreshedOrder,
      });
    }

    // Send WhatsApp delivery confirmation when order is marked as delivered
    let whatsappConfirmation = null;
    if (movedToDelivered) {
      const refreshedOrder = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
      if (refreshedOrder) {
        whatsappConfirmation = await queueWhatsAppDeliveryConfirmation({
          db,
          orderId: orderId,
          order: refreshedOrder,
          invoiceLink: refreshedOrder?.invoiceLink || `${process.env.INVOICE_LINK || 'https://wholesale-store.local/invoices'}/${orderId}`,
        });
        
        if (whatsappConfirmation.queued) {
          console.log(`WhatsApp delivery confirmation sent for order ${orderId}`);
        } else {
          console.warn(`Failed to send WhatsApp delivery confirmation for order ${orderId}:`, whatsappConfirmation.reason);
        }
      }
    }

    res.json({ success: true, message: "Order updated", confirmationEmail, dispatchConfirmation, whatsappConfirmation });

  } catch (error) {
    next(error);
  }
};

const sendDispatchConfirmation = async (req, res, next) => {
  try {
    const db = getDB();
    const orderId = String(req.params.id || '').trim();
    if (!ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const result = await queueDispatchConfirmation({ db, orderId, order, force: true });
    if (!result.queued) {
      return res.status(400).json({ success: false, message: `Unable to queue confirmation (${result.reason})` });
    }

    res.json({ success: true, message: 'Dispatch confirmation queued', data: result });
  } catch (error) {
    next(error);
  }
};

const recordDispatchReply = async (req, res, next) => {
  try {
    const db = getDB();
    const orderId = String(req.body.orderId || '').trim();
    const rawReply = String(req.body.reply || req.body.message || '').trim().toUpperCase();

    if (!ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'Valid orderId is required' });
    }

    if (!['YES', 'NO'].includes(rawReply)) {
      return res.status(400).json({ success: false, message: 'Reply must be YES or NO' });
    }

    const orderObjectId = new ObjectId(orderId);
    const order = await db.collection('orders').findOne({ _id: orderObjectId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isConfirmed = rawReply === 'YES';
    const now = new Date();

    const updatePayload = {
      $set: {
        'dispatchConfirmation.deliveryConfirmed': isConfirmed,
        'dispatchConfirmation.replyText': rawReply,
        'dispatchConfirmation.repliedAt': now,
      },
      $push: {
        statusHistory: {
          status: isConfirmed ? 'Delivery Confirmed' : 'Delivery Issue Reported',
          at: now,
        },
      },
    };

    if (!isConfirmed) {
      updatePayload.$set.status = 'Issue Reported';
      updatePayload.$set.action = 'Customer marked not received';
      await db.collection('notifications').insertOne({
        channel: 'internal',
        type: 'dispatch_confirmation_escalation',
        orderId,
        message: 'Customer replied NO for dispatch confirmation.',
        status: 'queued',
        createdAt: now,
      });
    }

    await db.collection('orders').updateOne({ _id: orderObjectId }, updatePayload);

    res.json({
      success: true,
      message: isConfirmed ? 'Delivery confirmed by customer' : 'Delivery issue marked and escalated',
      data: { orderId, reply: rawReply, deliveryConfirmed: isConfirmed },
    });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const db = getDB();
    const orderId = String(req.params.id || '').trim();
    const reason = String(req.body.reason || '').trim();

    if (!ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
    }

    const orderObjectId = new ObjectId(orderId);
    const order = await db.collection('orders').findOne({ _id: orderObjectId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const currentStatus = String(order.status || '').trim().toLowerCase();
    if (NON_CANCELLABLE_STATUS_SET.has(currentStatus) && currentStatus !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled after it is shipped or delivered',
      });
    }

    if (currentStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled' });
    }

    if (!CANCELLABLE_STATUS_SET.has(currentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Only Pending or Confirmed orders can be cancelled',
      });
    }

    const orderItems = Array.isArray(order.items) ? order.items : [];
    if (!order?.stockRestoredOnCancel) {
      for (const item of orderItems) {
        const productId = String(item?.id || item?.productId || item?._id || '').trim();
        const qty = Number(item?.quantity || 0);

        if (!ObjectId.isValid(productId) || !Number.isFinite(qty) || qty <= 0) {
          continue;
        }

        await db.collection('products').updateOne(
          { _id: new ObjectId(productId) },
          { $inc: { stock: qty }, $set: { updatedAt: new Date() } }
        );
      }
    }

    const now = new Date();
    const paymentMethod = String(order.payment || order.paymentMethod || '').trim();
    const isOnlinePayment = isOnlinePaymentMethod(paymentMethod);

    const updatePayload = {
      $set: {
        status: 'Cancelled',
        action: 'Cancelled',
        cancelledAt: now,
        cancellationReason: reason,
        stockRestoredOnCancel: true,
        paymentStatus: isOnlinePayment ? 'Refunded' : String(order.paymentStatus || 'Pending'),
        refund: {
          applicable: isOnlinePayment,
          status: isOnlinePayment ? 'Processed' : 'Not Required',
          processedAt: isOnlinePayment ? now : null,
          amount: Number(order.finalPayableAmount || order.totalAmount || 0),
          reason: isOnlinePayment ? 'Order cancelled by customer' : 'Cash on delivery order cancelled',
        },
      },
      $push: {
        statusHistory: {
          status: 'Cancelled',
          at: now,
          reason,
        },
      },
    };

    await db.collection('orders').updateOne({ _id: orderObjectId }, updatePayload);
    const updatedOrder = await db.collection('orders').findOne({ _id: orderObjectId });

    res.json({
      success: true,
      message: isOnlinePayment
        ? 'Order cancelled, stock restored, and refund processed'
        : 'Order cancelled and stock restored',
      data: {
        order: updatedOrder,
        refund: updatedOrder?.refund || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ✅ DELETE ORDER
const deleteOrder = async (req, res, next) => {
  try {
    const db = getDB();

    const result = await db.collection("orders").deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.json({ success: true, message: "Order deleted" });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  cancelOrder,
  deleteOrder,
  sendDispatchConfirmation,
  recordDispatchReply,
  recordEmailOrderReply,
};