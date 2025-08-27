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

// Use simplified MONGODB_URI from environment
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://dev_user:dev_pass_123@localhost:27017/user_service_dev_db?authSource=admin';

console.log(`🔌 Connecting to MongoDB...`);
console.log(`� URI: ${MONGODB_URI.replace(/:[^:@]*@/, ':***@')}`); // Hide password in logs

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
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
