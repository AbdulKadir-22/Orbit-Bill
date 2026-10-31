import api from '../../../lib/api';

/**
 * Authentication service communicating with real backend endpoints
 */
export const authService = {
  /**
   * Register a new customer
   * @param {{ name: string, email: string, password: string }} data 
   * @returns {Promise<{ user: Object, token: string }>}
   */
  register: async ({ name, email, password }) => {
    const response = await api.post('/auth/register', { name, email, password });
    // Payload from backend ApiResponse: { success, message, data: { user, accessToken } }
    const { user, accessToken } = response.data?.data || {};
    return { user, token: accessToken };
  },

  /**
   * Sign in user
   * @param {{ email: string, password: string }} data 
   * @returns {Promise<{ user: Object, token: string }>}
   */
  login: async ({ email, password }) => {
    const response = await api.post('/auth/login', { email, password });
    const { user, accessToken } = response.data?.data || {};
    return { user, token: accessToken };
  },

  /**
   * Request password reset email
   * @param {{ email: string }} data 
   * @returns {Promise<{ message: string }>}
   */
  forgotPassword: async ({ email }) => {
    const response = await api.post('/auth/forgot-password', { email });
    return { message: response.data?.message || 'Reset link sent' };
  },

  /**
   * Complete password reset with token
   * @param {{ token: string, password: string }} data 
   * @returns {Promise<{ message: string }>}
   */
  resetPassword: async ({ token, password }) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return { message: response.data?.message || 'Password updated' };
  },

  /**
   * Retrieve current authenticated user profile
   * @returns {Promise<{ user: Object }>}
   */
  getMe: async () => {
    const response = await api.get('/auth/me');
    const user = response.data?.data?.user;
    return { user };
  },

  /**
   * Terminate session on backend
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors during logout
    }
  },
};
