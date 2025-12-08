import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Check, Trash2, Bell, MessageCircle, Ticket, Users2, Combine, User, Calendar, ChevronDown } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import useAuth from '../../lib/hooks/useAuth';
import useNotificationPermissions from '../../lib/hooks/useNotificationPermissions';
import { useToast } from '../../components/ui/toast';
import { debounceSearch } from '../../utils/debounce';
import moment from 'moment';

const NotificationsPage = () => {
  const { user, token } = useAuth();
  const { hasPermission, canPerformBulkActions, canDeleteNotifications } = useNotificationPermissions();
  const { addToast } = useToast();

  // Check if user has permission to view notifications
  if (!hasPermission('view')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view notifications.</p>
        </div>
      </div>
    );
  }

  // State management
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    dateRange: 'all',
    ticketId: ''
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Notification types for filtering
  const notificationTypes = [
    { value: 'all', label: 'All Types', icon: Bell },
    { value: 'ticket', label: 'Tickets', icon: Ticket },
    { value: 'message', label: 'Messages', icon: MessageCircle },
    { value: 'spare_request', label: 'Spare Requests', icon: Combine },
    { value: 'user', label: 'Users', icon: User },
    { value: 'service_center', label: 'Service Centers', icon: Users2 },
    { value: 'system', label: 'System', icon: Bell }
  ];

  // Date ranges for filtering
  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' }
  ];

  // Fetch notifications with filters
  const fetchNotifications = useCallback(async (page = 1, search = '', filterParams = {}) => {
    if (!token) return;

    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: search,
        type: filterParams.type || filters.type,
        status: filterParams.status || filters.status,
        dateRange: filterParams.dateRange || filters.dateRange,
        ticketId: filterParams.ticketId || filters.ticketId,
        sortBy,
        sortOrder
      });

      const baseUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${baseUrl}/notifications?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const transformedNotifications = data.data.map(item => ({
          id: item.id,
          title: item.notification?.title || 'Notification',
          message: item.notification?.description || '',
          type: getNotificationType(item.notification?.type),
          time: moment(item.notification?.createdAt).format('MMM DD, YYYY HH:mm'),
          timeAgo: moment(item.notification?.createdAt).fromNow(),
          unread: !item.seen,
          ticketId: item.notification?.ticketId,
          ticketCode: item.notification?.ticket?.ticketCode,
          createdBy: item.notification?.createdBy,
          rawData: item
        }));

        setNotifications(transformedNotifications);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      addToast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [token, filters, sortBy, sortOrder, addToast]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounceSearch((query) => {
      fetchNotifications(1, query, filters);
    }, 300),
    [fetchNotifications, filters]
  );

  // Effects
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Helper functions
  const getNotificationType = (type) => {
    if (!type) return 'system';
    if (type.includes('conversation') || type.includes('message') || type.includes('chat')) return 'message';
    if (type.includes('ticket')) return 'ticket';
    if (type.includes('spare') || type.includes('request')) return 'spare_request';
    if (type.includes('user') || type.includes('account')) return 'user';
    if (type.includes('service') || type.includes('center')) return 'service_center';
    return 'system';
  };

  const getTypeIcon = (type) => {
    const iconMap = {
      ticket: Ticket,
      message: MessageCircle,
      spare_request: Combine,
      user: User,
      service_center: Users2,
      system: Bell
    };
    const IconComponent = iconMap[type] || Bell;
    return <IconComponent className="w-4 h-4" />;
  };

  const getTypeColor = (type) => {
    const colorMap = {
      ticket: 'text-blue-600 bg-blue-100',
      message: 'text-green-600 bg-green-100',
      spare_request: 'text-purple-600 bg-purple-100',
      user: 'text-indigo-600 bg-indigo-100',
      service_center: 'text-orange-600 bg-orange-100',
      system: 'text-red-600 bg-red-100'
    };
    return colorMap[type] || 'text-gray-600 bg-gray-100';
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n.id)));
    }
  };

  const handleSelectNotification = (id) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  // Bulk actions
  const markSelectedAsRead = async () => {
    if (selectedNotifications.size === 0) return;

    try {
      const baseUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${baseUrl}/notifications/bulk/update`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: Array.from(selectedNotifications),
          updateData: { seen: true }
        })
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            selectedNotifications.has(n.id) ? { ...n, unread: false } : n
          )
        );
        setSelectedNotifications(new Set());

        addToast({
          title: 'Success',
          description: `${selectedNotifications.size} notification(s) marked as read`,
          variant: 'default'
        });
      } else {
        throw new Error('Failed to update notifications');
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      addToast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive'
      });
    }
  };

  const deleteSelected = async () => {
    if (selectedNotifications.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedNotifications.size} notification(s)?`)) return;

    try {
      const baseUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${baseUrl}/notifications/bulk/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: Array.from(selectedNotifications)
        })
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.filter(n => !selectedNotifications.has(n.id))
        );
        setSelectedNotifications(new Set());

        addToast({
          title: 'Success',
          description: `${selectedNotifications.size} notification(s) deleted`,
          variant: 'default'
        });
      } else {
        throw new Error('Failed to delete notifications');
      }
    } catch (error) {
      console.error('Error deleting notifications:', error);
      addToast({
        title: 'Error',
        description: 'Failed to delete notifications',
        variant: 'destructive'
      });
    }
  };

  // Individual notification actions
  const markAsRead = async (id) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL;
      await fetch(`${baseUrl}/notifications/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, unread: false } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Filter handlers
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    fetchNotifications(1, searchQuery, newFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      type: 'all',
      status: 'all',
      dateRange: 'all',
      ticketId: ''
    };
    setFilters(defaultFilters);
    setSearchQuery('');
    setCurrentPage(1);
    fetchNotifications(1, '', defaultFilters);
  };

  // Pagination
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchNotifications(page, searchQuery, filters);
    }
  };

  // Navigation handler
  const handleNotificationClick = (notification) => {
    // Mark as read
    if (notification.unread) {
      markAsRead(notification.id);
    }

    // Navigate based on type - you can implement navigation logic here
    console.log('Navigate to notification:', notification);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and view all your notifications
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="px-3 py-1">
                {totalCount} Total
              </Badge>
              <Badge variant="destructive" className="px-3 py-1">
                {notifications.filter(n => n.unread).length} Unread
              </Badge>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
              {/* Search Bar */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Bulk Actions */}
              {selectedNotifications.size > 0 && canPerformBulkActions() && (
                <div className="flex items-center space-x-2">
                  {hasPermission('update') && (
                    <button
                      onClick={markSelectedAsRead}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark Read ({selectedNotifications.size})</span>
                    </button>
                  )}
                  {canDeleteNotifications() && (
                    <button
                      onClick={deleteSelected}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete ({selectedNotifications.size})</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Filter Panel */}
            {isFilterOpen && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={filters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {notificationTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="unread">Unread</option>
                      <option value="read">Read</option>
                    </select>
                  </div>

                  {/* Date Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {dateRanges.map(range => (
                        <option key={range.value} value={range.value}>
                          {range.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ticket ID Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ticket ID</label>
                    <input
                      type="text"
                      placeholder="Enter ticket ID..."
                      value={filters.ticketId}
                      onChange={(e) => handleFilterChange('ticketId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={resetFilters}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Reset all filters
                  </button>
                  <div className="text-sm text-gray-500">
                    {totalCount} notification(s) found
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* List Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={selectedNotifications.size === notifications.length && notifications.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  {selectedNotifications.size > 0 
                    ? `${selectedNotifications.size} selected` 
                    : 'Select all'
                  }
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No notifications found</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                    notification.unread ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(notification.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectNotification(notification.id);
                      }}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(notification.type)}`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-medium ${notification.unread ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                          {notification.unread && (
                            <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full inline-block"></span>
                          )}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {notification.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-gray-500">{notification.timeAgo}</span>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        {notification.ticketCode && (
                          <span className="flex items-center space-x-1">
                            <Ticket className="w-3 h-3" />
                            <span>{notification.ticketCode}</span>
                          </span>
                        )}
                        {notification.createdBy && (
                          <span className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{notification.createdBy.name}</span>
                          </span>
                        )}
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{notification.time}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalCount)} of {totalCount} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;