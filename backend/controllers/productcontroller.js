const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

// ✅ GET ALL PRODUCTS
const getProducts = async (req, res, next) => {
  try {
    const db = getDB();
    const products = await db.collection("products").find().toArray();

    res.json({ success: true, data: products });

  } catch (error) {
    next(error);
  }
};

// ✅ GET PRODUCT BY ID
const getProductById = async (req, res, next) => {
  try {
    const db = getDB();
    const product = await db.collection("products").findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({ success: true, data: product });

  } catch (error) {
    next(error);
  }
};

// ✅ CREATE PRODUCT
const createProduct = async (req, res, next) => {
  try {
    const db = getDB();

    const productData = {
      ...req.body,
      moq: Number(req.body.moq ?? req.body.MOQ ?? 1),
      price: Number(req.body.price || 0),
      purchasePrice: Number(req.body.purchasePrice ?? req.body.costPrice ?? 0),
      stock: Number(req.body.stock || 0),
      createdAt: new Date(),
    };

    const result = await db.collection("products").insertOne(productData);

    res.status(201).json({
      success: true,
      message: "Product created",
      insertedId: result.insertedId,
      data: { ...productData, _id: result.insertedId },
    });

  } catch (error) {
    next(error);
  }
};

// ✅ UPDATE PRODUCT
const updateProduct = async (req, res, next) => {
  try {
    const db = getDB();

    const updateFields = { ...req.body, updatedAt: new Date() };
    if (req.body.price !== undefined)         updateFields.price = Number(req.body.price);
    if (req.body.purchasePrice !== undefined) updateFields.purchasePrice = Number(req.body.purchasePrice);
    if (req.body.costPrice !== undefined)     updateFields.purchasePrice = Number(req.body.costPrice);
    if (req.body.stock !== undefined)         updateFields.stock = Number(req.body.stock);
    if (req.body.moq !== undefined)           updateFields.moq = Number(req.body.moq);

    const result = await db.collection("products").findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({ success: true, message: "Product updated", data: result });

  } catch (error) {
    next(error);
  }
};

// ✅ INCREMENT STOCK
const incrementStock = async (req, res, next) => {
  try {
    const db = getDB();
    const qty = Number(req.body.quantity ?? req.body.qty ?? 1);

    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: "quantity must be a positive number" });
    }

    const result = await db.collection("products").findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $inc: { stock: qty }, $set: { updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: `Stock increased by ${qty}`, data: result });

  } catch (error) {
    next(error);
  }
};

// ✅ DECREMENT STOCK
const decrementStock = async (req, res, next) => {
  try {
    const db = getDB();
    const qty = Number(req.body.quantity ?? req.body.qty ?? 1);

    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: "quantity must be a positive number" });
    }

    const product = await db.collection("products").findOne({ _id: new ObjectId(req.params.id) });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const currentStock = Number(product.stock || 0);
    if (currentStock < qty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${currentStock}, Requested: ${qty}`
      });
    }

    const updated = await db.collection("products").findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $inc: { stock: -qty }, $set: { updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    res.json({ success: true, message: `Stock decreased by ${qty}`, data: updated });

  } catch (error) {
    next(error);
  }
};

// ✅ DELETE PRODUCT
const deleteProduct = async (req, res, next) => {
  try {
    const db = getDB();

    const result = await db.collection("products").deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({ success: true, message: "Product deleted" });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  incrementStock,
  decrementStock,
};