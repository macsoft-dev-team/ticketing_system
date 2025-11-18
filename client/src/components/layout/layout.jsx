import Sidebar from './Sidebar';
import Topbar from './topbar/Topbar';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setSidebarCollapsed } from '../../lib/features/uiSlice';

const Layout = () => {
    const { sidebarCollapsed } = useSelector(state => state.ui);
    const dispatch = useDispatch();

    const handleBackdropClick = () => {
        dispatch(setSidebarCollapsed(false));
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Desktop sidebar - always visible on lg+ screens */}
            <div className="hidden lg:block">
                <Sidebar />
            </div>
            
            {/* Mobile sidebar - overlay that shows/hides based on state */}
            <div className={`
                fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ease-in-out
                ${sidebarCollapsed ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
            `}>
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-black/15"
                    onClick={handleBackdropClick}
                ></div>
                
                {/* Sidebar */}
                <div className={`
                    absolute left-0 top-0 h-full transform transition-transform duration-300 ease-in-out
                    ${sidebarCollapsed ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    <Sidebar />
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-y-auto " onClick={handleBackdropClick}>
                     <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;