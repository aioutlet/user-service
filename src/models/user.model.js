import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

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
      // required: [true, 'Please add a password'],
      minlength: [6, 'Password must be between 6 and 100 characters'],
      maxlength: [100, 'Password must be between 6 and 100 characters'],
      trim: true,
    },
    name: {
      type: String,
      // required: [true, 'Please add a name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must be less than 50 characters'],
    },
    roles: {
      type: [String],
      default: ['user'],
    },
    social: {
      google: { id: String },
      facebook: { id: String },
      twitter: { id: String },
    },
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
