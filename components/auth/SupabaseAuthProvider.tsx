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

        const fullUserData = await getFullUserProfile(session.user);

        if (fullUserData) {
          const { profile, settings } = fullUserData;
          
          // 1. Atualiza o estado de autenticação
          login(profile);

          // 2. Atualiza os estados de tema e cartão
          useThemeStore.getState().setHeroTheme(settings.heroTheme);
          useThemeStore.getState().setMode(settings.mode);
          useCardStore.getState().setAll({
            templateId: settings.cardTemplateId || undefined,
            font: settings.fontStyle,
            color: settings.fontColor,
            fontSize: settings.fontSize,
          });
          
          // Aplica o tema visualmente
          useThemeStore.getState().applyTheme();

        } else {
          console.error('AUTH_ERROR: Perfil completo não pôde ser carregado. Desconectando.');
          await supabase.auth.signOut();
          logout();
        }
      } catch (error: any) {
        console.error("Erro no provedor de autenticação, limpando sessão:", error);
        if (error.message && error.message.includes('Invalid Refresh Token')) {
            console.warn("Token de atualização inválido detectado. O usuário será desconectado.");
        }
        await supabase.auth.signOut();
        logout();
      } finally {
        setTimeout(() => { isHandlingRef.current = false; }, 50);
      }
    });

    return () => subscription.unsubscribe();
  }, [login, logout]);

  return <>{children}</>;
};