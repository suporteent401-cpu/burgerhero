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

const inferRoleFromEmail = (email?: string | null): Role => {
  const e = (email || '').toLowerCase().trim();
  if (e === 'admin@hero.com') return 'admin';
  if (e === 'staff@hero.com') return 'staff';
  return 'client';
};

export const SupabaseAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  const isHandlingRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (isHandlingRef.current) return;
      isHandlingRef.current = true;

      try {
        if (!session?.user) {
          logout();
          return;
        }

        const applySettings = (settings: any) => {
          if (!settings) return;
          
          const { setHeroTheme, setMode } = useThemeStore.getState();
          const { setAll } = useCardStore.getState();

          setHeroTheme(settings.hero_theme || 'sombra-noturna');
          setMode(settings.theme_mode || 'light');
          setAll({
            templateId: settings.card_template_id,
            font: settings.font_style,
            color: settings.font_color,
            fontSize: settings.font_size_px,
          });
        };

        let result = await getFullUserProfile(session.user);

        if (!result) {
          const role = inferRoleFromEmail(session.user.email);

          const { data: rpcData, error: rpcError } = await supabase.rpc('ensure_user_profile_login', {
            p_display_name: session.user.email?.split('@')[0] || 'Hero',
            p_email: session.user.email,
            p_cpf: '',
            p_birthdate: null,
            p_role: role,
          });

          if (rpcError) {
            console.error('AUTH_ERROR (RPC ensure_user_profile_login):', rpcError);
            await supabase.auth.signOut();
            logout();
            return;
          }

          const rpcResult = rpcData?.[0];
          if (!rpcResult?.ok) {
            console.error('AUTH_ERROR (RPC result):', rpcResult);
            await supabase.auth.signOut();
            logout();
            return;
          }

          result = await getFullUserProfile(session.user);
        }

        if (result?.profile) {
          login(result.profile);
          applySettings(result.settings);
        } else {
          console.error('AUTH_ERROR: perfil não carregou mesmo após fallback');
          await supabase.auth.signOut();
          logout();
        }
      } finally {
        setTimeout(() => { isHandlingRef.current = false; }, 50);
      }
    });

    return () => subscription.unsubscribe();
  }, [login, logout]);

  return <>{children}</>;
};