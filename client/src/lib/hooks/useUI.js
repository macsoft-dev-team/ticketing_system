import { useSelector, useDispatch } from 'react-redux';
import { 
  toggleSidebar,
  setSidebarCollapsed,
  setTheme,
  setIsMobile,
  setLoading,
  setNotification,
  clearNotification 
} from '../lib/features/uiSlice';

export const useUI = () => {
  const dispatch = useDispatch();
  const ui = useSelector((state) => state.ui);

  return {
    ...ui,
    toggleSidebar: () => dispatch(toggleSidebar()),
    setSidebarCollapsed: (collapsed) => dispatch(setSidebarCollapsed(collapsed)),
    setTheme: (theme) => dispatch(setTheme(theme)),
    setIsMobile: (isMobile) => dispatch(setIsMobile(isMobile)),
    setLoading: (loading) => dispatch(setLoading(loading)),
    showNotification: (notification) => dispatch(setNotification(notification)),
    hideNotification: () => dispatch(clearNotification()),
  };
};

export default useUI;
