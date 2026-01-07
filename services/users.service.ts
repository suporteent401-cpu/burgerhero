// /services/users.service.ts
import { supabase } from '../lib/supabaseClient';
import { User as AppUser, Role } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';

const normalizeCpf = (cpf: string) => (cpf ? cpf.replace(/[^\d]/g, '') : '');

export const checkCpfExists = async (cpf: string): Promise<boolean> => {
  const normalizedCpf = normalizeCpf(cpf);
  if (!normalizedCpf) return false;

  const { data, error } = await supabase
    .from('client_profiles')
    .select('cpf')
    .eq('cpf', normalizedCpf)
    .limit(1);

  if (error) {
    console.error('Erro ao verificar CPF:', error);
    throw new Error('Não foi possível verificar o CPF. Tente novamente.');
  }

  return Array.isArray(data) && data.length > 0;
};

export const getUserProfileById = async (userId: string) => {
  const { data, error } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('user_id', userId)
    .limit(1);

  if (error) {
    console.error('Erro ao buscar perfil do cliente:', error);
    return null;
  }

  return data?.[0] ?? null;
};

export const getFullUserProfile = async (authUser: SupabaseUser): Promise<AppUser | null> => {
  // 1) role obrigatório do app_users
  const { data: appUserRows, error: appUserError } = await supabase
    .from('app_users')
    .select('role, is_active')
    .eq('id', authUser.id)
    .limit(1);

  if (appUserError) {
    console.error('CRÍTICO: erro ao buscar app_users:', { userId: authUser.id, error: appUserError });
    return null;
  }

  const appUserData = appUserRows?.[0];
  if (!appUserData) {
    console.error('CRÍTICO: Registro em "app_users" não encontrado para o usuário autenticado.', { userId: authUser.id });
    return null;
  }

  const role = appUserData.role as Role;

  // 2) Perfil do cliente é opcional (admin/staff podem não ter)
  const { data: clientRows, error: clientProfileError } = await supabase
    .from('client_profiles')
    .select('display_name, hero_code, avatar_url, cpf')
    .eq('user_id', authUser.id)
    .limit(1);

  if (clientProfileError) {
    console.warn('Aviso: não foi possível buscar client_profiles (ok para admin/staff).', {
      userId: authUser.id,
      error: clientProfileError,
    });
  }

  const clientProfileData = clientRows?.[0] ?? null;

  const fullProfile: AppUser = {
    id: authUser.id,
    email: authUser.email || '',
    role,

    name:
      clientProfileData?.display_name ||
      (authUser.user_metadata as any)?.full_name ||
      authUser.email?.split('@')[0] ||
      'Herói',

    customerCode: clientProfileData?.hero_code || 'N/A',
    avatarUrl: clientProfileData?.avatar_url || (authUser.user_metadata as any)?.avatar_url || null,
    cpf: clientProfileData?.cpf || '',
    whatsapp: '',
    birthDate: '',
    heroTheme: 'sombra-noturna',
  };

  return fullProfile;
};

export const signUpAndCreateProfile = async (userData: any) => {
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

  // login para obter sessão e rodar RPC
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: userData.email,
    password: userData.password,
  });

  if (signInError) {
    console.error('Falha no login automático após cadastro:', signInError);
    throw new Error('Cadastro realizado. Por favor, confirme seu e-mail antes de fazer login.');
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    await supabase.auth.signOut();
    throw new Error('Confirme seu e-mail para ativar a conta e depois faça login.');
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc('ensure_user_profile', {
    p_display_name: userData.name,
    p_email: userData.email,
    p_cpf: userData.cpf,
    p_birthdate: userData.birthDate || null,
  });

  if (rpcError) {
    console.error('Erro na RPC ensure_user_profile:', rpcError);
    await supabase.auth.signOut();
    throw new Error('Ocorreu um erro ao configurar seu perfil. Tente novamente.');
  }

  const result = Array.isArray(rpcData) ? rpcData[0] : rpcData;
  if (!result || !result.ok) {
    console.error('Resultado da RPC não foi ok:', result);
    await supabase.auth.signOut();
    throw new Error(result?.message || 'Falha ao criar perfil de usuário.');
  }

  return authData;
};
