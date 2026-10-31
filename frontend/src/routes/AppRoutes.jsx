import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES, getRoleHomePath } from '../constants/roles';
import { STRINGS } from '../constants/strings';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { AppShell } from '../components/layout/AppShell';
import { PlaceholderPage } from '../components/layout/PlaceholderPage';
import { AuthPage } from '../features/auth/AuthPage';
import { ProductsPage } from '../features/products/ProductsPage';
import { ProductFormPage } from '../features/products/ProductFormPage';
import { PlansPage } from '../features/plans/PlansPage';
import { TaxesPage } from '../features/taxes/TaxesPage';
import { DiscountsPage } from '../features/discounts/DiscountsPage';
import { CustomersPage } from '../features/customers/CustomersPage';
import { CustomerDetailsPage } from '../features/customers/CustomerDetailsPage';
import { StaffPage } from '../features/staff/StaffPage';
import { QuotationsPage } from '../features/quotations/QuotationsPage';
import { QuotationFormPage } from '../features/quotations/QuotationFormPage';
import { SubscriptionsPage } from '../features/subscriptions/SubscriptionsPage';
import { SubscriptionDetailsPage } from '../features/subscriptions/SubscriptionDetailsPage';
import { InvoicesPage } from '../features/invoices/InvoicesPage';
import { InvoiceDetailsPage } from '../features/invoices/InvoiceDetailsPage';
import { PaymentsPage } from '../features/payments/PaymentsPage';

/**
 * Root Router matching all required role guards & routes:
 * - Public: /auth
 * - Admin only: /staff
 * - Admin + Staff: /dashboard, /products, /plans, /customers, /customers/:id,
 *                 /quotations, /subscriptions, /subscriptions/:id,
 *                 /invoices, /invoices/:id, /taxes, /discounts, /payments, /reports
 * - Customer only: /my/dashboard, /my/subscriptions, /my/invoices
 */
export const AppRoutes = () => {
  const { isAuthenticated, role } = useAuth();

  return (
    <Routes>
      {/* Public Auth Route */}
      <Route path="/auth" element={<AuthPage />} />

      {/* Root redirect */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={getRoleHomePath(role)} replace />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />

      {/* Authenticated App Shell */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        {/* Admin + Staff Shared Routes */}
        <Route
          path="/dashboard"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
              <PlaceholderPage title={STRINGS.NAV.DASHBOARD} />
            </RoleRoute>
          }
        />
        {/* Catalog Routes */}
        <Route
          path="/products"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
              <ProductsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/products/new"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <ProductFormPage />
            </RoleRoute>
          }
        />
        <Route
          path="/products/:id/edit"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <ProductFormPage />
            </RoleRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
              <PlansPage />
            </RoleRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
              <CustomersPage />
            </RoleRoute>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
              <CustomerDetailsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/quotations"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
              <QuotationsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/quotations/new"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
              <QuotationFormPage />
            </RoleRoute>
          }
        />
        <Route
          path="/quotations/:id"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
              <QuotationFormPage />
            </RoleRoute>
          }
        />
        <Route
          path="/subscriptions"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
              <SubscriptionsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/subscriptions/:id"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
              <SubscriptionDetailsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
              <InvoicesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/invoices/:id"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
              <InvoiceDetailsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
              <PaymentsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/taxes"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
              <TaxesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/discounts"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
              <DiscountsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
              <PlaceholderPage title={STRINGS.NAV.REPORTS} />
            </RoleRoute>
          }
        />

        {/* Admin-Only Route */}
        <Route
          path="/staff"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <StaffPage />
            </RoleRoute>
          }
        />

        {/* Customer-Only Routes */}
        <Route
          path="/my/dashboard"
          element={
            <RoleRoute allowedRoles={[ROLES.CUSTOMER]}>
              <PlaceholderPage title={STRINGS.NAV.MY_DASHBOARD} />
            </RoleRoute>
          }
        />
        <Route
          path="/my/subscriptions"
          element={
            <RoleRoute allowedRoles={[ROLES.CUSTOMER]}>
              <PlaceholderPage title={STRINGS.NAV.MY_SUBSCRIPTIONS} />
            </RoleRoute>
          }
        />
        <Route
          path="/my/invoices"
          element={
            <RoleRoute allowedRoles={[ROLES.CUSTOMER]}>
              <PlaceholderPage title={STRINGS.NAV.MY_INVOICES} />
            </RoleRoute>
          }
        />
      </Route>

      {/* 404 Catch-All */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f6f5f2] text-center">
            <h1 className="text-4xl font-extrabold text-neutral-900 mb-2">404</h1>
            <h2 className="text-lg font-semibold text-neutral-700 mb-2">
              {STRINGS.NOT_FOUND.TITLE}
            </h2>
            <p className="text-sm text-neutral-500 max-w-sm mb-6">
              {STRINGS.NOT_FOUND.DESCRIPTION}
            </p>
            <a
              href="/"
              className="px-4 py-2.5 bg-black text-white rounded-[10px] text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              {STRINGS.NOT_FOUND.BACK_HOME}
            </a>
          </div>
        }
      />
    </Routes>
  );
};
