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
      required: true,
      min: [1, 'Expiry month must be between 1 and 12'],
      max: [12, 'Expiry month must be between 1 and 12'],
    },
    expiryYear: {
      type: Number,
      required: true,
      validate: {
        validator: function (value) {
          // Dynamic validation - checks current year at runtime, not at schema definition time
          const currentYear = new Date().getFullYear();
          const yearValue = Number(value); // Coerce to number in case string is passed

          // Handle NaN and ensure it's a valid number
          if (isNaN(yearValue)) {
            return false;
          }

          return yearValue >= currentYear;
        },
        message: 'Expiry year cannot be in the past',
      },
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
