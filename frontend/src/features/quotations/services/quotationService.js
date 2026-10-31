import api from '../../../lib/api';

/**
 * Quotation API Service
 */
export const quotationService = {
  /**
   * List quotations with pagination, filters, search, status
   */
  list: async (params = {}) => {
    const res = await api.get('/quotations', {
      params: {
        ...params,
        isTemplate: false,
      },
    });

    const quotations = res.data?.data || [];
    const meta = res.data?.meta || {
      page: params.page || 1,
      limit: params.limit || 10,
      total: quotations.length,
      totalPages: 1,
    };

    const now = new Date();
    // Compute status counts for tabs
    const isExpired = (q) =>
      q.status === 'expired' || (q.validUntil && new Date(q.validUntil) < now && ['draft', 'sent'].includes(q.status));

    const draftCount = quotations.filter((q) => q.status === 'draft' && !isExpired(q)).length;
    const sentCount = quotations.filter((q) => q.status === 'sent' && !isExpired(q)).length;
    const confirmedCount = quotations.filter((q) => q.status === 'confirmed').length;
    const expiredCount = quotations.filter(isExpired).length;

    return {
      data: quotations,
      pagination: meta,
      counts: {
        all: meta.total,
        draft: draftCount,
        sent: sentCount,
        confirmed: confirmedCount,
        expired: expiredCount,
      },
    };
  },

  getById: async (id) => {
    const res = await api.get(`/quotations/${id}`);
    return res.data?.data;
  },

  create: async (data) => {
    const res = await api.post('/quotations', data);
    return res.data?.data;
  },

  update: async (id, data) => {
    const res = await api.patch(`/quotations/${id}`, data);
    return res.data?.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/quotations/${id}`);
    return res.data;
  },

  send: async (id) => {
    const res = await api.post(`/quotations/${id}/send`);
    return res.data?.data;
  },

  convert: async (id, data) => {
    const res = await api.post(`/quotations/${id}/convert`, data);
    return res.data?.data;
  },

  calculate: async (lines) => {
    const res = await api.post('/quotations/calculate', { lines });
    return res.data?.data;
  },

  /**
   * Templates endpoints
   */
  listTemplates: async () => {
    const res = await api.get('/quotations/templates');
    return res.data?.data || [];
  },

  createTemplate: async (data) => {
    const res = await api.post('/quotations/templates', data);
    return res.data?.data;
  },

  deleteTemplate: async (id) => {
    const res = await api.delete(`/quotations/templates/${id}`);
    return res.data;
  },

  createFromTemplate: async (templateId, data) => {
    const res = await api.post(`/quotations/from-template/${templateId}`, data);
    return res.data?.data;
  },
};
