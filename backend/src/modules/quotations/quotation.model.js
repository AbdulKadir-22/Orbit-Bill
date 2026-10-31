const mongoose = require('mongoose');

const quotationLineSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    variantName: {
      type: String,
      default: null,
    },
    planName: {
      type: String,
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    taxId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tax',
      default: null,
    },
    taxRate: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    lineSubtotal: {
      type: Number,
      required: true,
    },
    lineTotal: {
      type: Number,
      required: true,
    },
    priceOverridden: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const quotationSchema = new mongoose.Schema(
  {
    quoteNumber: {
      type: String,
      unique: true,
      sparse: true, // templates do not have quote numbers
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null, // null only for templates
    },
    lines: [quotationLineSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    taxTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    discountTotal: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    validityDays: {
      type: Number,
      default: 30,
      min: 1,
    },
    validUntil: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'confirmed', 'rejected', 'expired'],
      default: 'draft',
      index: true,
    },
    isTemplate: {
      type: Boolean,
      default: false,
      index: true,
    },
    templateName: {
      type: String,
      trim: true,
      default: null,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    sentAt: {
      type: Date,
      default: null,
    },
    discountPreview: {
      type: Array,
      default: [],
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

// Indexes
quotationSchema.index({ customerId: 1, status: 1 });
quotationSchema.index({ validUntil: 1 });

module.exports = mongoose.model('Quotation', quotationSchema);
