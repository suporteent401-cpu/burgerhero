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
  const [appUserResponse, clientProfileResponse, settingsResponse] = await Promise.all([
    supabase.from('app_users').select('role, is_active').eq('id', authUser.id).maybeSingle(),
    supabase.from('client_profiles').select('*').eq('user_id', authUser.id).maybeSingle(),
    supabase.from('hero_card_settings').select('hero_theme').eq('user_id', authUser.id).maybeSingle()
  ]);

  if (appUserResponse.error) {
    console.error('CRÍTICO: erro ao buscar app_users:', appUserResponse.error);
    return null;
  }
  
  const appUserData = appUserResponse.data;
  if (!appUserData) return null;

  const role = appUserData.role as Role;
  const clientProfileData = clientProfileResponse.data;
  const settingsData = settingsResponse.data;

  const savedTheme = settingsData?.hero_theme as any || 'sombra-noturna';

  const fullProfile: AppUser = {
    id: authUser.id,
    email: authUser.email || '',
    role,
    name: clientProfileData?.display_name || (authUser.user_metadata as any)?.full_name || 'Herói',
    customerCode: clientProfileData?.customer_id_public || clientProfileData?.hero_code || '',
    avatarUrl: clientProfileData?.avatar_url || (authUser.user_metadata as any)?.avatar_url || null,
    cpf: clientProfileData?.cpf || '',
    whatsapp: '',
    birthDate: '',
    heroTheme: savedTheme,
  };

  return fullProfile;
};

export const signUpAndCreateProfile = async (userData: any) => {
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
  });

  if (signUpError) {
    if (signUpError.message.includes('User already registered')) throw new Error('E-mail já cadastrado. Faça login.');
    throw signUpError;
  }

  if (!authData.user) throw new Error('Não foi possível criar o usuário. Tente novamente.');

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: userData.email,
    password: userData.password,
  });

  if (signInError) console.warn('Falha no login automático:', signInError);

  await supabase.rpc('ensure_user_profile', {
    p_display_name: userData.name,
    p_email: userData.email,
    p_cpf: userData.cpf,
    p_birthdate: userData.birthDate || null,
  });

  return authData;
};

export const updateProfileName = async (userId: string, name: string) => {
  console.log('[UsersService] Atualizando nome...', { userId, name });
  
  const { data, error } = await supabase
    .from('client_profiles')
    .update({ display_name: name })
    .eq('user_id', userId)
    .select();

  if (error) {
    console.error('[UsersService] Erro ao atualizar nome:', error);
    throw error;
  }
  
  return data;
};

// --- AVATAR ---

export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
  console.log('[UsersService] Iniciando upload de avatar...', { userId, fileName: file.name });
  
  // Cria um nome de arquivo único para evitar cache: uid/timestamp.ext
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  // 1. Upload
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { 
      upsert: true,
      contentType: file.type 
    });

  if (uploadError) {
    console.error('[UsersService] Erro no upload:', uploadError);
    throw new Error(`Falha no upload: ${uploadError.message}`);
  }

  // 2. Get Public URL
  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
  
  if (!data.publicUrl) {
     throw new Error('Falha ao obter URL pública do avatar.');
  }

  console.log('[UsersService] Upload concluído. URL:', data.publicUrl);
  return data.publicUrl;
};

// --- SETTINGS ---

export const updateCardSettings = async (userId: string, settings: any) => {
  const dbPayload: any = {};
  if (settings.templateId) dbPayload.card_template_id = settings.templateId;
  if (settings.fontFamily) dbPayload.font_style = settings.fontFamily;
  if (settings.fontColor) dbPayload.font_color = settings.fontColor;
  if (settings.fontSize) dbPayload.font_size_px = settings.fontSize;
  if (settings.heroTheme) dbPayload.hero_theme = settings.heroTheme;
  if (settings.mode) dbPayload.theme_mode = settings.mode;

  const { error } = await supabase
    .from('hero_card_settings')
    .update(dbPayload)
    .eq('user_id', userId);

  if (error) throw error;
};

export const getCardSettings = async (userId: string) => {
  const { data, error } = await supabase
    .from('hero_card_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) return null;
  return data;
};

// --- Tipos e Interfaces ---

export interface PublicProfile {
  display_name: string;
  avatar_url: string | null;
  customer_code: string;
  subscription_status: string | null;
  created_at: string;
}

export const getPublicProfileByCode = async (code: string): Promise<PublicProfile | null> => {
  const { data, error } = await supabase.rpc('get_public_profile_by_code', { p_code: code });
  if (error) {
    console.error('Erro ao buscar perfil público:', error);
    return null;
  }
  if (Array.isArray(data) && data.length > 0) return data[0] as PublicProfile;
  return null;
};