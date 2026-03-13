const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildUserResponse = (registerUser = null, loginUser = null) => ({
  _id: registerUser?._id || null,
  registerId: registerUser?._id || null,
  loginId: loginUser?._id || null,
  username: loginUser?.username || registerUser?.username || "",
  email: loginUser?.email || registerUser?.email || "",
  fullname: registerUser?.fullname || "",
  shopname: registerUser?.shopname || "",
  shopaddress: registerUser?.shopaddress || "",
  phonenumber: registerUser?.phonenumber || "",
  city: registerUser?.city || "",
  state: registerUser?.state || "",
  pincode: registerUser?.pincode || "",
  createdAt: registerUser?.createdAt || loginUser?.createdAt || new Date(),
});

const upsertLoginRecord = async (db, payload = {}, filterEmail = null) => {
  if (!payload?.email) {
    return null;
  }

  await db.collection("logins").updateOne(
    { email: filterEmail || payload.email },
    {
      $set: {
        username: payload.username || "",
        email: payload.email,
        ...(payload.password ? { password: payload.password } : {}),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  return db.collection("logins").findOne({ email: payload.email });
};

const findRegisterByIdentifier = async (db, identifier) => {
  const normalizedIdentifier = String(identifier || "").trim();
  if (!normalizedIdentifier) {
    return null;
  }

  return db.collection("registers").findOne({
    $or: [
      { email: { $regex: `^${escapeRegExp(normalizedIdentifier)}$`, $options: "i" } },
      { username: { $regex: `^${escapeRegExp(normalizedIdentifier)}$`, $options: "i" } },
    ],
  });
};

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

    let user = await db.collection("logins").findOne({ email });
    let registerUser = await db.collection("registers").findOne({ email });

    if (!user && registerUser) {
      user = await upsertLoginRecord(db, {
        username: registerUser.username,
        email: registerUser.email,
        password: registerUser.password,
      });
    }

    if (!user && !registerUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const savedPassword = user?.password || registerUser?.password;

    if (savedPassword !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
    }

    if (!registerUser && user?.email) {
      registerUser = await db.collection("registers").findOne({ email: user.email });
    }

    res.json({
      success: true,
      message: "Login successful",
      data: buildUserResponse(registerUser, user)
    });

  } catch (error) {
    next(error);
  }
};

// ✅ CHANGE PASSWORD
const changePassword = async (req, res, next) => {
  try {
    const db = getDB();
    const { userId, email, oldPassword, newPassword } = req.body;

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters"
      });
    }

    let registerUser = null;

    if (userId && ObjectId.isValid(userId)) {
      registerUser = await db.collection("registers").findOne({
        _id: new ObjectId(userId)
      });
    }

    if (!registerUser && email) {
      registerUser = await db.collection("registers").findOne({ email });
    }

    if (!registerUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const loginUserRecord = await db.collection("logins").findOne({ email: registerUser.email });
    const savedPassword = loginUserRecord?.password || registerUser.password;

    if (savedPassword !== oldPassword) {
      return res.status(401).json({
        success: false,
        message: "Incorrect old password"
      });
    }

    await db.collection("registers").updateOne(
      { _id: registerUser._id },
      {
        $set: {
          password: newPassword,
          confirmpassword: newPassword,
        },
      }
    );

    const updatedRegister = await db.collection("registers").findOne({
      _id: registerUser._id
    });
    const updatedLogin = await upsertLoginRecord(db, {
      username: updatedRegister.username,
      email: updatedRegister.email,
      password: newPassword,
    }, registerUser.email);

    res.json({
      success: true,
      message: "Password changed successfully",
      data: buildUserResponse(updatedRegister, updatedLogin)
    });
  } catch (error) {
    next(error);
  }
};

// ✅ RESET PASSWORD
const resetPassword = async (req, res, next) => {
  try {
    const db = getDB();
    const { identifier, newPassword } = req.body;

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters"
      });
    }

    const registerUser = await findRegisterByIdentifier(db, identifier);

    if (!registerUser) {
      return res.status(404).json({
        success: false,
        message: "User not found with provided details."
      });
    }

    await db.collection("registers").updateOne(
      { _id: registerUser._id },
      {
        $set: {
          password: newPassword,
          confirmpassword: newPassword,
        },
      }
    );

    const updatedRegister = await db.collection("registers").findOne({
      _id: registerUser._id
    });
    const updatedLogin = await upsertLoginRecord(db, {
      username: updatedRegister.username,
      email: updatedRegister.email,
      password: newPassword,
    }, registerUser.email);

    res.json({
      success: true,
      message: "Password reset successful",
      data: buildUserResponse(updatedRegister, updatedLogin)
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
  changePassword,
  resetPassword,
  deleteLogin
};