import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebar } from '../../../../lib/features/uiSlice';
const logo = "/macsoft-logo.png";

const LogoSection = () => {
  const dispatch = useDispatch();
  const { sidebarCollapsed } = useSelector(state => state.ui);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  if (sidebarCollapsed) {
    return null;
  }

  return (
    <div className="flex items-center max-w-md">
      <div className="flex items-center space-x-3">
        <button 
          onClick={handleToggleSidebar} 
          className="w-10 cursor-pointer h-10 rounded-lg flex items-center justify-center"
        >
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
  );
};

export default LogoSection;