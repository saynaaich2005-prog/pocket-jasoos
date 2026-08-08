// Pocket Jasoos - Central API Configuration & Auth Helpers

const API_BASE_URL = 'http://localhost:5000/api/auth';
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

window.API = {
  API_BASE_URL,
  TOKEN_KEY,
  USER_KEY,
  getToken,
  setToken,
  clearToken,
  getAuthHeaders,
  logout,
};
