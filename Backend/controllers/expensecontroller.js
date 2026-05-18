const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const {
  EXPENSE_COLLECTION,
  NUMERIC_FIELDS,
  generateExpenseId,
  calculateTotalExpense,
  validateExpensePayload,
  buildExpenseDocument,
  toExpenseDate,
} = require('../models/Expense');

const getExpensesCollection = () => getDB().collection(EXPENSE_COLLECTION);

const toResponseExpense = (expense) => {
  if (!expense) return null;
  return {
    ...expense,
    id: expense.id || String(expense._id),
  };
};

const createExpense = async (req, res, next) => {
  try {
    const validationErrors = validateExpensePayload(req.body, { partial: false });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', '),
      });
    }

    const now = new Date();
    const expenseData = buildExpenseDocument(req.body, { partial: false });
    expenseData.total_expense = calculateTotalExpense(expenseData);

    const expenseDoc = {
      id: generateExpenseId(),
      ...expenseData,
      created_at: now,
      updated_at: now,
    };

    const result = await getExpensesCollection().insertOne(expenseDoc);

    return res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: toResponseExpense({ ...expenseDoc, _id: result.insertedId }),
    });
  } catch (error) {
    next(error);
  }
};

const getExpenses = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const filter = {};

    // Optional date filter: ?month=3&year=2026 OR ?year=2026
    if (year) {
      const parsedYear = Number(year);
      if (!Number.isInteger(parsedYear) || parsedYear < 1900) {
        return res.status(400).json({ success: false, message: 'year must be a valid number' });
      }

      let startDate;
      let endDate;

      if (month) {
        const parsedMonth = Number(month);
        if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
          return res.status(400).json({ success: false, message: 'month must be between 1 and 12' });
        }
        startDate = new Date(parsedYear, parsedMonth - 1, 1);
        endDate = new Date(parsedYear, parsedMonth, 1);
      } else {
        startDate = new Date(parsedYear, 0, 1);
        endDate = new Date(parsedYear + 1, 0, 1);
      }

      filter.date = { $gte: startDate, $lt: endDate };
    }

    const expenses = await getExpensesCollection().find(filter).sort({ date: -1, created_at: -1 }).toArray();

    return res.json({
      success: true,
      count: expenses.length,
      data: expenses.map(toResponseExpense),
    });
  } catch (error) {
    next(error);
  }
};

const getExpenseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { id }] }
      : { id };

    const expense = await getExpensesCollection().findOne(filter);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    return res.json({ success: true, data: toResponseExpense(expense) });
  } catch (error) {
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;

    const hasAnyUpdateField = ['date', 'notes', ...NUMERIC_FIELDS].some((field) => req.body[field] !== undefined);
    if (!hasAnyUpdateField) {
      return res.status(400).json({ success: false, message: 'No updatable fields provided' });
    }

    const validationErrors = validateExpensePayload(req.body, { partial: true });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', '),
      });
    }

    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { id }] }
      : { id };

    const existing = await getExpensesCollection().findOne(filter);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const updatedData = buildExpenseDocument(req.body, { partial: true });

    const mergedForTotal = {
      ...existing,
      ...updatedData,
    };

    mergedForTotal.date = updatedData.date || existing.date;
    if (req.body.date !== undefined) {
      mergedForTotal.date = toExpenseDate(req.body.date);
    }

    const total_expense = calculateTotalExpense(mergedForTotal);

    const updatePayload = {
      ...updatedData,
      total_expense,
      updated_at: new Date(),
    };

    const result = await getExpensesCollection().findOneAndUpdate(
      { _id: existing._id },
      { $set: updatePayload },
      { returnDocument: 'after' }
    );

    const updatedDoc = result?.value || result;

    return res.json({
      success: true,
      message: 'Expense updated successfully',
      data: toResponseExpense(updatedDoc),
    });
  } catch (error) {
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;

    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { id }] }
      : { id };

    const result = await getExpensesCollection().deleteOne(filter);

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    return res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
};
