const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

// ✅ GET ALL CONTACTS
const getContacts = async (req, res, next) => {
  try {
    const db = getDB();
    const contacts = await db.collection("contacts").find().toArray();

    res.json({ success: true, data: contacts });

  } catch (error) {
    next(error);
  }
};

// ✅ GET CONTACT BY ID
const getContactById = async (req, res, next) => {
  try {
    const db = getDB();

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact ID"
      });
    }

    const contact = await db.collection("contacts").findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    res.json({ success: true, data: contact });

  } catch (error) {
    next(error);
  }
};

// ✅ CREATE CONTACT (Contact Form Submit)
const createContact = async (req, res, next) => {
  try {
    const db = getDB();

    const newContact = {
      ...req.body,
      createdAt: new Date()
    };

    const result = await db.collection("contacts").insertOne(newContact);

    res.status(201).json({
      success: true,
      message: "Contact message submitted",
      insertedId: result.insertedId
    });

  } catch (error) {
    next(error);
  }
};

// ✅ UPDATE CONTACT
const updateContact = async (req, res, next) => {
  try {
    const db = getDB();

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact ID"
      });
    }

    const result = await db.collection("contacts").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    res.json({ success: true, message: "Contact updated" });

  } catch (error) {
    next(error);
  }
};

// ✅ DELETE CONTACT
const deleteContact = async (req, res, next) => {
  try {
    const db = getDB();

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact ID"
      });
    }

    const result = await db.collection("contacts").deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    res.json({ success: true, message: "Contact deleted" });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact
};