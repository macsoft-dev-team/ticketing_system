import { useSelector, useDispatch } from 'react-redux';

import {
  setUser,
  setToken,
  setPermissions,
  setAuthLoading,
  setAuthError,
  login,
  register,
  logout,
  clearAuthError,
  checkAuth,
  logoutUser
} from '../features/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  return {
    ...auth,
    login: (phone, password) => dispatch(login({ phone, password })),
    register: (name, phone, password) => dispatch(register({ name, phone, password })),
    checkAuth: () => dispatch(checkAuth()),
    logoutUser: () => dispatch(logoutUser()),
    setUser: (user) => dispatch(setUser(user)),
    setToken: (token) => dispatch(setToken(token)),
    setPermissions: (permissions) => dispatch(setPermissions(permissions)),
    setLoading: (loading) => dispatch(setAuthLoading(loading)),
    setError: (error) => dispatch(setAuthError(error)),
    logout: () => dispatch(logout()),
    clearError: () => dispatch(clearAuthError()),
    // Quick logout without API call
    quickLogout: () => {
      dispatch(logout());
      return Promise.resolve();
    },
    hasPermission: (permission) => auth.permissions.includes(permission),
    hasRole: (role) => auth.user?.role === role,
    canAccess: (requiredRoles) => {
      if (!auth.user?.role) return false;
      if (Array.isArray(requiredRoles)) {
        return requiredRoles.includes(auth.user.role);
      }
      return auth.user.role === requiredRoles;
    },
  };
};

export default useAuth;
