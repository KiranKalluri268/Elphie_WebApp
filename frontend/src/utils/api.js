import axios from 'axios';
import { getIdToken } from '../services/cognitoAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Cognito ID token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await getIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Don't redirect if we're already on login/register/verify pages
    const currentPath = window.location.pathname;
    const publicPaths = ['/login', '/register', '/verify-contact'];
    const isPublicPath = publicPaths.some(path => currentPath.startsWith(path));
    
    // Check if user exists in localStorage (OTP verification skipped)
    const user = localStorage.getItem('user');
    
    // Only redirect to login if:
    // 1. We get 401/403 AND
    // 2. We're not on a public path AND
    // 3. User doesn't exist in localStorage (meaning they're not logged in)
    if ((error.response?.status === 401 || error.response?.status === 403) && !isPublicPath && !user) {
      // Only redirect if not already on a public page and user is not logged in
      // Use window.location to clear any cached state
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
