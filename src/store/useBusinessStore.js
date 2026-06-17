import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import settingsService from '../api/settingsService';

const useBusinessStore = create(
    persist(
        (set, get) => ({
            businessProfile: {
                businessName: '',
                address: '',
                gstin: '',
                phone: '',
                email: '',
                state: '',
                stateCode: '',
                bankDetails: '',
                autoBackup: false,
                backupEmail: '',
            },
            loading: false,

            fetchSettings: async () => {
                const token = localStorage.getItem('token');
                if (!token) return;

                set({ loading: true });
                try {
                    const data = await settingsService.getSettings();
                    if (data && typeof data === 'object') {
                        set({ businessProfile: { ...get().businessProfile, ...data }, loading: false });
                    }
                } catch (error) {
                    console.error('Error fetching settings:', error);
                    if (error.response?.status === 403) {
                        // Silent fail or handle as unauthorized
                        set({ loading: false });
                    } else {
                        set({ loading: false });
                    }
                } finally {
                    set({ loading: false });
                }
            },

            updateProfile: async (newData) => {
                set({ loading: true });
                try {
                    const updatedData = { ...get().businessProfile, ...newData };
                    await settingsService.updateSettings(updatedData);
                    set({ businessProfile: updatedData });
                    return true;
                } catch (error) {
                    console.error('Error updating settings:', error);
                    throw error;
                } finally {
                    set({ loading: false });
                }
            },
        }),
        {
            name: 'business-profile-storage',
        }
    )
);

export default useBusinessStore;
