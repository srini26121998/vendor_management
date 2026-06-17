import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

// ── DEV BYPASS: set localStorage.devBypass = '1' in browser console to skip auth
const DEV_BYPASS = import.meta.env.DEV && localStorage.getItem('devBypass') === '1';

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const location = useLocation();

    if (!isAuthenticated && !DEV_BYPASS) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
