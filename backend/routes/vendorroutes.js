const express = require('express');
const { body, param } = require('express-validator');
const vendorController = require('../controllers/vendorcontroller');
const validate = require('../middleware/validationMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Vendors
 *   description: Vendor management API
 */

router.get('/vendors', vendorController.getVendors);

router.get(
  '/vendors/:id',
  param('id').notEmpty().withMessage('id is required'),
  validate,
  vendorController.getVendorById
);

router.post(
  '/vendors',
  body('vendorName').notEmpty().withMessage('vendorName is required'),
  body('companyName').notEmpty().withMessage('companyName is required'),
  body('mobileNumber')
    .notEmpty().withMessage('mobileNumber is required')
    .matches(/^\d{10}$/).withMessage('mobileNumber must be exactly 10 digits'),
  body('gstNumber').notEmpty().withMessage('gstNumber is required'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('email must be valid'),
  body('productCategory').notEmpty().withMessage('productCategory is required'),
  body('notes').optional().isString().withMessage('notes must be a string'),
  validate,
  vendorController.createVendor
);

router.put(
  '/vendors/:id',
  param('id').notEmpty().withMessage('id is required'),
  body('vendorName').optional().notEmpty().withMessage('vendorName cannot be empty'),
  body('companyName').optional().notEmpty().withMessage('companyName cannot be empty'),
  body('mobileNumber').optional().matches(/^\d{10}$/).withMessage('mobileNumber must be exactly 10 digits'),
  body('gstNumber').optional().notEmpty().withMessage('gstNumber cannot be empty'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('email must be valid'),
  body('productCategory').optional().notEmpty().withMessage('productCategory cannot be empty'),
  body('notes').optional().isString().withMessage('notes must be a string'),
  validate,
  vendorController.updateVendor
);

router.delete(
  '/vendors/:id',
  param('id').notEmpty().withMessage('id is required'),
  validate,
  vendorController.deleteVendor
);

module.exports = router;
