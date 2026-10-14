export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  // Expired or invalid session: clear it and send the user back to login
  if (response.status === 401 && token) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.assign('/login');
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(data?.message || data?.title || `API error: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
};
