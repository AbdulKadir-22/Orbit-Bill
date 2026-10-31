const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tax name is required'],
      trim: true,
      unique: true,
    },
    rate: {
      type: Number,
      required: [true, 'Tax rate is required'],
      min: [0, 'Tax rate cannot be less than 0%'],
      max: [100, 'Tax rate cannot exceed 100%'],
    },
    appliesTo: {
      type: String,
      enum: ['all', 'products'],
      default: 'all',
    },
    productIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

taxSchema.index({ name: 1 }, { collation: { locale: 'en', strength: 2 } });

module.exports = mongoose.model('Tax', taxSchema);
