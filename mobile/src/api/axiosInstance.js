import axios from 'axios';
import { getApiBaseUrl } from '../config/apiConfig';

const axiosInstance = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const baseUrl = await getApiBaseUrl();
    config.baseURL = baseUrl;
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.error || error?.message || "Network Error. Please check connection.";
    console.error("API Error:", message);
    return Promise.reject(error);
  }
);

export default axiosInstance;
