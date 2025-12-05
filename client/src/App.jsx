import React from 'react';
import { RouterProvider } from "react-router-dom";
import { switchRoutes } from "./lib/constants/routes";
import "./App.css";
import LoadingSpinner from './components/LoadingSpinner';
import { ToastProvider } from './components/ui/toast';
import { SocketProvider } from './lib/contexts/SocketContext';
import { BuzzerAlertsProvider } from './lib/contexts/BuzzerAlertsContext';
import useAuth from './lib/hooks/useAuth';
import { SessionManager } from './lib/utils/sessionManager';
import { SoundProvider } from './lib/hooks/SoundManager';

function App() {
  const [router, setRouter] = React.useState(null);
  const [initializing, setInitializing] = React.useState(true);
  const { user, loading, token, setUser, setToken, isAuthenticated, checkAuth } = useAuth();

  // Initialize authentication on app start
  React.useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize session activity tracking
        SessionManager.initializeActivityTracking();

        const storedUser = SessionManager.getUser();
        const storedToken = SessionManager.getToken();

        // Check if session is expired first
        if (SessionManager.isSessionExpired()) {
          SessionManager.logout();
          setInitializing(false);
          return;
        }

        // If we have stored credentials and they're not in Redux yet
        if (storedUser && storedToken && !user && !token) {
          try {
            // Set user and token in Redux
            setUser(storedUser);
            setToken(storedToken);

            // Verify token is still valid with the server
            await checkAuth();
          } catch (error) {
            // Token is invalid, clear storage
            SessionManager.logout();
          }
        } else if (token && !user) {
          // If we have token but no user, verify with server
          try {
            await checkAuth();
          } catch (error) {
            SessionManager.logout();
          }
        }
      } catch (error) {
        SessionManager.logout();
      } finally {
        setInitializing(false);
      }
    };

    initializeAuth();
  }, []); // Run only once on mount

  // Set router based on authentication status
  React.useEffect(() => {
    if (!initializing) {
      if (isAuthenticated && user) {
        const routes = switchRoutes(user.role || "MACSOFT_ADMIN");
        setRouter(routes);
      } else {
        // Show login routes when not authenticated
        const loginRouter = switchRoutes("END_USER");
        setRouter(loginRouter);
      }
    }
  }, [isAuthenticated, user, initializing]);

  if (initializing || loading) {
    return <LoadingSpinner />;
  }

  if (!router) {
    return <LoadingSpinner />;
  }

  return (
    <ToastProvider>
      <SocketProvider>
        <SoundProvider defaultVolume={0.45}>
          <BuzzerAlertsProvider>
            <div className="App">
              <RouterProvider router={router} />
            </div>
          </BuzzerAlertsProvider>
        </SoundProvider>
      </SocketProvider>
    </ToastProvider>
  );
}

export default App;
