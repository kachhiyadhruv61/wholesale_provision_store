const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

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

    const result = await db.collection("orders").insertOne(orderData);

    res.status(201).json({
      success: true,
      message: "Order created",
      insertedId: result.insertedId
    });

  } catch (error) {
    next(error);
  }
};

// ✅ UPDATE ORDER
const updateOrder = async (req, res, next) => {
  try {
    const db = getDB();

    const result = await db.collection("orders").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.json({ success: true, message: "Order updated" });

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
  deleteOrder
};