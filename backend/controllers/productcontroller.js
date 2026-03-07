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
      stock: Number(req.body.stock || 0),
    };

    const result = await db.collection("products").insertOne(productData);

    res.status(201).json({
      success: true,
      message: "Product created",
      insertedId: result.insertedId
    });

  } catch (error) {
    next(error);
  }
};

// ✅ UPDATE PRODUCT
const updateProduct = async (req, res, next) => {
  try {
    const db = getDB();

    const result = await db.collection("products").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({ success: true, message: "Product updated" });

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
  deleteProduct
};