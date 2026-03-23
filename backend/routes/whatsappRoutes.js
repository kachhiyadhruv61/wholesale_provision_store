const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const whatsappController = require('../controllers/whatsappWebhookController');
const validate = require('../middleware/validationMiddleware');

/**
 * @swagger
 * tags:
 *   name: WhatsApp
 *   description: WhatsApp delivery confirmation API
 */

/**
 * @swagger
 * /webhooks/whatsapp:
 *   post:
 *     summary: Incoming WhatsApp message webhook (from Twilio)
 *     tags: [WhatsApp]
 *     description: Webhook endpoint for incoming WhatsApp messages. Automatically triggered by Twilio.
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               From:
 *                 type: string
 *                 example: whatsapp:+919876543210
 *               To:
 *                 type: string
 *                 example: whatsapp:+919313616159
 *               Body:
 *                 type: string
 *                 example: YES
 *               MessageSid:
 *                 type: string
 *               AccountSid:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message processed successfully
 *       400:
 *         description: No matching order found
 *       401:
 *         description: Invalid webhook signature
 *       500:
 *         description: Internal server error
 */
router.post(
  '/webhooks/whatsapp',
  whatsappController.handleIncomingWhatsAppMessage
);

/**
 * @swagger
 * /orders/{id}/delivery-confirmation/status:
 *   get:
 *     summary: Get delivery confirmation status
 *     tags: [WhatsApp]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Order ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Delivery confirmation status retrieved
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/orders/:id/delivery-confirmation/status',
  param('id').isMongoId().withMessage('Order ID must be a valid MongoDB ID'),
  validate,
  whatsappController.getDeliveryConfirmationStatus
);

/**
 * @swagger
 * /orders/{id}/delivery-confirmation/send:
 *   post:
 *     summary: Send delivery confirmation WhatsApp message (manual)
 *     tags: [WhatsApp]
 *     description: Manually send a delivery confirmation message for an order (admin use)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Order ID
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               invoiceLink:
 *                 type: string
 *                 example: https://wholesale-store.local/invoices/123
 *     responses:
 *       200:
 *         description: Delivery confirmation sent successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/orders/:id/delivery-confirmation/send',
  param('id').isMongoId().withMessage('Order ID must be a valid MongoDB ID'),
  body('invoiceLink').optional().isURL().withMessage('Invoice link must be a valid URL'),
  validate,
  whatsappController.sendDeliveryConfirmationManually
);

/**
 * @swagger
 * /orders/{id}/delivery-confirmation/resend:
 *   post:
 *     summary: Resend delivery confirmation WhatsApp message
 *     tags: [WhatsApp]
 *     description: Resend delivery confirmation if customer did not reply
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Order ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Delivery confirmation resent successfully
 *       400:
 *         description: Order already confirmed or invalid
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/orders/:id/delivery-confirmation/resend',
  param('id').isMongoId().withMessage('Order ID must be a valid MongoDB ID'),
  validate,
  whatsappController.resendDeliveryConfirmation
);

module.exports = router;
