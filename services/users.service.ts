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
    return null;
  }

  const { data: clientProfile, error: clientProfileError } = await supabase
    .from('client_profiles')
    .select('display_name, hero_code, avatar_url, cpf')
    .eq('user_id', authUser.id)
    .single();

  if (clientProfileError && clientProfileError.code !== 'PGRST116') {
    console.error('Erro ao buscar perfil do cliente:', clientProfileError.message);
  }

  const fullProfile: AppUser = {
    id: authUser.id,
    email: authUser.email || '',
    role: appUser.role as Role,
    name: clientProfile?.display_name || authUser.email?.split('@')[0] || 'Herói',
    customerCode: clientProfile?.hero_code || 'N/A',
    avatarUrl: clientProfile?.avatar_url || null,
    cpf: clientProfile?.cpf || '',
    whatsapp: '',
    birthDate: '',
    heroTheme: 'sombra-noturna',
  };

  return fullProfile;
};

/**
 * Registra um novo usuário e garante a criação do seu perfil via RPC.
 */
export const signUpAndCreateProfile = async (userData: any) => {
  // 1. Cria o usuário no Supabase Auth.
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
  });

  if (signUpError) {
    if (signUpError.message.includes('User already registered')) {
      throw new Error('E-mail já cadastrado. Faça login.');
    }
    throw signUpError;
  }
  if (!authData.user) {
    throw new Error('Não foi possível criar o usuário. Tente novamente.');
  }

  // 2. Faz login para obter uma sessão válida para a chamada RPC.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: userData.email,
    password: userData.password,
  });

  if (signInError) {
    console.error("Falha no login automático após cadastro:", signInError);
    throw new Error('Cadastro realizado, mas falha ao iniciar sessão. Tente fazer login manualmente.');
  }

  // 3. Chama a RPC para criar/garantir o perfil completo.
  const { data: rpcData, error: rpcError } = await supabase.rpc('ensure_user_profile', {
    p_display_name: userData.name,
    p_email: userData.email,
    p_cpf: userData.cpf,
    p_birthdate: userData.birthDate || null
  });

  if (rpcError) {
    console.error("Erro na RPC ensure_user_profile:", rpcError);
    await supabase.auth.signOut(); // Desloga em caso de erro para evitar estado inconsistente.
    throw new Error('Ocorreu um erro ao configurar seu perfil. Tente novamente.');
  }

  const result = rpcData[0];
  if (!result || !result.ok) {
    await supabase.auth.signOut();
    throw new Error(result?.message || 'Falha ao criar perfil de usuário.');
  }

  // 4. Retorna os dados da sessão de autenticação.
  return authData;
};