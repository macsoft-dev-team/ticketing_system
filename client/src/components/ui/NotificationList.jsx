import { useState } from 'react';
import { Bell, Search, Filter, MoreVertical, X, Check, Trash2, Archive, Eye } from 'lucide-react';
import { Badge } from './badge';
import { NotificationIcon, NOTIFICATION_PRIORITIES } from './NotificationIcons';

const NotificationList = ({ 
  notifications = [], 
  loading = false,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onArchive,
  onFilterChange,
  onSearchChange,
  filters = {
    type: 'all',
    status: 'all',
    priority: 'all'
  }
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearchChange?.(value);
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    const allIds = notifications.map(n => n.id);
    setSelectedNotifications(
      selectedNotifications.length === notifications.length ? [] : allIds
    );
  };

  const handleBulkAction = (action) => {
    switch (action) {
      case 'markAsRead':
        selectedNotifications.forEach(id => onMarkAsRead?.(id));
        break;
      case 'delete':
        selectedNotifications.forEach(id => onDelete?.(id));
        break;
      case 'archive':
        selectedNotifications.forEach(id => onArchive?.(id));
        break;
    }
    setSelectedNotifications([]);
  };

  const getNotificationPriority = (notification) => {
    // Determine priority based on type or explicit priority field
    if (notification.priority) return notification.priority;
    
    if (notification.type?.includes('alert') || notification.type?.includes('urgent')) {
      return 'urgent';
    }
    if (notification.type?.includes('system')) {
      return 'high';
    }
    return 'normal';
  };

  const filteredNotifications = notifications.filter(notification => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        notification.title?.toLowerCase().includes(searchLower) ||
        notification.message?.toLowerCase().includes(searchLower) ||
        notification.ticketCode?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={onMarkAllAsRead}
              className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Mark all as read
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => onFilterChange?.({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="ticket">Tickets</option>
                  <option value="message">Messages</option>
                  <option value="system">System</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => onFilterChange?.({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => onFilterChange?.({ ...filters, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedNotifications.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedNotifications.length} notification{selectedNotifications.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('markAsRead')}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Check className="w-4 h-4 inline mr-1" />
                Mark as Read
              </button>
              <button
                onClick={() => handleBulkAction('archive')}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                <Archive className="w-4 h-4 inline mr-1" />
                Archive
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 inline mr-1" />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-200">
        {loading && (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading notifications...</p>
          </div>
        )}

        {!loading && filteredNotifications.length === 0 && (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'You\'re all caught up!'}
            </p>
          </div>
        )}

        {!loading && filteredNotifications.map((notification) => {
          const priority = getNotificationPriority(notification);
          const priorityConfig = NOTIFICATION_PRIORITIES[priority] || NOTIFICATION_PRIORITIES.normal;
          
          return (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 transition-colors ${
                notification.unread 
                  ? `${priorityConfig.bgColor} border-l-4 ${priorityConfig.borderColor}` 
                  : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedNotifications.includes(notification.id)}
                  onChange={() => handleSelectNotification(notification.id)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />

                {/* Notification Icon */}
                <NotificationIcon type={notification.type} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className={`text-sm font-medium ${
                          notification.unread ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          {notification.title}
                        </p>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                        {priority !== 'normal' && (
                          <Badge className={`text-xs capitalize ${
                            priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {priority}
                          </Badge>
                        )}
                      </div>
                      
                      {notification.message && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400">
                          {notification.time}
                        </p>
                        {notification.ticketCode && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {notification.ticketCode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Menu */}
                    <div className="flex items-center space-x-1 ml-4">
                      {notification.unread && (
                        <button
                          onClick={() => onMarkAsRead?.(notification.id)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Mark as read"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onArchive?.(notification.id)}
                        className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                        title="Archive"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete?.(notification.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk Select All */}
      {!loading && filteredNotifications.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {selectedNotifications.length === filteredNotifications.length 
              ? 'Deselect All' 
              : 'Select All'
            }
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationList;