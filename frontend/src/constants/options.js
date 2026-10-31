/**
 * Standard option lists matching OrbitBill Backend Enums & Schemas
 */

export const PRODUCT_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'software', label: 'Software' },
  { value: 'service', label: 'Service' },
  { value: 'goods', label: 'Goods' },
  { value: 'addon', label: 'Add-on' },
];

export const BILLING_CYCLE_OPTIONS = [
  { value: '', label: 'All Billing Cycles' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export const DISCOUNT_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed', label: 'Fixed Amount' },
];

export const APPLIES_TO_OPTIONS = [
  { value: 'subscription', label: 'Entire Subscription' },
  { value: 'products', label: 'Selected Products' },
];

export const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];
