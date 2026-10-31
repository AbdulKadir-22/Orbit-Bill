import api from '../../../lib/api';

/**
 * Customer Portal service
 * Strictly scoped to the logged-in customer by the backend.
 * Never send customerId from the frontend.
 */
export const portalService = {
  /**
   * GET /api/v1/portal/dashboard
   */
  getDashboard: async () => {
    // Fetch dashboard, profile, and recent subscriptions in parallel if needed
    const [dashRes, profileRes, subRes] = await Promise.allSettled([
      api.get('/portal/dashboard'),
      api.get('/portal/profile'),
      api.get('/portal/subscriptions?status=active'),
    ]);

    const dash = dashRes.status === 'fulfilled' ? dashRes.value.data?.data || {} : {};
    const profile = profileRes.status === 'fulfilled' ? profileRes.value.data?.data || {} : {};
    const subs = subRes.status === 'fulfilled' ? subRes.value.data?.data || [] : [];

    // Calculate totalInvoices & amountPaid
    const recentInvoices = dash.recentInvoices || [];
    const recentPayments = dash.recentPayments || [];

    const totalInvoices = dash.totalInvoices ?? (recentInvoices.length > 0 ? recentInvoices.length : 0);
    const amountPaid = dash.amountPaid ?? recentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const outstandingAmount = dash.totalOutstandingAmount ?? dash.outstandingAmount ?? 0;
    const activeSubscriptions = dash.activeSubscriptionCount ?? dash.activeSubscriptions ?? subs.length;

    return {
      activeSubscriptions,
      totalInvoices,
      amountPaid,
      outstandingAmount,
      subscriptions: subs.slice(0, 3),
      recentInvoices: recentInvoices.slice(0, 5),
      recentPayments: recentPayments.slice(0, 4),
      profile,
    };
  },

  /**
   * GET /api/v1/portal/subscriptions?status=active|closed
   */
  getSubscriptions: async (params = {}) => {
    // Map 'closed' to backend parameter if needed
    const query = { ...params };
    if (query.status === 'closed') {
      query.status = 'previous';
    }
    const res = await api.get('/portal/subscriptions', { params: query });
    return {
      data: res.data?.data || [],
      pagination: res.data?.pagination || null,
    };
  },

  /**
   * GET /api/v1/portal/subscriptions/:id
   */
  getSubscriptionById: async (id) => {
    const res = await api.get(`/portal/subscriptions/${id}`);
    return res.data?.data;
  },

  /**
   * GET /api/v1/portal/invoices
   */
  getInvoices: async (params = {}) => {
    const res = await api.get('/portal/invoices', { params });
    return {
      data: res.data?.data || [],
      pagination: res.data?.pagination || null,
    };
  },

  /**
   * GET /api/v1/portal/invoices/:id
   */
  getInvoiceById: async (id) => {
    const res = await api.get(`/portal/invoices/${id}`);
    return res.data?.data;
  },

  /**
   * GET /api/v1/portal/payments
   */
  getPayments: async (params = {}) => {
    const res = await api.get('/portal/payments', { params });
    return {
      data: res.data?.data || [],
      pagination: res.data?.pagination || null,
    };
  },

  /**
   * GET /api/v1/portal/profile
   */
  getProfile: async () => {
    const res = await api.get('/portal/profile');
    return res.data?.data;
  },

  /**
   * PUT /api/v1/portal/profile (or PATCH)
   */
  updateProfile: async (data) => {
    const res = await api.patch('/portal/profile', data);
    return res.data?.data;
  },
};
