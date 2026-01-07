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

const generateCustomerCode = () => {
  // curto, fácil de ler no balcão
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BH-${rand}`;
};

type ClientProfileRow = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  customer_code: string | null; // ✅ nova coluna
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

  // Evita execução dupla no Strict Mode
  const isInitializingRef = useRef(false);

  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    const applySettings = (settings?: HeroCardSettingsRow | null) => {
      if (!settings) return;

      // Theme
      if (settings.hero_theme) useThemeStore.getState().setHeroTheme(settings.hero_theme);
      if (settings.mode) useThemeStore.getState().setMode(settings.mode);

      // Card prefs
      useCardStore.getState().setAll({
        templateId: settings.card_template_id || undefined,
        font: settings.font_style || undefined,
        color: settings.font_color || undefined,
        fontSize: settings.font_size || undefined,
      });

      useThemeStore.getState().applyTheme();
    };

    const ensureCustomerCode = async (profile: ClientProfileRow) => {
      if (profile.customer_code) return profile;

      const newCode = generateCustomerCode();

      const { error } = await supabase
        .from('client_profiles')
        .update({ customer_code: newCode })
        .eq('user_id', profile.user_id);

      if (error) {
        console.error('Falha ao atualizar customer_code em client_profiles:', error);
        return profile; // não derruba o app
      }

      return { ...profile, customer_code: newCode };
    };

    const fetchClientProfile = async (userId: string): Promise<ClientProfileRow | null> => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('user_id, display_name, email, avatar_url, customer_code')
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

      if (error) {
        // Se ainda não existir registro, não é erro fatal
        return null;
      }

      return data as HeroCardSettingsRow;
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
          logout();
          return;
        }

        if (!session?.user) {
          logout();
          return;
        }

        const authUser = session.user;

        // 1) Busca perfil do app na sua tabela
        let profile = await fetchClientProfile(authUser.id);

        // Se não existir client_profiles para esse user, algo falhou no signup
        if (!profile) {
          console.error('client_profiles não encontrado para usuário autenticado:', authUser.id);
          // não dá logout automaticamente — mas evita quebrar
          logout();
          return;
        }

        // 2) Garante customer_code
        profile = await ensureCustomerCode(profile);

        // 3) Busca settings (se existir)
        const settings = await fetchHeroCardSettings(authUser.id);
        applySettings(settings);

        // 4) Monta objeto do store (o que seu app usa)
        // Role: se você controla isso em app_users, depois a gente integra.
        // Por enquanto client.
        const userForStore = {
          id: authUser.id,
          name: profile.display_name || authUser.email?.split('@')[0] || 'Cliente',
          email: profile.email || authUser.email || '',
          avatarUrl: profile.avatar_url || '',
          customerCode: profile.customer_code || '',
          role: normalizeRole('client'),
        };

        login(userForStore as any);
      } catch (err) {
        console.error('Exceção na inicialização da autenticação:', err);
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

          // se já tem user e já tem customerCode, não refaz tudo
          if (currentUser?.id && currentUser?.customerCode) return;

          setLoading(true);

          const authUser = session.user;

          let profile = await fetchClientProfile(authUser.id);
          if (!profile) {
            console.error('client_profiles não encontrado no auth change:', authUser.id);
            logout();
            return;
          }

          profile = await ensureCustomerCode(profile);

          const settings = await fetchHeroCardSettings(authUser.id);
          applySettings(settings);

          const userForStore = {
            id: authUser.id,
            name: profile.display_name || authUser.email?.split('@')[0] || 'Cliente',
            email: profile.email || authUser.email || '',
            avatarUrl: profile.avatar_url || '',
            customerCode: profile.customer_code || '',
            role: normalizeRole('client'),
          };

          login(userForStore as any);
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
