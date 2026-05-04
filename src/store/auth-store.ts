import { create } from 'zustand';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  permissions?: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

// Helper để lấy cookie client-side
const getCookie = (name: string) => {
  if (typeof window === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    const userData = getCookie('user_info');
    if (userData) {
      try {
        return JSON.parse(decodeURIComponent(userData));
      } catch (e) {
        return null;
      }
    }
    return null;
  })(),
  token: getCookie('access_token'),
  setAuth: (user, token) => {
    set({ user, token });
    if (typeof window !== 'undefined') {
      document.cookie = `access_token=${token}; path=/; max-age=86400`;
      document.cookie = `user_info=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400`;
    }
  },
  setUser: (user) => {
    set({ user });
    if (typeof window !== 'undefined') {
      document.cookie = `user_info=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400`;
    }
  },
  setToken: (token) => {
    set({ token });
    if (typeof window !== 'undefined') {
      document.cookie = `access_token=${token}; path=/; max-age=86400`;
    }
  },
  logout: () => {
    set({ user: null, token: null });
    if (typeof window !== 'undefined') {
      document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "user_info=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  },
}));
