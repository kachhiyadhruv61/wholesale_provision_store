const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

const mapRegisterPayload = (payload = {}) => {
  const nextRegister = {};

  if (payload.username !== undefined) {
    nextRegister.username = String(payload.username).trim();
  }

  if (payload.fullname !== undefined || payload.ownerName !== undefined) {
    nextRegister.fullname = String(payload.fullname ?? payload.ownerName).trim();
  }

  if (payload.shopname !== undefined || payload.shopName !== undefined) {
    nextRegister.shopname = String(payload.shopname ?? payload.shopName).trim();
  }

  if (payload.shopaddress !== undefined || payload.address !== undefined) {
    nextRegister.shopaddress = String(payload.shopaddress ?? payload.address).trim();
  }

  if (payload.email !== undefined) {
    nextRegister.email = String(payload.email).trim();
  }

  if (payload.phonenumber !== undefined || payload.phone !== undefined) {
    nextRegister.phonenumber = String(payload.phonenumber ?? payload.phone).trim();
  }

  if (payload.password !== undefined) {
    nextRegister.password = payload.password;
    nextRegister.confirmpassword = payload.confirmpassword ?? payload.password;
  } else if (payload.confirmpassword !== undefined) {
    nextRegister.confirmpassword = payload.confirmpassword;
  }

  if (payload.city !== undefined) {
    nextRegister.city = String(payload.city).trim();
  }

  if (payload.state !== undefined) {
    nextRegister.state = String(payload.state).trim();
  }

  if (payload.pincode !== undefined) {
    nextRegister.pincode = String(payload.pincode).trim();
  }

  return nextRegister;
};

const syncLoginRecord = async (db, registerUser, existingRegister = null) => {
  if (!registerUser?.email) {
    return null;
  }

  const loginFilter = {
    email: existingRegister?.email || registerUser.email,
  };

  const loginUpdate = {
    username: registerUser.username || existingRegister?.username || "",
    email: registerUser.email,
  };

  if (registerUser.password) {
    loginUpdate.password = registerUser.password;
  }

  await db.collection("logins").updateOne(
    loginFilter,
    {
      $set: loginUpdate,
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  return db.collection("logins").findOne({ email: registerUser.email });
};

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
      ...mapRegisterPayload(req.body),
      createdAt: new Date()
    };

    const result = await db.collection("registers").insertOne(newRegister);
    const createdRegister = await db.collection("registers").findOne({
      _id: result.insertedId
    });

    await syncLoginRecord(db, createdRegister);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      insertedId: result.insertedId,
      data: createdRegister
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

    const existingRegister = await db.collection("registers").findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!existingRegister) {
      return res.status(404).json({
        success: false,
        message: "Register user not found"
      });
    }

    const updates = mapRegisterPayload(req.body);

    const result = await db.collection("registers").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Register user not found"
      });
    }

    const updatedRegister = await db.collection("registers").findOne({
      _id: new ObjectId(req.params.id)
    });

    await syncLoginRecord(db, updatedRegister, existingRegister);

    res.json({
      success: true,
      message: "Register updated",
      data: updatedRegister
    });

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