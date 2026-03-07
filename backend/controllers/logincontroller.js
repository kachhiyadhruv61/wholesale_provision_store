const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

// ✅ GET ALL USERS
const getLogins = async (req, res, next) => {
  try {
    const db = getDB();
    const users = await db.collection("logins").find().toArray();

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// ✅ REGISTER USER
const registerLogin = async (req, res, next) => {
  try {
    const db = getDB();
    const { username, email, password } = req.body;

    const existingUser = await db.collection("logins").findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    const newUser = {
      username,
      email,
      password,
      createdAt: new Date()
    };

    const result = await db.collection("logins").insertOne(newUser);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      insertedId: result.insertedId
    });

  } catch (error) {
    next(error);
  }
};

// ✅ LOGIN USER
const loginUser = async (req, res, next) => {
  try {
    const db = getDB();
    const { email, password } = req.body;

    const user = await db.collection("logins").findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      data: user
    });

  } catch (error) {
    next(error);
  }
};

// ✅ DELETE USER
const deleteLogin = async (req, res, next) => {
  try {
    const db = getDB();

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID"
      });
    }

    const result = await db.collection("logins").deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      message: "User deleted"
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLogins,
  registerLogin,
  loginUser,
  deleteLogin
};