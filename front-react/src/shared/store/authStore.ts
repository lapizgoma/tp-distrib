import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { User } from "@/features/auth/types/user.types"


interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

/** Lee el claim `exp` (segundos desde epoch) del JWT. No valida la firma. */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const claims: unknown = JSON.parse(atob(padded));

    if (claims && typeof claims === 'object') {
      const exp = (claims as Record<string, unknown>).exp;
      if (typeof exp === 'number') return exp;
    }
    return null;
  } catch {
    return null;
  }
}

/** true si hay token, se pudo leer su `exp` y todavía no venció. */
export function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  const exp = getTokenExpiry(token);
  if (exp === null) return false;
  return exp * 1000 > Date.now();
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: (token) => set({ token, user: null }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
      isAuthenticated: () => isTokenValid(get().token),
    }),
    {
      name: 'museo-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);