import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../api/authService';
import backupService from '../api/backupService';

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: localStorage.getItem('token') !== 'undefined' ? localStorage.getItem('token') : null,
            isAuthenticated: !!localStorage.getItem('token') && localStorage.getItem('token') !== 'undefined',
            isLoading: false,
            error: null,

            login: async (credentials) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authService.login(credentials);
                    // Handle both flat and nested (e.g. response.data) responses
                    const data = response.data || response;
                    const token = data.token;
                    const userData = data.user || data;

                    if (!token) {
                        throw new Error('Authentication failed: No token received from server.');
                    }

                    localStorage.setItem('token', token);

                    set({
                        user: userData,
                        token: token,
                        isAuthenticated: true,
                        isLoading: false
                    });

                    return response;
                } catch (error) {
                    const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
                    set({ error: errorMessage, isLoading: false, isAuthenticated: false });
                    throw error;
                }
            },

            logout: async () => {
                set({ isLoading: true });
                try {
                    // 1. Force backup on logout to ensure data is synced to GDrive
                    try {
                        await backupService.performBackup(true);
                    } catch (e) {
                        console.error('Standard backup failed on logout:', e);
                    }

                    // 2. Call logout API and get shift data from response
                    const logoutResponse = await authService.logout();

                    // 3. Perform specific logout shift backup to Google Drive
                    if (logoutResponse) {
                        await backupService.performLogoutBackup(logoutResponse);
                    }
                } catch (error) {
                    console.error('Logout sequence failed:', error);
                } finally {
                    // 4. Always cleanup local state
                    localStorage.removeItem('token');
                    localStorage.removeItem('auth-storage');
                    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
                }
            },

            getToken: () => get().token,
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);

export default useAuthStore;

