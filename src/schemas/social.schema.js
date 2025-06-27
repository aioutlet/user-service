import mongoose from 'mongoose';

const socialSchema = new mongoose.Schema(
  {
    google: {
      id: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
      },
    },
    facebook: {
      id: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
      },
    },
    twitter: {
      id: {
        type: String,
        trim: true,
      },
      username: {
        type: String,
        trim: true,
      },
    },
    linkedin: {
      id: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
      },
    },
    apple: {
      id: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
      },
    },
  },
  { _id: false }
);

export default socialSchema;
