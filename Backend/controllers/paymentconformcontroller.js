const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const razorpay = require('../middleware/razorpay');

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'JwAYo6QQvvn0NRDV4vehC52U';

const normalizePaymentMethod = (value) => {
  const method = String(value || '').trim().toLowerCase();
  if (method === 'upi') return 'UPI';
  if (method === 'card') return 'Card';
  if (method === 'bank' || method === 'net banking') return 'Net Banking';
  return 'Cash';
};

// ✅ CREATE RAZORPAY ORDER
const createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', orderId } = req.body;
    const amountNumber = Number(amount || 0);

    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
      });
    }

    const amountInPaise = Math.round(amountNumber * 100);
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: `rcpt_${Date.now()}`,
      notes: {
        orderId: String(orderId || ''),
      },
    });

    // Link Razorpay order to existing app order if provided.
    if (orderId && ObjectId.isValid(String(orderId))) {
      const db = getDB();
      await db.collection('orders').updateOne(
        { _id: new ObjectId(String(orderId)) },
        {
          $set: {
            razorpayOrderId: razorpayOrder.id,
            paymentStatus: 'Pending',
            updatedAt: new Date(),
          },
        }
      );
    }

    return res.json({
      success: true,
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ VERIFY PAYMENT STATUS
const verifyPaymentStatus = async (req, res, next) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'orderId, razorpay_order_id, razorpay_payment_id and razorpay_signature are required',
      });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    if (!ObjectId.isValid(String(orderId))) {
      return res.status(400).json({ success: false, message: 'Invalid orderId' });
    }

    const db = getDB();
    const now = new Date();
    const orderObjectId = new ObjectId(String(orderId));
    const result = await db.collection('orders').updateOne(
      { _id: orderObjectId },
      {
        $set: {
          paymentStatus: 'Paid',
          transactionId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paymentVerifiedAt: now,
          updatedAt: now,
        },
        $push: {
          statusHistory: {
            status: 'Payment Verified',
            at: now,
          },
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const updatedOrder = await db.collection('orders').findOne({ _id: orderObjectId });
    const paymentMethod = normalizePaymentMethod(
      updatedOrder?.paymentMethod || updatedOrder?.payment || ''
    );

    await db.collection('payments').updateOne(
      { orderId: String(orderId) },
      {
        $set: {
          orderId: String(orderId),
          transactionId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          amount: Number(
            updatedOrder?.finalPayableAmount ||
              updatedOrder?.totalAmount ||
              updatedOrder?.total ||
              0
          ),
          method: paymentMethod,
          paymentMethod,
          status: 'Completed',
          customerName: String(updatedOrder?.customerName || updatedOrder?.name || ''),
          customerEmail: String(updatedOrder?.customerEmail || updatedOrder?.email || ''),
          customerPhone: String(updatedOrder?.customerPhone || ''),
          date: updatedOrder?.date || now,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );

    return res.json({
      success: true,
      message: 'Payment verified and order marked as paid',
      data: {
        orderId: String(orderId),
        paymentStatus: 'Paid',
        transactionId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPaymentStatus,
};