import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, AuthResponse } from '../api/types';
import { api, getStoredToken, getStoredUser, setStoredAuth, clearStoredAuth } from '../api/client';

interface AuthContextType {
  token: string | null;
  role: UserRole | null;
  userName: string | null;
  userId: number | null;
  loading: boolean;
  demoLogin: (role: UserRole) => Promise<void>;
  login: (phone: string, pass: string) => Promise<void>;
  register: (name: string, phone: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [role, setRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser && token) {
      setRole(storedUser.role as UserRole);
      setUserName(storedUser.name);
      setUserId(storedUser.id);
    }
    setLoading(false);
  }, [token]);

  const handleAuthSuccess = (data: AuthResponse) => {
    setToken(data.access_token);
    setRole(data.role);
    setUserName(data.name);
    setUserId(data.user_id);
    setStoredAuth(data.access_token, {
      id: data.user_id,
      name: data.name,
      role: data.role,
    });
  };

  const demoLogin = async (targetRole: UserRole) => {
    setLoading(true);
    try {
      const res = await api.demoLogin(targetRole);
      handleAuthSuccess(res);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone: string, pass: string) => {
    setLoading(true);
    try {
      const res = await api.login(phone, pass);
      handleAuthSuccess(res);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, phone: string, pass: string) => {
    setLoading(true);
    try {
      const res = await api.register(name, phone, pass);
      handleAuthSuccess(res);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearStoredAuth();
    setToken(null);
    setRole(null);
    setUserName(null);
    setUserId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        userName,
        userId,
        loading,
        demoLogin,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
