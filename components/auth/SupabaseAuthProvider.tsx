import React, { useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { getFullUserProfile } from '../../services/users.service';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const SupabaseAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { login, logout } = useAuthStore();

  useEffect(() => {
    // Listener que reage a eventos de login, logout, etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Se uma sessão for detectada, busca o perfil completo do usuário.
        const profile = await getFullUserProfile(session.user);
        if (profile) {
          login(profile);
        } else {
          // Se o perfil não for encontrado, força o logout para evitar um estado inconsistente.
          console.error("Sessão encontrada, mas perfil do usuário não existe no banco de dados.");
          await supabase.auth.signOut();
        }
      } else {
        // Se não houver sessão, limpa o estado de autenticação.
        logout();
      }
    });

    // Limpa o listener quando o componente é desmontado.
    return () => {
      subscription.unsubscribe();
    };
  }, [login, logout]);

  return <>{children}</>;
};