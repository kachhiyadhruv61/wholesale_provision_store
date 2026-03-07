const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const orderController = require('../controllers/ordercontroller');
const validate = require('../middleware/validationMiddleware');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order CRUD API with Delivery Details
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: List of orders
 *       500:
 *         description: Internal server error
 */
router.get('/orders', orderController.getOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by MongoDB ObjectId
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: MongoDB ObjectId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order found
 *       400:
 *         description: Invalid Order ID
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/orders/:id',
  param('id').isMongoId().withMessage('Invalid MongoDB ObjectId'),
  validate,
  orderController.getOrderById
);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create new order with delivery details
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - userId
 *               - totalAmount
 *               - payment
 *               - status
 *               - name
 *               - deliveryAddress
 *               - city
 *               - pincode
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: ORD003
 *               userId:
 *                 type: string
 *                 example: USER001
 *               totalAmount:
 *                 type: number
 *                 example: 5000
 *               payment:
 *                 type: string
 *                 example: UPI
 *               status:
 *                 type: string
 *                 example: Pending
 *               name:
 *                 type: string
 *                 example: Rahul Patel
 *               deliveryAddress:
 *                 type: string
 *                 example: Shop No 12, Market Road
 *               city:
 *                 type: string
 *                 example: Ahmedabad
 *               pincode:
 *                 type: string
 *                 example: 380001
 *               specialInstruction:
 *                 type: string
 *                 example: Deliver before 5 PM
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post(
  '/orders',

  body('orderId').notEmpty().withMessage('Order ID is required'),

  body('userId').notEmpty().withMessage('User ID is required'),

  body('totalAmount')
    .notEmpty().withMessage('Total amount is required')
    .isFloat({ gt: 0 }).withMessage('Total amount must be greater than 0'),

  body('payment')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['UPI', 'Card', 'Cash'])
    .withMessage('Payment must be UPI, Card or Cash'),

  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['Pending', 'Completed', 'Cancelled'])
    .withMessage('Status must be Pending, Completed or Cancelled'),

  // ✅ DELIVERY VALIDATIONS
  body('name').notEmpty().withMessage('Delivery name is required'),
  body('deliveryAddress').notEmpty().withMessage('Delivery address is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('pincode')
    .notEmpty().withMessage('Pincode is required')
    .isLength({ min: 6, max: 6 }).withMessage('Pincode must be 6 digits'),

  body('specialInstruction').optional(),

  validate,
  orderController.createOrder
);

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Update order (including delivery)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/orders/:id',
  param('id').isMongoId().withMessage('Invalid MongoDB ObjectId'),

  body('totalAmount').optional().isFloat({ gt: 0 }),
  body('payment').optional().isIn(['UPI', 'Card', 'Cash']),
  body('status').optional().isIn(['Pending', 'Completed', 'Cancelled']),
  body('delivery.name').optional(),
  body('delivery.deliveryAddress').optional(),
  body('delivery.city').optional(),
  body('delivery.pincode').optional(),
  body('delivery.specialInstruction').optional(),

  validate,
  orderController.updateOrder
);

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Delete order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/orders/:id',
  param('id').isMongoId().withMessage('Invalid MongoDB ObjectId'),
  validate,
  orderController.deleteOrder
);

module.exports = router;