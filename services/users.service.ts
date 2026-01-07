import { supabase } from '../lib/supabaseClient';
import { User as AppUser, Role, HeroTheme } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Estrutura de retorno unificada para o perfil completo
export interface FullUserProfile {
  profile: AppUser;
  settings: {
    cardTemplateId: string | null;
    fontStyle: string;
    fontColor: string;
    fontSize: number;
    heroTheme: HeroTheme;
    mode: 'light' | 'dark' | 'system';
  };
}

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

export const getFullUserProfile = async (authUser: SupabaseUser): Promise<FullUserProfile | null> => {
  const [appUserResponse, clientProfileResponse, settingsResponse] = await Promise.all([
    supabase.from('app_users').select('role, is_active').eq('id', authUser.id).maybeSingle(),
    supabase.from('client_profiles').select('*').eq('user_id', authUser.id).maybeSingle(),
    supabase.from('hero_card_settings').select('*').eq('user_id', authUser.id).maybeSingle()
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

  const profile: AppUser = {
    id: authUser.id,
    email: authUser.email || '',
    role,
    name: clientProfileData?.display_name || (authUser.user_metadata as any)?.full_name || 'Herói',
    customerCode: clientProfileData?.customer_id_public || clientProfileData?.hero_code || '',
    avatarUrl: clientProfileData?.avatar_url || (authUser.user_metadata as any)?.avatar_url || null,
    cpf: clientProfileData?.cpf || '',
    whatsapp: '', 
    birthDate: '', 
    heroTheme: (settingsData?.hero_theme as HeroTheme) || 'sombra-noturna',
  };

  const settings = {
    cardTemplateId: settingsData?.card_template_id || null,
    fontStyle: settingsData?.font_style || 'Inter, sans-serif',
    fontColor: settingsData?.font_color || '#FFFFFF',
    fontSize: settingsData?.font_size_px || 22,
    heroTheme: (settingsData?.hero_theme as HeroTheme) || 'sombra-noturna',
    mode: (settingsData?.theme_mode as 'light' | 'dark' | 'system') || 'light',
  };

  return { profile, settings };
};

export const uploadAndSyncAvatar = async (userId: string, file: File): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
  const publicUrl = publicUrlData.publicUrl;

  const { error: dbError } = await supabase
    .from('client_profiles')
    .update({ avatar_url: publicUrl })
    .eq('user_id', userId);

  if (dbError) throw dbError;

  return publicUrl;
};

export const updateProfileName = async (userId: string, name: string) => {
  const { error } = await supabase
    .from('client_profiles')
    .update({ display_name: name })
    .eq('user_id', userId);

  if (error) throw error;
};

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
    .upsert({ user_id: userId, ...dbPayload }, { onConflict: 'user_id' });

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