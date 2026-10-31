import api from '../../../lib/api';

/**
 * Discount API Service
 */
export const discountService = {
  list: async (params = {}) => {
    const res = await api.get('/discounts', { params });
    const discounts = res.data?.data || [];
    const meta = res.data?.meta || {
      page: params.page || 1,
      limit: params.limit || 10,
      total: discounts.length,
      totalPages: 1,
    };

    return {
      data: discounts,
      pagination: meta,
      counts: {
        all: meta.total,
        active: discounts.filter((d) => d.isActive).length,
        inactive: discounts.filter((d) => !d.isActive).length,
      },
    };
  },

  getById: async (id) => {
    const res = await api.get(`/discounts/${id}`);
    return res.data?.data;
  },

  create: async (data) => {
    const res = await api.post('/discounts', data);
    return res.data?.data;
  },

  update: async (id, data) => {
    const res = await api.patch(`/discounts/${id}`, data);
    return res.data?.data;
  },

  updateStatus: async (id, isActive) => {
    const res = await api.patch(`/discounts/${id}/status`, { isActive });
    return res.data?.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/discounts/${id}`);
    return res.data;
  },
};
