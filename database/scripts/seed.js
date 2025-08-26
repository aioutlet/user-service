import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../../src/models/user.model.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);

dotenv.config();

const MONGODB_CONNECTION_SCHEME = process.env.MONGODB_CONNECTION_SCHEME || 'mongodb';
const MONGODB_HOST = process.env.MONGODB_HOST || 'mongo-user-service';
const MONGODB_PORT = process.env.MONGODB_PORT || '27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'user_service_dev_db';
const MONGODB_USERNAME = process.env.MONGODB_USERNAME || 'userservice';
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD || 'user_mongo_dev_123';
const MONGODB_DB_PARAMS = process.env.MONGODB_DB_PARAMS || 'authSource=admin';

let mongodb_uri = `${MONGODB_CONNECTION_SCHEME}://`;
if (MONGODB_USERNAME) {
  mongodb_uri += `${MONGODB_USERNAME}:${MONGODB_PASSWORD}@`;
}
mongodb_uri += `${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DB_NAME}`;
if (MONGODB_DB_PARAMS) {
  mongodb_uri += `?${MONGODB_DB_PARAMS}`;
}

console.log(`🔌 Connecting to MongoDB: ${mongodb_uri.replace(MONGODB_PASSWORD, '***')}`);

async function seed() {
  try {
    await mongoose.connect(mongodb_uri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data first
    const deleteResult = await User.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing users`);

    // Read sample data
    const dataPath = join(dirname(__filename), '../data/sample-users.json');
    const users = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`📖 Read ${users.length} users from sample data`);

    // Hash passwords and insert users
    for (const user of users) {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }

    const insertResult = await User.insertMany(users);
    console.log(`✅ Successfully seeded ${insertResult.length} users!`);

    // Display seeded users summary
    const userSummary = insertResult.map((user) => ({
      email: user.email,
      roles: user.roles,
      tier: user.tier,
      addressCount: user.addresses?.length || 0,
      paymentCount: user.paymentMethods?.length || 0,
      wishlistCount: user.wishlist?.length || 0,
    }));

    console.table(userSummary);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

seed();
