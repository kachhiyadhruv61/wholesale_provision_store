const crypto = require('crypto');
const { processWhatsAppReply } = require('../utils/whatsappDelivery');
const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';

/**
 * Validate Twilio webhook signature
 * This ensures the request is genuinely from Twilio
 */
const validateTwilioWebhookSignature = (req, url) => {
  const authToken = TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.warn('TWILIO_AUTH_TOKEN not configured - webhook signature validation skipped');
    return true; // Skip validation if token not set
  }

  const signature = req.headers['x-twilio-signature'] || '';
  const params = req.body;

  // Build the data string from POST variables
  let data = url;
  const sortedKeys = Object.keys(params).sort();
  for (const key of sortedKeys) {
    data += key + params[key];
  }

  // Compute HMAC-SHA1 signature
  const computed = crypto
    .createHmac('sha1', authToken)
    .update(data)
    .digest('Base64');

  return computed === signature;
};

/**
 * Extract order ID from incoming WhatsApp message metadata
 * Twilio stores context in the incoming message
 */
const extractOrderIdFromContext = async (from, db) => {
  try {
    // Try to find order by customer phone
    const normalizedPhone = String(from || '').replace(/\D/g, '');
    if (normalizedPhone.length < 10) {
      return null;
    }

    const order = await db.collection('orders').findOne(
      {
        $or: [
          { deliveryConfirmationPhone: new RegExp(normalizedPhone) },
          { customerPhone: new RegExp(normalizedPhone) },
          { 'delivery.phone': new RegExp(normalizedPhone) },
        ],
        status: { $in: ['delivered', 'delivery_issue', 'out for delivery'] },
      },
      { sort: { deliveryConfirmationSentAt: -1, '_id': -1 } }
    );

    return order?._id?.toString() || null;
  } catch (error) {
    console.error('Error extracting order ID from context:', error.message);
    return null;
  }
};

/**
 * Handle incoming WhatsApp messages (webhook)
 */
const handleIncomingWhatsAppMessage = async (req, res, next) => {
  try {
    const db = getDB();

    // Validate Twilio signature
    const url = process.env.WEBHOOK_URL || `http://${req.get('host')}/webhooks/whatsapp`;
    const isValid = validateTwilioWebhookSignature(req, url);

    if (!isValid) {
      console.warn('Invalid Twilio webhook signature');
      // Still process but log the warning
    }

    // Extract message details
    const from = String(req.body.From || '').replace('whatsapp:', '').trim();
    const to = String(req.body.To || '').replace('whatsapp:', '').trim();
    const messageBody = String(req.body.Body || '').trim();
    const messageSid = String(req.body.MessageSid || '');
    const accountSid = String(req.body.AccountSid || '');

    // Extract order ID from context or infer from phone
    const orderId = await extractOrderIdFromContext(from, db);

    if (!orderId) {
      console.warn(`No matching order found for phone: ${from}`);
      return res.status(400).json({
        success: false,
        reason: 'no-matching-order',
        message: 'Could not find matching order for this phone number',
      });
    }

    // Process the reply
    const result = await processWhatsAppReply({
      orderId,
      phoneNumber: from,
      replyText: messageBody,
      messageSid,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        reason: result.reason,
        message: result.message || 'Failed to process reply',
      });
    }

    // Log the incoming message
    try {
      await db.collection('whatsapp_message_logs').insertOne({
        type: 'incoming',
        orderId: new ObjectId(orderId),
        from,
        to,
        messageBody,
        messageSid,
        accountSid,
        confirmationStatus: result.confirmationStatus,
        processedAt: new Date(),
        status: 'processed',
      });
    } catch (logError) {
      console.error('Error logging incoming message:', logError.message);
    }

    // Return success to Twilio (HTTP 200 OK)
    return res.json({
      success: true,
      orderId,
      confirmationStatus: result.confirmationStatus,
      message: `Delivery confirmation recorded: ${result.reply}`,
    });
  } catch (error) {
    console.error('Error in handleIncomingWhatsAppMessage:', error.message);
    next(error);
  }
};

/**
 * Get delivery confirmation status
 */
const getDeliveryConfirmationStatus = async (req, res, next) => {
  try {
    const db = getDB();
    const { orderId } = req.params;

    if (!orderId || !(/^[0-9a-f]{24}$/i.test(orderId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID',
      });
    }

    const orderObjectId = new ObjectId(orderId);

    const confirmation = await db.collection('delivery_confirmations').findOne(
      { orderId: orderObjectId },
      { sort: { sentAt: -1 } }
    );

    if (!confirmation) {
      return res.status(404).json({
        success: false,
        message: 'No delivery confirmation found for this order',
      });
    }

    const order = await db.collection('orders').findOne({ _id: orderObjectId });

    return res.json({
      success: true,
      data: {
        orderId,
        confirmationId: confirmation._id?.toString(),
        status: confirmation.confirmationStatus || confirmation.status,
        sentAt: confirmation.sentAt,
        repliedAt: confirmation.repliedAt,
        replyText: confirmation.replyText,
        customerPhone: confirmation.customerPhone,
        orderStatus: order?.status || 'unknown',
      },
    });
  } catch (error) {
    console.error('Error in getDeliveryConfirmationStatus:', error.message);
    next(error);
  }
};

/**
 * Send delivery confirmation manually (admin endpoint)
 */
const sendDeliveryConfirmationManually = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { invoiceLink } = req.body;

    if (!orderId || !(/^[0-9a-f]{24}$/i.test(orderId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID',
      });
    }

    const db = getDB();
    const orderObjectId = new ObjectId(orderId);
    const order = await db.collection('orders').findOne({ _id: orderObjectId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const { queueWhatsAppDeliveryConfirmation } = require('../utils/whatsappDelivery');

    const result = await queueWhatsAppDeliveryConfirmation({
      db,
      orderId: orderId,
      order,
      invoiceLink: invoiceLink || order.invoiceLink,
    });

    if (!result.queued) {
      return res.status(400).json({
        success: false,
        reason: result.reason,
        message: 'Failed to queue delivery confirmation',
      });
    }

    return res.json({
      success: true,
      message: 'Delivery confirmation queued successfully',
      data: {
        orderId,
        confirmationId: result.confirmationId?.toString(),
        messageSid: result.messageSid,
      },
    });
  } catch (error) {
    console.error('Error in sendDeliveryConfirmationManually:', error.message);
    next(error);
  }
};

/**
 * Resend delivery confirmation if no reply received
 */
const resendDeliveryConfirmation = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!orderId || !(/^[0-9a-f]{24}$/i.test(orderId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID',
      });
    }

    const db = getDB();
    const orderObjectId = new ObjectId(orderId);
    const order = await db.collection('orders').findOne({ _id: orderObjectId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const confirmation = await db.collection('delivery_confirmations').findOne(
      { orderId: orderObjectId },
      { sort: { sentAt: -1 } }
    );

    if (!confirmation) {
      return res.status(404).json({
        success: false,
        message: 'No delivery confirmation found for this order',
      });
    }

    // Check if already confirmed
    if (confirmation.confirmationStatus === 'confirmed' || confirmation.confirmationStatus === 'delivery_issue') {
      return res.status(400).json({
        success: false,
        message: 'Order already confirmed. Cannot resend.',
      });
    }

    const { queueWhatsAppDeliveryConfirmation } = require('../utils/whatsappDelivery');

    const result = await queueWhatsAppDeliveryConfirmation({
      db,
      orderId: orderId,
      order,
      invoiceLink: order.invoiceLink,
    });

    if (!result.queued) {
      return res.status(400).json({
        success: false,
        reason: result.reason,
        message: 'Failed to resend delivery confirmation',
      });
    }

    return res.json({
      success: true,
      message: 'Delivery confirmation resent successfully',
      data: {
        orderId,
        confirmationId: result.confirmationId?.toString(),
        messageSid: result.messageSid,
      },
    });
  } catch (error) {
    console.error('Error in resendDeliveryConfirmation:', error.message);
    next(error);
  }
};

module.exports = {
  handleIncomingWhatsAppMessage,
  getDeliveryConfirmationStatus,
  sendDeliveryConfirmationManually,
  resendDeliveryConfirmation,
  validateTwilioWebhookSignature,
};
