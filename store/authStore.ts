import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { getUserProfileById } from '../services/users.service';

interface AuthState {
  user: User | null;
  isAuthed: boolean;

  // loading do auth provider (session fetch, etc.)
  isLoading: boolean;

  // ✅ garante que o persist terminou (evita loop infinito)
  hasHydrated: boolean;

  login: (user: User) => void;
  logout: () => void;

  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;

  updateUser: (user: Partial<User>) => void;
  setUser: (user: User | null) => void;

  refreshUserFromDb: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthed: false,

      // ✅ começa true, mas será derrubado no hydrate
      isLoading: true,
      hasHydrated: false,

      login: (user) => set({ user, isAuthed: true, isLoading: false }),
      logout: () => set({ user: null, isAuthed: false, isLoading: false }),

      setLoading: (loading) => set({ isLoading: loading }),
      setHydrated: (hydrated) => set({ hasHydrated: hydrated }),

      setUser: (user) => set({ user }),

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),

      refreshUserFromDb: async (userId: string) => {
        try {
          const state = get();
          const current = state.user;

          const dbProfile: any = await getUserProfileById(userId);
          if (!dbProfile) return;

          const nextPatch: Partial<User> = {};

          if (!current?.name || current.name === 'Herói') {
            if (dbProfile.display_name) nextPatch.name = dbProfile.display_name;
          }

          if (!current?.avatarUrl || String(current.avatarUrl).startsWith('data:')) {
            if (dbProfile.avatar_url) nextPatch.avatarUrl = dbProfile.avatar_url;
          }

          if (!current?.customerCode) {
            nextPatch.customerCode = dbProfile.customer_id_public || dbProfile.hero_code || '';
          }

          if (!current?.cpf && dbProfile.cpf) nextPatch.cpf = dbProfile.cpf;
          if (!current?.whatsapp && dbProfile.whatsapp) nextPatch.whatsapp = dbProfile.whatsapp;
          if (!current?.birthDate && dbProfile.birthdate) nextPatch.birthDate = dbProfile.birthdate;

          if (Object.keys(nextPatch).length > 0) {
            set((s) => ({
              user: s.user ? { ...s.user, ...nextPatch } : s.user,
            }));
          }
        } catch (e) {
          console.warn('refreshUserFromDb falhou (seguindo sem travar).', e);
        }
      },
    }),
    {
      name: 'burger-hero-auth',
      partialize: (state) => ({ user: state.user, isAuthed: state.isAuthed }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Erro ao rehidratar authStore:', error);
          }
          // ✅ aqui é OBRIGATÓRIO usar método do store (set), não atribuição direta
          state?.setHydrated(true);
          state?.setLoading(false);
        };
      },
    }
  )
);
