import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tokenStorage, setOnUnauthorizedCallback } from '../lib/api';
import { authService } from '../features/auth/services/authService';
import { isRoleAllowed } from '../constants/roles';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Centralized logout
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  }, []);

  // Initialize session from token
  const initAuth = useCallback(async () => {
    const existingToken = tokenStorage.get();
    if (!existingToken) {
      setIsLoading(false);
      return;
    }

    try {
      const { user: userProfile } = await authService.getMe();
      if (userProfile && userProfile.isActive) {
        setUser(userProfile);
      } else {
        tokenStorage.clear();
        setUser(null);
      }
    } catch {
      tokenStorage.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Interceptor hook for 401 session expiry
    setOnUnauthorizedCallback(() => {
      setUser(null);
    });

    let isMounted = true;
    (async () => {
      if (isMounted) {
        await initAuth();
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [initAuth]);

  /**
   * Login handler
   */
  const login = async ({ email, password, rememberMe = true }) => {
    const { user: loggedInUser, token } = await authService.login({ email, password });
    tokenStorage.set(token, rememberMe);
    setUser(loggedInUser);
    return loggedInUser;
  };

  /**
   * Register handler
   */
  const register = async ({ name, email, password }) => {
    const { user: newUser, token } = await authService.register({ name, email, password });
    tokenStorage.set(token, true);
    setUser(newUser);
    return newUser;
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return isRoleAllowed(user.role, roles);
  };

  const hasPermission = (permissionKey) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Super admin has all permissions
    return Array.isArray(user.permissions) && user.permissions.includes(permissionKey);
  };

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    hasRole,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
