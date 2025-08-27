import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../../src/models/user.model.js';

dotenv.config();

// Use simplified MONGODB_URI from environment
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://dev_user:dev_pass_123@localhost:27017/user_service_dev_db?authSource=admin';

console.log(`🔌 Connecting to MongoDB...`);
console.log(`� URI: ${MONGODB_URI.replace(/:[^:@]*@/, ':***@')}`); // Hide password in logs

async function clear() {
  try {
    await mongoose.connect(MONGODB_URI);
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
