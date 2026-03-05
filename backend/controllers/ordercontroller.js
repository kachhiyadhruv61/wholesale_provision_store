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

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order ID"
      });
    }

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

// ✅ CREATE ORDER (WITH DELIVERY DETAILS)
const createOrder = async (req, res, next) => {
  try {
    const db = getDB();

    const orderData = {
      orderId: req.body.orderId,
      userId: req.body.userId,
      date: req.body.date || new Date(),
      totalAmount: req.body.totalAmount,
      payment: req.body.payment,
      status: req.body.status,

      // ✅ DELIVERY DETAILS ADDED
      delivery: {
        name: req.body.name,
        deliveryAddress: req.body.deliveryAddress,
        city: req.body.city,
        pincode: req.body.pincode,
        specialInstruction: req.body.specialInstruction
      },

      createdAt: new Date()
    };

    const result = await db.collection("orders").insertOne(orderData);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      insertedId: result.insertedId
    });

  } catch (error) {
    next(error);
  }
};

// ✅ UPDATE ORDER (INCLUDING DELIVERY)
const updateOrder = async (req, res, next) => {
  try {
    const db = getDB();

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order ID"
      });
    }

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

    res.json({ success: true, message: "Order updated successfully" });

  } catch (error) {
    next(error);
  }
};

// ✅ DELETE ORDER
const deleteOrder = async (req, res, next) => {
  try {
    const db = getDB();

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order ID"
      });
    }

    const result = await db.collection("orders").deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.json({ success: true, message: "Order deleted successfully" });

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