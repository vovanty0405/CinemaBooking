import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import axios from 'axios';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  setUser: (user: User, token: string) => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: async (credentials: any) => {
        try {
          const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
          const response = await axios.post(`${baseURL}/auth/login`, credentials, { withCredentials: true });
          const { user, accessToken } = response.data.data;
          set({ user, accessToken, isAuthenticated: true });
        } catch (error) {
          throw error;
        }
      },

      logout: async () => {
        try {
          const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
          await axios.post(`${baseURL}/auth/logout`, {}, { withCredentials: true });
        } catch (e) {}
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      refreshToken: async () => {
        try {
          const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
          const response = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
          const { accessToken } = response.data.data;
          set({ accessToken });
        } catch (error) {
          get().logout();
          throw error;
        }
      },

      setUser: (user: User, token: string) => {
        set({ user, accessToken: token, isAuthenticated: true });
      },
      
      updateUser: (updatedUser: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updatedUser } });
        }
      }
    }),
    {
      name: 'auth-storage', // unique name
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, isAuthenticated: state.isAuthenticated }), // only save needed fields
    }
  )
);
