const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Variant name is required'],
      trim: true,
    },
    priceDelta: {
      type: Number,
      required: [true, 'Price delta is required'],
      default: 0,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Product type is required'],
      enum: ['service', 'goods', 'software', 'addon'],
      index: true,
    },
    salesPrice: {
      type: Number,
      required: [true, 'Sales price is required'],
      min: [0, 'Sales price must be greater than or equal to 0'],
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price must be greater than or equal to 0'],
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    variants: [variantSchema],
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

// Indexes
productSchema.index({ name: 'text', notes: 'text' });
productSchema.index({ 'variants.sku': 1 });

module.exports = mongoose.model('Product', productSchema);
