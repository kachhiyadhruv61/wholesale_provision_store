const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

// ✅ GET ALL DELIVERIES
const getDeliveries = async (req, res, next) => {
  try {
    const db = getDB();
    const deliveries = await db.collection("deliveries").find().toArray();

    res.json({ success: true, data: deliveries });

  } catch (error) {
    next(error);
  }
};

// ✅ GET DELIVERY BY ID
const getDeliveryById = async (req, res, next) => {
  try {
    const db = getDB();

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery ID"
      });
    }

    const delivery = await db.collection("deliveries").findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found"
      });
    }

    res.json({ success: true, data: delivery });

  } catch (error) {
    next(error);
  }
};

// ✅ CREATE DELIVERY
const createDelivery = async (req, res, next) => {
  try {
    const db = getDB();

    const { name, deliveryAddress, city, pincode, specialInstruction } = req.body;

    const newDelivery = {
      name,
      deliveryAddress,
      city,
      pincode,
      specialInstruction,
      createdAt: new Date()
    };

    const result = await db.collection("deliveries").insertOne(newDelivery);

    res.status(201).json({
      success: true,
      message: "Delivery details saved",
      insertedId: result.insertedId
    });

  } catch (error) {
    next(error);
  }
};

// ✅ UPDATE DELIVERY
const updateDelivery = async (req, res, next) => {
  try {
    const db = getDB();

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery ID"
      });
    }

    const { name, deliveryAddress, city, pincode, specialInstruction } = req.body;

    const result = await db.collection("deliveries").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          name,
          deliveryAddress,
          city,
          pincode,
          specialInstruction
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found"
      });
    }

    res.json({ success: true, message: "Delivery updated" });

  } catch (error) {
    next(error);
  }
};

// ✅ DELETE DELIVERY
const deleteDelivery = async (req, res, next) => {
  try {
    const db = getDB();

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery ID"
      });
    }

    const result = await db.collection("deliveries").deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found"
      });
    }

    res.json({ success: true, message: "Delivery deleted" });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  deleteDelivery
};