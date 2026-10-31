/**
 * Granular staff permissions configuration for OrbitBill
 */
export const PERMISSIONS_LIST = [
  // General & Analytics
  {
    category: 'Analytics & Overview',
    permissions: [
      { key: 'dashboard:view', label: 'Dashboard: view system metrics' },
      { key: 'reports:view', label: 'Reports: view financial reports' },
    ],
  },
  // Catalog Configuration
  {
    category: 'Catalog & Rules',
    permissions: [
      { key: 'products:view', label: 'Products: view only' },
      { key: 'plans:view', label: 'Plans: view only' },
      { key: 'taxes:view', label: 'Taxes: view only' },
      { key: 'discounts:view', label: 'Discounts: view only' },
    ],
  },
  // Operations & Customers
  {
    category: 'Operations & Billing',
    permissions: [
      { key: 'customers:read', label: 'Customers: view customer profiles' },
      { key: 'customers:write', label: 'Customers: create and edit' },
      { key: 'quotations:read', label: 'Quotations: view quotations' },
      { key: 'quotations:write', label: 'Quotations: manage quotations' },
      { key: 'subscriptions:read', label: 'Subscriptions: view subscriptions' },
      { key: 'subscriptions:manage', label: 'Subscriptions: manage and renew' },
      { key: 'invoices:read', label: 'Invoices: view invoices' },
      { key: 'invoices:manage', label: 'Invoices: manage invoices' },
      { key: 'payments:read', label: 'Payments: view payment history' },
      { key: 'payments:record', label: 'Payments: record payments' },
    ],
  },
];

export const ALL_PERMISSION_KEYS = PERMISSIONS_LIST.flatMap((group) =>
  group.permissions.map((p) => p.key)
);
