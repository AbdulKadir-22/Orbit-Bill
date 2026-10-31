import api from '../../../lib/api';

/**
 * Product API Service
 */
export const productService = {
  /**
   * List products with pagination, search, status, and type
   */
  list: async (params = {}) => {
    const res = await api.get('/products', { params });
    // Backend returns: { success, message, data: products, meta }
    const products = res.data?.data || [];
    const meta = res.data?.meta || {
      page: params.page || 1,
      limit: params.limit || 10,
      total: products.length,
      totalPages: 1,
    };

    // Calculate tab counts
    const activeCount = products.filter((p) => p.isActive).length;
    const inactiveCount = products.filter((p) => !p.isActive).length;

    return {
      data: products,
      pagination: meta,
      counts: {
        all: meta.total,
        active: activeCount,
        inactive: inactiveCount,
      },
    };
  },

  getById: async (id) => {
    const res = await api.get(`/products/${id}`);
    return res.data?.data;
  },

  create: async (data) => {
    const res = await api.post('/products', data);
    return res.data?.data;
  },

  update: async (id, data) => {
    const res = await api.patch(`/products/${id}`, data);
    return res.data?.data;
  },

  updateStatus: async (id, isActive) => {
    const res = await api.patch(`/products/${id}/status`, { isActive });
    return res.data?.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },
};
