import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Ticket, Users2, Combine, LogOut, MessageCircle, Menu, X, User, Settings, UserCheck } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useRef, useEffect } from 'react';
import logo from "../../assets/macsoft-logo.png";
import { Badge } from '../ui/badge';
import { toggleSidebar } from '../../lib/features/uiSlice';
import useAuth from '../../lib/hooks/useAuth';
import { useSocket } from '../../lib/contexts/SocketContext';
// Notification Bell - Disabled (removed socket notifications, keeping conversations only)
const NotificationBell = () => {
  return (
    <div className="relative">
      <button
        className="p-2 text-gray-300 cursor-not-allowed rounded-lg transition-colors"
        disabled
        title="Notifications disabled (conversations still work in tickets)"
      >
        <Bell className="w-5 h-5" />
      </button>
    </div>
  );


};

const Topbar = () => {
  const { user, logoutUser, quickLogout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { sidebarCollapsed } = useSelector(state => state.ui);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const dropdownRef = useRef(null);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

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
    console.log('Logout button clicked');

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

      console.log('Local logout completed, redirecting...');

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
    <header className="h-16 bg-white border-b border-gray-200 flex gap-10 items-center px-2 sm:px-6">
      {/* Mobile menu button 
      <button
       
        className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        {!sidebarCollapsed ? <Menu className="w-6 h-6" /> : <X className="w-6 h-6" />}
      </button>
*/} {!sidebarCollapsed &&
        <div className="flex items-center max-w-md">
          <div className="flex items-center space-x-3">
            <button onClick={handleToggleSidebar} className="w-10 cursor-pointer h-10 rounded-lg flex items-center justify-center">
              <div className='w-10'>
                <img
                  src={logo}
                  alt="Macsoft Logo"
                  className="border-0 w-full h-full object-contain"

                />
              </div>
            </button>
            <div className='text-nowrap'>
              <h1 className="text-xl font-bold tracking-wider text-slate-700 uppercase">Macsoft</h1>
              <p className="text-sm text-gray-500 ">Ticketing System</p>
            </div>
          </div>
        </div>
      }
      {/* Nav items - Hidden on mobile, shown on desktop 
      <nav className="hidden lg:flex items-center space-x-4 text-nowrap">
        {switchMenuItems(user?.role || 'END_USER').filter(item => !item.hidden).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <div key={item.label}>
              <Link
                to={item.path}
                className={cn(
                  "group flex items-center justify-between px-4 py-3 text-sm font-medium  transition-colors duration-200",
                  isActive
                    ? "text-blue-800 border-b-2 drop-shadow border-blue-800"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-blue-800" : "text-gray-400 group-hover:text-gray-600"
                  )} />
                  <span className="capitalize">{item.label}</span>
                </div>
              </Link>
            </div>
          );
        })}
      </nav>
*/}
      {/* Spacer */}
      <div className="flex-1"></div>

      <div className="flex items-center space-x-2">
        {/* Notifications */}
        <NotificationBell />


        {/* User Menu */}
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
          {showUserMenu && (
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
                    console.log('Manual dropdown logout clicked');
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
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;