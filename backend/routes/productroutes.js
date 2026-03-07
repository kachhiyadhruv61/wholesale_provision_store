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
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/products', productController.getProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: MongoDB ObjectId
 *         schema:
 *           type: string
 */
router.get(
  '/products/:id',
  param('id')
    .isMongoId()
    .withMessage('Invalid Product ID'),
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
 *               - MOQ
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *                 example: Rice Bag
 *               price:
 *                 type: number
 *                 example: 1200
 *               purchasePrice:
 *                 type: number
 *                 example: 950
 *               MOQ:
 *                 type: integer
 *                 example: 5
 *               stock:
 *                 type: integer
 *                 example: 50
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
    .notEmpty().withMessage('Purchase Price is required')
    .isFloat({ gt: 0 }).withMessage('Purchase Price must be greater than 0'),

  body('MOQ')
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

  param('id')
    .isMongoId()
    .withMessage('Invalid Product ID'),

  body('name')
    .optional()
    .isLength({ min: 3 }).withMessage('Product name must be at least 3 characters'),

  body('price')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),

  body('purchasePrice')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Purchase Price must be greater than 0'),

  body('MOQ')
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
  param('id')
    .isMongoId()
    .withMessage('Invalid Product ID'),
  validate,
  productController.deleteProduct
);

module.exports = router;