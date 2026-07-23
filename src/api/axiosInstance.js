import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:8002',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Attach token to requests
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            const cleanToken = token.replace(/^"(.*)"$/, '$1');
            config.headers.Authorization = `${cleanToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default axiosInstance;