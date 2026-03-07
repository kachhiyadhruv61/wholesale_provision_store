const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://dreamit:dreamit@dreamit.d4cx1zx.mongodb.net";
const client = new MongoClient(uri);

let db;

const connectDB = async () => {
  await client.connect();
  db = client.db("DKTRADRES");
  console.log("MongoDB Connected");
};

const getDB = () => db;

module.exports = { connectDB, getDB };