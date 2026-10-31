import api from '../../../lib/api';

/**
 * Tax API Service
 */
export const taxService = {
  list: async (params = {}) => {
    const res = await api.get('/taxes', { params });
    const taxes = res.data?.data || [];
    const meta = res.data?.meta || {
      page: params.page || 1,
      limit: params.limit || 10,
      total: taxes.length,
      totalPages: 1,
    };

    return {
      data: taxes,
      pagination: meta,
      counts: {
        all: meta.total,
        active: taxes.filter((t) => t.isActive).length,
        inactive: taxes.filter((t) => !t.isActive).length,
      },
    };
  },

  getById: async (id) => {
    const res = await api.get(`/taxes/${id}`);
    return res.data?.data;
  },

  create: async (data) => {
    const res = await api.post('/taxes', data);
    return res.data?.data;
  },

  update: async (id, data) => {
    const res = await api.patch(`/taxes/${id}`, data);
    return res.data?.data;
  },

  updateStatus: async (id, isActive) => {
    const res = await api.patch(`/taxes/${id}/status`, { isActive });
    return res.data?.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/taxes/${id}`);
    return res.data;
  },
};
