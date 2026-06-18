import axios from 'axios';
import useLoadingStore from '../store/useLoadingStore';

/**
 * Common API Client Configuration
 * Optimized for performance and catch-all error handling
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 60000, // 60s — allows for Render free-tier cold start
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Request interceptor: Attach Auth Token
api.interceptors.request.use(
    (config) => {
        // Show global loader for every API request
        useLoadingStore.getState().showLoader();

        // Try getting token from localStorage first (for speed) 
        // or from state management if accessible
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        useLoadingStore.getState().hideLoader();
        return Promise.reject(error);
    }
);

// Response interceptor: Global Error Handling
api.interceptors.response.use(
    (response) => {
        // Hide global loader on success
        useLoadingStore.getState().hideLoader();
        
        // Return data directly for easier access in services
        return response.data;
    },
    (error) => {
        // Hide global loader on error
        useLoadingStore.getState().hideLoader();
        
        // Handle specific error codes
        if (error.response) {
            const { status } = error.response;

            if (status === 401) {
                // Unauthorized: Clear session and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('auth-storage');
                
                // For HashRouter, we need to check the hash, not the pathname
                const currentHash = window.location.hash;
                if (!currentHash.includes('/login')) {
                    window.location.hash = '#/login';
                }
            }

            if (status === 403) {
                console.error('Forbidden: You do not have permission.');
            }

            if (status >= 500) {
                console.error('Server Error: Something went wrong on the backend.');
            }
        } else if (error.code === 'ECONNABORTED') {
            // Request timed out
            console.error('Request timed out. The server may be starting up, please try again.');
        } else if (error.request) {
            // No response received (network offline, server unreachable)
            console.error('No response from server. Please check your internet connection or try again later.');
        }

        return Promise.reject(error);
    }
);

export default api;

