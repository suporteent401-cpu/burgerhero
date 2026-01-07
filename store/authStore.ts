import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthed: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthed: false,
      isLoading: true, // Inicia como true para aguardar a verificação inicial
      login: (user) => set({ user, isAuthed: true, isLoading: false }),
      logout: () => set({ user: null, isAuthed: false, isLoading: false }),
      updateUser: (data) => set((state) => ({
        user: state.user ? { ...state.user, ...data } : null
      })),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    { 
      name: 'burger-hero-auth',
      // Não persistir o estado de carregamento
      partialize: (state) => ({ user: state.user, isAuthed: state.isAuthed }),
    }
  )
);