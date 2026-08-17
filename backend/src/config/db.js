const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/baghnetra';

  try {
    // Attempt standard connection first with 3s timeout
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[BaghNetra-DB] Connected to MongoDB at ${mongoURI}`);
  } catch (err) {
    console.warn(`[BaghNetra-DB] External MongoDB unreachable (${err.message}). Starting embedded local MongoMemoryServer...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'baghnetra'
        }
      });
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log(`[BaghNetra-DB] Connected to embedded in-memory MongoDB engine at ${uri}`);
    } catch (memErr) {
      console.error(`[BaghNetra-DB] Failed to initialize embedded MongoDB: ${memErr.message}`);
      throw memErr;
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};

module.exports = { connectDB, disconnectDB };
