import { supabase } from '../lib/supabaseClient';
import { User as AppUser, Role } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * Normaliza uma string de CPF, removendo caracteres não numéricos.
 */
const normalizeCpf = (cpf: string) => cpf ? cpf.replace(/[^\d]/g, '') : '';

/**
 * Verifica se um CPF já está cadastrado na base de dados.
 */
export const checkCpfExists = async (cpf: string): Promise<boolean> => {
  const normalizedCpf = normalizeCpf(cpf);
  if (!normalizedCpf) return false;

  const { data, error } = await supabase
    .from('client_profiles')
    .select('cpf')
    .eq('cpf', normalizedCpf)
    .limit(1)
    .single();

  // PGRST116 significa que nenhuma linha foi encontrada, o que é o resultado esperado para um CPF novo.
  if (error && error.code !== 'PGRST116') {
    console.error('Erro ao verificar CPF:', error);
    throw new Error('Não foi possível verificar o CPF. Tente novamente.');
  }
  
  return !!data; // Retorna true se encontrou um registro, false caso contrário.
};

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
  // 1. Busca o 'role' essencial da tabela 'app_users'. Este é um dado obrigatório.
  const { data: appUserData, error: appUserError } = await supabase
    .from('app_users')
    .select('role')
    .eq('id', authUser.id)
    .single();

  // Se não encontrar um registro em app_users, é um erro crítico de integridade de dados.
  if (appUserError || !appUserData) {
    console.error('CRÍTICO: Registro em "app_users" não encontrado para o usuário autenticado.', { userId: authUser.id, error: appUserError });
    return null; // Retornar null acionará o fallback no AuthProvider.
  }

  // 2. Busca dados opcionais do perfil de cliente. Admins/Staff podem não ter este registro.
  const { data: clientProfileData, error: clientProfileError } = await supabase
    .from('client_profiles')
    .select('display_name, hero_code, avatar_url, cpf')
    .eq('user_id', authUser.id)
    .maybeSingle(); // Usa maybeSingle() para não gerar erro se o perfil não existir.

  if (clientProfileError) {
    console.warn('Não foi possível buscar "client_profile". Isso é normal para roles de admin/staff.', { userId: authUser.id, error: clientProfileError.message });
  }

  // 3. Constrói o objeto de usuário completo para a aplicação.
  const fullProfile: AppUser = {
    id: authUser.id,
    email: authUser.email || '',
    role: appUserData.role as Role, // O 'role' é garantido pela busca em 'app_users'.
    name: clientProfileData?.display_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Herói',
    customerCode: clientProfileData?.hero_code || 'N/A',
    avatarUrl: clientProfileData?.avatar_url || authUser.user_metadata?.avatar_url || null,
    cpf: clientProfileData?.cpf || '',
    whatsapp: '', // Placeholder, não está no DB atualmente
    birthDate: '', // Placeholder
    heroTheme: 'sombra-noturna', // TODO: Integrar com hero_card_settings
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
    // Isso pode acontecer se a confirmação de e-mail estiver ativa.
    throw new Error('Cadastro realizado. Por favor, confirme seu e-mail antes de fazer login.');
  }

  // 3. Garante que a sessão foi estabelecida.
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    console.error("Sessão não iniciada após login. O usuário pode precisar confirmar o e-mail.", { sessionData });
    await supabase.auth.signOut(); // Limpa qualquer estado parcial
    throw new Error("Confirme seu e-mail para ativar a conta e depois faça login.");
  }

  // 4. Com a sessão ativa, chama a RPC para criar/garantir o perfil completo.
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
    console.error("Resultado da RPC não foi 'ok':", result);
    await supabase.auth.signOut();
    throw new Error(result?.message || 'Falha ao criar perfil de usuário.');
  }

  // 5. Retorna os dados da sessão de autenticação.
  return authData;
};