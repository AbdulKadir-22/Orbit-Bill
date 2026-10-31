import api from '../../../lib/api';

/**
 * Invoice API Service
 */
export const invoiceService = {
  /**
   * List invoices with pagination, search, status, customerId, subscriptionId, payable
   */
  list: async (params = {}) => {
    // If status === 'overdue', map to { status: 'confirmed', overdue: true }
    const apiParams = { ...params };
    if (apiParams.status === 'overdue') {
      apiParams.status = 'confirmed';
      apiParams.overdue = true;
    }

    const res = await api.get('/invoices', { params: apiParams });
    const invoices = res.data?.data || [];
    const meta = res.data?.meta || {
      page: params.page || 1,
      limit: params.limit || 10,
      total: invoices.length,
      totalPages: 1,
    };

    return {
      data: invoices,
      pagination: meta,
    };
  },

  /**
   * Get single invoice with populated lines, customer, subscription, and payments
   */
  getById: async (id) => {
    const res = await api.get(`/invoices/${id}`);
    return res.data?.data;
  },

  /**
   * Generate due invoices across all subscriptions due for billing
   */
  generateDue: async (data = {}) => {
    const res = await api.post('/invoices/generate', data);
    return res.data?.data;
  },

  /**
   * Confirm draft invoice
   */
  confirm: async (id) => {
    const res = await api.post(`/invoices/${id}/confirm`);
    return res.data?.data;
  },

  /**
   * Cancel draft or confirmed invoice (with reason)
   */
  cancel: async (id, reason = 'Cancelled by operator') => {
    const res = await api.post(`/invoices/${id}/cancel`, { reason });
    return res.data?.data;
  },

  /**
   * Dispatch/send invoice email to customer
   */
  send: async (id) => {
    const res = await api.post(`/invoices/${id}/send`);
    return res.data?.data;
  },

  /**
   * Stream / download PDF invoice URL
   */
  getPdfUrl: (id, download = false) => {
    return `/api/v1/invoices/${id}/pdf${download ? '?download=true' : ''}`;
  },
};
