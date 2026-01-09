import { supabase } from '../lib/supabaseClient';
import { User as AppUser, Role, HeroTheme } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface FullUserProfile {
  profile: AppUser;
  settings: {
    cardTemplateId: string | null;
    fontStyle: string;
    fontColor: string;
    fontSize: number;
    heroTheme: HeroTheme;
    mode: 'light' | 'dark' | 'system';
    appFontSize: 'small' | 'medium' | 'large';
  };
}

export interface PublicProfile {
  display_name: string;
  avatar_url: string | null;
  customer_code: string;
  subscription_status: string | null;
  created_at: string;
}

const DEFAULT_SETTINGS: FullUserProfile['settings'] = {
  cardTemplateId: null,
  fontStyle: 'Inter',
  fontColor: '#FFFFFF',
  fontSize: 22,
  heroTheme: 'sombra-noturna' as HeroTheme,
  mode: 'system',
  appFontSize: 'medium',
};

const normalizeRole = (input: any): Role => {
  const r = String(input || '').toLowerCase();
  if (r === 'admin' || r === 'staff' || r === 'client') return r;
  return 'client';
};

/**
 * Busca o perfil completo do usuário (perfil + role + settings)
 */
export const getFullUserProfile = async (user: SupabaseUser): Promise<FullUserProfile | null> => {
  const userId = user.id;

  try {
    const { data: userProfileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!userProfileData) return null;

    const { data: roleData } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    const { data: settingsData } = await supabase
      .from('hero_card_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const role = normalizeRole(roleData?.role);

    const profile: AppUser = {
      id: userId,
      name: userProfileData.display_name || (user.user_metadata as any)?.full_name || 'Herói',
      email: userProfileData.email || user.email || '',
      cpf: userProfileData.cpf || '',
      avatarUrl: userProfileData.avatar_url || (user.user_metadata as any)?.avatar_url || null,
      customerCode: userProfileData.hero_code || userProfileData.customer_id_public || '',
      role,
    };

    const settings: FullUserProfile['settings'] = settingsData
      ? {
          cardTemplateId: settingsData.card_template_id ?? null,
          fontStyle: settingsData.font_style ?? DEFAULT_SETTINGS.fontStyle,
          fontColor: settingsData.font_color ?? DEFAULT_SETTINGS.fontColor,
          fontSize: settingsData.font_size_px ?? DEFAULT_SETTINGS.fontSize,
          heroTheme: (settingsData.hero_theme as HeroTheme) ?? DEFAULT_SETTINGS.heroTheme,
          mode: (settingsData.theme_mode as any) ?? DEFAULT_SETTINGS.mode,
          appFontSize: (settingsData.app_font_size as any) ?? DEFAULT_SETTINGS.appFontSize,
        }
      : { ...DEFAULT_SETTINGS };

    return { profile, settings };
  } catch (error) {
    console.error('Error in getFullUserProfile:', error);
    return null;
  }
};

export const getUserProfileById = async (userId: string) => {
  const { data } = await supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle();
  return data;
};

export const updateProfileName = async (userId: string, displayName: string) => {
  const { error } = await supabase.from('user_profiles').update({ display_name: displayName }).eq('user_id', userId);
  if (error) throw error;
};

export const updateUserName = updateProfileName;

/**
 * Atualiza configurações do cartão e do app
 */
export const updateCardSettings = async (userId: string, settings: any) => {
  const payload: any = {};
  if (settings.templateId !== undefined) payload.card_template_id = settings.templateId ?? null;
  if (settings.fontFamily !== undefined) payload.font_style = settings.fontFamily;
  if (settings.fontColor !== undefined) payload.font_color = settings.fontColor;
  if (settings.fontSize !== undefined) payload.font_size_px = settings.fontSize;
  if (settings.heroTheme !== undefined) payload.hero_theme = settings.heroTheme;
  if (settings.mode !== undefined) payload.theme_mode = settings.mode;
  if (settings.appFontSize !== undefined) payload.app_font_size = settings.appFontSize;

  const { error } = await supabase.from('hero_card_settings').update(payload).eq('user_id', userId);
  if (error) throw error;
};

export const checkCpfExists = async (cpf: string): Promise<boolean> => {
  const cleanCpf = cpf.replace(/[^\d]/g, '');
  if (!cleanCpf) return false;
  const { count } = await supabase.from('user_profiles').select('user_id', { count: 'exact', head: true }).eq('cpf', cleanCpf);
  return (count || 0) > 0;
};

export const uploadAndSyncAvatar = async (userId: string, file: File): Promise<string | null> => {
  const bucketName = 'avatars';
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `user-avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  const publicUrl = data.publicUrl;

  await supabase.from('user_profiles').update({ avatar_url: publicUrl }).eq('user_id', userId);
  return publicUrl;
};

export const ensureHeroIdentity = async (userId: string): Promise<string | null> => {
  const { data, error } = await supabase.rpc('ensure_hero_identity');
  if (error) return null;
  return data as string;
};

export const ensureProfileFromSession = async (user: SupabaseUser) => {
  await supabase.rpc('ensure_user_bootstrap', {
    p_display_name: (user.user_metadata as any)?.full_name || 'Hero',
    p_email: user.email || '',
    p_cpf: '',
    p_birthdate: null,
    p_whatsapp: null,
  });
};

export const getPublicProfileByCode = async (code: string): Promise<PublicProfile | null> => {
  const { data } = await supabase.rpc('get_public_profile_by_code', { p_code: code });
  if (Array.isArray(data) && data.length > 0) return data[0] as PublicProfile;
  return data as PublicProfile;
};