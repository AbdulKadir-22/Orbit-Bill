const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
      index: true,
    },
    billingCycle: {
      type: String,
      required: [true, 'Billing cycle is required'],
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be greater than or equal to 0'],
    },
    minQuantity: {
      type: Number,
      required: [true, 'Minimum quantity is required'],
      min: [1, 'Minimum quantity must be at least 1'],
      default: 1,
    },
    availableFrom: {
      type: Date,
      default: null,
    },
    availableTo: {
      type: Date,
      default: null,
    },
    autoClose: {
      type: Boolean,
      default: false,
    },
    allowEarlyClose: {
      type: Boolean,
      default: true,
    },
    allowPause: {
      type: Boolean,
      default: false,
    },
    allowRenewal: {
      type: Boolean,
      default: true,
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

planSchema.index({ billingCycle: 1, isActive: 1 });
planSchema.index({ availableFrom: 1, availableTo: 1 });

module.exports = mongoose.model('Plan', planSchema);
