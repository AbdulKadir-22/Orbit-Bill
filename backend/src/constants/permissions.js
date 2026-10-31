const PERMISSIONS = Object.freeze({
  PRODUCTS_VIEW: 'products:view',
  PLANS_VIEW: 'plans:view',
  TAXES_VIEW: 'taxes:view',
  DISCOUNTS_VIEW: 'discounts:view',
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_WRITE: 'customers:write',
  QUOTATIONS_READ: 'quotations:read',
  QUOTATIONS_WRITE: 'quotations:write',
  SUBSCRIPTIONS_READ: 'subscriptions:read',
  SUBSCRIPTIONS_MANAGE: 'subscriptions:manage',
  INVOICES_READ: 'invoices:read',
  INVOICES_MANAGE: 'invoices:manage',
  PAYMENTS_READ: 'payments:read',
  PAYMENTS_RECORD: 'payments:record',
  DASHBOARD_VIEW: 'dashboard:view',
  REPORTS_VIEW: 'reports:view',
});

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

// Default permissions granted to staff upon creation
const DEFAULT_STAFF_PERMISSIONS = Object.freeze([
  PERMISSIONS.PRODUCTS_VIEW,
  PERMISSIONS.PLANS_VIEW,
  PERMISSIONS.TAXES_VIEW,
  PERMISSIONS.DISCOUNTS_VIEW,
  PERMISSIONS.CUSTOMERS_READ,
  PERMISSIONS.CUSTOMERS_WRITE,
  PERMISSIONS.DASHBOARD_VIEW,
]);

module.exports = {
  PERMISSIONS,
  ALL_PERMISSIONS,
  DEFAULT_STAFF_PERMISSIONS,
};
