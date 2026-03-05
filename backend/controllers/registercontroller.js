const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

// ✅ GET ALL REGISTERED USERS
const getRegisters = async (req, res, next) => {
  try {
    const db = getDB();
    const registers = await db.collection("registers").find().toArray();

    res.json({ success: true, data: registers });

  } catch (error) {
    next(error);
  }
};

// ✅ GET REGISTER BY ID
const getRegisterById = async (req, res, next) => {
  try {
    const db = getDB();

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid register ID"
      });
    }

    const register = await db.collection("registers").findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!register) {
      return res.status(404).json({
        success: false,
        message: "Register user not found"
      });
    }

    res.json({ success: true, data: register });

  } catch (error) {
    next(error);
  }
};

// ✅ CREATE REGISTER (User Signup)
const createRegister = async (req, res, next) => {
  try {
    const db = getDB();

    const newRegister = {
      ...req.body,
      createdAt: new Date()
    };

    const result = await db.collection("registers").insertOne(newRegister);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      insertedId: result.insertedId
    });

  } catch (error) {
    next(error);
  }
};

// ✅ UPDATE REGISTER
const updateRegister = async (req, res, next) => {
  try {
    const db = getDB();

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid register ID"
      });
    }

    const result = await db.collection("registers").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Register user not found"
      });
    }

    res.json({ success: true, message: "Register updated" });

  } catch (error) {
    next(error);
  }
};

// ✅ DELETE REGISTER
const deleteRegister = async (req, res, next) => {
  try {
    const db = getDB();

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid register ID"
      });
    }

    const result = await db.collection("registers").deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Register user not found"
      });
    }

    res.json({ success: true, message: "Register deleted" });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRegisters,
  getRegisterById,
  createRegister,
  updateRegister,
  deleteRegister
};