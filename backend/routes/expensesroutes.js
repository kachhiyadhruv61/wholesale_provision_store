const express = require('express');
const { body, param, query } = require('express-validator');
const expenseController = require('../controllers/expensecontroller');
const validate = require('../middleware/validationMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Expense management API
 */

// POST /expenses -> create new expense
router.post(
  '/expenses',
  body('date').notEmpty().withMessage('date is required').isISO8601().withMessage('date must be valid'),
  body('transportation_loading').notEmpty().withMessage('transportation_loading is required').isFloat({ min: 0 }).withMessage('transportation_loading must be non-negative'),
  body('shop_warehouse_expenses').notEmpty().withMessage('shop_warehouse_expenses is required').isFloat({ min: 0 }).withMessage('shop_warehouse_expenses must be non-negative'),
  body('staff_salary').notEmpty().withMessage('staff_salary is required').isFloat({ min: 0 }).withMessage('staff_salary must be non-negative'),
  body('damages_wastage').notEmpty().withMessage('damages_wastage is required').isFloat({ min: 0 }).withMessage('damages_wastage must be non-negative'),
  body('financial_charges').notEmpty().withMessage('financial_charges is required').isFloat({ min: 0 }).withMessage('financial_charges must be non-negative'),
  body('taxes').notEmpty().withMessage('taxes is required').isFloat({ min: 0 }).withMessage('taxes must be non-negative'),
  body('other_charges').notEmpty().withMessage('other_charges is required').isFloat({ min: 0 }).withMessage('other_charges must be non-negative'),
  body('notes').optional().isString().withMessage('notes must be a string'),
  validate,
  expenseController.createExpense
);

// GET /expenses -> get all expenses (optional ?month=&year=)
router.get(
  '/expenses',
  query('month').optional().isInt({ min: 1, max: 12 }).withMessage('month must be 1 to 12'),
  query('year').optional().isInt({ min: 1900 }).withMessage('year must be a valid number'),
  validate,
  expenseController.getExpenses
);

// GET /expenses/:id -> get single expense
router.get(
  '/expenses/:id',
  param('id').notEmpty().withMessage('id is required'),
  validate,
  expenseController.getExpenseById
);

// PUT /expenses/:id -> update expense
router.put(
  '/expenses/:id',
  param('id').notEmpty().withMessage('id is required'),
  body('date').optional().isISO8601().withMessage('date must be valid'),
  body('transportation_loading').optional().isFloat({ min: 0 }).withMessage('transportation_loading must be non-negative'),
  body('shop_warehouse_expenses').optional().isFloat({ min: 0 }).withMessage('shop_warehouse_expenses must be non-negative'),
  body('staff_salary').optional().isFloat({ min: 0 }).withMessage('staff_salary must be non-negative'),
  body('damages_wastage').optional().isFloat({ min: 0 }).withMessage('damages_wastage must be non-negative'),
  body('financial_charges').optional().isFloat({ min: 0 }).withMessage('financial_charges must be non-negative'),
  body('taxes').optional().isFloat({ min: 0 }).withMessage('taxes must be non-negative'),
  body('other_charges').optional().isFloat({ min: 0 }).withMessage('other_charges must be non-negative'),
  body('notes').optional().isString().withMessage('notes must be a string'),
  validate,
  expenseController.updateExpense
);

// DELETE /expenses/:id -> delete expense
router.delete(
  '/expenses/:id',
  param('id').notEmpty().withMessage('id is required'),
  validate,
  expenseController.deleteExpense
);

module.exports = router;
