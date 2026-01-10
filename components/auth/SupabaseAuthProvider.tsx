import React, { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useCardStore } from '../../store/cardStore';
import { templatesService } from '../../services/templates.service';
import { getFullUserProfile, ensureProfileFromSession } from '../../services/users.service';
import type { Role, HeroTheme } from '../../types';

interface AuthProviderProps {
  children: React.ReactNode;
}

const normalizeRole = (input: any): Role => {
  const r = String(input || '').toLowerCase();
  if (r === 'admin' || r === 'staff' || r === 'client') return r;
  return 'client';
};

const DEFAULT_SETTINGS = {
  cardTemplateId: null as string | null,
  fontStyle: 'Inter',
  fontColor: '#FFFFFF',
  fontSize: 22,
  heroTheme: 'sombra-noturna' as HeroTheme,
  mode: 'system' as 'light' | 'dark' | 'system',
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const SupabaseAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const setLoading = useAuthStore((s) => s.setLoading);

  const isInitializingRef = useRef(false);

  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    const applySettingsAndLoadTemplates = async (settings: any) => {
      const safe = settings || DEFAULT_SETTINGS;

      useThemeStore.getState().setHeroTheme(safe?.heroTheme || DEFAULT_SETTINGS.heroTheme);
      useThemeStore.getState().setMode(safe?.mode || DEFAULT_SETTINGS.mode);

      useCardStore.getState().setAll({
        templateId: safe?.cardTemplateId ?? undefined,
        font: safe?.fontStyle || DEFAULT_SETTINGS.fontStyle,
        color: safe?.fontColor || DEFAULT_SETTINGS.fontColor,
        fontSize: safe?.fontSize || DEFAULT_SETTINGS.fontSize,
      });

      useThemeStore.getState().applyTheme();

      try {
        const dbTemplates = await templatesService.getActiveTemplates();
        if (dbTemplates && dbTemplates.length > 0) {
          useCardStore.getState().setTemplates(templatesService.mapToStoreFormat(dbTemplates));
        }
      } catch (err) {
        console.error('Erro ao carregar templates:', err);
      }
    };

    const getFullWithRetry = async (sessionUser: any, attempts = 4) => {
      for (let i = 0; i < attempts; i++) {
        const full = await getFullUserProfile(sessionUser);
        if (full) return full;
        await sleep(250 + i * 250);
      }
      return null;
    };

    const buildLoginFromSession = async (sessionUser: any) => {
      // 1) tenta normal
      let full = await getFullWithRetry(sessionUser, 3);

      // 2) se não achou, tenta auto-cura + retry mais forte
      if (!full) {
        console.warn('Perfil incompleto detectado. Tentando auto-cura...');
        try {
          await ensureProfileFromSession(sessionUser);
        } catch (e) {
          console.error('Falha na auto-cura de perfil:', e);
        }

        full = await getFullWithRetry(sessionUser, 5);
      }

      if (!full) return null;

      const role = normalizeRole(full.profile.role);
      const safeProfile = { ...full.profile, role };

      await applySettingsAndLoadTemplates(full.settings);

      return safeProfile;
    };

    const initAuth = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session?.user) {
          logout();
          return;
        }

        const safeProfile = await buildLoginFromSession(session.user);

        if (!safeProfile) {
          // IMPORTANTÍSSIMO: não faz logout aqui.
          // Mantém a sessão e deixa a tela de Auth finalizar o cadastro.
          console.warn(
            '[SupabaseAuthProvider] Usuário tem sessão, mas perfil não pôde ser recuperado. Mantendo sessão (soft-fail).'
          );
          return;
        }

        login(safeProfile);
      } catch (err) {
        console.error('Erro na inicialização do auth:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_OUT') {
        logout();
        return;
      }

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        setLoading(true);
        try {
          const safeProfile = await buildLoginFromSession(session.user);

          if (!safeProfile) {
            // IMPORTANTÍSSIMO: não desloga.
            console.warn(
              '[SupabaseAuthProvider] Sessão existe, mas perfil não recuperado no evento. Mantendo sessão (soft-fail).'
            );
            return;
          }

          login(safeProfile);
        } catch (e) {
          console.error('Erro no onAuthStateChange:', e);
          // aqui pode logout porque é erro grave de estado
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
