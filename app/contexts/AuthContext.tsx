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

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (userData: User, token: string) => void;
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

  const login = (userData: User, token: string) => {
    const normalizedUser = { ...userData, role: userData.role.toLowerCase() };
    setUser(normalizedUser);
    
    AsyncStorage.setItem('loginData', JSON.stringify({ token, user: normalizedUser }));
  };

  const logout = async () => {
    try {
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
          setUser(normalizedUser);
          
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};