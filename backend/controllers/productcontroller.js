const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

const getProductsCollection = () => getDB().collection('products');

const toUpdatedDocument = (result) => {
  if (!result) return null;
  if (typeof result === 'object' && 'value' in result) {
    return result.value || null;
  }
  return result;
};

// ✅ GET ALL PRODUCTS
const getProducts = async (req, res, next) => {
  try {
    const products = await getProductsCollection().find().toArray();

    res.json({ success: true, data: products });

  } catch (error) {
    next(error);
  }
};

// ✅ GET PRODUCT BY ID
const getProductById = async (req, res, next) => {
  try {
    const product = await getProductsCollection().findOne({
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
    const productData = {
      name: req.body.name,
      price: Number(req.body.price || 0),
      purchasePrice: Number(req.body.purchasePrice ?? req.body.costPrice ?? 0), // ✅ added
      moq: Number(req.body.moq ?? req.body.MOQ ?? 1),
      stock: Number(req.body.stock || 0),
      category: req.body.category || 'Others',
      description: req.body.description || '',
      image: req.body.image || '',
      unit: req.body.unit || 'unit',
      wholesalePrice: Number(req.body.wholesalePrice ?? req.body.purchasePrice ?? 0),
      sellCost: Number(req.body.sellCost ?? req.body.price ?? 0),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await getProductsCollection().insertOne(productData);

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
    const updateFields = {
      updatedAt: new Date()
    };

    if (req.body.name !== undefined)           updateFields.name = req.body.name;
    if (req.body.price !== undefined)          updateFields.price = Number(req.body.price);
    if (req.body.purchasePrice !== undefined)  updateFields.purchasePrice = Number(req.body.purchasePrice); // ✅ added
    if (req.body.costPrice !== undefined)      updateFields.purchasePrice = Number(req.body.costPrice);
    if (req.body.stock !== undefined)          updateFields.stock = Number(req.body.stock);
    if (req.body.moq !== undefined)            updateFields.moq = Number(req.body.moq);
    if (req.body.MOQ !== undefined)            updateFields.moq = Number(req.body.MOQ);
    if (req.body.category !== undefined)       updateFields.category = req.body.category;
    if (req.body.description !== undefined)    updateFields.description = req.body.description;
    if (req.body.image !== undefined)          updateFields.image = req.body.image;
    if (req.body.unit !== undefined)           updateFields.unit = req.body.unit;
    if (req.body.wholesalePrice !== undefined) updateFields.wholesalePrice = Number(req.body.wholesalePrice);
    if (req.body.sellCost !== undefined)       updateFields.sellCost = Number(req.body.sellCost);

    const result = await getProductsCollection().findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    const updatedDoc = toUpdatedDocument(result);

    if (!updatedDoc) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      message: "Product updated",
      data: updatedDoc
    });

  } catch (error) {
    next(error);
  }
};

// ✅ INCREMENT STOCK
const incrementStock = async (req, res, next) => {
  try {
    const qty = Number(req.body.quantity ?? req.body.qty ?? 1);

    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: "quantity must be a positive number" });
    }

    const result = await getProductsCollection().findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $inc: { stock: qty }, $set: { updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    const updatedDoc = toUpdatedDocument(result);

    if (!updatedDoc) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: `Stock increased by ${qty}`, data: updatedDoc });

  } catch (error) {
    next(error);
  }
};

// ✅ DECREMENT STOCK
const decrementStock = async (req, res, next) => {
  try {
    const qty = Number(req.body.quantity ?? req.body.qty ?? 1);

    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: "quantity must be a positive number" });
    }

    const product = await getProductsCollection().findOne({
      _id: new ObjectId(req.params.id)
    });

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

    const updated = await getProductsCollection().findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $inc: { stock: -qty }, $set: { updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    const updatedDoc = toUpdatedDocument(updated);

    res.json({
      success: true,
      message: `Stock decreased by ${qty}`,
      data: updatedDoc
    });

  } catch (error) {
    next(error);
  }
};

// ✅ DELETE PRODUCT
const deleteProduct = async (req, res, next) => {
  try {
    const result = await getProductsCollection().deleteOne({
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