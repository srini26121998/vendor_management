import api from './axios';

/**
 * @typedef {Object} LoginRequest
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} AuthResponse
 * @property {string} token
 * @property {string} tokenType
 * @property {string} id
 * @property {string} userId
 * @property {string} name
 * @property {string} email
 * @property {string} role
 */

/**
 * @typedef {import('../types/auth').ForgotPasswordRequest} ForgotPasswordRequest
 */

/**
 * @typedef {import('../types/auth').ForgotPasswordResponse} ForgotPasswordResponse
 */

/**
 * @typedef {import('../types/auth').ResetPasswordRequest} ResetPasswordRequest
 */

/**
 * @typedef {import('../types/auth').ResetPasswordResponse} ResetPasswordResponse
 */

const authService = {
    /**
     * Authenticate user with email and password
     * @param {LoginRequest} credentials 
     * @returns {Promise<AuthResponse>}
     */
    login: async (credentials) => {
        return await api.post('/auth/login', credentials);
    },

    /**
     * Register a new user
     * @param {Object} userData
     * @returns {Promise<any>}
     */
    register: async (userData) => {
        return await api.post('/auth/register', userData);
    },

    /**
     * Send password reset link to user email
     * @param {ForgotPasswordRequest} data 
     * @returns {Promise<ForgotPasswordResponse>}
     */
    forgotPassword: async (data) => {
        return await api.post('/auth/forgot-password', data);
    },

    /**
     * Reset user password using a valid reset token
     * @param {ResetPasswordRequest} data - Object containing the reset token and new password 
     * @returns {Promise<ResetPasswordResponse>} - API response with success message
     */
    resetPassword: async (data) => {
        return await api.post('/auth/reset-password', data);
    },

    /**
     * Logout user
     */
    logout: async () => {
        return await api.post('/auth/logout');
    }
};

export default authService;
