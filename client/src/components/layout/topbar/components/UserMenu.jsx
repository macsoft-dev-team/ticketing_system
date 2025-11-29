import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Settings, UserCheck } from 'lucide-react';
import useAuth from '../../../../lib/hooks/useAuth';

const UserMenu = () => {
  const { user, quickLogout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
 
    // Emergency logout - clear everything immediately
    try {
      // Clear session storage directly
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('last_activity');

      // Clear Redux state
      quickLogout();

      // Clear any axios headers
      if (window.axios && window.axios.defaults && window.axios.defaults.headers) {
        delete window.axios.defaults.headers.common['Authorization'];
      }

      // Navigate to login
      navigate('/login', { replace: true });

      // Force page reload after a short delay to ensure clean state
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    } catch (error) {
      console.error('Emergency logout error:', error);
      // Ultimate fallback - just redirect
      window.location.href = '/login';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
        onClick={() => setShowUserMenu(!showUserMenu)}
      >
        <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
          {/* User Avatar */}
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>

          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
            <p className="text-[8px] text-gray-500">{user?.role || 'Role'}</p>
          </div>
        </div>
      </button>
      
     {/*  {showUserMenu && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-600 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-600">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.name || 'User'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user?.phone || 'Phone not available'}
            </p>
          </div>
          <div className="py-2">
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={() => {
                setShowAccountDialog(true);
                setShowUserMenu(false);
              }}
            >
              <UserCheck className="w-4 h-4 mr-3" />
              Account Settings
            </button>
            <Link to="/settings">
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => setShowUserMenu(false)}
              >
                <Settings className="w-4 h-4 mr-3" />
                Preferences
              </button>
            </Link>
          </div>
          <div className="border-t border-gray-200 py-2 dark:border-gray-600">
            <button
              onClick={() => {
                 setShowUserMenu(false);
                handleLogout();
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default UserMenu;