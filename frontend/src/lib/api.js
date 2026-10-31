import axios from 'axios';

/**
 * Centralized Axios client instance configured with environment-based base URL
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Response interceptor to normalize error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      message = error.response.data.errors.join('. ');
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
