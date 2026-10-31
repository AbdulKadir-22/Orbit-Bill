import api from '../../../lib/api';

/**
 * Customer API Service
 */
export const customerService = {
  /**
   * List customers with pagination, search, and status
   */
  list: async (params = {}) => {
    const res = await api.get('/customers', { params });
    const customers = res.data?.data || [];
    const meta = res.data?.meta || {
      page: params.page || 1,
      limit: params.limit || 10,
      total: customers.length,
      totalPages: 1,
    };

    return {
      data: customers,
      pagination: meta,
      counts: {
        all: meta.total,
        active: customers.filter((c) => c.isActive).length,
        inactive: customers.filter((c) => !c.isActive).length,
      },
    };
  },

  getById: async (id) => {
    const res = await api.get(`/customers/${id}`);
    return res.data?.data;
  },

  create: async (data) => {
    const res = await api.post('/customers', data);
    return res.data?.data;
  },

  update: async (id, data) => {
    const res = await api.patch(`/customers/${id}`, data);
    return res.data?.data;
  },

  updateStatus: async (id, isActive) => {
    const res = await api.patch(`/customers/${id}/status`, { isActive });
    return res.data?.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/customers/${id}`);
    return res.data;
  },

  getSummary: async (id) => {
    try {
      const res = await api.get(`/customers/${id}/summary`);
      return res.data?.data;
    } catch {
      return null;
    }
  },

  // Related data fetching with safe fallbacks
  getSubscriptions: async (id, limit = 10) => {
    try {
      const res = await api.get(`/subscriptions`, { params: { customerId: id, limit } });
      return res.data?.data || [];
    } catch {
      return [];
    }
  },

  getQuotations: async (id, limit = 10) => {
    try {
      const res = await api.get(`/quotations`, { params: { customerId: id, limit } });
      return res.data?.data || [];
    } catch {
      return [];
    }
  },

  getInvoices: async (id, limit = 10) => {
    try {
      const res = await api.get(`/invoices`, { params: { customerId: id, limit } });
      return res.data?.data || [];
    } catch {
      return [];
    }
  },

  getPayments: async (id, limit = 10) => {
    try {
      const res = await api.get(`/payments`, { params: { customerId: id, limit } });
      return res.data?.data || [];
    } catch {
      return [];
    }
  },
};
