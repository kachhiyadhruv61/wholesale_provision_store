const crypto = require('crypto');

const EXPENSE_COLLECTION = 'expenses';

const NUMERIC_FIELDS = [
  'transportation_loading',
  'shop_warehouse_expenses',
  'staff_salary',
  'damages_wastage',
  'financial_charges',
  'taxes',
  'other_charges',
];

const toNonNegativeNumber = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
};

const toExpenseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const generateExpenseId = () => {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const calculateTotalExpense = (payload = {}) => {
  return NUMERIC_FIELDS.reduce((sum, field) => sum + Number(payload[field] || 0), 0);
};

const validateExpensePayload = (payload = {}, { partial = false } = {}) => {
  const errors = [];

  if (!partial || payload.date !== undefined) {
    const normalizedDate = toExpenseDate(payload.date);
    if (!normalizedDate) {
      errors.push('date is required and must be a valid date');
    }
  }

  NUMERIC_FIELDS.forEach((field) => {
    if (partial && payload[field] === undefined) {
      return;
    }

    const normalized = toNonNegativeNumber(payload[field]);
    if (normalized === null) {
      errors.push(`${field} must be a non-negative number`);
    }
  });

  return errors;
};

const buildExpenseDocument = (payload = {}, { partial = false } = {}) => {
  const base = {};

  if (!partial || payload.date !== undefined) {
    base.date = toExpenseDate(payload.date);
  }

  NUMERIC_FIELDS.forEach((field) => {
    if (partial && payload[field] === undefined) {
      return;
    }
    base[field] = Number(payload[field] || 0);
  });

  if (!partial || payload.notes !== undefined) {
    base.notes = payload.notes ? String(payload.notes).trim() : '';
  }

  return base;
};

module.exports = {
  EXPENSE_COLLECTION,
  NUMERIC_FIELDS,
  generateExpenseId,
  calculateTotalExpense,
  validateExpensePayload,
  buildExpenseDocument,
  toExpenseDate,
};
