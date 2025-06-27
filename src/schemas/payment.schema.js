import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'credit_card',
        'debit_card',
        'paypal',
        'apple_pay',
        'google_pay',
        'bank_transfer',
        'digital_wallet',
        'other',
      ],
      required: true,
    },
    provider: {
      type: String,
      enum: ['visa', 'mastercard', 'amex', 'discover', 'paypal', 'stripe', 'square', 'bank_transfer', 'other'],
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
    // For digital wallets
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    // For bank accounts
    accountType: {
      type: String,
      enum: ['checking', 'savings', 'business'],
    },
    bankName: {
      type: String,
      trim: true,
      maxlength: [100, 'Bank name must be less than 100 characters'],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    nickname: {
      type: String,
      trim: true,
      maxlength: [50, 'Payment method nickname must be less than 50 characters'],
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

export default paymentSchema;
