import axios from 'axios';
import { STRINGS } from '../constants/strings';

const TOKEN_KEY = 'orbitbill_token';
const STORAGE_TYPE_KEY = 'orbitbill_storage_type';

/**
 * Token storage helper handling 'Remember Me' preference:
 * Remember Me checked -> localStorage
 * Remember Me unchecked -> sessionStorage
 */
export const tokenStorage = {
  get: () => {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
  },
  set: (token, rememberMe = true) => {
    if (!token) return;
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(STORAGE_TYPE_KEY, 'local');
      sessionStorage.removeItem(TOKEN_KEY);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(STORAGE_TYPE_KEY, 'session');
      localStorage.removeItem(TOKEN_KEY);
    }
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORAGE_TYPE_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(STORAGE_TYPE_KEY);
  },
};

/**
 * Centralized Axios client instance configured with environment-based base URL
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true,
});

/**
 * Request interceptor to attach Bearer Authorization token automatically
 */
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Global unauthorized callback triggerable by interceptor
 */
let onUnauthorizedHandler = null;

export const setOnUnauthorizedCallback = (callback) => {
  onUnauthorizedHandler = callback;
};

/**
 * Response interceptor to handle 401s and format backend error messages
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // Check if 401 on non-auth request
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/forgot-password') || url.includes('/auth/reset-password');

    if (status === 401 && !isAuthEndpoint) {
      tokenStorage.clear();
      if (onUnauthorizedHandler) {
        onUnauthorizedHandler(STRINGS.SESSION_EXPIRED);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
