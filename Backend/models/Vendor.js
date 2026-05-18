const crypto = require('crypto');

const VENDOR_COLLECTION = 'vendors';

const REQUIRED_FIELDS = [
  'vendorName',
  'companyName',
  'mobileNumber',
  'gstNumber',
  'productCategory',
];

const generateVendorId = () => {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeMobileNumber = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length !== 10) return null;
  return digits;
};

const normalizeEmail = (value) => {
  if (value == null || String(value).trim() === '') return '';
  return String(value).trim().toLowerCase();
};

const isValidEmail = (value) => {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const validateVendorPayload = (payload = {}, { partial = false } = {}) => {
  const errors = [];

  REQUIRED_FIELDS.forEach((field) => {
    if (partial && payload[field] === undefined) return;
    if (!String(payload[field] || '').trim()) {
      errors.push(`${field} is required`);
    }
  });

  if (!partial || payload.mobileNumber !== undefined) {
    const normalizedMobile = normalizeMobileNumber(payload.mobileNumber);
    if (!normalizedMobile) {
      errors.push('mobileNumber must be exactly 10 digits');
    }
  }

  if (!partial || payload.email !== undefined) {
    const email = normalizeEmail(payload.email);
    if (!isValidEmail(email)) {
      errors.push('email must be a valid email address');
    }
  }

  return errors;
};

const buildVendorDocument = (payload = {}, { partial = false } = {}) => {
  const doc = {};

  if (!partial || payload.vendorName !== undefined) {
    doc.vendorName = String(payload.vendorName || '').trim();
  }
  if (!partial || payload.companyName !== undefined) {
    doc.companyName = String(payload.companyName || '').trim();
  }
  if (!partial || payload.mobileNumber !== undefined) {
    doc.mobileNumber = normalizeMobileNumber(payload.mobileNumber);
  }
  if (!partial || payload.gstNumber !== undefined) {
    doc.gstNumber = String(payload.gstNumber || '').trim().toUpperCase();
  }
  if (!partial || payload.email !== undefined) {
    doc.email = normalizeEmail(payload.email);
  }
  if (!partial || payload.productCategory !== undefined) {
    doc.productCategory = String(payload.productCategory || '').trim();
  }
  if (!partial || payload.notes !== undefined) {
    doc.notes = String(payload.notes || '').trim();
  }

  return doc;
};

module.exports = {
  VENDOR_COLLECTION,
  generateVendorId,
  validateVendorPayload,
  buildVendorDocument,
};
