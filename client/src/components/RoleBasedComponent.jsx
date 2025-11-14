import React from 'react';
import useAuth from '../lib/hooks/useAuth';

const RoleBasedComponent = ({ 
  allowedRoles = [], 
  allowedPermissions = [], 
  children, 
  fallback = null,
  requireAll = false // If true, user must have ALL roles/permissions, if false, just ONE
}) => {
  const { user, hasPermission, canAccess } = useAuth();

  if (!user) {
    return fallback;
  }

  // Check role-based access
  const hasRoleAccess = allowedRoles.length === 0 || canAccess(allowedRoles);

  // Check permission-based access
  let hasPermissionAccess = true;
  if (allowedPermissions.length > 0) {
    if (requireAll) {
      hasPermissionAccess = allowedPermissions.every(permission => hasPermission(permission));
    } else {
      hasPermissionAccess = allowedPermissions.some(permission => hasPermission(permission));
    }
  }

  // Grant access if user has either role access AND permission access
  const hasAccess = hasRoleAccess && hasPermissionAccess;

  if (!hasAccess) {
    return fallback;
  }

  return children;
};

// HOC version for wrapping components
export const withRoleProtection = (allowedRoles = [], allowedPermissions = []) => {
  return (WrappedComponent) => {
    return (props) => (
      <RoleBasedComponent 
        allowedRoles={allowedRoles} 
        allowedPermissions={allowedPermissions}
        fallback={<div className="text-gray-500 text-sm">Access denied</div>}
      >
        <WrappedComponent {...props} />
      </RoleBasedComponent>
    );
  };
};

// Specific role components for common use cases
export const AdminOnly = ({ children, fallback = null }) => (
  <RoleBasedComponent 
    allowedRoles={['MACSOFT_ADMIN']} 
    fallback={fallback}
  >
    {children}
  </RoleBasedComponent>
);

export const TechnicalOnly = ({ children, fallback = null }) => (
  <RoleBasedComponent 
    allowedRoles={['MACSOFT_ADMIN', 'MACSOFT_TECHNICAL_USER', 'CUSTOMER_TECHNICAL_USER']} 
    fallback={fallback}
  >
    {children}
  </RoleBasedComponent>
);

export const CustomerAdminOnly = ({ children, fallback = null }) => (
  <RoleBasedComponent 
    allowedRoles={['MACSOFT_ADMIN', 'CUSTOMER_ADMIN']} 
    fallback={fallback}
  >
    {children}
  </RoleBasedComponent>
);

export const MacsoftOnly = ({ children, fallback = null }) => (
  <RoleBasedComponent 
    allowedRoles={['MACSOFT_ADMIN', 'MACSOFT_TECHNICAL_USER', 'MACSOFT_USER']} 
    fallback={fallback}
  >
    {children}
  </RoleBasedComponent>
);

export default RoleBasedComponent;