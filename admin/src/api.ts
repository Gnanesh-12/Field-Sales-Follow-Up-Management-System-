import axios from 'axios';

export const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the admin JWT token to every request automatically.
// The token is stored in sessionStorage after login.
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});