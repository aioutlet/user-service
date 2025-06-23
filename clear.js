import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/user.model.js';

dotenv.config();

const MONGODB_CONNECTION_SCHEME = process.env.MONGODB_CONNECTION_SCHEME || 'mongodb';
const MONGODB_HOST = process.env.MONGODB_HOST || 'localhost';
const MONGODB_PORT = process.env.MONGODB_PORT || '27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'user-service-db';
const MONGODB_USERNAME = process.env.MONGODB_USERNAME || '';
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD || '';
const MONGODB_DB_PARAMS = process.env.MONGODB_DB_PARAMS || '';

let mongodb_uri = `${MONGODB_CONNECTION_SCHEME}://`;
if (MONGODB_USERNAME) {
  mongodb_uri += `${MONGODB_USERNAME}:${MONGODB_PASSWORD}@`;
}
mongodb_uri += `${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DB_NAME}`;
if (MONGODB_DB_PARAMS) {
  mongodb_uri += `?${MONGODB_DB_PARAMS}`;
}

async function clear() {
  await mongoose.connect(mongodb_uri);
  await User.deleteMany({});
  console.log('All users deleted!');
  await mongoose.disconnect();
}

clear();
