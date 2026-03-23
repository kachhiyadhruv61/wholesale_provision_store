const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+919313616159';
const TWILIO_READY = Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN);

/**
 * Normalize phone number to WhatsApp format
 */
const normalizePhoneNumber = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.startsWith('+')) return digits;
  return `+${digits}`;
};

/**
 * Build WhatsApp delivery confirmation message
 */
const buildDeliveryMessage = (customerName, orderId, invoiceLink) => {
  const name = String(customerName || 'there').trim();
  const message = `Hello ${name},

📦 Your order #${orderId} has been delivered.

📄 Invoice:
${invoiceLink}

Please confirm delivery:
Reply YES → if received
Reply NO → if not received`;

  return message;
};

/**
 * Send delivery confirmation via Twilio WhatsApp
 */
const sendDeliveryConfirmationViaWhatsApp = async ({ to, customerName, orderId, invoiceLink }) => {
  if (!TWILIO_READY) {
    return { sent: false, reason: 'twilio-not-configured' };
  }

  const normalizedPhone = normalizePhoneNumber(to);
  if (!normalizedPhone) {
    return { sent: false, reason: 'invalid-phone' };
  }

  const message = buildDeliveryMessage(customerName, orderId, invoiceLink);
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

  const twilioTo = `whatsapp:${normalizedPhone}`;
  const fromNumber = TWILIO_WHATSAPP_FROM.startsWith('whatsapp:') ? TWILIO_WHATSAPP_FROM : `whatsapp:${TWILIO_WHATSAPP_FROM}`;

  const body = new URLSearchParams({
    To: twilioTo,
    From: fromNumber,
    Body: message,
  });

  try {
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
      message,
    };
  } catch (error) {
    return {
      sent: false,
      reason: 'network-error',
      error: error.message,
    };
  }
};

/**
 * Queue WhatsApp delivery confirmation message
 */
const queueWhatsAppDeliveryConfirmation = async ({ db, orderId, order, invoiceLink }) => {
  if (!order) {
    return { queued: false, reason: 'order-not-found' };
  }

  const phone = order?.customerPhone || order?.phone || order?.mobile || order?.whatsappNumber;
  if (!phone) {
    return { queued: false, reason: 'phone-not-found' };
  }

  const customerName = String(order?.customerName || order?.name || 'Customer').trim();
  const orderId_str = String(orderId || order?._id || order?.id || 'UNKNOWN');

  try {
    // Default invoice link format; can be customized
    const invoiceLink = order?.invoiceLink || `${process.env.INVOICE_LINK || 'https://wholesale-store.local/invoices'}/${orderId_str}`;

    const delivery = await sendDeliveryConfirmationViaWhatsApp({
      to: phone,
      customerName,
      orderId: orderId_str,
      invoiceLink,
    });

    if (!delivery.sent) {
      console.error(`WhatsApp delivery failed for order ${orderId_str}:`, delivery.reason);
      return { queued: false, reason: delivery.reason, delivery };
    }

    // Store delivery confirmation record
    const now = new Date();
    const confirmationRecord = {
      orderId: new ObjectId(orderId),
      customerPhone: normalizePhoneNumber(phone),
      customerName,
      messageType: 'whatsapp_delivery_confirmation',
      messageSid: delivery.providerMessageId,
      messageBody: delivery.message,
      status: 'sent',
      sentAt: now,
      confirmationStatus: null, // Will be updated when customer replies
      repliedAt: null,
      replyText: null,
      replySource: null,
    };

    const result = await db.collection('delivery_confirmations').insertOne(confirmationRecord);

    // Update order with delivery confirmation tracking
    await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          deliveryConfirmationId: result.insertedId,
          deliveryConfirmationStatus: 'pending',
          deliveryConfirmationSentAt: now,
          deliveryConfirmationPhone: normalizePhoneNumber(phone),
        },
      }
    );

    return {
      queued: true,
      confirmationId: result.insertedId,
      phone: normalizePhoneNumber(phone),
      messageSid: delivery.providerMessageId,
    };
  } catch (error) {
    console.error(`Error queuing WhatsApp delivery confirmation for order ${orderId}:`, error.message);
    return { queued: false, reason: 'database-error', error: error.message };
  }
};

/**
 * Process incoming WhatsApp reply and update order
 */
const processWhatsAppReply = async ({ orderId, phoneNumber, replyText, messageSid }) => {
  if (!orderId || !phoneNumber) {
    return { success: false, reason: 'missing-order-or-phone' };
  }

  try {
    const db = getDB();
    const reply = String(replyText || '').trim().toUpperCase();
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // Validate reply
    if (!['YES', 'NO'].includes(reply)) {
      return { success: false, reason: 'invalid-reply', message: 'Reply must be YES or NO' };
    }

    let confirmationStatus = 'unknown';
    let nextOrderStatus = 'delivered';

    if (reply === 'YES') {
      confirmationStatus = 'confirmed';
      nextOrderStatus = 'delivered';
    } else if (reply === 'NO') {
      confirmationStatus = 'delivery_issue';
      nextOrderStatus = 'delivery_issue';
    }

    const now = new Date();
    const orderObjectId = new ObjectId(orderId);

    // Update delivery confirmation record
    const confirmationUpdate = await db.collection('delivery_confirmations').updateOne(
      { orderId: orderObjectId, status: 'sent' },
      {
        $set: {
          confirmationStatus,
          replyText: reply,
          repliedAt: now,
          replySource: 'whatsapp',
          messageSid: messageSid || null,
        },
      }
    );

    // Update order status
    await db.collection('orders').updateOne(
      { _id: orderObjectId },
      {
        $set: {
          status: nextOrderStatus,
          deliveryConfirmationStatus: confirmationStatus,
          deliveryConfirmedAt: now,
        },
        $push: {
          statusHistory: {
            status: nextOrderStatus,
            at: now,
            reason: `WhatsApp delivery confirmation: ${reply}`,
          },
        },
      }
    );

    // Log delivery confirmation response
    await db.collection('delivery_confirmation_logs').insertOne({
      orderId: orderObjectId,
      phoneNumber: normalizedPhone,
      reply,
      confirmationStatus,
      processedAt: now,
      messageSid: messageSid || null,
    });

    return {
      success: true,
      orderId: orderId,
      confirmationStatus,
      nextOrderStatus,
      reply,
    };
  } catch (error) {
    console.error(`Error processing WhatsApp reply for order ${orderId}:`, error.message);
    return { success: false, reason: 'database-error', error: error.message };
  }
};

module.exports = {
  sendDeliveryConfirmationViaWhatsApp,
  queueWhatsAppDeliveryConfirmation,
  processWhatsAppReply,
  buildDeliveryMessage,
  normalizePhoneNumber,
  TWILIO_READY,
};
