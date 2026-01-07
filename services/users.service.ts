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
    // Pode ocorrer em casos de race condition no primeiro login, 
    // mas o AuthProvider deve lidar com retry se necessário.
    console.warn('Aviso: Registro em "app_users" não encontrado para o usuário.');
    return null;
  }

  const role = appUserData.role as Role;
  const clientProfileData = clientProfileResponse.data;

  // Monta o perfil final. 
  // O customer_id_public agora é garantido pelo Trigger do banco de dados.
  // Se ainda vier nulo (muito raro), usamos fallback.
  const fullProfile: AppUser = {
    id: authUser.id,
    email: authUser.email || '',
    role,

    name:
      clientProfileData?.display_name ||
      (authUser.user_metadata as any)?.full_name ||
      authUser.email?.split('@')[0] ||
      'Herói',

    customerCode: clientProfileData?.customer_id_public || clientProfileData?.hero_code || 'BH-GERANDO',
    avatarUrl: clientProfileData?.avatar_url || (authUser.user_metadata as any)?.avatar_url || null,
    cpf: clientProfileData?.cpf || '',
    whatsapp: '',
    birthDate: '',
    heroTheme: 'sombra-noturna', // Poderia vir do banco se houver coluna para isso
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

  // Login automático para rodar a RPC de criação de perfil
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: userData.email,
    password: userData.password,
  });

  if (signInError) {
    console.warn('Falha no login automático após cadastro (pode exigir confirmação de email):', signInError);
    // Não lançamos erro aqui se for apenas pendência de email
    return authData;
  }

  // RPC para garantir tabelas iniciais
  const { data: rpcData, error: rpcError } = await supabase.rpc('ensure_user_profile', {
    p_display_name: userData.name,
    p_email: userData.email,
    p_cpf: userData.cpf,
    p_birthdate: userData.birthDate || null,
  });

  if (rpcError) {
    console.error('Erro na RPC ensure_user_profile:', rpcError);
    // Segue o fluxo, pois o usuário foi criado no Auth
  }

  return authData;
};