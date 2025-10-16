import axios from 'axios';

// The base URL for your backend API
const API_URL = 'http://localhost:3000'; // Make sure this matches your backend port

const api = axios.create({
  baseURL: API_URL,
});

// Axios Request Interceptor:
// This function will be called before every request is sent.
api.interceptors.request.use(
  (config) => {
    // Get the token from local storage
    const token = localStorage.getItem('token');

    // If the token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Handle request error
    return Promise.reject(error);
  }
);

export default api;