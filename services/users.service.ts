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

export const getUserProfileById = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile by ID:', error);
    return null;
  }
  return data;
};

export const updateProfileName = async (userId: string, displayName: string) => {
  const { error } = await supabase
    .from('user_profiles')
    .update({ display_name: displayName })
    .eq('user_id', userId);

  if (error) throw error;
};

// Alias para compatibilidade
export const updateUserName = updateProfileName;

export const getCardSettings = async (userId: string) => {
  const { data, error } = await supabase
    .from('hero_card_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data;
};

export const updateCardSettings = async (userId: string, settings: any) => {
  const payload: any = {};
  if (settings.templateId) payload.card_template_id = settings.templateId;
  if (settings.fontFamily) payload.font_style = settings.fontFamily;
  if (settings.fontColor) payload.font_color = settings.fontColor;
  if (settings.fontSize) payload.font_size = settings.fontSize;
  if (settings.heroTheme) payload.hero_theme = settings.heroTheme;
  if (settings.mode) payload.mode = settings.mode;

  const { error } = await supabase
    .from('hero_card_settings')
    .update(payload)
    .eq('user_id', userId);

  if (error) throw error;
};

export const checkCpfExists = async (cpf: string): Promise<boolean> => {
  const cleanCpf = cpf.replace(/\D/g, '');
  if (!cleanCpf) return false;
  
  const { count, error } = await supabase
    .from('user_profiles')
    .select('user_id', { count: 'exact', head: true })
    .eq('cpf', cleanCpf);

  if (error) return false;
  return (count || 0) > 0;
};

export const uploadAndSyncAvatar = async (userId: string, file: File): Promise<string | null> => {
  // Usar bucket "avatars" ou "images" conforme configuração do projeto.
  // Aqui assumo 'images' como padrão comum ou 'avatars' se existir. 
  // Vou tentar 'avatars' primeiro.
  const bucketName = 'avatars'; 
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `user-avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error('Upload failed:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  const publicUrl = data.publicUrl;

  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ avatar_url: publicUrl })
    .eq('user_id', userId);

  if (updateError) throw updateError;

  return publicUrl;
};

export const ensureHeroIdentity = async (userId: string): Promise<string | null> => {
  // Chama a RPC que garante e retorna o hero_code
  // A RPC usa auth.uid(), então precisamos estar logados.
  // Se userId for passado apenas para log, ok.
  const { data, error } = await supabase.rpc('ensure_hero_identity');
  if (error) {
    console.error('ensure_hero_identity error:', error);
    return null;
  }
  return data as string;
};

export const ensureProfileFromSession = async (user: SupabaseUser) => {
  const { error } = await supabase.rpc('ensure_user_profile', {
    p_display_name: user.user_metadata?.full_name || 'Hero',
    p_email: user.email,
    p_cpf: null // CPF opcional neste fluxo
  });
  if (error) console.error('ensureProfileFromSession warning:', error);
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