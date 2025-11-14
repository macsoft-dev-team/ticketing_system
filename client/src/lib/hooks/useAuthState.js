import { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  login, 
  logout, 
  checkAuth, 
  logoutUser,
  setUser, 
  setToken, 
  clearAuthError,
  setAuthError
} from '../features/authSlice';

export const useAuthState = () => {
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);

  // Memoized auth functions
  const authActions = useMemo(() => ({
    login: (phone, password) => dispatch(login({ phone, password })),
    logout: () => dispatch(logout()),
    logoutUser: () => dispatch(logoutUser()),
    checkAuth: () => dispatch(checkAuth()),
    setUser: (user) => dispatch(setUser(user)),
    setToken: (token) => dispatch(setToken(token)),
    clearError: () => dispatch(clearAuthError()),
    setError: (error) => dispatch(setAuthError(error)),
  }), [dispatch]);

  // Role and permission helpers
  const authHelpers = useMemo(() => ({
    hasRole: (role) => auth.user?.role === role,
    hasAnyRole: (roles) => roles.includes(auth.user?.role),
    hasPermission: (permission) => auth.permissions.includes(permission),
    hasAnyPermission: (permissions) => permissions.some(p => auth.permissions.includes(p)),
    hasAllPermissions: (permissions) => permissions.every(p => auth.permissions.includes(p)),
    canAccess: (requiredRoles) => {
      if (!auth.user?.role) return false;
      if (Array.isArray(requiredRoles)) {
        return requiredRoles.includes(auth.user.role);
      }
      return auth.user.role === requiredRoles;
    },
    isMacsoftUser: () => auth.user?.role?.startsWith('MACSOFT_'),
    isCustomerUser: () => auth.user?.role?.startsWith('CUSTOMER_'),
    isEndUser: () => auth.user?.role === 'END_USER',
    isAdmin: () => ['MACSOFT_ADMIN', 'CUSTOMER_ADMIN'].includes(auth.user?.role),
    isTechnical: () => ['MACSOFT_TECHNICAL_USER', 'CUSTOMER_TECHNICAL_USER'].includes(auth.user?.role),
  }), [auth.user, auth.permissions]);

  return {
    ...auth,
    ...authActions,
    ...authHelpers,
  };
};

export default useAuthState;