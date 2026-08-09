// Pocket Jasoos - Central API Configuration, Request Helper & Endpoint Methods

// Dynamically choose the backend based on the environment.
// Localhost / 127.0.0.1 -> local Express dev server.
// Anything else (deployed frontend) -> production Render backend.
const hostname = window.location.hostname;
const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

// API root (all feature endpoints hang off this).
const API_URL = isLocal
  ? 'http://localhost:5000/api'
  : 'https://pocket-jasoos.onrender.com/api';

// Auth base URL (kept with the /auth suffix so auth.js keeps working unchanged).
const API_BASE_URL = `${API_URL}/auth`;

const TOKEN_KEY = 'pocket_jasoos_token';
const USER_KEY = 'pocket_jasoos_user';

const getToken = () => localStorage.getItem(TOKEN_KEY);

const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);

const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const getAuthHeaders = (token = getToken()) => {
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const logout = () => {
  clearToken();
  localStorage.removeItem(USER_KEY);
  window.location.href = 'login.html';
};

// Build a query string from a params object, skipping undefined/null/empty values.
const buildQuery = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      qs.append(key, value);
    }
  });
  const q = qs.toString();
  return q ? `?${q}` : '';
};

// Reusable request helper.
// - Adds Authorization: Bearer <JWT> by default (opt out with auth: false).
// - Adds Content-Type: application/json whenever a JSON body is sent.
// - Parses JSON responses.
// - Rejects with { status, data } for any non-2xx response.
// - Never logs passwords or tokens.
const request = async (path, options = {}) => {
  const { method = 'GET', body = null, auth = true, params = null } = options;

  const headers = {};

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  if (body !== null && body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${API_URL}${path}${params ? buildQuery(params) : ''}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body !== null && body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      data && data.message ? data.message : `Request failed with status ${response.status}`
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

// ----------------------------------------------------
// Auth
// ----------------------------------------------------
const getProfile = () => request('/auth/profile');

const updateProfile = (data) =>
  request('/auth/profile', { method: 'PUT', body: data });

const updatePassword = (data) =>
  request('/auth/password', { method: 'PUT', body: data });

// ----------------------------------------------------
// Categories
// ----------------------------------------------------
const getCategories = () => request('/categories');

const createCategory = (data) =>
  request('/categories', { method: 'POST', body: data });

const updateCategory = (id, data) =>
  request(`/categories/${id}`, { method: 'PUT', body: data });

const deleteCategory = (id) =>
  request(`/categories/${id}`, { method: 'DELETE' });

// ----------------------------------------------------
// Transactions
// ----------------------------------------------------
const getTransactions = (params = {}) =>
  request('/transactions', { params });

const createTransaction = (data) =>
  request('/transactions', { method: 'POST', body: data });

const updateTransaction = (id, data) =>
  request(`/transactions/${id}`, { method: 'PUT', body: data });

const deleteTransaction = (id) =>
  request(`/transactions/${id}`, { method: 'DELETE' });

// ----------------------------------------------------
// Analytics
// ----------------------------------------------------
const getAnalyticsSummary = () => request('/analytics/summary');

const getAnalyticsTrend = (months = 6) =>
  request('/analytics/trend', { params: { months } });

const getAnalyticsCategories = () => request('/analytics/categories');

const getAnalyticsInsights = () => request('/analytics/insights');

const getFinancialHealth = () => request('/analytics/health');

window.API = {
  API_URL,
  API_BASE_URL,
  TOKEN_KEY,
  USER_KEY,
  getToken,
  setToken,
  clearToken,
  getAuthHeaders,
  logout,
  request,
  // Auth
  getProfile,
  updateProfile,
  updatePassword,
  // Categories
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  // Transactions
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  // Analytics
  getAnalyticsSummary,
  getAnalyticsTrend,
  getAnalyticsCategories,
  getAnalyticsInsights,
  getFinancialHealth,
};
