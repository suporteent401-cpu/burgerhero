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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        let profile = await getFullUserProfile(session.user);

        // Se o perfil não for encontrado, tenta criar um perfil de fallback.
        if (!profile) {
          console.warn(`Perfil não encontrado para ${session.user.id}. Tentando criar perfil de fallback...`);
          
          const { data: rpcData, error: rpcError } = await supabase.rpc('ensure_user_profile', {
            p_display_name: session.user.email?.split('@')[0] || 'Hero',
            p_email: session.user.email,
            p_cpf: '00000000000', // CPF placeholder, pois não está disponível neste contexto
            p_birthdate: null
          });

          if (rpcError) {
            console.error("AUTH_ERROR", rpcError);
            await supabase.auth.signOut();
            return;
          }
          
          const result = rpcData[0];
          if (!result || !result.ok) {
            console.error("AUTH_ERROR", new Error(result?.message || 'Falha na RPC de fallback.'));
            await supabase.auth.signOut();
            return;
          }

          // Tenta buscar o perfil novamente após a criação.
          profile = await getFullUserProfile(session.user);
        }

        if (profile) {
          login(profile);
        } else {
          // Se o perfil ainda for nulo, é um erro crítico.
          console.error("AUTH_ERROR", new Error("Seu perfil ainda não foi criado. Tente novamente em alguns segundos."));
          await supabase.auth.signOut();
        }
      } else {
        logout();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [login, logout]);

  return <>{children}</>;
};