  const express = require('express');
  const { body, param } = require('express-validator');
  const router = express.Router();
  const loginController = require('../controllers/logincontroller');
  const validate = require('../middleware/validationMiddleware');

  /**
   * @swagger
   * tags:
   *   name: Auth
   *   description: User Authentication API
   */

  /**
   * @swagger
   * /auth/users:
   *   get:
   *     summary: Get all users
   *     tags: [Auth]
   *     responses:
   *       200:
   *         description: List of users
   *       400:
   *         description: invalid request
   *       401:
   *         description: unauthorized access
   *       404:
   *         description: LOGIN not found
   *       500:
   *         description: Internal server error
   */
  router.get('/auth/users', loginController.getLogins);

  /**
   * @swagger
   * /auth/register:
   *   post:
   *     summary: Register new user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - email
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 example: rahul
   *               email:
   *                 type: string
   *                 example: rahul@gmail.com
   *               password:
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
   *         description: LOGIN not found
   *       500:
   *         description: Internal server error
   */
  router.post(
    '/auth/register',
    body('username')
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),

    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Valid email is required'),

    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

    validate,
    loginController.registerLogin
  );

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: Login user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 example: rahul@gmail.com
   *               password:
   *                 type: string
   *                 example: 123456
   *     responses:
   *       200:
   *         description: Login successful
   *       400:
   *         description: invalid request
   *       401:
   *         description: unauthorized access
   *       404:
   *         description: LOGIN not found
   *       500:
   *         description: Internal server error
   */
  router.post(
    '/auth/login',
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Valid email is required'),

    body('password')
      .notEmpty().withMessage('Password is required'),

    validate,
    loginController.loginUser
  );

  /**
   * @swagger
   * /auth/users/{id}:
   *   delete:
   *     summary: Delete login
   *     tags: [Auth]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: User deleted
   *       400:
   *         description: invalid request
   *       401:
   *         description: unauthorized access
   *       404:
   *         description: LOGIN not found
   *       500:
   *         description: Internal server error
   */
  router.delete(
    '/auth/users/:id',
    param('id').isMongoId().withMessage('User ID must be a valid MongoDB ID'),
    validate,
    loginController.deleteLogin
  );

  module.exports = router;