import api from './axios';

/**
 * @typedef {Object} ProductRequest
 * @property {string} name - Product name
 * @property {string} sku - Product Stock Keeping Unit
 * @property {string} categoryId - Category UUID
 * @property {string} unit - Product unit (e.g., PCS, KG)
 * @property {number} purchaseRate - Rate at which product is purchased
 * @property {number} mrp - Maximum Retail Price
 * @property {number} sellingPrice - Selling price of the product
 * @property {number} gstRate - GST rate percentage
 * @property {string} hsnCode - HSN Code for the product
 * @property {string} brand - Brand of the product
 * @property {number} minStock - Minimum stock level
 * @property {number} currentStock - Current stock quantity
 */

/**
 * @typedef {Object} ProductResponse
 * @property {string} id - Product UUID
 * @property {string} name - Product name
 * @property {string} sku - SKU
 * @property {string} categoryId - Category ID
 * @property {string} unit - Unit
 * @property {number} purchaseRate - Purchase Rate
 * @property {number} mrp - MRP
 * @property {number} sellingPrice - Selling Price
 * @property {number} gstRate - GST Rate
 * @property {string} hsnCode - HSN Code
 * @property {string} brand - Brand
 * @property {number} minStock - Min Stock
 * @property {number} currentStock - Current Stock
 */

const productService = {
    /**
     * Create a new product
     * @param {ProductRequest} productData 
     * @returns {Promise<ProductResponse>}
     */
    createProduct: async (productData) => {
        return await api.post('/products', productData);
    },

    /**
     * Get all products
     * @returns {Promise<ProductResponse[]>}
     */
    getProducts: async () => {
        return await api.get('/products');
    },

    /**
     * Get product by ID
     * @param {string} id 
     * @returns {Promise<ProductResponse>}
     */
    getProductById: async (id) => {
        return await api.get(`/products/${id}`);
    },

    /**
     * Update an existing product
     * @param {string} id
     * @param {ProductRequest} productData
     * @returns {Promise<ProductResponse>}
     */
    updateProduct: async (id, productData) => {
        return await api.put(`/products/${id}`, productData);
    },

    /**
     * Delete a product
     * @param {string} id
     * @returns {Promise<void>}
     */
    deleteProduct: async (id) => {
        return await api.delete(`/products/${id}`);
    },

    /**
     * Get low stock products
     * @returns {Promise<ProductResponse[]>}
     */
    getLowStockProducts: async () => {
        return await api.get('/products/low-stock');
    },

    /**
     * Get barcodes for a product SKU
     * @param {string} sku
     * @returns {Promise<string[]>}
     */
    getProductBarcodes: async (sku) => {
        return await api.get(`/products/barcode/${sku}`);
    },

    /**
     * Bulk upload products from a CSV/Excel file
     * @param {FormData} formData - FormData containing the file under key 'file'
     * @param {boolean} [autoCreateSuppliers=true] - Whether to auto-create suppliers
     * @returns {Promise<void>}
     */
    bulkUploadProducts: async (formData, autoCreateSuppliers = true) => {
        return await api.post(`/products/bulk-import?autoCreateSuppliers=${autoCreateSuppliers}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    /**
     * Get bulk upload history
     * @returns {Promise<any>}
     */
    getBulkImportHistory: async () => {
        return await api.get('/products/bulk-import/history');
    },

    /**
     * Get bulk upload history detail by ID
     * @param {string} id
     * @returns {Promise<any>}
     */
    getBulkImportHistoryById: async (id) => {
        return await api.get(`/products/bulk-import/history/${id}`);
    },

    /**
     * Delete bulk upload history by ID
     * @param {string} id
     * @returns {Promise<any>}
     */
    deleteBulkImportHistoryById: async (id) => {
        return await api.delete(`/products/bulk-import/history/${id}`);
    },

    /**
     * Get bulk upload templates info
     * @returns {Promise<any>}
     */
    getBulkImportTemplates: async () => {
        return await api.get('/products/bulk-import/templates');
    },

    /**
     * Get specific template by Supplier ID
     */
    getBulkImportTemplateBySupplierId: async (supplierId) => {
        return await api.get(`/products/bulk-import/templates/${supplierId}`);
    },

    /**
     * Delete specific template by Supplier ID
     */
    deleteBulkImportTemplateBySupplierId: async (supplierId) => {
        return await api.delete(`/products/bulk-import/templates/${supplierId}`);
    },

    /**
     * Download a sample CSV template for bulk upload
     */
    downloadTemplate: () => {
        const headers = ['name', 'sku', 'categoryId', 'unit', 'purchaseRate', 'mrp', 'sellingPrice', 'gstRate', 'hsnCode', 'brand', 'minStock', 'currentStock'];
        const sampleData = ['"Test Product"', 'SKU12345', '', 'PCS', '100', '150', '120', '18', '12345678', '"Test Brand"', '10', '50'];
        const csvContent = headers.join(',') + '\n' + sampleData.join(',');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'products_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export default productService;
