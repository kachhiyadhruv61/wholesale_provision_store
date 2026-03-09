const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const deliveryController = require('../controllers/deliverycontroller');
const validate = require('../middleware/validationMiddleware');

/**
 * @swagger
 * tags:
 *   name: Deliveries
 *   description: Delivery CRUD API
 */

/**
 * @swagger
 * /deliveries:
 *   get:
 *     summary: Get all deliveries
 *     tags: [Deliveries]
 *     responses:
 *       200:
 *         description: List of deliveries
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: Delivery not found
 *       500:
 *         description: Internal server error
 */
router.get('/deliveries', deliveryController.getDeliveries);

/**
 * @swagger
 * /deliveries/{id}:
 *   get:
 *     summary: Get delivery by ID
 *     tags: [Deliveries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Delivery ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Delivery found
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: Delivery not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/deliveries/:id',
  param('id').isMongoId().withMessage('Delivery ID must be a valid MongoDB ID'),
  validate,
  deliveryController.getDeliveryById
);

/**
 * @swagger
 * /deliveries:
 *   post:
 *     summary: Create new delivery
 *     tags: [Deliveries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - deliveryAddress
 *               - city
 *               - pincode
 *             properties:
 *               name:
 *                 type: string
 *                 example: Rahul Patel
 *               deliveryAddress:
 *                 type: string
 *                 example: 123 MG Road
 *               city:
 *                 type: string
 *                 example: Surat
 *               pincode:
 *                 type: string
 *                 example: 395007
 *               specialInstruction:
 *                 type: string
 *                 example: Call before delivery
 *     responses:
 *       201:
 *         description: Delivery created
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: Delivery not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/deliveries',
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),

  body('deliveryAddress')
    .notEmpty().withMessage('Delivery address is required')
    .isLength({ min: 5 }).withMessage('Delivery address must be at least 5 characters'),

  body('city')
    .notEmpty().withMessage('City is required'),

  body('pincode')
    .notEmpty().withMessage('Pincode is required')
    .isLength({ min: 6, max: 6 }).withMessage('Pincode must be 6 digits')
    .isNumeric().withMessage('Pincode must be numeric'),

  body('specialInstruction')
    .optional()
    .isLength({ max: 200 }).withMessage('Special instruction max 200 characters'),

  validate,
  deliveryController.createDelivery
);

/**
 * @swagger
 * /deliveries/{id}:
 *   put:
 *     summary: Update delivery
 *     tags: [Deliveries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               deliveryAddress:
 *                 type: string
 *               city:
 *                 type: string
 *               pincode:
 *                 type: string
 *               specialInstruction:
 *                 type: string
 *     responses:
 *       200:
 *         description: Delivery updated
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: Delivery not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/deliveries/:id',
  param('id').isMongoId().withMessage('Delivery ID must be a valid MongoDB ID'),

  body('name')
    .optional()
    .isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),

  body('deliveryAddress')
    .optional()
    .isLength({ min: 5 }).withMessage('Delivery address must be at least 5 characters'),

  body('city')
    .optional()
    .notEmpty().withMessage('City cannot be empty'),

  body('pincode')
    .optional()
    .isLength({ min: 6, max: 6 }).withMessage('Pincode must be 6 digits')
    .isNumeric().withMessage('Pincode must be numeric'),

  body('specialInstruction')
    .optional()
    .isLength({ max: 200 }).withMessage('Special instruction max 200 characters'),

  validate,
  deliveryController.updateDelivery
);

/**
 * @swagger
 * /deliveries/{id}:
 *   delete:
 *     summary: Delete delivery
 *     tags: [Deliveries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Delivery deleted
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: Delivery not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/deliveries/:id',
  param('id').isMongoId().withMessage('Delivery ID must be a valid MongoDB ID'),
  validate,
  deliveryController.deleteDelivery
);

module.exports = router;