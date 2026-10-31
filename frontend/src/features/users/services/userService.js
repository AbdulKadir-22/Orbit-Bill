import api from '../../../lib/api';

/**
 * User Service encapsulates all backend API communication for users feature
 */
export const userService = {
  /**
   * Fetch all users
   * @returns {Promise<Array>} List of user objects
   */
  async getAllUsers() {
    const response = await api.get('/users');
    return response.data?.data || [];
  },

  /**
   * Fetch a single user by ID
   * @param {string} id
   * @returns {Promise<Object>} User object
   */
  async getUserById(id) {
    const response = await api.get(`/users/${id}`);
    return response.data?.data;
  },

  /**
   * Create a new user
   * @param {Object} userData - { name, email, age }
   * @returns {Promise<Object>} Created user object
   */
  async createUser(userData) {
    const payload = {
      name: userData.name,
      email: userData.email,
    };
    if (userData.age !== '' && userData.age !== null && userData.age !== undefined) {
      payload.age = Number(userData.age);
    }
    const response = await api.post('/users', payload);
    return response.data;
  },

  /**
   * Update an existing user
   * @param {string} id - User ID
   * @param {Object} userData - { name, email, age }
   * @returns {Promise<Object>} Updated user object
   */
  async updateUser(id, userData) {
    const payload = {};
    if (userData.name !== undefined) payload.name = userData.name;
    if (userData.email !== undefined) payload.email = userData.email;
    if (userData.age !== '' && userData.age !== null && userData.age !== undefined) {
      payload.age = Number(userData.age);
    }
    const response = await api.put(`/users/${id}`, payload);
    return response.data;
  },

  /**
   * Delete a user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object>} Delete response
   */
  async deleteUser(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
