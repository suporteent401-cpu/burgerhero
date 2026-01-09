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
  } | null;
}

export const getFullUserProfile = async (user: SupabaseUser): Promise<FullUserProfile> => {
  const userId = user.id;

  const { data: userProfileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (profileError) throw profileError;

  const { data: roleData } = await supabase
    .from('app_users')
    .select('role')
    .eq('id', userId)
    .single();

  const { data: settingsData } = await supabase
    .from('hero_card_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const profile: AppUser = {
    id: userId,
    name: userProfileData?.display_name || user.user_metadata?.full_name || 'Herói',
    email: userProfileData?.email || user.email || '',
    cpf: userProfileData?.cpf || '',
    avatarUrl: userProfileData?.avatar_url || user.user_metadata?.avatar_url || null,
    // ✅ PADRÃO: sempre priorizar hero_code (imutável/real)
    // fallback apenas para evitar tela vazia em dados antigos
    customerCode: userProfileData?.hero_code || userProfileData?.customer_id_public || '',
    role: (roleData?.role as Role) || 'client',
  };

  const settings = settingsData ? {
    cardTemplateId: settingsData.card_template_id ?? null,
    fontStyle: settingsData.font_style ?? 'Inter',
    fontColor: settingsData.font_color ?? '#FFFFFF',
    fontSize: settingsData.font_size ?? 16,
    heroTheme: (settingsData.hero_theme as HeroTheme) ?? 'classic',
    mode: (settingsData.mode as any) ?? 'system',
  } : null;

  return { profile, settings };
};

export const updateUserName = async (userId: string, displayName: string) => {
  const { error } = await supabase
    .from('user_profiles')
    .update({ display_name: displayName })
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
