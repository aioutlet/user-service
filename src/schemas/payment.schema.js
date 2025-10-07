import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    cardType: {
      type: String,
      enum: ['visa', 'mastercard', 'amex', 'discover'],
      required: true,
    },
    last4: {
      type: String,
      required: true,
      trim: true,
      maxlength: [4, 'Last 4 digits must be exactly 4 characters'],
      minlength: [4, 'Last 4 digits must be exactly 4 characters'],
    },
    expiryMonth: {
      type: Number,
      min: [1, 'Expiry month must be between 1 and 12'],
      max: [12, 'Expiry month must be between 1 and 12'],
    },
    expiryYear: {
      type: Number,
      min: [new Date().getFullYear(), 'Expiry year cannot be in the past'],
    },
    cardholderName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Cardholder name must be less than 100 characters'],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

export default paymentSchema;
