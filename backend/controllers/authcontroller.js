const bcrypt = require("bcryptjs");
const { getDB } = require('../config/db');
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

const loginUser = async (req, res, next) => {
  try {

    const db = getDB();

    const { username, password } = req.body;

    const user = await db.collection("users").findOne({ username });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    // 🔐 Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { refreshToken } }
    );

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    next(error);
  }
};

// ✅ CREATE REGISTER

const createRegister = async (req, res, next) => {
  try {

    const db = getDB();

    const {
      name,
      username,
      email,
      password,
      phone,
      gender,
      emailOtp,
      address,
      pincode
    } = req.body;

    // 🔎 Check if username already exists
    const existingUsername = await db.collection("users").findOne({ username });

    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Username already exists"
      });
    }

    // 🔎 Check if email already exists
    const existingEmail = await db.collection("users").findOne({ email });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newRegister = {
      name,
      username,
      email,
      password: hashedPassword,
      role: "user",
      phone,
      gender,
      emailOtp: emailOtp || null,
      address,
      pincode,
      status: "Active",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection("users").insertOne(newRegister);

    res.status(201).json({
      success: true,
      message: "User registered successfully"
    });

  } catch (error) {
    next(error);
  }
};


const refreshToken = async (req, res) => {
  try {

    const db = getDB();
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required"
      });
    }    
    const decoded = jwt.verify(refreshToken, "qweuansdasdg123123");
    
    
    const user = await db.collection("users").findOne({
      _id: new ObjectId(decoded.id),
      refreshToken
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token"
      });
    }

    const accessToken = generateAccessToken(user);

    res.json({
      success: true,
      accessToken
    });

  } catch (error) {    
    res.status(401).json({
      success: false,
      message: "Invalid refresh token"
    });
  }
};

module.exports = {
  createRegister,
  loginUser,
  refreshToken
};