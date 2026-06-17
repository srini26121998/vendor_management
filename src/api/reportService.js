import api from './axios';

/**
 * Report Service
 * Handles all business analytics and tax reports
 */
const reportService = {
    /**
     * Get GST Summary Report
     * @param {string} from - ISO date (YYYY-MM-DD)
     * @param {string} to - ISO date (YYYY-MM-DD)
     * @returns {Promise<Object>} GST summary data
     */
    getGstSummary: async (from, to) => {
        try {
            return await api.get('/reports/gst-summary', {
                params: { from, to }
            });
        } catch (error) {
            console.error('Error fetching GST summary:', error);
            throw error;
        }
    }
};

export default reportService;
