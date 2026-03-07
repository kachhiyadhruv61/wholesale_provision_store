const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

// ✅ GET ALL PAYMENTS
const getPayments = async (req, res, next) => {
  try {
    const db = getDB();
    const payments = await db.collection("payments").find().toArray();

    res.json({ success: true, data: payments });

  } catch (error) {
    next(error);
  }
};

// ✅ GET PAYMENT BY ID
const getPaymentById = async (req, res, next) => {
  try {
    const db = getDB();
    const payment = await db.collection("payments").findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    res.json({ success: true, data: payment });

  } catch (error) {
    next(error);
  }
};

// ✅ CREATE PAYMENT
const createPayment = async (req, res, next) => {
  try {
    const db = getDB();

    const paymentData = {
      orderId: req.body.orderId,
      amount: req.body.amount,
      paymentMethod: req.body.paymentMethod,
      status: req.body.status || 'pending',
      createdAt: new Date()
    };

    const result = await db.collection("payments").insertOne(paymentData);

    res.status(201).json({
      success: true,
      message: "Payment created",
      insertedId: result.insertedId
    });

  } catch (error) {
    next(error);
  }
};

// ✅ UPDATE PAYMENT
const updatePayment = async (req, res, next) => {
  try {
    const db = getDB();

    const result = await db.collection("payments").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    res.json({ success: true, message: "Payment updated" });

  } catch (error) {
    next(error);
  }
};

// ✅ DELETE PAYMENT
const deletePayment = async (req, res, next) => {
  try {
    const db = getDB();

    const result = await db.collection("payments").deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    res.json({ success: true, message: "Payment deleted" });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment
};