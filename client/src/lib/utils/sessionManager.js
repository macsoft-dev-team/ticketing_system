// Session management utilities
export class SessionManager {
  static SESSION_KEYS = {
    USER: 'user',
    TOKEN: 'token',
    REFRESH_TOKEN: 'refresh_token',
    LAST_ACTIVITY: 'last_activity',
    THEME: 'theme',
    LANGUAGE: 'language'
  };

  static SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds

  // Get item from session storage with JSON parsing
  static getItem(key) {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error parsing session item ${key}:`, error);
      return null;
    }
  }

  // Set item to session storage with JSON stringification
  static setItem(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting session item ${key}:`, error);
      return false;
    }
  }

  // Remove item from session storage
  static removeItem(key) {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing session item ${key}:`, error);
      return false;
    }
  }

  // Clear all session data
  static clearSession() {
    try {
      Object.values(this.SESSION_KEYS).forEach(key => {
        sessionStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing session:', error);
      return false;
    }
  }

  // Check if session is expired
  static isSessionExpired() {
    const lastActivity = this.getItem(this.SESSION_KEYS.LAST_ACTIVITY);
    if (!lastActivity) return true;
    
    const now = Date.now();
    return (now - lastActivity) > this.SESSION_TIMEOUT;
  }

  // Update last activity timestamp
  static updateActivity() {
    this.setItem(this.SESSION_KEYS.LAST_ACTIVITY, Date.now());
  }

  // Get user from session
  static getUser() {
    return this.getItem(this.SESSION_KEYS.USER);
  }

  // Set user in session
  static setUser(user) {
    this.updateActivity();
    return this.setItem(this.SESSION_KEYS.USER, user);
  }

  // Get token from session
  static getToken() {
    return sessionStorage.getItem(this.SESSION_KEYS.TOKEN);
  }

  // Set token in session
  static setToken(token) {
    this.updateActivity();
    sessionStorage.setItem(this.SESSION_KEYS.TOKEN, token);
    return true;
  }

  // Remove token from session
  static removeToken() {
    return this.removeItem(this.SESSION_KEYS.TOKEN);
  }

  // Check if user is authenticated
  static isAuthenticated() {
    const user = this.getUser();
    const token = this.getToken();
    return !!(user && token && !this.isSessionExpired());
  }

  // Get user role
  static getUserRole() {
    const user = this.getUser();
    return user?.role || null;
  }

  // Check if user has specific role
  static hasRole(role) {
    return this.getUserRole() === role;
  }

  // Check if user has any of the specified roles
  static hasAnyRole(roles) {
    const userRole = this.getUserRole();
    return Array.isArray(roles) ? roles.includes(userRole) : userRole === roles;
  }

  // Session cleanup on logout
  static logout() {
    this.clearSession();
    
    // Clear any additional storage
    localStorage.removeItem('remember_me');
    
    // Clear axios authorization header
    delete window.axios?.defaults?.headers?.common['Authorization'];
  }

  static _activityTrackingInitialized = false;
  static _activityCheckInterval = null;
  static _activityHandlers = [];

  // Initialize session activity tracking
  static initializeActivityTracking() {
    // Prevent multiple initializations
    if (this._activityTrackingInitialized) {
      return;
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const updateActivity = () => {
      if (this.isAuthenticated()) {
        this.updateActivity();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
      this._activityHandlers.push({ event, handler: updateActivity });
    });

    // Check session expiry every minute
    this._activityCheckInterval = setInterval(() => {
      if (this.isAuthenticated() && this.isSessionExpired()) {
        console.warn('Session expired due to inactivity');
        this.logout();
        window.location.href = '/login';
      }
    }, 60000); // Check every minute

    this._activityTrackingInitialized = true;
  }

  // Cleanup activity tracking (useful for testing or cleanup)
  static cleanupActivityTracking() {
    if (this._activityCheckInterval) {
      clearInterval(this._activityCheckInterval);
      this._activityCheckInterval = null;
    }

    this._activityHandlers.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler, true);
    });
    this._activityHandlers = [];
    this._activityTrackingInitialized = false;
  }

  // Extend session (refresh token if needed)
  static async extendSession() {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      // Update activity timestamp
      this.updateActivity();
      
      // Here you could implement token refresh logic
      // const refreshToken = this.getItem(this.SESSION_KEYS.REFRESH_TOKEN);
      // if (refreshToken) {
      //   const response = await api.refreshToken(refreshToken);
      //   this.setToken(response.token);
      // }
      
      return true;
    } catch (error) {
      console.error('Error extending session:', error);
      return false;
    }
  }

  // Get session info for debugging
  static getSessionInfo() {
    return {
      user: this.getUser(),
      hasToken: !!this.getToken(),
      lastActivity: this.getItem(this.SESSION_KEYS.LAST_ACTIVITY),
      isExpired: this.isSessionExpired(),
      isAuthenticated: this.isAuthenticated(),
      sessionKeys: Object.keys(sessionStorage).filter(key => 
        Object.values(this.SESSION_KEYS).includes(key)
      )
    };
  }
}

// Hook for using session manager in React components
export const useSessionManager = () => {
  return {
    getUser: SessionManager.getUser,
    setUser: SessionManager.setUser,
    getToken: SessionManager.getToken,
    setToken: SessionManager.setToken,
    isAuthenticated: SessionManager.isAuthenticated,
    hasRole: SessionManager.hasRole,
    hasAnyRole: SessionManager.hasAnyRole,
    logout: SessionManager.logout,
    extendSession: SessionManager.extendSession,
    getSessionInfo: SessionManager.getSessionInfo,
    isSessionExpired: SessionManager.isSessionExpired
  };
};

export default SessionManager;