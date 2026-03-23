const { MongoClient } = require('mongodb');

const DEFAULT_URI = 'mongodb+srv://dreamit:dreamit@dreamit.d4cx1zx.mongodb.net';
const MONGO_URI = process.env.MONGO_URI || DEFAULT_URI;
const DB_NAME = process.env.DB_NAME || 'DKTRADRES';

const client = new MongoClient(MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
});

let db = null;

const connectDB = async () => {
  if (db) {
    return db;
  }

  await client.connect();
  db = client.db(DB_NAME);
  await db.command({ ping: 1 });
  console.log(`MongoDB Connected: ${DB_NAME}`);
  return db;
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB() before using getDB().');
  }
  return db;
};

module.exports = { connectDB, getDB, client };