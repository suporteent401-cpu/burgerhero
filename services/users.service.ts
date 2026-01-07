import { supabase } from '../lib/supabaseClient';
import { User as AppUser, Role } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';

const normalizeCpf = (cpf: string) => (cpf ? cpf.replace(/[^\d]/g, '') : '');

const inferRoleFromEmail = (email?: string | null): Role => {
  const e = (email || '').toLowerCase().trim();
  if (e === 'admin@hero.com') return 'admin';
  if (e === 'staff@hero.com') return 'staff';
  return 'client';
};

export const checkCpfExists = async (cpf: string): Promise<boolean> => {
  const normalizedCpf = normalizeCpf(cpf);
  if (!normalizedCpf) return false;

  const { data, error } = await supabase
    .from('client_profiles')
    .select('cpf')
    .eq('cpf', normalizedCpf)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Erro ao verificar CPF:', error);
    throw new Error('Não foi possível verificar o CPF. Tente novamente.');
  }

  return !!data;
};

export const getUserProfileById = async (userId: string) => {
  const { data, error } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar perfil do cliente:', error);
    return null;
  }

  return data;
};

export const getFullUserProfile = async (authUser: SupabaseUser): Promise<AppUser | null> => {
  // 1) role obrigatório: app_users
  const { data: appUserData, error: appUserError } = await supabase
    .from('app_users')
    .select('role, is_active')
    .eq('id', authUser.id)
    .maybeSingle();

  // Se não existir ainda, deixa o AuthProvider cair no fallback via RPC
  if (appUserError) {
    console.error('Erro ao buscar app_users:', appUserError);
    return null;
  }
  if (!appUserData) return null;

  const role = appUserData.role as Role;

  // 2) client_profiles é opcional (admin/staff podem não ter)
  const { data: clientProfileData, error: clientProfileError } = await supabase
    .from('client_profiles')
    .select('display_name, hero_code, avatar_url, cpf')
    .eq('user_id', authUser.id)
    .maybeSingle();

  if (clientProfileError) {
    // Não explode: admin/staff podem não ter mesmo.
    console.warn('Falha ao buscar client_profiles (ok para admin/staff):', clientProfileError);
  }

  const fullProfile: AppUser = {
    id: authUser.id,
    email: authUser.email || '',
    role,

    name:
      clientProfileData?.display_name ||
      (authUser.user_metadata as any)?.full_name ||
      authUser.email?.split('@')[0] ||
      'Herói',

    customerCode: clientProfileData?.hero_code || (role === 'client' ? 'N/A' : role.toUpperCase()),
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
    if (signUpError.message.toLowerCase().includes('already registered')) {
      throw new Error('E-mail já cadastrado. Faça login.');
    }
    throw signUpError;
  }

  if (!authData.user) {
    throw new Error('Não foi possível criar o usuário. Tente novamente.');
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: userData.email,
    password: userData.password,
  });

  if (signInError) {
    throw new Error('Cadastro realizado. Por favor, confirme seu e-mail antes de fazer login.');
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    await supabase.auth.signOut();
    throw new Error('Confirme seu e-mail para ativar a conta e depois faça login.');
  }

  const role = inferRoleFromEmail(userData.email);

  const { data: rpcData, error: rpcError } = await supabase.rpc('ensure_user_profile', {
    p_display_name: userData.name,
    p_email: userData.email,
    p_cpf: userData.cpf,
    p_birthdate: userData.birthDate || null,
    p_role: role,
  });

  if (rpcError) {
    console.error('Erro na RPC ensure_user_profile:', rpcError);
    await supabase.auth.signOut();
    throw new Error('Ocorreu um erro ao configurar seu perfil. Tente novamente.');
  }

  const result = rpcData?.[0];
  if (!result?.ok) {
    await supabase.auth.signOut();
    throw new Error(result?.message || 'Falha ao criar perfil de usuário.');
  }

  return authData;
};
