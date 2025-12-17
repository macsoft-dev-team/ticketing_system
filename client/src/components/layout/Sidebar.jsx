import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  UserCircle,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { cn } from '../../lib/utils';
import { setSidebarCollapsed, toggleSidebar } from '../../lib/features/uiSlice';
import useAuth from '../../lib/hooks/useAuth';
import { switchMenuItems } from '../../lib/constants/routes';
import logo from '/macsoft-logo.png';



const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { quickLogout, user } = useAuth();
  const { sidebarCollapsed } = useSelector(state => state.ui);

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    dispatch(setSidebarCollapsed(false));
  };
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
  const isProfileActive = location.pathname === '/profile';
  const menus = switchMenuItems(user?.role || 'END_USER').filter(item => !item.hidden);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  if (sidebarCollapsed)
  return (
    <div className="w-64 fixed z-50 h-full bg-white shadow-lg lg:shadow-sm border-r border-gray-200  n">
      <div className="p-6 lg:px-6 lg:py-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center">
            <div className='w-10'>
              <img
                src={logo}
                alt="Macsoft Logo"
                className="border-0 w-full h-full object-contain"

              />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-slate-700 uppercase">Macsoft</h1>
            <p className="text-sm text-gray-500">Ticketing System</p>
          </div>
        </div>
      </div>
      <button onClick={handleToggleSidebar} className='absolute top-5 -end-5 bg-cyan-600/80 px-2 w-max h-max cursor-pointer flex items-center rounded text-white'>
        <ChevronLeft />
      </button>

      <nav className="px-4 py-4 overflow-auto max-h-[calc(100vh-200px)] border-b border-gray-200">
        <ul className="space-y-2">
          {menus.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.label}>
                <NavLink
                  to={item.path}
                  onClick={handleLinkClick}
                  className={cn(
                    "group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200",
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                    )} />
                    <span className="capitalize">{item.label}</span>
                  </div>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-blue-600" />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <footer className="px-4 py-4 space-y-1">
        <div>
          <Link
            to={"/profile"}
            onClick={handleLinkClick}
            className={cn(
              "group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200",
              isProfileActive
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <div className="flex items-center space-x-3">
              <UserCircle className={cn(
                "w-5 h-5 transition-colors",
                isProfileActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
              )} />
              <span>Profile</span>
            </div>
            {isProfileActive && (
              <ChevronRight className="w-4 h-4 text-blue-600" />
            )}
          </Link>
        </div>
        <div>
          <Link
            to={"/login"}
            onClick={handleLogout}
            className={cn(
              "group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 text-gray-600 hover:bg-gray-50 hover:text-red-600"
            )}
          >
            <div className="flex items-center space-x-3">
              <LogOut className={cn(
                "w-5 h-5 transition-colors text-gray-400 group-hover:text-red-600"
              )} />
              <span>Sign out</span>
            </div>
          </Link>
        </div>

      </footer>
    </div>
  );
};

export default Sidebar;