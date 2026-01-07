import React, { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
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

  // evita dupla execução em dev/strict mode
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

        // 1) tenta buscar perfil completo
        let profile = await getFullUserProfile(session.user);

        // 2) se não existir app_users ainda, cria via RPC segura (login)
        if (!profile) {
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

          const result = rpcData?.[0];
          if (!result?.ok) {
            console.error('AUTH_ERROR (RPC result):', result);
            await supabase.auth.signOut();
            logout();
            return;
          }

          // 3) busca novamente após garantir app_users
          profile = await getFullUserProfile(session.user);
        }

        if (profile) {
          login(profile);
        } else {
          console.error('AUTH_ERROR: perfil não carregou mesmo após fallback');
          await supabase.auth.signOut();
          logout();
        }
      } finally {
        // pequena janela para não disparar duplo por render
        setTimeout(() => { isHandlingRef.current = false; }, 50);
      }
    });

    return () => subscription.unsubscribe();
  }, [login, logout]);

  return <>{children}</>;
};
