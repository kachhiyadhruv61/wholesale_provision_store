const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

const auth = async (req, res, next) => {
  try {

    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, "qweuansdasdg123123");

    const db = getDB();

    const user = await db.collection("users").findOne({
      _id: new ObjectId(decoded.id)
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user not found.'
      });
    }

    if (user.status !== "Active") {
      return res.status(401).json({
        success: false,
        message: 'Account is not active.'
      });
    }

    delete user.password;

    req.user = user;

    next();

  } catch (error) {

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error in authentication.'
    });

  }
};

module.exports = auth;