import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  checkAuth, 
  setUser, 
  setToken, 
  logout as logoutAction 
} from '../features/authSlice';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize authentication on app start
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = sessionStorage.getItem('user');
        const storedToken = sessionStorage.getItem('token');

        if (storedUser && storedToken) {
          const user = JSON.parse(storedUser);
          dispatch(setUser(user));
          dispatch(setToken(storedToken));
          
          // Verify token is still valid
          try {
            await dispatch(checkAuth()).unwrap();
          } catch (error) {
            // Token is invalid, clear storage
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('token');
            dispatch(logoutAction());
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initAuth();
  }, [dispatch]);

  const contextValue = {
    ...auth,
    isInitialized,
    checkAuth: () => dispatch(checkAuth()),
    logout: () => {
      dispatch(logoutAction());
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
    }
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;