import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/signup', userData),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (passwords) => api.post('/auth/change-password', passwords),
};

// User API calls
export const userAPI = {
  getAllUsers: () => api.get('/users/'),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users/', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  resetPassword: (id, passwordData) => api.post(`/users/${id}/reset-password`, passwordData),
  getManagers: () => api.get('/users/managers'),
  getSubordinates: () => api.get('/users/subordinates'),
};

// Expense API calls
export const expenseAPI = {
  createExpense: (formData) => 
    api.post('/expenses/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  getMyExpenses: (params) => api.get('/expenses/my', { params }),
  getExpense: (id) => api.get(`/expenses/${id}`),
  updateExpense: (id, data) => api.put(`/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
  getCompanyExpenses: (params) => api.get('/expenses/company', { params }),
};

// Approval API calls
export const approvalAPI = {
  getPendingApprovals: () => api.get('/approvals/pending'),
  getMyApprovals: () => api.get('/approvals/my'),
  approveExpense: (expenseId, comment) => 
    api.post(`/approvals/${expenseId}/approve`, { comment }),
  rejectExpense: (expenseId, comment) => 
    api.post(`/approvals/${expenseId}/reject`, { comment }),
  getApprovalRules: () => api.get('/approvals/rules'),
  createApprovalRule: (ruleData) => api.post('/approvals/rules', ruleData),
  updateApprovalRule: (id, ruleData) => api.put(`/approvals/rules/${id}`, ruleData),
  deleteApprovalRule: (id) => api.delete(`/approvals/rules/${id}`),
  overrideApproval: (expenseId, data) => 
    api.post(`/approvals/${expenseId}/override`, data),
};

export default api;
