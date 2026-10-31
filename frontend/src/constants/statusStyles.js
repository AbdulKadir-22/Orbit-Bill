/**
 * Status color mappings for Badges across OrbitBill
 * Used in Customers, Subscriptions, Invoices, Quotations, and Account roles.
 */
export const STATUS_STYLES = {
  // Subscription: draft = gray, quotation = gray, confirmed = blue, active = green, paused = amber, closed = red
  subscription: {
    draft: 'neutral',
    quotation: 'neutral',
    confirmed: 'info',
    active: 'success',
    paused: 'pending',
    closed: 'danger',
  },

  // Invoice: draft = gray, confirmed = blue, paid = green, cancelled = red, overdue = red
  invoice: {
    draft: 'neutral',
    confirmed: 'info',
    paid: 'success',
    cancelled: 'danger',
    overdue: 'danger',
  },

  // Quotation: draft = gray, sent = blue, confirmed = green, expired/cancelled = red
  quotation: {
    draft: 'neutral',
    sent: 'info',
    confirmed: 'success',
    expired: 'danger',
    cancelled: 'danger',
  },

  // Account (customer / staff): active = green, inactive = red
  account: {
    active: 'success',
    inactive: 'danger',
  },
};

/**
 * Helper to resolve status badge variant
 * @param {'subscription' | 'invoice' | 'quotation' | 'account'} module 
 * @param {string|boolean} status 
 * @returns {'success' | 'pending' | 'danger' | 'info' | 'neutral'}
 */
export const getStatusBadgeVariant = (module, status) => {
  if (module === 'account') {
    return status === true || status === 'active' ? 'success' : 'danger';
  }
  const key = String(status || '').toLowerCase();
  return STATUS_STYLES[module]?.[key] || 'neutral';
};
