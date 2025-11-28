import { NotificationBell, UserMenu, LogoSection } from './components';

const Topbar = () => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex gap-10 items-center px-2 sm:px-6">
      {/* Logo Section */}
      <LogoSection />
      
      {/* Spacer */}
      <div className="flex-1"></div>

      <div className="flex items-center space-x-2">
        {/* Notifications */}
        <NotificationBell />
        
      {/*   User Menu */}
        <UserMenu />
      </div>
    </header>
  );
};

export default Topbar;