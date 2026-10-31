import api from '../../../lib/api';

/**
 * Plan API Service
 */
export const planService = {
  list: async (params = {}) => {
    const res = await api.get('/plans', { params });
    const plans = res.data?.data || [];
    const meta = res.data?.meta || {
      page: params.page || 1,
      limit: params.limit || 10,
      total: plans.length,
      totalPages: 1,
    };

    const activeCount = plans.filter((p) => p.isActive).length;
    const inactiveCount = plans.filter((p) => !p.isActive).length;

    return {
      data: plans,
      pagination: meta,
      counts: {
        all: meta.total,
        active: activeCount,
        inactive: inactiveCount,
      },
    };
  },

  getById: async (id) => {
    const res = await api.get(`/plans/${id}`);
    return res.data?.data;
  },

  create: async (data) => {
    const res = await api.post('/plans', data);
    return res.data?.data;
  },

  update: async (id, data) => {
    const res = await api.patch(`/plans/${id}`, data);
    return res.data?.data;
  },

  updateStatus: async (id, isActive) => {
    const res = await api.patch(`/plans/${id}/status`, { isActive });
    return res.data?.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/plans/${id}`);
    return res.data;
  },
};
