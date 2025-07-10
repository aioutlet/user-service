import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import addressSchema from '../schemas/address.schema.js';
import socialSchema from '../schemas/social.schema.js';
import paymentSchema from '../schemas/payment.schema.js';
import wishlistSchema from '../schemas/wishlist.schema.js';
import preferencesSchema from '../schemas/preferences.schema.js';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: [true, 'Email already exists'],
      trim: true,
    },
    password: {
      type: String,
      minlength: [6, 'Password must be between 6 and 100 characters'],
      maxlength: [100, 'Password must be between 6 and 100 characters'],
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name must be less than 50 characters'],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name must be less than 50 characters'],
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: [100, 'Display name must be less than 100 characters'],
    },
    roles: {
      type: [String],
      enum: ['customer', 'admin'],
      default: ['customer'],
    },
    tier: {
      type: String,
      enum: ['basic', 'premium', 'gold', 'platinum'],
      default: 'basic',
    },
    addresses: [addressSchema],
    paymentMethods: [paymentSchema],
    wishlist: [wishlistSchema],
    preferences: preferencesSchema,
    social: socialSchema,
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (
    this.isModified('password') &&
    this.password &&
    typeof this.password === 'string' &&
    this.password.length > 0 &&
    !/^\$2[aby]\$\d{2}\$/.test(this.password)
  ) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model('User', userSchema);
export default User;
