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

    res.status(201).json({
      success: true,
      message: "Order created",
      insertedId: result.insertedId,
      data: { ...orderData, _id: result.insertedId }
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