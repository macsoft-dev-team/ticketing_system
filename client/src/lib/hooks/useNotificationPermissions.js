import { useMemo } from 'react';
import useAuth from './useAuth';

// Define role-based permissions for notifications
const NOTIFICATION_PERMISSIONS = {
  MACSOFT_ADMIN: {
    view: true,
    update: true,
    delete: true,
    bulkAction: true,
    viewAll: true
  },
  MACSOFT_HEAD: {
    view: true,
    update: true,
    delete: true,
    bulkAction: true,
    viewAll: false
  },
  MACSOFT_SUPPORT: {
    view: true,
    update: true,
    delete: true,
    bulkAction: true,
    viewAll: false
  },
  CUSTOMER_SERVICE_HEAD: {
    view: true,
    update: true,
    delete: true,
    bulkAction: true,
    viewAll: false
  },
  SERVICE_CENTER_TECHNICIAN: {
    view: true,
    update: true,
    delete: false,
    bulkAction: false,
    viewAll: false
  },
  CUSTOMER_FIELD_ENGINEER: {
    view: true,
    update: true,
    delete: false,
    bulkAction: false,
    viewAll: false
  }
};

const useNotificationPermissions = () => {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    if (!user || !user.role) {
      return {
        view: false,
        update: false,
        delete: false,
        bulkAction: false,
        viewAll: false
      };
    }

    return NOTIFICATION_PERMISSIONS[user.role] || {
      view: false,
      update: false,
      delete: false,
      bulkAction: false,
      viewAll: false
    };
  }, [user]);

  const hasPermission = (action) => {
    return permissions[action] || false;
  };

  const canPerformBulkActions = () => {
    return permissions.bulkAction;
  };

  const canDeleteNotifications = () => {
    return permissions.delete;
  };

  const canViewAllNotifications = () => {
    return permissions.viewAll;
  };

  return {
    permissions,
    hasPermission,
    canPerformBulkActions,
    canDeleteNotifications,
    canViewAllNotifications
  };
};

export default useNotificationPermissions;