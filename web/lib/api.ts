import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://glowing-robot-production.up.railway.app/api',
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401 errors (User deleted or Token expired)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Check if we are already on the login page to avoid loops
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
                console.log("Session expired or user missing. Logging out...");
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login?expired=true';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
