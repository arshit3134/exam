import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import { User, UserRole } from '../types';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string, expectedRole?: UserRole) => Promise<boolean>;
  register: (name: string, email: string, pass: string, role?: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  quickDemoLogin: (role: UserRole) => Promise<boolean>;
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check current session on load
  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const res = await authAPI.getMe();
        if (mounted && res.success && res.user) {
          setUser(res.user);
        }
      } catch (err) {
        // Not logged in or expired
        if (mounted) {
          setUser(null);
          localStorage.removeItem('apex_token');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    checkAuth();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, pass: string, expectedRole?: UserRole): Promise<boolean> => {
    try {
      const res = await authAPI.login({ email, password: pass, expectedRole });
      if (res.success && res.user) {
        setUser(res.user);
        if (res.token) {
          localStorage.setItem('apex_token', res.token);
        }
        addToast(`Welcome back, ${res.user.name}!`, 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      addToast(msg, 'error');
      return false;
    }
  };

  const register = async (name: string, email: string, pass: string, role: UserRole = 'candidate'): Promise<boolean> => {
    try {
      const res = await authAPI.register({ name, email, password: pass, role });
      if (res.success && res.user) {
        setUser(res.user);
        if (res.token) {
          localStorage.setItem('apex_token', res.token);
        }
        addToast(`Account created successfully! Welcome, ${res.user.name}.`, 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed.';
      addToast(msg, 'error');
      return false;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.warn('Logout error ignored');
    } finally {
      setUser(null);
      localStorage.removeItem('apex_token');
      addToast('You have been logged out.', 'info');
    }
  };

  const quickDemoLogin = async (role: UserRole): Promise<boolean> => {
    if (role === 'teacher') {
      return await login('teacher@apexexam.io', 'TeacherPass123!', 'teacher');
    } else {
      return await login('student@apexexam.io', 'StudentPass123!', 'candidate');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        quickDemoLogin,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
