import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../../src/models/user.model.js';

dotenv.config();

// Use simplified MONGODB_URI from environment
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://dev_user:dev_pass_123@localhost:27017/user_service_dev_db?authSource=admin';

console.log(`🔌 Connecting to MongoDB...`);
console.log(`🔗 URI: ${MONGODB_URI.replace(/:[^:@]*@/, ':***@')}`); // Hide password in logs

async function checkStatus() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get database info
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    console.log(`📂 Database: ${dbName}`);

    // Get collection stats
    const userCount = await User.countDocuments();
    console.log(`👥 Total Users: ${userCount}`);

    if (userCount > 0) {
      // Get user distribution by role
      const roleStats = await User.aggregate([
        { $unwind: '$roles' },
        { $group: { _id: '$roles', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      console.log('\n📊 User Distribution by Role:');
      roleStats.forEach((stat) => {
        console.log(`   ${stat._id}: ${stat.count}`);
      });

      // Get user distribution by tier
      const tierStats = await User.aggregate([
        { $group: { _id: '$tier', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      console.log('\n💎 User Distribution by Tier:');
      tierStats.forEach((stat) => {
        console.log(`   ${stat._id}: ${stat.count}`);
      });

      // Get active vs inactive users
      const statusStats = await User.aggregate([{ $group: { _id: '$isActive', count: { $sum: 1 } } }]);

      console.log('\n🔄 User Status:');
      statusStats.forEach((stat) => {
        const status = stat._id ? 'Active' : 'Inactive';
        console.log(`   ${status}: ${stat.count}`);
      });

      // Get recent users (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentUsers = await User.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
      });

      console.log(`\n📅 New Users (last 7 days): ${recentUsers}`);
    }

    // Get database size information
    const stats = await db.stats();
    const dbSize = (stats.dataSize / 1024 / 1024).toFixed(2); // Convert to MB
    const indexSize = (stats.indexSize / 1024 / 1024).toFixed(2); // Convert to MB

    console.log(`\n💾 Database Size: ${dbSize} MB`);
    console.log(`📇 Index Size: ${indexSize} MB`);
    console.log(`📄 Collections: ${stats.collections}`);
  } catch (error) {
    console.error('❌ Database status check failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

checkStatus();
