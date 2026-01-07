import React, { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useCardStore } from '../../store/cardStore';
import type { Role } from '../../types';

interface AuthProviderProps {
  children: React.ReactNode;
}

const normalizeRole = (input: any): Role => {
  const r = String(input || '').toLowerCase();
  if (r === 'admin' || r === 'staff' || r === 'client') return r;
  return 'client';
};

const generateHeroCode = () => {
  // curto, legível no balcão
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BH-${rand}`;
};

type ClientProfileRow = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  hero_code: string; // ✅ EXISTE NO SEU BANCO
};

type HeroCardSettingsRow = {
  user_id: string;
  card_template_id: string | null;
  font_style: string | null;
  font_color: string | null;
  font_size: number | null;
  hero_theme: any | null;
  mode: 'light' | 'dark' | 'system' | null;
};

export const SupabaseAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const setLoading = useAuthStore((s) => s.setLoading);

  // Evita execução dupla no StrictMode
  const isInitializingRef = useRef(false);

  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    const applySettings = (settings?: HeroCardSettingsRow | null) => {
      if (!settings) return;

      if (settings.hero_theme) useThemeStore.getState().setHeroTheme(settings.hero_theme);
      if (settings.mode) useThemeStore.getState().setMode(settings.mode);

      useCardStore.getState().setAll({
        templateId: settings.card_template_id || undefined,
        font: settings.font_style || undefined,
        color: settings.font_color || undefined,
        fontSize: settings.font_size || undefined,
      });

      useThemeStore.getState().applyTheme();
    };

    const ensureHeroCode = async (profile: ClientProfileRow) => {
      if (profile.hero_code) return profile;

      const newCode = generateHeroCode();

      const { error } = await supabase
        .from('client_profiles')
        .update({ hero_code: newCode })
        .eq('user_id', profile.user_id);

      if (error) {
        console.error('Erro ao gerar hero_code:', error);
        return profile; // não derruba o app
      }

      return { ...profile, hero_code: newCode };
    };

    const fetchClientProfile = async (userId: string): Promise<ClientProfileRow | null> => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('user_id, display_name, email, avatar_url, hero_code')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar client_profiles:', error);
        return null;
      }

      return data as ClientProfileRow;
    };

    const fetchHeroCardSettings = async (userId: string): Promise<HeroCardSettingsRow | null> => {
      const { data, error } = await supabase
        .from('hero_card_settings')
        .select('user_id, card_template_id, font_style, font_color, font_size, hero_theme, mode')
        .eq('user_id', userId)
        .single();

      if (error) return null;
      return data as HeroCardSettingsRow;
    };

    const initAuth = async () => {
      setLoading(true);

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session?.user) {
          logout();
          return;
        }

        const authUser = session.user;

        let profile = await fetchClientProfile(authUser.id);
        if (!profile) {
          console.error('client_profiles não encontrado para usuário:', authUser.id);
          logout();
          return;
        }

        profile = await ensureHeroCode(profile);

        const settings = await fetchHeroCardSettings(authUser.id);
        applySettings(settings);

        const userForStore = {
          id: authUser.id,
          name: profile.display_name || authUser.email?.split('@')[0] || 'Herói',
          email: profile.email || authUser.email || '',
          avatarUrl: profile.avatar_url || '',
          customerCode: profile.hero_code, // ✅ MAPEAMENTO CORRETO
          role: normalizeRole('client'),
        };

        login(userForStore as any);
      } catch (err) {
        console.error('Erro na inicialização do auth:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_OUT') {
        logout();
        return;
      }

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        try {
          const currentUser = useAuthStore.getState().user;
          if (currentUser?.customerCode) return;

          setLoading(true);

          let profile = await fetchClientProfile(session.user.id);
          if (!profile) {
            logout();
            return;
          }

          profile = await ensureHeroCode(profile);

          const settings = await fetchHeroCardSettings(session.user.id);
          applySettings(settings);

          login({
            id: session.user.id,
            name: profile.display_name || session.user.email?.split('@')[0] || 'Herói',
            email: profile.email || session.user.email || '',
            avatarUrl: profile.avatar_url || '',
            customerCode: profile.hero_code,
            role: normalizeRole('client'),
          } as any);
        } catch (e) {
          console.error('Erro no onAuthStateChange:', e);
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
