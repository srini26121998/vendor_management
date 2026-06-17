import api from './axios';

/**
 * @typedef {Object} SupplierResponse
 * @property {string} id - Unique identifier (UUID string from backend)
 * @property {string} name - Supplier name
 * @property {string} contactPerson - Contact person
 * @property {string} phoneNumber - Phone number
 * @property {string} email - Email
 * @property {string} gstNumber - GST number
 * @property {string} address - Address
 */

/**
 * Supplier Service for managing suppliers
 */
const supplierService = {
    /**
     * Get all suppliers
     * @returns {Promise<SupplierResponse[]>}
     */
    getSuppliers: async () => {
        return await api.get('/suppliers');
    },

    /**
     * Create a new supplier
     * @param {Object} supplierData
     * @returns {Promise<SupplierResponse>}
     */
    createSupplier: async (supplierData) => {
        return await api.post('/suppliers', supplierData);
    },

    /**
     * Update an existing supplier
     * @param {string} id
     * @param {Object} supplierData
     * @returns {Promise<SupplierResponse>}
     */
    updateSupplier: async (id, supplierData) => {
        return await api.put(`/suppliers/${id}`, supplierData);
    },

    /**
     * Delete a supplier
     * @param {string} id
     * @returns {Promise<void>}
     */
    deleteSupplier: async (id) => {
        await api.delete(`/suppliers/${id}`);
    },

    /**
     * Get supplier by ID
     * @param {string} id
     * @returns {Promise<SupplierResponse>}
     */
    getSupplierById: async (id) => {
        return await api.get(`/suppliers/${id}`);
    }
};

export default supplierService;
