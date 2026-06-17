import api from './axios';

const settingsService = {
    getSettings: async () => {
        return api.get('/settings');
    },

    updateSettings: async (settingsData) => {
        return api.post('/settings', settingsData);
    }
};

export default settingsService;
