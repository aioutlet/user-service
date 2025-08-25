import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../../src/models/user.model.js';

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

async function clear() {
  try {
    await mongoose.connect(mongodb_uri);
    console.log('✅ Connected to MongoDB');

    // Count existing users
    const userCount = await User.countDocuments();
    console.log(`📊 Found ${userCount} users in database`);

    if (userCount === 0) {
      console.log('💡 Database is already empty');
      return;
    }

    // Clear all users
    const deleteResult = await User.deleteMany({});
    console.log(`✅ Successfully deleted ${deleteResult.deletedCount} users!`);

    // Verify deletion
    const remainingCount = await User.countDocuments();
    if (remainingCount === 0) {
      console.log('🎉 Database cleared successfully!');
    } else {
      console.log(`⚠️  Warning: ${remainingCount} users still remain`);
    }
  } catch (error) {
    console.error('❌ Clear operation failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

clear();
