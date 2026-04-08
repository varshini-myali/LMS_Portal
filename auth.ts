// src/store/auth.ts
import { create } from 'zustand';
import { authApi } from '@/lib/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  hydrated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  hydrated: false,

  setAuth: (user, accessToken) => {
    if (typeof window !== 'undefined') localStorage.setItem('lms_at', accessToken);
    set({ user, accessToken });
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('lms_at');
    set({ user: null, accessToken: null });
  },

  hydrate: async () => {
    // try to restore from the HTTP-only refresh token cookie
    try {
      const res = await authApi.refresh();
      const { user, accessToken } = res.data as { user: User; accessToken: string };
      if (typeof window !== 'undefined') localStorage.setItem('lms_at', accessToken);
      set({ user, accessToken, hydrated: true });
    } catch {
      if (typeof window !== 'undefined') localStorage.removeItem('lms_at');
      set({ user: null, accessToken: null, hydrated: true });
    }
  },
}));
