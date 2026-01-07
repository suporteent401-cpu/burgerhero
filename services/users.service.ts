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
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar perfil do cliente:', error);
    return null;
  }

  return data;
};

export const getFullUserProfile = async (authUser: SupabaseUser): Promise<AppUser | null> => {
  // OTIMIZAÇÃO: Busca em paralelo para reduzir tempo de login pela metade
  const [appUserResponse, clientProfileResponse] = await Promise.all([
    supabase
      .from('app_users')
      .select('role, is_active')
      .eq('id', authUser.id)
      .maybeSingle(),
      
    supabase
      .from('client_profiles')
      .select('display_name, hero_code, avatar_url, cpf, customer_id_public')
      .eq('user_id', authUser.id)
      .maybeSingle()
  ]);

  // Checagem de erros
  if (appUserResponse.error) {
    console.error('CRÍTICO: erro ao buscar app_users:', appUserResponse.error);
    return null;
  }
  
  const appUserData = appUserResponse.data;
  if (!appUserData) {
    console.warn('Aviso: Registro em "app_users" não encontrado para o usuário.');
    return null;
  }

  const role = appUserData.role as Role;
  const clientProfileData = clientProfileResponse.data;

  const fullProfile: AppUser = {
    id: authUser.id,
    email: authUser.email || '',
    role,

    name:
      clientProfileData?.display_name ||
      (authUser.user_metadata as any)?.full_name ||
      authUser.email?.split('@')[0] ||
      'Herói',

    customerCode: clientProfileData?.customer_id_public || clientProfileData?.hero_code || '',
    
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

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: userData.email,
    password: userData.password,
  });

  if (signInError) {
    console.warn('Falha no login automático após cadastro:', signInError);
    return authData;
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc('ensure_user_profile', {
    p_display_name: userData.name,
    p_email: userData.email,
    p_cpf: userData.cpf,
    p_birthdate: userData.birthDate || null,
  });

  if (rpcError) {
    console.error('Erro na RPC ensure_user_profile:', rpcError);
  }

  return authData;
};

export interface PublicProfile {
  display_name: string;
  avatar_url: string | null;
  customer_code: string;
  subscription_status: string | null;
  created_at: string;
}

export const getPublicProfileByCode = async (code: string): Promise<PublicProfile | null> => {
  const { data, error } = await supabase.rpc('get_public_profile_by_code', {
    p_code: code
  });

  if (error) {
    console.error('Erro ao buscar perfil público:', error);
    return null;
  }

  // RPC retorna array de linhas, queremos a primeira (única)
  if (Array.isArray(data) && data.length > 0) {
    return data[0] as PublicProfile;
  }
  
  return null;
};