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

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

export const PAYMENT_METHOD_FILTER_OPTIONS = [
  { value: '', label: 'All Methods' },
  ...PAYMENT_METHODS,
];

export const getPaymentMethodLabel = (val) => {
  if (!val) return '—';
  const found = PAYMENT_METHODS.find((m) => m.value === val);
  if (found) return found.label;
  return String(val)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export const INVOICE_STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'overdue', label: 'Overdue' },
];
