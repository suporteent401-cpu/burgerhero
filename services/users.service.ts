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

const normalizeCpf = (cpf: string) => cpf.replace(/[^\d]/g, '');

const checkCpfExists = async (cpf: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('client_profiles')
    .select('cpf')
    .eq('cpf', normalizeCpf(cpf))
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Erro ao verificar CPF:', error);
    throw error;
  }
  return !!data;
};

const generateUniqueHeroCode = async (): Promise<string> => {
  let heroCode = '';
  let isUnique = false;
  while (!isUnique) {
    heroCode = `HE${Math.floor(10000 + Math.random() * 90000)}`;
    const { data } = await supabase.from('client_profiles').select('hero_code').eq('hero_code', heroCode).single();
    if (!data) isUnique = true;
  }
  return heroCode;
};

export const registerNewUser = async (userData: any) => {
  const cpfExists = await checkCpfExists(userData.cpf);
  if (cpfExists) throw new Error('CPF já cadastrado.');

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
  });

  if (signUpError) throw signUpError;
  if (!authData.user) throw new Error('Não foi possível criar o usuário.');
  
  const userId = authData.user.id;
  const heroCode = await generateUniqueHeroCode();

  const [appUserResult, clientProfileResult, cardSettingsResult] = await Promise.all([
    supabase.from('app_users').insert({ id: userId, role: 'client', is_active: true }),
    supabase.from('client_profiles').insert({
      user_id: userId,
      display_name: userData.name,
      email: userData.email,
      cpf: userData.cpf,
      hero_code: heroCode,
    }),
    supabase.from('hero_card_settings').insert({ user_id: userId }),
  ]);

  if (appUserResult.error) throw new Error(`Erro (app): ${appUserResult.error.message}`);
  if (clientProfileResult.error) throw new Error(`Erro (profile): ${clientProfileResult.error.message}`);
  if (cardSettingsResult.error) throw new Error(`Erro (settings): ${cardSettingsResult.error.message}`);

  return authData;
};