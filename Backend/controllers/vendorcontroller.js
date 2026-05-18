const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');
const {
  VENDOR_COLLECTION,
  generateVendorId,
  validateVendorPayload,
  buildVendorDocument,
} = require('../models/Vendor');

const getVendorsCollection = () => getDB().collection(VENDOR_COLLECTION);

const toResponseVendor = (vendor) => {
  if (!vendor) return null;
  return {
    ...vendor,
    id: vendor.id || String(vendor._id),
  };
};

const createVendor = async (req, res, next) => {
  try {
    const validationErrors = validateVendorPayload(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', '),
      });
    }

    const now = new Date();
    const vendorDoc = {
      id: generateVendorId(),
      ...buildVendorDocument(req.body),
      created_at: now,
      updated_at: now,
    };

    const result = await getVendorsCollection().insertOne(vendorDoc);

    return res.status(201).json({
      success: true,
      message: 'Vendor created successfully',
      data: toResponseVendor({ ...vendorDoc, _id: result.insertedId }),
    });
  } catch (error) {
    next(error);
  }
};

const getVendors = async (req, res, next) => {
  try {
    const vendors = await getVendorsCollection()
      .find({})
      .sort({ created_at: -1, updated_at: -1 })
      .toArray();

    return res.json({
      success: true,
      count: vendors.length,
      data: vendors.map(toResponseVendor),
    });
  } catch (error) {
    next(error);
  }
};

const getVendorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { id }] }
      : { id };

    const vendor = await getVendorsCollection().findOne(filter);

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    return res.json({ success: true, data: toResponseVendor(vendor) });
  } catch (error) {
    next(error);
  }
};

const updateVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hasUpdatableField = [
      'vendorName',
      'companyName',
      'mobileNumber',
      'gstNumber',
      'email',
      'productCategory',
      'notes',
    ].some((field) => req.body[field] !== undefined);

    if (!hasUpdatableField) {
      return res.status(400).json({ success: false, message: 'No updatable fields provided' });
    }

    const validationErrors = validateVendorPayload(req.body, { partial: true });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', '),
      });
    }

    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { id }] }
      : { id };

    const existing = await getVendorsCollection().findOne(filter);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const updatePayload = {
      ...buildVendorDocument(req.body, { partial: true }),
      updated_at: new Date(),
    };

    await getVendorsCollection().updateOne(
      { _id: existing._id },
      { $set: updatePayload }
    );

    const updatedVendor = await getVendorsCollection().findOne({ _id: existing._id });

    return res.json({
      success: true,
      message: 'Vendor updated successfully',
      data: toResponseVendor(updatedVendor),
    });
  } catch (error) {
    next(error);
  }
};

const deleteVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { id }] }
      : { id };

    const result = await getVendorsCollection().deleteOne(filter);

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    return res.json({ success: true, message: 'Vendor deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
};
