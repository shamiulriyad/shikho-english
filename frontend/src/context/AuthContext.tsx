import { createContext, startTransition, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiCall } from '../utils/api';
import type { AuthResponse, User } from '../types/api';

export type AuthResult = { success: true } | { success: false; message: string };

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, username: string, password: string, fullName: string) => Promise<AuthResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const loadStoredUser = (): User | null => {
  try {
    return JSON.parse(localStorage.getItem('user') ?? 'null') as User | null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(loadStoredUser);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    if (token && user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [token, user]);

  const authenticate = async (endpoint: string, body: object, fallbackMessage: string): Promise<AuthResult> => {
    try {
      const data = await apiCall<AuthResponse>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      setUser(data.user);
      setToken(data.token);
      return { success: true };
    } catch (err) {
      return { success: false, message: (err instanceof Error && err.message) || fallbackMessage };
    }
  };

  const login = (email: string, password: string) =>
    authenticate('/auth/login', { email, password }, 'Login failed');

  const register = (email: string, username: string, password: string, fullName: string) =>
    authenticate('/auth/register', { email, username, password, fullName }, 'Registration failed');

  // React Router applies navigation in a transition. Signing out in one too lets "log out and go home"
  // land in a single render, so a protected page never sees the signed-out state and bounces to login.
  const logout = () => {
    startTransition(() => {
      setUser(null);
      setToken(null);
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
