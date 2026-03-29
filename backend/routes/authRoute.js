const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authcontroller');
const validate = require('../middleware/validationMiddleware');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Register CRUD API
 */

/**
 * @swagger
 * /registers:
 *   post:
 *     summary: Create new register
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - fullname
 *               - shopname
 *               - shopaddress
 *               - email
 *               - phonenumber
 *               - password
 *               - confirmpassword
 *             properties:
 *               username:
 *                 type: string
 *                 example: dhruv123
 *               fullname:
 *                 type: string
 *                 example: Dhruv Kachhiya
 *               shopname:
 *                 type: string
 *                 example: DK Store
 *               shopaddress:
 *                 type: string
 *                 example: Anand, Gujarat
 *               email:
 *                 type: string
 *                 example: your@email.com
 *               phonenumber:
 *                 type: string
 *                 example: 9876543210
 *               password:
 *                 type: string
 *                 example: 123456
 *               confirmpassword:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       201:
 *         description: Register created
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Register not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/registers',

  body('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),

  body('fullname')
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 3 }).withMessage('Full name must be at least 3 characters'),

  body('shopname')
    .notEmpty().withMessage('Shop name is required'),

  body('shopaddress')
    .notEmpty().withMessage('Shop address is required'),

  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Valid email is required'),

  body('phonenumber')
    .notEmpty().withMessage('Phone number is required')
    .isLength({ min: 10 }).withMessage('Phone must be at least 10 digits'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  body('confirmpassword')
    .notEmpty().withMessage('Confirm password is required'),

  validate,
  authController.createRegister
);

router.post(
  '/registers/verify-otp',

  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Valid email is required'),

  body('otp')
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 4, max: 6 }).withMessage('OTP must be 4 to 6 digits'),

  validate,
  authController.verifyRegisterOtp
);

router.post(
  '/registers/resend-otp',

  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Valid email is required'),

  validate,
  authController.resendRegisterOtp
);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login user using username and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: dhruv123
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post(
  "/login",

  body('username')
    .notEmpty().withMessage('Username is required'),

  body('password')
    .notEmpty().withMessage('Password is required'),

  validate,
  authController.loginUser
);

/**
 * @swagger
 * /refresh-token:
 *   post:
 *     summary: Generate new access token using refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: your_refresh_token_here
 *     responses:
 *       200:
 *         description: New access token generated
 *       401:
 *         description: Invalid refresh token
 *       500:
 *         description: Internal server error
 */
router.post(
  "/refresh-token",

  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required'),

  validate,
  authController.refreshToken
);

module.exports = router;