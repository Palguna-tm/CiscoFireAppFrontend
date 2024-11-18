// app/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface User {
  username: string;
  email: string;
  role: string;
  permissions: string[];
  project_id: string | null;
}

interface Session {
  issuedAt: string;
  expiresAt: string;
}

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (userData: User, token: string, session: Session) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [logoutTimer, setLogoutTimer] = useState<NodeJS.Timeout | null>(null);

  const setupAutoLogout = (expiresAt: string) => {
    if (logoutTimer) {
      clearTimeout(logoutTimer);
    }

    const expirationTime = new Date(expiresAt).getTime();
    const currentTime = new Date().getTime();
    const timeUntilExpiry = expirationTime - currentTime;

    if (timeUntilExpiry <= 0) {
      logout();
      return;
    }

    const timer = setTimeout(() => {
      logout();
    }, timeUntilExpiry);

    setLogoutTimer(timer);
  };

  const login = (userData: User, token: string, session: Session) => {
    const normalizedUser = { ...userData, role: userData.role.toLowerCase() };
    setUser(normalizedUser);
    
    AsyncStorage.setItem('loginData', JSON.stringify({ 
      token, 
      user: normalizedUser,
      session
    }));

    setupAutoLogout(session.expiresAt);
  };

  const logout = async () => {
    try {
      if (logoutTimer) {
        clearTimeout(logoutTimer);
      }
      setUser(null);
      await AsyncStorage.removeItem('loginData');
      router.navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedData = await AsyncStorage.getItem('loginData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          const normalizedUser = { ...parsedData.user, role: parsedData.user.role.toLowerCase() };
          
          // Check if token is expired
          const expirationTime = new Date(parsedData.session.expiresAt).getTime();
          const currentTime = new Date().getTime();
          
          if (currentTime >= expirationTime) {
            await logout();
          } else {
            setUser(normalizedUser);
            setupAutoLogout(parsedData.session.expiresAt);
          }
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    return () => {
      if (logoutTimer) {
        clearTimeout(logoutTimer);
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};