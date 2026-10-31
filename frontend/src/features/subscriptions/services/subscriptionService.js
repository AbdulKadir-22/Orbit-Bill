import api from '../../../lib/api';

/**
 * Subscription API Service
 */
export const subscriptionService = {
  /**
   * List subscriptions with pagination, search, status, billingCycle, customerId
   */
  list: async (params = {}) => {
    const res = await api.get('/subscriptions', { params });
    const subscriptions = res.data?.data || [];
    const meta = res.data?.meta || {
      page: params.page || 1,
      limit: params.limit || 10,
      total: subscriptions.length,
      totalPages: 1,
    };

    const draftCount = subscriptions.filter((s) => s.status === 'draft').length;
    const confirmedCount = subscriptions.filter((s) => s.status === 'confirmed').length;
    const activeCount = subscriptions.filter((s) => s.status === 'active').length;
    const pausedCount = subscriptions.filter((s) => s.status === 'paused').length;
    const closedCount = subscriptions.filter((s) => s.status === 'closed').length;

    return {
      data: subscriptions,
      pagination: meta,
      counts: {
        all: meta.total,
        draft: draftCount,
        confirmed: confirmedCount,
        active: activeCount,
        paused: pausedCount,
        closed: closedCount,
      },
    };
  },

  getById: async (id) => {
    const res = await api.get(`/subscriptions/${id}`);
    return res.data?.data;
  },

  update: async (id, data) => {
    const res = await api.patch(`/subscriptions/${id}`, data);
    return res.data?.data;
  },

  activate: async (id) => {
    const res = await api.post(`/subscriptions/${id}/activate`);
    return res.data?.data;
  },

  pause: async (id, data = {}) => {
    const res = await api.post(`/subscriptions/${id}/pause`, data);
    return res.data?.data;
  },

  resume: async (id, data = {}) => {
    const res = await api.post(`/subscriptions/${id}/resume`, data);
    return res.data?.data;
  },

  renew: async (id, data = {}) => {
    const res = await api.post(`/subscriptions/${id}/renew`, data);
    return res.data?.data;
  },

  close: async (id, data) => {
    const res = await api.post(`/subscriptions/${id}/close`, data);
    return res.data?.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/subscriptions/${id}`);
    return res.data;
  },

  /**
   * Related data endpoints for Details page
   */
  getInvoices: async (subscriptionId, limit = 10) => {
    try {
      const res = await api.get('/invoices', { params: { subscriptionId, limit } });
      return res.data?.data || [];
    } catch {
      return [];
    }
  },

  getPayments: async (subscriptionId, limit = 10) => {
    try {
      // Fetch invoices for subscription, then payments for those invoices if needed, or query by subscription invoices
      const invRes = await api.get('/invoices', { params: { subscriptionId, limit: 100 } });
      const invoices = invRes.data?.data || [];
      if (!invoices.length) return [];
      
      const invoiceIds = invoices.map(i => i._id);
      // Fetch payments for the first invoice or list payments matching the customer
      const pmtPromises = invoiceIds.slice(0, 5).map(invId => 
        api.get('/payments', { params: { invoiceId: invId, limit } }).then(r => r.data?.data || []).catch(() => [])
      );
      const allPmts = (await Promise.all(pmtPromises)).flat();
      return allPmts.slice(0, limit);
    } catch {
      return [];
    }
  },
};
