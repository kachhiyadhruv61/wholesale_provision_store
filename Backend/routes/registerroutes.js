const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const registerController = require('../controllers/registercontroller');
const validate = require('../middleware/validationMiddleware');

/**
 * @swagger
 * tags:
 *   name: Register
 *   description: User Registration API
 */

/**
 * @swagger
 * /register:
 *   get:
 *     summary: Get all registered users
 *     tags: [Register]
 *     responses:
 *       200:
 *         description: List of registered users
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: USER not found
 *       500:
 *         description: Internal server error
 */
router.get('/register', registerController.getRegisters);

/**
 * @swagger
 * /register/{id}:
 *   get:
 *     summary: Get registered user by ID
 *     tags: [Register]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *      
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.get('/register/:id', registerController.getRegisterById);

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register new user
 *     tags: [Register]
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
 *                 example: dipali123
 *               fullname:
 *                 type: string
 *                 example: Dipali Patel
 *               shopname:
 *                 type: string
 *                 example: Patel Store
 *               shopaddress:
 *                 type: string
 *                 example: Surat, Gujarat
 *               email:
 *                 type: string
 *                 example: dipali@gmail.com
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
 *         description: User registered successfully
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: USER not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/register',
  body('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),

  body('fullname')
    .notEmpty().withMessage('Fullname is required'),

  body('shopname')
    .notEmpty().withMessage('Shopname is required'),

  body('shopaddress')
    .notEmpty().withMessage('Shopaddress is required'),

  body('email')
    .isEmail().withMessage('Valid email is required'),

  body('phonenumber')
    .isLength({ min: 10, max: 10 })
    .withMessage('Phone number must be 10 digits'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  body('confirmpassword')
    .notEmpty().withMessage('Confirm Password is required'),

  validate,
  registerController.createRegister
);

/**
 * @swagger
 * /register/{id}:
 *   put:
 *     summary: Update registered user
 *     tags: [Register]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: USER not found
 *       500:
 *         description: Internal server error
 */      
router.put(
  '/register/:id',
  registerController.updateRegister
);

/**
 * @swagger
 * /register/{id}:
 *   delete:
 *     summary: Delete registered user
 *     tags: [Register]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: USER not found
 *       500:
 *         description: Internal server error
 */
router.delete('/register/:id', registerController.deleteRegister);

module.exports = router;