import React, { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { getFullUserProfile } from '../../services/users.service';
import { User } from '../../types';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const SupabaseAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { login, logout } = useAuthStore();
  const isHandlingRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // 1. Tratamento de Logout
      if (event === 'SIGNED_OUT' || !session) {
        logout();
        isHandlingRef.current = false;
        return;
      }

      // 2. Tratamento de Login e Sessão Inicial
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        // Bloqueio para evitar chamadas duplicadas/concorrentes
        if (isHandlingRef.current) return;
        isHandlingRef.current = true;

        try {
          // Tenta buscar o perfil completo
          let profile = await getFullUserProfile(session.user);

          // Se não encontrou perfil, tenta criar/garantir via RPC (fail-safe)
          if (!profile) {
            console.warn(`Perfil não encontrado para ${session.user.id}. Tentando RPC de fallback...`);
            
            try {
              const { data: rpcData, error: rpcError } = await supabase.rpc('ensure_user_profile', {
                p_display_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Hero',
                p_email: session.user.email,
                p_cpf: '00000000000', // Placeholder para evitar erro de constraint se obrigatório
                p_birthdate: null
              });

              if (rpcError) {
                console.error("Erro na RPC ensure_user_profile:", rpcError);
              } else {
                // Se a RPC funcionou, tenta buscar o perfil novamente
                profile = await getFullUserProfile(session.user);
              }
            } catch (rpcErr) {
               console.error("Exceção ao chamar RPC de fallback:", rpcErr);
            }
          }

          // 3. Fallback Final: Cria um perfil temporário em memória para não quebrar a UI
          if (!profile) {
            console.error("FALHA CRÍTICA: Não foi possível carregar ou criar o perfil completo do usuário a partir do banco de dados. O registro em 'app_users' pode estar ausente. Criando um perfil de fallback com role 'CLIENT' para evitar que a aplicação quebre. O acesso pode ser incorreto.");
            profile = {
              id: session.user.id,
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Visitante',
              email: session.user.email || '',
              role: 'CLIENT', // Mantendo para não quebrar a tipagem, mas com um erro explícito acima.
              cpf: '',
              whatsapp: '',
              birthDate: '',
              heroTheme: 'sombra-noturna',
              avatarUrl: session.user.user_metadata?.avatar_url || null,
              customerCode: 'ERROR'
            } as User;
          }

          // Log de verificação de role antes de atualizar o store
          console.log('[AUTH] Logging in user. Role:', profile.role, 'ID:', profile.id);

          // Atualiza o store.
          login(profile);

        } catch (err) {
          console.error("Erro inesperado no fluxo de autenticação:", err);
          // Manter sessão ativa para permitir retry ou debug
        } finally {
          isHandlingRef.current = false;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [login, logout]);

  return <>{children}</>;
};