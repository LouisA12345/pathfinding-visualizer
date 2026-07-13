import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

interface AuthStoreState {
  user: AuthUser | null;
  /** True only until the first session check resolves — avoids flashing a "Log in" button before we know there's already a session. */
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
}));
