import { NotificationBell, MessageBox, UserMenu, LogoSection } from './components';
import BuzzerAlerts from '../../BuzzerAlerts';

const Topbar = () => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex gap-10 items-center px-2 sm:px-6">
      {/* Logo Section */}
      <LogoSection />
      
      {/* Spacer */}
      <div className="flex-1"></div>

      <div className="flex items-center space-x-2">
        {/* Buzzer Alerts */}
        <BuzzerAlerts />
        
        {/* Notifications */}
        <NotificationBell />

        {/* Message Box */}
        <MessageBox />
        
      {/*   User Menu */}
        <UserMenu />
      </div>
    </header>
  );
};

export default Topbar;