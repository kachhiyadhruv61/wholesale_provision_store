const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const paymentController = require('../controllers/paymentcontroller');
const validate = require('../middleware/validationMiddleware');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment CRUD API
 */

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: List of payments
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: PAYMENT not found
 *       500:
 *         description: Internal server error
 */
router.get('/payments', paymentController.getPayments);

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Payment ID
 *         
 *     responses:
 *       200:
 *         description: Payment found
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: PAYMENT not found
 *       500:
 *         description: Internal server error
 *      
 */
router.get(
  '/payments/:id',
  param('id').isMongoId().withMessage('Payment ID must be a valid MongoDB ID'),
  validate,
  paymentController.getPaymentById
);

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Create new payment
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - amount
 *               - method
 *               - status
 *               - date
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: ORD003
 *               amount:
 *                 type: number
 *                 example: 5000
 *               method:
 *                 type: string
 *                 example: UPI
 *               status:
 *                 type: string
 *                 example: Completed
 *               date:
 *                 type: string
 *                 example: 2026-02-17
 *     responses:
 *       201:
 *         description: Payment created
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: PAYMENT not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/payments',

  body('orderId')
    .notEmpty().withMessage('Order ID is required'),

  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),

  body('method')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['UPI', 'Card', 'Cash', 'COD', 'Bank', 'Net Banking'])
    .withMessage('Method must be UPI, Card, Cash, COD or Bank'),

  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['Pending', 'Completed', 'Paid', 'Failed', 'Refunded'])
    .withMessage('Status must be Pending, Completed, Paid, Failed or Refunded'),

  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Date must be valid format (YYYY-MM-DD)'),

  validate,
  paymentController.createPayment
);

/**
 * @swagger
 * /payments/{id}:
 *   put:
 *     summary: Update payment
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *        
 *     responses:
 *       200:
 *         description: Payment updated
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: PAYMENT not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/payments/:id',
  param('id').isMongoId().withMessage('Payment ID must be a valid MongoDB ID'),

  body('orderId')
    .optional()
    .notEmpty().withMessage('Order ID cannot be empty'),

  body('amount')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),

  body('method')
    .optional()
    .isIn(['UPI', 'Card', 'Cash', 'COD', 'Bank', 'Net Banking'])
    .withMessage('Method must be UPI, Card, Cash, COD or Bank'),

  body('status')
    .optional()
    .isIn(['Pending', 'Completed', 'Paid', 'Failed', 'Refunded'])
    .withMessage('Status must be Pending, Completed, Paid, Failed or Refunded'),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be valid format (YYYY-MM-DD)'),

  validate,
  paymentController.updatePayment
);

/**
 * @swagger
 * /payments/{id}:
 *   delete:
 *     summary: Delete payment
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *        
 *     responses:
 *       200:
 *         description: Payment deleted
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: PAYMENT not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/payments/:id',
  param('id').isMongoId().withMessage('Payment ID must be a valid MongoDB ID'),
  validate,
  paymentController.deletePayment
);

module.exports = router;