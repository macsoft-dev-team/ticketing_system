import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../lib/hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';
 
const ProtectedRoute = ({ children, requiredPermission, requiredRoles }) => {
  const { isAuthenticated, user, token, hasPermission, canAccess, loading, checkAuth } = useAuth();
  const location = useLocation();

  // Check authentication status if we have a token but no user
  useEffect(() => {
    if (token && !user && !loading) {
      checkAuth();
    }
  }, [token, user, loading, checkAuth]);

  // Show loading while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user || !token) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user needs organization setup (skip for organization-setup page itself and MACSOFT roles)
  const macsoftRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT'];
  const needsOrganization = !user.orgCode && !user.organisation && !macsoftRoles.includes(user.role);
  
  if (location.pathname !== '/organization-setup' && needsOrganization) {
    return <Navigate to="/organization-setup" replace />;
  }

  // Check role-based access
  if (requiredRoles && !canAccess(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-sm text-gray-600 mb-4">
            You don't have the required role to access this page.
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Required: {Array.isArray(requiredRoles) ? requiredRoles.join(', ') : requiredRoles}
            <br />
            Your role: {user?.role || 'Unknown'}
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-sm text-gray-600 mb-4">
            You don't have the required permission to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
