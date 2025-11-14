import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from './useAuth';

export const useAuthGuard = (requiredRoles = null, requiredPermissions = null, redirectTo = '/login') => {
  const { isAuthenticated, user, token, canAccess, hasPermission, loading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuthorization = () => {
      setIsChecking(true);

      // Wait for auth to be loaded
      if (loading) {
        return;
      }

      // Check if user is authenticated
      if (!isAuthenticated || !user || !token) {
        setIsAuthorized(false);
        setIsChecking(false);
        navigate(redirectTo, { 
          state: { from: location },
          replace: true 
        });
        return;
      }

      // Check role requirements
      if (requiredRoles && !canAccess(requiredRoles)) {
        setIsAuthorized(false);
        setIsChecking(false);
        return;
      }

      // Check permission requirements
      if (requiredPermissions) {
        const hasRequiredPermissions = Array.isArray(requiredPermissions)
          ? requiredPermissions.every(permission => hasPermission(permission))
          : hasPermission(requiredPermissions);

        if (!hasRequiredPermissions) {
          setIsAuthorized(false);
          setIsChecking(false);
          return;
        }
      }

      setIsAuthorized(true);
      setIsChecking(false);
    };

    checkAuthorization();
  }, [isAuthenticated, user, token, loading, requiredRoles, requiredPermissions, canAccess, hasPermission, navigate, redirectTo, location]);

  return {
    isAuthorized,
    isChecking,
    user,
    isAuthenticated
  };
};

export const useRoleGuard = (allowedRoles) => {
  return useAuthGuard(allowedRoles);
};

export const usePermissionGuard = (requiredPermissions) => {
  return useAuthGuard(null, requiredPermissions);
};

export const useAdminGuard = () => {
  return useAuthGuard(['MACSOFT_ADMIN', 'CUSTOMER_ADMIN']);
};

export const useTechnicalGuard = () => {
  return useAuthGuard(['MACSOFT_ADMIN', 'MACSOFT_TECHNICAL_USER', 'CUSTOMER_TECHNICAL_USER']);
};

export const useMacsoftGuard = () => {
  return useAuthGuard(['MACSOFT_ADMIN', 'MACSOFT_TECHNICAL_USER', 'MACSOFT_USER']);
};

export default useAuthGuard;