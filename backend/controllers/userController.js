const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

// ✅ GET ALL USERS
const getUsers = async (req, res, next) => {
  try {
    const db = getDB();
    const users = await db.collection("users").find().toArray();

    res.json({ success: true, data: users });

  } catch (error) {
    next(error);
  }
};

// ✅ GET USER BY ID
const getUserById = async (req, res, next) => {
  try {
    const db = getDB();
    const user = await db.collection("users").findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({ success: true, data: user });

  } catch (error) {
    next(error);
  }
};

// ✅ CREATE USER
const createUser = async (req, res, next) => {
  try {
    const db = getDB();
    const result = await db.collection("users").insertOne(req.body);

    res.status(201).json({
      success: true,
      message: "User created",
      insertedId: result.insertedId
    });

  } catch (error) {
    next(error);
  }
};

// ✅ UPDATE USER
const updateUser = async (req, res, next) => {
  try {
    const db = getDB();
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({ success: true, message: "User updated" });

  } catch (error) {
    next(error);
  }
};

// ✅ DELETE USER
const deleteUser = async (req, res, next) => {
  try {
    const db = getDB();
    const result = await db.collection("users").deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({ success: true, message: "User deleted" });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};