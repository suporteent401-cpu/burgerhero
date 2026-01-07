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
  if (e === 'admin@hero.com') return 'ADMIN';
  if (e === 'staff@hero.com') return 'STAFF';
  return 'CLIENT';
};

const isInvalidRefreshTokenError = (err: unknown) => {
  const msg = (err as any)?.message || String(err || '');
  return (
    msg.includes('Invalid Refresh Token') ||
    msg.includes('Refresh Token Not Found') ||
    msg.includes('invalid refresh token') ||
    msg.includes('refresh_token_not_found')
  );
};

const hardResetAuth = async (logout: () => void) => {
  try {
    await supabase.auth.signOut();
  } catch {
    // ignora
  }

  try {
    // limpa persist do zustand
    localStorage.removeItem('burger-hero-auth');
  } catch {
    // ignora
  }

  // tenta limpar tokens do supabase (varia o prefixo)
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('sb-')) localStorage.removeItem(k);
    }
  } catch {
    // ignora
  }

  logout();
};

export const SupabaseAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  // evita dupla execução em dev/strict mode
  const isHandlingRef = useRef(false);
  const didInitRef = useRef(false);

  // 1) INIT: pega sessão logo no mount e trata refresh token inválido
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          if (isInvalidRefreshTokenError(error)) {
            await hardResetAuth(logout);
            return;
          }
          // qualquer outro erro: garante logout para não ficar em limbo
          console.error('AUTH_INIT_ERROR:', error);
          await hardResetAuth(logout);
          return;
        }

        // sem sessão -> garante logout (evita isAuthed "fantasma" do persist)
        if (!data?.session?.user) {
          logout();
          return;
        }

        // com sessão -> a cadeia normal vai acontecer via onAuthStateChange
      } catch (err) {
        if (isInvalidRefreshTokenError(err)) {
          await hardResetAuth(logout);
          return;
        }
        console.error('AUTH_INIT_FATAL:', err);
        await hardResetAuth(logout);
      }
    })();
  }, [logout]);

  // 2) LISTENER: reage a login/logout e carrega perfil
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (isHandlingRef.current) return;
      isHandlingRef.current = true;

      try {
        if (!session?.user) {
          logout();
          return;
        }

        try {
          // 1) tenta buscar perfil completo
          let profile = await getFullUserProfile(session.user);

          // 2) se não existir, cria via RPC fallback (se o seu backend usa isso)
          if (!profile) {
            const role = inferRoleFromEmail(session.user.email);

            // ⚠️ mantém a chamada como estava no seu projeto (se existir essa RPC)
            const { data: rpcData, error: rpcError } = await supabase.rpc('ensure_user_profile_login', {
              p_display_name: (session.user.user_metadata?.full_name as string) || '',
              p_email: session.user.email || '',
              p_cpf: '',
              p_birthdate: null,
              p_role: role,
            });

            if (rpcError) {
              console.error('AUTH_ERROR (RPC ensure_user_profile_login):', rpcError);
              await hardResetAuth(logout);
              return;
            }

            const result = Array.isArray(rpcData) ? rpcData[0] : rpcData;
            if (!result?.ok) {
              console.error('AUTH_ERROR (RPC result):', result);
              await hardResetAuth(logout);
              return;
            }

            // 3) busca novamente após garantir
            profile = await getFullUserProfile(session.user);
          }

          if (profile) {
            login(profile);
          } else {
            console.error('AUTH_ERROR: perfil não carregou mesmo após fallback');
            await hardResetAuth(logout);
          }
        } catch (err) {
          // aqui é onde estoura quando o refresh token é inválido durante uma chamada
          if (isInvalidRefreshTokenError(err)) {
            await hardResetAuth(logout);
            return;
          }
          console.error('AUTH_PROFILE_FATAL:', err);
          await hardResetAuth(logout);
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
