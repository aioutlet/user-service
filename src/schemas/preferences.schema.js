import mongoose from 'mongoose';

const preferencesSchema = new mongoose.Schema(
  {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light',
    },
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: false,
      },
    },
  },
  { _id: false }
);

export default preferencesSchema;
