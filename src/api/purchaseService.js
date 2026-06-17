import api from './axios';

/**
 * @typedef {Object} PurchaseItem
 * @property {string} productId - Product UUID
 * @property {number} quantity - Quantity purchased
 * @property {number} purchaseRate - Rate at which product is purchased
 * @property {number} gstRate - GST Rate percentage
 * @property {number} discountPct - Discount percentage
 */

/**
 * @typedef {Object} PurchaseRequest
 * @property {string} supplierId - Supplier UUID
 * @property {string} invoiceNumber - Invoice Number
 * @property {string} invoiceDate - Invoice Date (YYYY-MM-DD)
 * @property {string} paymentMode - Payment Mode (e.g., BANK_TRANSFER, CASH)
 * @property {string} dueDate - Due Date (YYYY-MM-DD)
 * @property {string} status - Status (e.g., COMPLETED, PENDING)
 * @property {PurchaseItem[]} items - List of purchase items
 */

const purchaseService = {
    /**
     * Create a new purchase order
     * @param {PurchaseRequest} purchaseData 
     * @returns {Promise<any>}
     */
    createPurchase: async (purchaseData) => {
        return await api.post('/purchase-orders', purchaseData);
    },

    /**
     * Get all purchase orders
     * @returns {Promise<any[]>}
     */
    getPurchases: async () => {
        return await api.get('/purchase-orders');
    },

    /**
     * Get purchase details by ID
     * @param {string} id 
     * @returns {Promise<any>}
     */
    getPurchaseById: async (id) => {
        return await api.get(`/purchase-orders/${id}`);
    },

    /**
     * Delete a purchase record by ID
     * @param {string} id 
     * @returns {Promise<any>}
     */
    deletePurchase: async (id) => {
        return await api.delete(`/purchase-orders/${id}`);
    },

    /**
     * Update an existing purchase order
     * @param {string} id
     * @param {PurchaseRequest} purchaseData
     * @returns {Promise<any>}
     */
    updatePurchase: async (id, purchaseData) => {
        return await api.put(`/purchase-orders/${id}`, purchaseData);
    },

    /**
     * Update status of purchase order
     * @param {string} id
     * @param {string} status
     * @returns {Promise<any>}
     */
    updatePurchaseStatus: async (id, status) => {
        return await api.put(`/purchase-orders/${id}/status?status=${status}`);
    },

    /**
     * Vendor responds to a purchase order
     * @param {string} id
     * @param {string} status
     * @param {string} deliveryDate
     * @returns {Promise<any>}
     */
    vendorRespondToPO: async (id, status, deliveryDate) => {
        let url = `/purchase-orders/${id}/vendor-response?status=${status}`;
        if (deliveryDate) {
            url += `&deliveryDate=${deliveryDate}`;
        }
        return await api.put(url);
    }
};

export default purchaseService;
