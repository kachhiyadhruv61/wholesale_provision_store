const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const contactController = require('../controllers/contactcontroller');
const validate = require('../middleware/validationMiddleware');

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Contact Message API
 */

/**
 * @swagger
 * /contacts:
 *   get:
 *     summary: Get all contact messages
 *     tags: [Contact]
 *     responses:
 *       200:
 *         description: List of contact messages
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Internal server error
 */
router.get('/contacts', contactController.getContacts);

/**
 * @swagger
 * /contacts/{id}:
 *   get:
 *     summary: Get contact by ID
 *     tags: [Contact]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Contact ID
 *     responses:
 *       200:
 *         description: Contact found
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/contacts/:id',
  param('id').isInt().withMessage('Contact ID must be integer'),
  validate,
  contactController.getContactById
);

/**
 * @swagger
 * /contacts:
 *   post:
 *     summary: Send contact message
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phoneNumber
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 example: Rahul Patel
 *               email:
 *                 type: string
 *                 example: rahul@gmail.com
 *               phoneNumber:
 *                 type: string
 *                 example: 9876543210
 *               message:
 *                 type: string
 *                 example: I am interested in bulk purchase.
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/contacts',

  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),

  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Valid email is required'),

  body('phoneNumber')
    .notEmpty().withMessage('Phone number is required')
    .isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits')
    .isNumeric().withMessage('Phone number must be numeric'),

  body('message')
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 5 }).withMessage('Message must be at least 5 characters'),

  validate,
  contactController.createContact
);

/**
 * @swagger
 * /contacts/{id}:
 *   delete:
 *     summary: Delete contact message
 *     tags: [Contact]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Contact deleted successfully
 *       400:
 *         description: invalid request
 *       401:
 *         description: unauthorized access
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/contacts/:id',
  param('id').isInt().withMessage('Contact ID must be integer'),
  validate,
  contactController.deleteContact
);

module.exports = router;