const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');
const { getPincodeDeliveryMessage, isServiceablePincode, sanitizePincode } = require('../utils/serviceablePincodes');

const checkPincodeAvailability = async (req, res, next) => {
  try {
    const normalizedPincode = sanitizePincode(req.query?.pincode || req.body?.pincode || '');
    const serviceable = isServiceablePincode(normalizedPincode);

    res.json({
      success: true,
      data: {
        pincode: normalizedPincode,
        serviceable,
        message: getPincodeDeliveryMessage(normalizedPincode),
      },
    });
  } catch (error) {
    next(error);
  }
};

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
    const normalizedPincode = sanitizePincode(pincode);

    if (!isServiceablePincode(normalizedPincode)) {
      return res.status(400).json({
        success: false,
        message: 'Sorry, delivery is not available in your area yet.',
        data: {
          pincode: normalizedPincode,
          serviceable: false,
        },
      });
    }

    const newDelivery = {
      name,
      deliveryAddress,
      city,
      pincode: normalizedPincode,
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
    const normalizedPincode = pincode == null ? undefined : sanitizePincode(pincode);

    if (normalizedPincode != null && !isServiceablePincode(normalizedPincode)) {
      return res.status(400).json({
        success: false,
        message: 'Sorry, delivery is not available in your area yet.',
        data: {
          pincode: normalizedPincode,
          serviceable: false,
        },
      });
    }

    const updatePayload = {
      name,
      deliveryAddress,
      city,
      specialInstruction,
    };
    if (normalizedPincode !== undefined) {
      updatePayload.pincode = normalizedPincode;
    }

    const result = await db.collection("deliveries").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: updatePayload
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
  checkPincodeAvailability,
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  deleteDelivery
};