const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Discount name is required'],
      trim: true,
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Discount type is required'],
      enum: ['fixed', 'percentage'],
      index: true,
    },
    value: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    minPurchase: {
      type: Number,
      default: 0,
      min: [0, 'minPurchase cannot be negative'],
    },
    minQuantity: {
      type: Number,
      default: 0,
      min: [0, 'minQuantity cannot be negative'],
    },
    appliesTo: {
      type: String,
      required: [true, 'appliesTo is required'],
      enum: ['products', 'subscription'],
      index: true,
    },
    productIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    usageLimit: {
      type: Number,
      default: null, // null = unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
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

discountSchema.index({ isActive: 1, startDate: 1, endDate: 1, appliesTo: 1 });

module.exports = mongoose.model('Discount', discountSchema);
