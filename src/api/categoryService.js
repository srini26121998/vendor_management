import api from './axios';

/**
 * @typedef {Object} CategoryRequest
 * @property {string} name - Name of the category/product
 * @property {string} description - Description of the category/product
 * @property {number} selling_price - Selling price of the category/product
 * @property {number} gst_rate - GST rate percentage
 */

/**
 * @typedef {Object} CategoryResponse
 * @property {number} id - Unique identifier
 * @property {string} name - Name
 * @property {string} description - Description
 * @property {number} selling_price - Selling price
 * @property {number} gst_rate - GST rate
 */

/**
 * Category Service for managing categories/products
 */
const categoryService = {
    /**
     * Create a new category
     * @param {CategoryRequest} categoryData 
     * @returns {Promise<CategoryResponse>}
     */
    createCategory: async (categoryData) => {
        return await api.post('/categories', categoryData);
    },

    /**
     * Get all categories
     * @returns {Promise<CategoryResponse[]>}
     */
    getCategories: async () => {
        return await api.get('/categories');
    },

    /**
     * Get category by ID
     * @param {number|string} id 
     * @returns {Promise<CategoryResponse>}
     */
    getCategoryById: async (id) => {
        return await api.get(`/categories/${id}`);
    },

    /**
     * Update an existing category
     * @param {number|string} id
     * @param {CategoryRequest} categoryData
     * @returns {Promise<CategoryResponse>}
     */
    updateCategory: async (id, categoryData) => {
        return await api.put(`/categories/${id}`, categoryData);
    },

    /**
     * Delete a category
     * @param {number|string} id
     * @returns {Promise<void>}
     */
    deleteCategory: async (id) => {
        return await api.delete(`/categories/${id}`);
    }
};

export default categoryService;
