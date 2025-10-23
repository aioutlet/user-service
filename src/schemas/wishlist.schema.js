import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      trim: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Product name must be less than 200 characters'],
    },
    productPrice: {
      type: Number,
      required: true,
      min: [0, 'Product price must be non-negative'],
    },
    productImage: {
      type: String,
      trim: true,
      maxlength: [500, 'Product image URL must be less than 500 characters'],
    },
    productCategory: {
      type: String,
      trim: true,
      maxlength: [100, 'Product category must be less than 100 characters'],
    },
    productBrand: {
      type: String,
      trim: true,
      maxlength: [100, 'Product brand must be less than 100 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes must be less than 500 characters'],
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

export default wishlistSchema;
