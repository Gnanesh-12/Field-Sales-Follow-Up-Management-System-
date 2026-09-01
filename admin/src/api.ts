import axios from 'axios';

export const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});