import { supabase } from '../lib/supabaseClient';
import { User as AppUser, Role } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * Busca o perfil de um cliente pelo seu ID de usuário (auth.uid).
 */
export const getUserProfileById = async (userId: string) => {
  const { data, error } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    // Não é um erro crítico se nenhum perfil for encontrado (pode ser staff/admin).
    if (error.code !== 'PGRST116') {
      console.error('Erro ao buscar perfil do cliente:', error);
    }
    return null;
  }
  return data;
};

/**
 * Busca o perfil completo de um usuário (auth + app_users + client_profiles).
 */
export const getFullUserProfile = async (authUser: SupabaseUser): Promise<AppUser | null> => {
  const { data: appUser, error: appUserError } = await supabase
    .from('app_users')
    .select('role')
    .eq('id', authUser.id)
    .single();

  if (appUserError || !appUser) {
    console.error('Erro ao buscar dados de app_users:', appUserError?.message);
    return null; // Retorna null se o role não for encontrado, pois é crítico.
  }

  const { data: clientProfile, error: clientProfileError } = await supabase
    .from('client_profiles')
    .select('display_name, hero_code, avatar_url, cpf')
    .eq('user_id', authUser.id)
    .single();

  // Não trata o erro se o perfil não for encontrado (PGRST116), pois pode ser um staff/admin.
  if (clientProfileError && clientProfileError.code !== 'PGRST116') {
    console.error('Erro ao buscar perfil do cliente:', clientProfileError.message);
  }

  // Monta o objeto final do usuário para o Zustand store
  const fullProfile: AppUser = {
    id: authUser.id,
    email: authUser.email || '',
    role: appUser.role as Role,
    name: clientProfile?.display_name || authUser.email?.split('@')[0] || 'Herói',
    customerCode: clientProfile?.hero_code || 'N/A',
    avatarUrl: clientProfile?.avatar_url || null,
    cpf: clientProfile?.cpf || '',
    // Campos que não estão no DB, mas estão no tipo User
    whatsapp: '',
    birthDate: '',
    heroTheme: 'sombra-noturna', // TODO: Isso deveria vir do DB (hero_card_settings)
  };

  return fullProfile;
};