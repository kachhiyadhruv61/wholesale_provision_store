const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

const DISPATCH_STATUS_SET = new Set(['processing', 'shipped', 'out for delivery', 'dispatched']);
const BUSINESS_ORDER_NUMBER = '9313616159';
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_SMS_FROM = process.env.TWILIO_SMS_FROM || '';
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || '';

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
  const invoice = {
    invoiceId: `INV-${String(orderDoc.orderId || orderDoc._id || Date.now())}`,
    orderId: String(orderDoc._id),
    customerName: String(orderDoc.name || orderDoc.customerName || 'Customer'),
    customerPhone: String(orderDoc.customerPhone || ''),
    totalAmount: Number(orderDoc.totalAmount || 0),
    paymentMethod: String(orderDoc.payment || 'Unknown'),
    status: 'Generated',
    items: Array.isArray(orderDoc.items)
      ? orderDoc.items.map((item) => ({
          name: String(item?.name || ''),
          quantity: Number(item?.quantity || 0),
          price: Number(item?.price || 0),
        }))
      : [],
    generatedAt: now,
    createdAt: now,
  };

  await db.collection('invoices').insertOne(invoice);
  return invoice;
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

    const orderData = {
      ...req.body,
      orderId: req.body.orderId,
      userId: req.body.userId,
      date: req.body.date || new Date(),
      totalAmount: Number(req.body.totalAmount || req.body.total || 0),
      payment: req.body.payment,
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

    res.json({ success: true, message: "Order updated", dispatchConfirmation });

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
  deleteOrder,
  sendDispatchConfirmation,
  recordDispatchReply
};