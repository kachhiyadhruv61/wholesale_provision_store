const bcrypt = require("bcryptjs"); 
const { getDB } = require('../config/db');
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const generateOTP = require("../utils/otp");
const sendEmail = require("../utils/sendEmail");

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
      username,
      fullname,
      shopname,
      shopaddress,
      email,
      phonenumber,
      password,
      // confirmpassword
    } = req.body;

    const existingUsername = await db.collection("users").findOne({ username });

    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Username already exists"
      });
    }

    const existingEmail = await db.collection("users").findOne({ email,status: "Active" });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const newRegister = {
      name: fullname,
      username,
      email,
      password: hashedPassword,
      role: "user",
      phone: phonenumber,
      shopname,
      address: shopaddress,
      otp: otp,
      otpExpiresAt,
      status: "Inactive",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection("users").insertOne(newRegister);
    await sendEmail(
 email,
  "Verify Your Email 🔐",
  `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Email Verification</h2>

      <p>Hello ${fullname},</p>

      <p>Your OTP for verification is:</p>

      <h1 style="
        letter-spacing: 5px;
        color: #2c3e50;
        background: #f4f4f4;
        display: inline-block;
        padding: 10px 20px;
        border-radius: 8px;
      ">
        ${otp}
      </h1>

      <p>This OTP is valid for <b>5 minutes</b>.</p>

      <p>If you did not request this, please ignore this email.</p>

      <br/>
      <p>Thanks,<br/>Your Team</p>
    </div>
  `
);

    res.status(201).json({
      success: true,
      message: "User registered successfully. Please verify OTP to activate account.",
      data: {
        email,
        username,
      }
    });

  } catch (error) {
    next(error);
  }
};

const verifyRegisterOtp = async (req, res, next) => {
  try {
    const db = getDB();
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required"
      });
    }

    const user = await db.collection("users").findOne({
      email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: "i" }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (String(user.status || "").toLowerCase() === "active") {
      return res.status(400).json({
        success: false,
        message: "Account is already active"
      });
    }

    if (!user.otp || String(user.otp) !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    if (user.otpExpiresAt && new Date(user.otpExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please register again to get a new OTP"
      });
    }

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          status: "Active",
          updatedAt: new Date(),
        },
        $unset: {
          otp: "",
          otpExpiresAt: "",
        }
      }
    );

    res.json({
      success: true,
      message: "OTP verified successfully. Your account is now active."
    });
  } catch (error) {
    next(error);
  }
};

const resendRegisterOtp = async (req, res, next) => {
  try {
    const db = getDB();
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const user = await db.collection("users").findOne({
      email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: "i" }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (String(user.status || "").toLowerCase() === "active") {
      return res.status(400).json({
        success: false,
        message: "Account already active. Please login."
      });
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          otp,
          otpExpiresAt,
          updatedAt: new Date(),
        }
      }
    );

    await sendEmail(
      user.email,
      "Resend OTP - Verify Your Email",
      `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Email Verification OTP</h2>
        <p>Hello ${user.name || user.username || "User"},</p>
        <p>Your new OTP is:</p>
        <h1 style="letter-spacing: 5px; color: #2c3e50; background: #f4f4f4; display: inline-block; padding: 10px 20px; border-radius: 8px;">
          ${otp}
        </h1>
        <p>This OTP is valid for <b>5 minutes</b>.</p>
      </div>
      `
    );

    res.json({
      success: true,
      message: "New OTP sent successfully"
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
  refreshToken,
  verifyRegisterOtp,
  resendRegisterOtp,
};