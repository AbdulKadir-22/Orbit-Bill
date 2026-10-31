import {
  LayoutDashboard,
  Package,
  Layers,
  Users,
  FileSpreadsheet,
  Repeat,
  Receipt,
  CreditCard,
  Percent,
  Tag,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import { ROLES } from './roles';
import { STRINGS } from './strings';

/**
 * Sidebar Navigation configuration grouped by section.
 * Filtered dynamically per active user role.
 */
export const NAVIGATION_CONFIG = [
  {
    group: 'main',
    items: [
      // Admin / Staff Main Items
      {
        id: 'dashboard',
        label: STRINGS.NAV.DASHBOARD,
        icon: LayoutDashboard,
        path: '/dashboard',
        roles: [ROLES.ADMIN, ROLES.STAFF],
      },
      {
        id: 'products',
        label: STRINGS.NAV.PRODUCTS,
        icon: Package,
        path: '/products',
        roles: [ROLES.ADMIN, ROLES.STAFF],
      },
      {
        id: 'plans',
        label: STRINGS.NAV.PLANS,
        icon: Layers,
        path: '/plans',
        roles: [ROLES.ADMIN, ROLES.STAFF],
      },
      {
        id: 'customers',
        label: STRINGS.NAV.CUSTOMERS,
        icon: Users,
        path: '/customers',
        roles: [ROLES.ADMIN, ROLES.STAFF],
      },
      {
        id: 'quotations',
        label: STRINGS.NAV.QUOTATIONS,
        icon: FileSpreadsheet,
        path: '/quotations',
        roles: [ROLES.ADMIN, ROLES.STAFF],
      },
      {
        id: 'subscriptions',
        label: STRINGS.NAV.SUBSCRIPTIONS,
        icon: Repeat,
        path: '/subscriptions',
        roles: [ROLES.ADMIN, ROLES.STAFF],
      },
      {
        id: 'invoices',
        label: STRINGS.NAV.INVOICES,
        icon: Receipt,
        path: '/invoices',
        roles: [ROLES.ADMIN, ROLES.STAFF],
      },
      {
        id: 'payments',
        label: STRINGS.NAV.PAYMENTS,
        icon: CreditCard,
        path: '/payments',
        roles: [ROLES.ADMIN, ROLES.STAFF],
      },

      // Customer Portal Items
      {
        id: 'my-dashboard',
        label: STRINGS.NAV.MY_DASHBOARD,
        icon: LayoutDashboard,
        path: '/my/dashboard',
        roles: [ROLES.CUSTOMER],
      },
      {
        id: 'my-subscriptions',
        label: STRINGS.NAV.MY_SUBSCRIPTIONS,
        icon: Repeat,
        path: '/my/subscriptions',
        roles: [ROLES.CUSTOMER],
      },
      {
        id: 'my-invoices',
        label: STRINGS.NAV.MY_INVOICES,
        icon: Receipt,
        path: '/my/invoices',
        roles: [ROLES.CUSTOMER],
      },
    ],
  },
  {
    group: 'settings',
    items: [
      {
        id: 'taxes',
        label: STRINGS.NAV.TAXES,
        icon: Percent,
        path: '/taxes',
        roles: [ROLES.ADMIN, ROLES.STAFF],
      },
      {
        id: 'discounts',
        label: STRINGS.NAV.DISCOUNTS,
        icon: Tag,
        path: '/discounts',
        roles: [ROLES.ADMIN, ROLES.STAFF],
      },
      {
        id: 'staff',
        label: STRINGS.NAV.STAFF,
        icon: ShieldCheck,
        path: '/staff',
        roles: [ROLES.ADMIN], // Admin only
      },
    ],
  },
  {
    group: 'analytics',
    items: [
      {
        id: 'reports',
        label: STRINGS.NAV.REPORTS,
        icon: BarChart3,
        path: '/reports',
        roles: [ROLES.ADMIN, ROLES.STAFF],
      },
    ],
  },
];
