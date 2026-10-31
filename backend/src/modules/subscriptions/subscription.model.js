const mongoose = require('mongoose');

const subscriptionLineSchema = new mongoose.Schema(
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

const statusHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    from: {
      type: String,
      default: null,
    },
    to: {
      type: String,
      required: true,
    },
    at: {
      type: Date,
      default: Date.now,
    },
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
  {
    subscriptionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      unique: true,
      sparse: true,
      default: null,
    },
    lines: [subscriptionLineSchema],
    billingCycle: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },
    nextBillingDate: {
      type: Date,
      default: null,
      index: true,
    },
    paymentTerms: {
      type: String,
      default: 'Net 15',
    },
    paymentTermsDays: {
      type: Number,
      default: 15,
      min: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'quotation', 'confirmed', 'active', 'paused', 'closed'],
      default: 'draft',
      index: true,
    },
    pausedAt: {
      type: Date,
      default: null,
    },
    totalPausedDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    closeReason: {
      type: String,
      default: null,
    },
    closeType: {
      type: String,
      enum: ['manual', 'early', 'auto', null],
      default: null,
    },
    lastInvoicedAt: {
      type: Date,
      default: null,
    },
    renewalCount: {
      type: Number,
      default: 0,
      min: 0,
    },
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
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    statusHistory: [statusHistorySchema],
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
subscriptionSchema.index({ customerId: 1, status: 1 });
subscriptionSchema.index({ status: 1, nextBillingDate: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
