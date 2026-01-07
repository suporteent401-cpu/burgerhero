import React, { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useCardStore } from '../../store/cardStore';
import { getFullUserProfile } from '../../services/users.service';
import type { Role } from '../../types';

interface AuthProviderProps {
  children: React.ReactNode;
}

const normalizeRole = (input: any): Role => {
  const r = String(input || '').toLowerCase();
  if (r === 'admin' || r === 'staff' || r === 'client') return r;
  return 'client';
};

export const SupabaseAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const setLoading = useAuthStore((s) => s.setLoading);

  // Evita execução dupla no Strict Mode
  const isInitializingRef = useRef(false);

  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    const applySettings = (settings: any) => {
      useThemeStore.getState().setHeroTheme(settings.heroTheme);
      useThemeStore.getState().setMode(settings.mode);
      useCardStore.getState().setAll({
        templateId: settings.cardTemplateId || undefined,
        font: settings.fontStyle,
        color: settings.fontColor,
        fontSize: settings.fontSize,
      });
      useThemeStore.getState().applyTheme();
    };

    const initAuth = async () => {
      setLoading(true);

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Erro ao verificar sessão inicial:', error);
          if (error.message?.includes('Invalid Refresh Token')) {
            await supabase.auth.signOut();
          }
          logout();
          return;
        }

        if (!session?.user) {
          logout();
          return;
        }

        const full = await getFullUserProfile(session.user);

        if (!full) {
          console.error('Perfil não encontrado para usuário autenticado.');
          await supabase.auth.signOut();
          logout();
          return;
        }

        // Garante role válida
        const safeProfile = { ...full.profile, role: normalizeRole(full.profile.role) };

        applySettings(full.settings);
        login(safeProfile);
      } catch (err) {
        console.error('Exceção na inicialização da autenticação:', err);
        logout();
      } finally {
        // Se login/logout já setou isLoading=false, aqui só garante
        setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Já tratamos manualmente a inicialização
      if (event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_OUT') {
        logout();
        return;
      }

      // SIGNED_IN / TOKEN_REFRESHED
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        try {
          // Se já tiver usuário no store, não precisa reload completo sempre
          const currentUser = useAuthStore.getState().user;
          if (currentUser) return;

          setLoading(true);
          const full = await getFullUserProfile(session.user);
          if (!full) {
            await supabase.auth.signOut();
            logout();
            return;
          }

          const safeProfile = { ...full.profile, role: normalizeRole(full.profile.role) };

          applySettings(full.settings);
          login(safeProfile);
        } catch (e) {
          console.error('Erro ao processar mudança de auth state:', e);
          logout();
        } finally {
          setLoading(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [login, logout, setLoading]);

  return <>{children}</>;
};
