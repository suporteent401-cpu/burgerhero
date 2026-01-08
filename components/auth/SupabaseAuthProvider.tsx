import React, { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useCardStore } from '../../store/cardStore';
import { templatesService } from '../../services/templates.service';
import type { Role } from '../../types';

interface AuthProviderProps {
  children: React.ReactNode;
}

const normalizeRole = (input: any): Role => {
  const r = String(input || '').toLowerCase();
  if (r === 'admin' || r === 'staff' || r === 'client') return r;
  return 'client';
};

type UserProfileRow = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  hero_code: string;
  customer_id_public: string | null;
};

export const SupabaseAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const setLoading = useAuthStore((s) => s.setLoading);

  const isInitializingRef = useRef(false);

  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    const loadUserSettingsAndTemplates = async (userId: string) => {
      const { data: settings, error } = await supabase
        .from('hero_card_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && settings) {
        if (settings.hero_theme) useThemeStore.getState().setHeroTheme(settings.hero_theme);
        if (settings.theme_mode) useThemeStore.getState().setMode(settings.theme_mode);

        useCardStore.getState().setAll({
          templateId: settings.card_template_id || undefined,
          font: settings.font_style || undefined,
          color: settings.font_color || undefined,
          fontSize: settings.font_size_px || undefined,
        });

        useThemeStore.getState().applyTheme();
      }

      try {
        const dbTemplates = await templatesService.getActiveTemplates();
        if (dbTemplates.length > 0) {
          useCardStore.getState().setTemplates(templatesService.mapToStoreFormat(dbTemplates));
        }
      } catch (err) {
        console.error('Erro ao carregar templates:', err);
      }
    };

    const fetchUserProfile = async (userId: string): Promise<UserProfileRow | null> => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return null;
      }
      return data as UserProfileRow;
    };

    const ensureProfileExists = async (email: string) => {
      // Tenta garantir que os registros básicos existam caso o cadastro tenha falhado parcialmente
      try {
        await supabase.rpc('ensure_user_profile_login', { p_email: email });
      } catch (e) {
        console.warn('Erro ao executar ensure_user_profile_login:', e);
      }
    };

    const fetchUserRole = async (userId: string): Promise<Role> => {
      const { data, error } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) return 'client';
      return normalizeRole(data.role);
    };

    const initAuth = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session?.user) {
          logout();
          return;
        }

        const authUser = session.user;
        
        // Tenta buscar o perfil
        let profile = await fetchUserProfile(authUser.id);
        
        // Se não existir, tenta criar um perfil básico de "emergência"
        if (!profile) {
          await ensureProfileExists(authUser.email || '');
          profile = await fetchUserProfile(authUser.id);
        }

        // Se mesmo assim não existir, o usuário precisa completar o cadastro ou há um erro de RLS
        if (!profile) {
           // Em vez de deslogar, vamos apenas setar o loading como false 
           // e deixar as páginas tratarem o estado sem perfil (ex: redirecionar para completar cadastro)
           setLoading(false);
           return;
        }

        const role = await fetchUserRole(authUser.id);
        await loadUserSettingsAndTemplates(authUser.id);

        login({
          id: authUser.id,
          name: profile.display_name || authUser.email?.split('@')[0] || 'Herói',
          email: profile.email || authUser.email || '',
          avatarUrl: profile.avatar_url || '',
          customerCode: profile.customer_id_public || profile.hero_code || '',
          role: role,
        } as any);
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
        try {
          setLoading(true);
          let profile = await fetchUserProfile(session.user.id);
          
          if (!profile) {
            await ensureProfileExists(session.user.email || '');
            profile = await fetchUserProfile(session.user.id);
          }

          if (!profile) {
            setLoading(false);
            return;
          }

          const role = await fetchUserRole(session.user.id);
          await loadUserSettingsAndTemplates(session.user.id);

          login({
            id: session.user.id,
            name: profile.display_name || session.user.email?.split('@')[0] || 'Herói',
            email: profile.email || session.user.email || '',
            avatarUrl: profile.avatar_url || '',
            customerCode: profile.customer_id_public || profile.hero_code || '',
            role: role,
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