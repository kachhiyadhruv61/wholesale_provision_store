const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildUserResponse = (registerUser = null, loginUser = null, legacyUser = null) => ({
  _id: registerUser?._id || legacyUser?._id || null,
  registerId: registerUser?._id || null,
  loginId: loginUser?._id || null,
  username: loginUser?.username || registerUser?.username || legacyUser?.username || "",
  email: loginUser?.email || registerUser?.email || legacyUser?.email || "",
  fullname: registerUser?.fullname || legacyUser?.name || "",
  shopname: registerUser?.shopname || "",
  shopaddress: registerUser?.shopaddress || legacyUser?.address || "",
  phonenumber: registerUser?.phonenumber || legacyUser?.phone || "",
  city: registerUser?.city || "",
  state: registerUser?.state || "",
  pincode: registerUser?.pincode || legacyUser?.pincode || "",
  role: legacyUser?.role || "customer",
  createdAt: registerUser?.createdAt || loginUser?.createdAt || legacyUser?.createdAt || new Date(),
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

const normalizeRegisterPayload = (payload = {}, fallback = {}) => ({
  username: String(payload.username ?? fallback.username ?? "").trim(),
  fullname: String(payload.fullname ?? payload.ownerName ?? fallback.fullname ?? "").trim(),
  shopname: String(payload.shopname ?? payload.shopName ?? fallback.shopname ?? "").trim(),
  shopaddress: String(payload.shopaddress ?? payload.address ?? fallback.shopaddress ?? "").trim(),
  email: String(payload.email ?? fallback.email ?? "").trim().toLowerCase(),
  phonenumber: String(payload.phonenumber ?? payload.phone ?? fallback.phonenumber ?? "").trim(),
  city: String(payload.city ?? fallback.city ?? "Anand").trim(),
  state: String(payload.state ?? fallback.state ?? "Gujarat").trim(),
  pincode: String(payload.pincode ?? fallback.pincode ?? "").trim(),
  password: String(payload.password ?? fallback.password ?? ""),
  confirmpassword: String(
    payload.confirmpassword ?? payload.confirmPassword ?? fallback.confirmpassword ?? payload.password ?? fallback.password ?? ""
  ),
});

const buildRegisterMatch = (payload = {}) => ({
  $or: [
    { email: { $regex: `^${escapeRegExp(payload.email || "")}$`, $options: "i" } },
    { username: { $regex: `^${escapeRegExp(payload.username || "")}$`, $options: "i" } },
  ],
});

const isBcryptHash = (value = "") => typeof value === "string" && value.startsWith("$2");

const verifyPassword = async (plainPassword, savedPassword) => {
  if (!savedPassword) return false;
  if (isBcryptHash(savedPassword)) {
    return bcrypt.compare(String(plainPassword || ""), savedPassword);
  }
  return String(savedPassword) === String(plainPassword || "");
};

const getRegisters = async (req, res, next) => {
  try {
    const db = getDB();
    const registers = await db.collection("registers").find().sort({ createdAt: -1 }).toArray();

    res.json({ success: true, data: registers });
  } catch (error) {
    next(error);
  }
};

const createRegister = async (req, res, next) => {
  try {
    const db = getDB();
    const payload = normalizeRegisterPayload(req.body);

    if (!payload.username || !payload.email || !payload.password) {
      return res.status(400).json({
        success: false,
        message: "username, email and password are required"
      });
    }

    if (payload.password !== payload.confirmpassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    const existingRegister = await db.collection("registers").findOne(buildRegisterMatch(payload));
    if (existingRegister) {
      return res.status(400).json({
        success: false,
        message: "Username or email already registered"
      });
    }

    const registerDoc = {
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const registerResult = await db.collection("registers").insertOne(registerDoc);
    const loginRecord = await upsertLoginRecord(db, {
      username: payload.username,
      email: payload.email,
      password: payload.password,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      insertedId: registerResult.insertedId,
      data: buildUserResponse({ ...registerDoc, _id: registerResult.insertedId }, loginRecord)
    });
  } catch (error) {
    next(error);
  }
};

const updateRegister = async (req, res, next) => {
  try {
    const db = getDB();
    const registerId = String(req.params.id || "").trim();

    if (!ObjectId.isValid(registerId)) {
      return res.status(400).json({ success: false, message: "Invalid register ID" });
    }

    const existingRegister = await db.collection("registers").findOne({ _id: new ObjectId(registerId) });
    if (!existingRegister) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const payload = normalizeRegisterPayload(req.body, existingRegister);

    const conflictingRegister = await db.collection("registers").findOne({
      ...buildRegisterMatch(payload),
      _id: { $ne: new ObjectId(registerId) },
    });

    if (conflictingRegister) {
      return res.status(400).json({ success: false, message: "Username or email already registered" });
    }

    const updateDoc = {
      ...payload,
      updatedAt: new Date(),
    };

    await db.collection("registers").updateOne(
      { _id: new ObjectId(registerId) },
      { $set: updateDoc }
    );

    const loginRecord = await upsertLoginRecord(
      db,
      {
        username: updateDoc.username,
        email: updateDoc.email,
        password: updateDoc.password,
      },
      existingRegister.email
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: buildUserResponse({ ...existingRegister, ...updateDoc, _id: existingRegister._id }, loginRecord)
    });
  } catch (error) {
    next(error);
  }
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
    const identifier = String(req.body.identifier || req.body.email || req.body.username || "").trim();
    const { password } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Username or email is required"
      });
    }

    const normalizedIdentifier = escapeRegExp(identifier);

    let user = await db.collection("logins").findOne({
      $or: [
        { email: { $regex: `^${normalizedIdentifier}$`, $options: "i" } },
        { username: { $regex: `^${normalizedIdentifier}$`, $options: "i" } },
      ],
    });
    let registerUser = await findRegisterByIdentifier(db, identifier);

    const legacyUser = await db.collection("users").findOne({
      $or: [
        { email: { $regex: `^${normalizedIdentifier}$`, $options: "i" } },
        { username: { $regex: `^${normalizedIdentifier}$`, $options: "i" } },
      ],
    });

    if (!user && registerUser) {
      user = await upsertLoginRecord(db, {
        username: registerUser.username,
        email: registerUser.email,
        password: registerUser.password,
      });
    }

    if (!user && legacyUser?.email) {
      user = await upsertLoginRecord(db, {
        username: legacyUser.username,
        email: legacyUser.email,
        password: legacyUser.password,
      });
    }

    if (!registerUser && legacyUser?.email) {
      registerUser = await findRegisterByIdentifier(db, legacyUser.email);
    }

    if (!user && !registerUser && !legacyUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const savedPassword = user?.password || registerUser?.password || legacyUser?.password;
    const isPasswordValid = await verifyPassword(password, savedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
    }

    if (!registerUser && user?.email) {
      registerUser = await findRegisterByIdentifier(db, user.email);
    }

    const responseData = buildUserResponse(registerUser, user, legacyUser);

    res.json({
      success: true,
      message: "Login successful",
      data: responseData
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
  getRegisters,
  createRegister,
  updateRegister,
  getLogins,
  registerLogin,
  loginUser,
  changePassword,
  resetPassword,
  deleteLogin
};