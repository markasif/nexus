import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole, AuthState } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for prototype
const demoUsers: Record<string, User> = {
  admin: {
    id: '1',
    name: 'Sarah Mitchell',
    email: 'admin@nexus.com',
    role: 'admin',
    status: 'active',
    createdAt: new Date(),
  },
  employee: {
    id: '2',
    name: 'James Cooper',
    email: 'employee@nexus.com',
    role: 'employee',
    baseSalary: 50000,
    commissionPercent: 8,
    status: 'active',
    createdAt: new Date(),
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });

  const login = useCallback(async (email: string, password: string, role: UserRole) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const user = demoUsers[role];
    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
