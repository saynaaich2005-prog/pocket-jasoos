// Pocket Jasoos - Central API Configuration & Auth Helpers

// Dynamically choose the backend based on the environment.
// Localhost / 127.0.0.1 -> local Express dev server.
// Anything else (deployed frontend) -> production Render backend.
const hostname = window.location.hostname;
const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

const API_BASE_URL = isLocal
  ? 'http://localhost:5000/api/auth'
  // TODO: Replace with your deployed Render backend URL, e.g.
  // 'https://YOUR-RENDER-APP-NAME.onrender.com/api/auth'
  : 'https://YOUR-RENDER-APP-NAME.onrender.com/api/auth';

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
