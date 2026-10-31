import api from '../../../lib/api';

/**
 * Payment API Service
 */
export const paymentService = {
  /**
   * List payments with pagination, search, method, fromDate, toDate, customerId, invoiceId
   */
  list: async (params = {}) => {
    const res = await api.get('/payments', { params });
    const payments = res.data?.data || [];
    const meta = res.data?.meta || {
      page: params.page || 1,
      limit: params.limit || 10,
      total: payments.length,
      totalPages: 1,
    };

    return {
      data: payments,
      pagination: meta,
    };
  },

  /**
   * Get single payment by ID
   */
  getById: async (id) => {
    const res = await api.get(`/payments/${id}`);
    return res.data?.data;
  },

  /**
   * Record a new payment against an invoice
   */
  record: async (data) => {
    const res = await api.post('/payments', data);
    return res.data?.data;
  },

  /**
   * Delete / void payment (Admin only)
   */
  delete: async (id, reason = 'Payment deleted by admin') => {
    const res = await api.delete(`/payments/${id}`, { data: { reason } });
    return res.data?.data;
  },
};
