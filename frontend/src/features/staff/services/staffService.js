import api from '../../../lib/api';

/**
 * Staff API Service (Admin Only)
 */
export const staffService = {
  list: async (params = {}) => {
    const res = await api.get('/staff', { params });
    const staffMembers = res.data?.data || [];
    const meta = res.data?.meta || {
      page: params.page || 1,
      limit: params.limit || 10,
      total: staffMembers.length,
      totalPages: 1,
    };

    return {
      data: staffMembers,
      pagination: meta,
      counts: {
        all: meta.total,
        active: staffMembers.filter((s) => s.isActive).length,
        inactive: staffMembers.filter((s) => !s.isActive).length,
      },
    };
  },

  getById: async (id) => {
    const res = await api.get(`/staff/${id}`);
    return res.data?.data;
  },

  create: async (data) => {
    const res = await api.post('/staff', data);
    return res.data?.data;
  },

  update: async (id, data) => {
    const res = await api.patch(`/staff/${id}`, data);
    return res.data?.data;
  },

  updateStatus: async (id, isActive) => {
    const res = await api.patch(`/staff/${id}/status`, { isActive });
    return res.data?.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/staff/${id}`);
    return res.data;
  },
};
