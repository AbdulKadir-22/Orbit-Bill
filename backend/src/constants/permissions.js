const PERMISSIONS = Object.freeze({
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

module.exports = {
  PERMISSIONS,
  ALL_PERMISSIONS,
};
