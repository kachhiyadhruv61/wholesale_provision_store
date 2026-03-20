const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const productController = require('../controllers/productcontroller');
const validate = require('../middleware/validationMiddleware');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product CRUD API
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 */
router.get('/products', productController.getProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 */
router.get(
  '/products/:id',
  param('id').isMongoId().withMessage('Product ID must be a valid MongoDB ID'),
  validate,
  productController.getProductById
);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - purchasePrice
 *               - moq
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *                 example: Gold Ring
 *               price:
 *                 type: number
 *                 example: 2500
 *               purchasePrice:
 *                 type: number
 *                 example: 2000
 *               moq:
 *                 type: integer
 *                 example: 2
 *               stock:
 *                 type: integer
 *                 example: 10
 */
router.post(
  '/products',
  body('name')
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 3 }).withMessage('Product name must be at least 3 characters'),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),

  body('purchasePrice')
    .notEmpty().withMessage('Purchase price is required')
    .isFloat({ gt: 0 }).withMessage('Purchase price must be greater than 0'),

  body('moq')
    .notEmpty().withMessage('MOQ is required')
    .isInt({ gt: 0 }).withMessage('MOQ must be greater than 0'),

  body('stock')
    .notEmpty().withMessage('Stock is required')
    .isInt({ gt: -1 }).withMessage('Stock must be 0 or greater'),

  validate,
  productController.createProduct
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 */
router.put(
  '/products/:id',
  param('id').isMongoId().withMessage('Product ID must be a valid MongoDB ID'),

  body('name')
    .optional()
    .isLength({ min: 3 }).withMessage('Product name must be at least 3 characters'),

  body('price')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),

  body('purchasePrice')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Purchase price must be greater than 0'),

  body('moq')
    .optional()
    .isInt({ gt: 0 }).withMessage('MOQ must be greater than 0'),

  body('stock')
    .optional()
    .isInt({ gt: -1 }).withMessage('Stock must be 0 or greater'),

  validate,
  productController.updateProduct
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
 */
router.delete(
  '/products/:id',
  param('id').isMongoId().withMessage('Product ID must be a valid MongoDB ID'),
  validate,
  productController.deleteProduct
);

// ✅ INCREMENT STOCK
router.patch(
  '/products/:id/stock/increment',
  param('id').isMongoId().withMessage('Product ID must be a valid MongoDB ID'),
  body('quantity').optional().isFloat({ gt: 0 }).withMessage('quantity must be greater than 0'),
  validate,
  productController.incrementStock
);

// ✅ DECREMENT STOCK
router.patch(
  '/products/:id/stock/decrement',
  param('id').isMongoId().withMessage('Product ID must be a valid MongoDB ID'),
  body('quantity').optional().isFloat({ gt: 0 }).withMessage('quantity must be greater than 0'),
  validate,
  productController.decrementStock
);

module.exports = router;