const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const orderController = require('../controllers/ordercontroller');
const validate = require('../middleware/validationMiddleware');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order CRUD API
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
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: ORDER not found
 *       500:
 *         description: Internal server error
 */
router.get('/orders', orderController.getOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Order ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order found
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: ORDER not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/orders/:id',
  param('id').isMongoId().withMessage('Order ID must be a valid MongoDB ID'),
  validate,
  orderController.getOrderById
);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create new order
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
 *               - date
 *               - totalAmount
 *               - payment
 *               - status
 *               - action
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: ORD003
 *               userId:
 *                 type: integer
 *                 example: 1
 *               date:
 *                 type: string
 *                 example: 2026-02-17
 *               totalAmount:
 *                 type: number
 *                 example: 5000
 *               payment:
 *                 type: string
 *                 example: UPI
 *               status:
 *                 type: string
 *                 example: Pending
 *               action:
 *                 type: string
 *                 example: Processing
 *     responses:
 *       201:
 *         description: Order created
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: ORDER not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/orders',

  body('orderId')
    .notEmpty().withMessage('Order ID is required'),

  body('userId')
    .notEmpty().withMessage('User ID is required')
    .isString().withMessage('User ID must be a string'),

  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Date must be valid format (YYYY-MM-DD)'),

  body('totalAmount')
    .notEmpty().withMessage('Total amount is required')
    .isFloat({ gt: 0 }).withMessage('Total amount must be greater than 0'),

  body('payment')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['UPI', 'Card', 'Cash', 'COD', 'Bank', 'Net Banking'])
    .withMessage('Payment must be UPI, Card, Cash, COD or Bank'),

  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['Pending', 'Confirmed', 'Processing', 'Delivered', 'Completed', 'Cancelled'])
    .withMessage('Status must be Pending, Confirmed, Processing, Delivered, Completed or Cancelled'),

  body('action')
    .notEmpty().withMessage('Action is required'),

  body('items').optional().isArray().withMessage('items must be an array'),
  body('items.*.name').optional().isString().withMessage('item name must be a string'),
  body('items.*.category').optional().isString().withMessage('item category must be a string'),
  body('items.*.price').optional().isFloat({ gt: 0 }).withMessage('item price must be greater than 0'),
  body('items.*.quantity').optional().isInt({ gt: 0 }).withMessage('item quantity must be greater than 0'),
  body('items.*.gstPercent').optional().isFloat({ min: 0 }).withMessage('item gstPercent must be 0 or greater'),
  body('items.*.gstAmount').optional().isFloat({ min: 0 }).withMessage('item gstAmount must be 0 or greater'),
  body('items.*.subtotal').optional().isFloat({ min: 0 }).withMessage('item subtotal must be 0 or greater'),
  body('items.*.total').optional().isFloat({ min: 0 }).withMessage('item total must be 0 or greater'),
  body('totalAmountBeforeGst').optional().isFloat({ min: 0 }).withMessage('totalAmountBeforeGst must be 0 or greater'),
  body('totalGst').optional().isFloat({ min: 0 }).withMessage('totalGst must be 0 or greater'),
  body('subtotalAfterGst').optional().isFloat({ min: 0 }).withMessage('subtotalAfterGst must be 0 or greater'),
  body('finalPayableAmount').optional().isFloat({ min: 0 }).withMessage('finalPayableAmount must be 0 or greater'),

  validate,
  orderController.createOrder
);

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Update order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order updated
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: ORDER not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/orders/:id',
  param('id').isMongoId().withMessage('Order ID must be a valid MongoDB ID'),

  body('orderId').optional().notEmpty(),
  body('userId').optional().isInt().withMessage('User ID must be integer'),
  body('date').optional().isISO8601().withMessage('Date must be valid format'),
  body('totalAmount').optional().isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('payment').optional().isIn(['UPI', 'Card', 'Cash', 'COD', 'Bank', 'Net Banking']),
  body('status').optional().isIn(['Pending', 'Confirmed', 'Processing', 'Delivered', 'Completed', 'Cancelled']),
  body('action').optional(),

  validate,
  orderController.updateOrder
);

router.post(
  '/orders/:id/cancel',
  param('id').isMongoId().withMessage('Order ID must be a valid MongoDB ID'),
  body('reason').notEmpty().withMessage('Cancellation reason is required').isString().withMessage('Cancellation reason must be a string'),
  validate,
  orderController.cancelOrder
);

router.post(
  '/orders/:id/dispatch-confirmation',
  param('id').isMongoId().withMessage('Order ID must be a valid MongoDB ID'),
  validate,
  orderController.sendDispatchConfirmation
);

router.post(
  '/orders/dispatch-confirmation/reply',
  body('orderId').isMongoId().withMessage('orderId must be a valid MongoDB ID'),
  body('reply').notEmpty().withMessage('reply is required').isIn(['YES', 'NO', 'yes', 'no']).withMessage('reply must be YES or NO'),
  validate,
  orderController.recordDispatchReply
);

router.get(
  '/orders/:id/email-confirmation',
  orderController.recordEmailOrderReply
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
 *         
 *     responses:
 *       200:
 *         description: Order deleted
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: ORDER not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/orders/:id',
  param('id').isMongoId().withMessage('Order ID must be a valid MongoDB ID'),
  validate,
  orderController.deleteOrder
);

module.exports = router;