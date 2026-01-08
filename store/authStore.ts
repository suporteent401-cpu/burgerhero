import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { getUserProfileById } from '../services/users.service';

interface AuthState {
  user: User | null;
  isAuthed: boolean;
  isLoading: boolean;

  // ✅ evita telas com estado “meio hidratado”
  hasHydrated: boolean;

  login: (user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;

  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;

  // ✅ Recarrega do banco e corrige customerCode/avatar/name se o store estiver faltando
  refreshUserFromDb: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthed: false,
      isLoading: true,
      hasHydrated: false,

      login: (user) => set({ user, isAuthed: true, isLoading: false }),
      logout: () => set({ user: null, isAuthed: false, isLoading: false }),
      setUser: (user) => set({ user }),

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      refreshUserFromDb: async (userId: string) => {
        try {
          const state = get();
          const current = state.user;

          const dbProfile: any = await getUserProfileById(userId);
          if (!dbProfile) return;

          const nextPatch: Partial<User> = {};

          // name
          if (!current?.name || current.name === 'Herói') {
            if (dbProfile.display_name) nextPatch.name = dbProfile.display_name;
          }

          // avatar
          if (!current?.avatarUrl || String(current.avatarUrl).startsWith('data:')) {
            if (dbProfile.avatar_url) nextPatch.avatarUrl = dbProfile.avatar_url;
          }

          // customerCode
          if (!current?.customerCode) {
            nextPatch.customerCode = dbProfile.customer_id_public || dbProfile.hero_code || '';
          }

          // extras
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
      onRehydrateStorage: () => (state, error) => {
        if (error) console.error('Erro ao rehidratar authStore:', error);

        // ✅ marca hidratação finalizada do persist
        if (state) {
          state.setLoading(false);
          // não muta state direto; faz set via Zustand
          // (como persist não expõe set aqui, vamos usar create getState)
          try {
            useAuthStore.setState({ hasHydrated: true });
          } catch {}
        }
      },
    }
  )
);
