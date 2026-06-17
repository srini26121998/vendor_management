import api from './axios';

/**
 * Sales Service for managing sales history and invoices
 */
const salesService = {
    /**
     * Get all sales history
     * @returns {Promise<any[]>}
     */
    getSales: async () => {
        return await api.get('/sales');
    },

    /**
     * Create a new sale/invoice
     * @param {Object} salesData 
     * @returns {Promise<any>}
     */
    createSale: async (salesData) => {
        return await api.post('/sales', salesData);
    },

    /**
     * Delete a sale invoice
     * @param {string} id 
     * @returns {Promise<void>}
     */
    deleteSale: async (id) => {
        await api.delete(`/sales/${id}`);
    },

    /**
     * Get sale by ID
     * @param {string} id 
     * @returns {Promise<any>}
     */
    getSaleById: async (id) => {
        return await api.get(`/sales/${id}`);
    },

    /**
     * Get sales summary statistics
     * @returns {Promise<any>}
     */
    getSalesSummary: async () => {
        return await api.get('/sales/summary');
    },

    /**
     * Hold a sale/bill
     * @param {Object} holdData 
     * @returns {Promise<any>}
     */
    holdSale: async (holdData) => {
        return await api.post('/sales/hold', holdData);
    },

    /**
     * Get all held sales
     * @param {string} [userId] Optional userId filter
     * @returns {Promise<any[]>}
     */
    getHeldSales: async (userId) => {
        const params = userId ? { userId } : {};
        return await api.get('/sales/hold', { params });
    },

    /**
     * Delete a held sale
     * @param {string} id 
     * @returns {Promise<void>}
     */
    deleteHeldSale: async (id) => {
        await api.delete(`/sales/hold/${id}`);
    },

    /**
     * Delete all held sales
     * @returns {Promise<void>}
     */
    deleteAllHeldSales: async () => {
        await api.delete('/sales/hold');
    },
};

export default salesService;
