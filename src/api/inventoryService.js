import axios from './axios';

const inventoryService = {
    getInventory: async (status = 'ALL') => {
        try {
            const data = await axios.get(`/inventory/products?status=${status}`);
            return data;
        } catch (error) {
            console.error('Error fetching inventory:', error);
            throw error;
        }
    },
    getInventorySummary: async () => {
        try {
            const response = await axios.get('/inventory/summary');
            return response;
        } catch (error) {
            console.error('Error fetching inventory summary:', error);
            throw error;
        }
    },
    getInventoryHistory: async (productId) => {
        try {
            const response = await axios.get(`/inventory/history/${productId}`);
            return response;
        } catch (error) {
            console.error('Error fetching inventory history:', error);
            throw error;
        }
    },
    adjustStock: async (adjustmentData) => {
        try {
            const response = await axios.post('/inventory/adjust', adjustmentData);
            return response;
        } catch (error) {
            console.error('Error adjusting stock:', error);
            throw error;
        }
    }
};

export default inventoryService;
