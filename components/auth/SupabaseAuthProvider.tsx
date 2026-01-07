import React, { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useCardStore } from '../../store/cardStore';
import { getFullUserProfile } from '../../services/users.service';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const SupabaseAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const setLoading = useAuthStore((s) => s.setLoading);
  
  // Ref para evitar execução dupla em React Strict Mode e controlar inicialização
  const isInitializingRef = useRef(false);

  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    const initAuth = async () => {
      try {
        // 1. Verificação ativa da sessão atual
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Erro ao verificar sessão inicial:", error);
          if (error.message.includes('Invalid Refresh Token')) {
             await supabase.auth.signOut();
          }
          logout(); // Garante estado limpo e isLoading = false
          return;
        }

        if (!session?.user) {
          logout(); // Sem sessão = deslogado e isLoading = false
          return;
        }

        // 2. Se tem sessão, carrega o perfil
        const fullUserData = await getFullUserProfile(session.user);

        if (fullUserData) {
          const { profile, settings } = fullUserData;
          
          // Carrega preferências antes de liberar o login
          useThemeStore.getState().setHeroTheme(settings.heroTheme);
          useThemeStore.getState().setMode(settings.mode);
          useCardStore.getState().setAll({
            templateId: settings.cardTemplateId || undefined,
            font: settings.fontStyle,
            color: settings.fontColor,
            fontSize: settings.fontSize,
          });
          useThemeStore.getState().applyTheme();

          login(profile); // Loga e isLoading = false
        } else {
          console.error('Perfil não encontrado para usuário autenticado.');
          await supabase.auth.signOut();
          logout();
        }
      } catch (err) {
        console.error("Exceção na inicialização da autenticação:", err);
        logout();
      }
    };

    initAuth();

    // 3. Listener para eventos futuros (ex: logout em outra aba, expiração de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignora INITIAL_SESSION pois já tratamos manualmente no initAuth para maior controle
      if (event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_OUT') {
        logout();
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          // Em eventos de refresh, apenas garantimos que o usuário continue logado
          // Não precisamos recarregar todo o perfil se já estivermos logados, 
          // mas para segurança, podemos atualizar se necessário.
          // Aqui, simplificamos para evitar loops: se já está logado, segue.
          const currentUser = useAuthStore.getState().user;
          if (!currentUser) {
             // Se o store perdeu o usuário mas o supabase diz que logou, recarrega
             const fullData = await getFullUserProfile(session.user);
             if (fullData) login(fullData.profile);
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [login, logout, setLoading]);

  return <>{children}</>;
};