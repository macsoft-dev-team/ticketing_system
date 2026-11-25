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

  // Group menus by category
  const CATEGORY_DEFINITIONS = [
    { id: 'main', label: 'Overview' },
    { id: 'tickets', label: 'Ticket Operations' },
    { id: 'rms', label: 'RMS & VFD Control' },
    { id: 'inventory', label: 'Inventory & Assets' },
    { id: 'admin', label: 'Administration' },
  ];

  const groupedMenus = CATEGORY_DEFINITIONS.map(cat => ({
    ...cat,
    items: menus.filter(item => item.category === cat.id),
  })).filter(cat => cat.items.length > 0);

  const uncategorized = menus.filter(
    item => !CATEGORY_DEFINITIONS.some(cat => cat.id === item.category)
  );
  if (uncategorized.length > 0) {
    groupedMenus.push({
      id: 'other',
      label: 'Other',
      items: uncategorized,
    });
  }

  if (sidebarCollapsed)
  return (
    <div className="w-64 fixed z-50 h-full bg-white shadow-lg lg:shadow-sm border-r border-gray-200 flex flex-col">
      <div className="p-4 lg:px-5 lg:py-3.5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center">
            <div className='w-9'>
              <img
                src={logo}
                alt="Macsoft Logo"
                className="border-0 w-full h-full object-contain"
              />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider text-slate-800 uppercase">Macsoft</h1>
            <p className="text-xs text-gray-500 font-medium">Ticketing System</p>
          </div>
        </div>
      </div>
      <button onClick={handleToggleSidebar} className='absolute top-4 -end-5 bg-cyan-600/80 px-2 w-max h-max cursor-pointer flex items-center rounded text-white'>
        <ChevronLeft />
      </button>

      <nav className="px-3 py-2 overflow-y-auto flex-1 divide-y divide-gray-100/70">
        {groupedMenus.map((cat, idx) => (
          <div key={cat.id} className={cn("space-y-0.5", idx > 0 ? "pt-3 pb-1" : "pb-1")}>
            <div className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
              {cat.label}
            </div>
            <ul className="space-y-0.5">
              {cat.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <li key={item.label}>
                    <NavLink
                      to={item.path}
                      onClick={handleLinkClick}
                      className={cn(
                        "group flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-150",
                        isActive
                          ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs font-bold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <Icon className={cn(
                          "w-4 h-4 flex-shrink-0 transition-colors",
                          isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                        )} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isActive && (
                        <ChevronRight className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <footer className="px-3 py-2.5 border-t border-gray-100 space-y-0.5 flex-shrink-0 bg-slate-50/50">
        <div>
          <Link
            to={"/profile"}
            onClick={handleLinkClick}
            className={cn(
              "group flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors duration-150",
              isProfileActive
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-slate-600 hover:bg-white hover:text-slate-900"
            )}
          >
            <div className="flex items-center space-x-2.5">
              <UserCircle className={cn(
                "w-4 h-4 transition-colors",
                isProfileActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
              )} />
              <span>Profile</span>
            </div>
            {isProfileActive && (
              <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
            )}
          </Link>
        </div>
        <div>
          <Link
            to={"/login"}
            onClick={handleLogout}
            className="group flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors duration-150 text-slate-600 hover:bg-white hover:text-red-600"
          >
            <div className="flex items-center space-x-2.5">
              <LogOut className="w-4 h-4 transition-colors text-slate-400 group-hover:text-red-600" />
              <span>Sign out</span>
            </div>
          </Link>
        </div>

      </footer>
    </div>
  );
};

export default Sidebar;