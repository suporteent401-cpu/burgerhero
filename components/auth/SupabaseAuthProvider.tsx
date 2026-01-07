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

const normalizeRole = (input: any): Role => {
  const r = String(input || '').toLowerCase();
  if (r === 'admin' || r === 'staff' || r === 'client') return r;
  return 'client';
};

const generateCustomerCode = () => {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BH-${random}`;
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

    const applySettings = (settings: any) => {
      useThemeStore.getState().setHeroTheme(settings.heroTheme);
      useThemeStore.getState().setMode(settings.mode);
      useCardStore.getState().setAll({
        templateId: settings.cardTemplateId || undefined,
        font: settings.fontStyle,
        color: settings.fontColor,
        fontSize: settings.fontSize,
      });
      useThemeStore.getState().applyTheme();
    };

    /**
     * Garante que o usuário autenticado tenha customerCode.
     * IMPORTANTE:
     * - Aqui eu atualizo direto no Supabase.
     * - Ajuste o nome da coluna se no seu banco for `customer_code` ao invés de `customerCode`.
     */
    const ensureCustomerCode = async (profile: any) => {
      // Se já tem, beleza
      if (profile?.customerCode) return profile;

      const newCode = generateCustomerCode();

      // ⚠️ ATENÇÃO: escolha 1 dos campos abaixo conforme sua tabela.
      // Se a coluna no banco for snake_case: use { customer_code: newCode }
      // Se for camelCase (menos comum): use { customerCode: newCode }
      //
      // Eu vou tentar snake_case primeiro, e se falhar, tento camelCase.
      // (Assim evita ficar travado sem saber o nome exato.)
      let updated = false;

      // tentativa 1: snake_case
      {
        const { error } = await supabase
          .from('profiles')
          .update({ customer_code: newCode })
          .eq('id', profile.id);

        if (!error) updated = true;
      }

      // tentativa 2: camelCase (fallback)
      if (!updated) {
        const { error } = await supabase
          .from('profiles')
          .update({ customerCode: newCode })
          .eq('id', profile.id);

        if (error) {
          console.error('Falha ao gerar customerCode no profile:', error);
          // Não joga logout por isso; só retorna o profile como está.
          return profile;
        }
      }

      // Atualiza o objeto em memória para o app já enxergar agora
      return { ...profile, customerCode: newCode };
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
          if (error.message?.includes('Invalid Refresh Token')) {
            await supabase.auth.signOut();
          }
          logout();
          return;
        }

        if (!session?.user) {
          logout();
          return;
        }

        const full = await getFullUserProfile(session.user);

        if (!full) {
          console.error('Perfil não encontrado para usuário autenticado.');
          await supabase.auth.signOut();
          logout();
          return;
        }

        // Garante role válida
        let safeProfile = { ...full.profile, role: normalizeRole(full.profile.role) };

        // ✅ Garante customerCode
        safeProfile = await ensureCustomerCode(safeProfile);

        applySettings(full.settings);
        login(safeProfile);
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
      // Já tratamos manualmente a inicialização
      if (event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_OUT') {
        logout();
        return;
      }

      // SIGNED_IN / TOKEN_REFRESHED
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        try {
          // Se já tiver usuário no store, normalmente não precisa reload
          // MAS: se não tiver customerCode ainda, a gente garante aqui.
          const currentUser = useAuthStore.getState().user;

          // Se já existe user e já tem customerCode, não faz nada
          if (currentUser?.id && currentUser?.customerCode) return;

          setLoading(true);

          // Se já existe user no store, tenta garantir code sem refazer tudo
          if (currentUser?.id && !currentUser.customerCode) {
            const ensured = await ensureCustomerCode(currentUser);
            // login() aqui serve como "refresh" do store do auth
            login({ ...ensured, role: normalizeRole(ensured.role) });
            return;
          }

          // Se não tem user no store, carrega completo
          const full = await getFullUserProfile(session.user);
          if (!full) {
            await supabase.auth.signOut();
            logout();
            return;
          }

          let safeProfile = { ...full.profile, role: normalizeRole(full.profile.role) };
          safeProfile = await ensureCustomerCode(safeProfile);

          applySettings(full.settings);
          login(safeProfile);
        } catch (e) {
          console.error('Erro ao processar mudança de auth state:', e);
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
