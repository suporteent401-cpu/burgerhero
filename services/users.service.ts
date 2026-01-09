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
};

const normalizeRole = (input: any): Role => {
  const r = String(input || '').toLowerCase();
  if (r === 'admin' || r === 'staff' || r === 'client') return r;
  return 'client';
};

const normalizeCpf = (cpf: string) => (cpf ? cpf.replace(/[^\d]/g, '') : '');

/**
 * Busca o perfil completo do usuário (perfil + role + settings)
 * - NUNCA retorna settings null (usa DEFAULT_SETTINGS)
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

    // role: tenta app_users primeiro
    const { data: roleData, error: roleErr } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    // settings: pode não existir ainda (usuário novo)
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
      // prioridade: hero_code (imutável), senão customer_id_public
      customerCode: userProfileData.hero_code || userProfileData.customer_id_public || '',
      role,
    };

    const settings: FullUserProfile['settings'] = settingsData
      ? {
          cardTemplateId: settingsData.card_template_id ?? null,
          fontStyle: settingsData.font_style ?? DEFAULT_SETTINGS.fontStyle,
          fontColor: settingsData.font_color ?? DEFAULT_SETTINGS.fontColor,
          fontSize: settingsData.font_size ?? DEFAULT_SETTINGS.fontSize,
          heroTheme: (settingsData.hero_theme as HeroTheme) ?? DEFAULT_SETTINGS.heroTheme,
          mode: (settingsData.mode as any) ?? DEFAULT_SETTINGS.mode,
        }
      : DEFAULT_SETTINGS;

    return { profile, settings };
  } catch (error) {
    console.error('Error in getFullUserProfile:', error);
    return null;
  }
};

/**
 * Busca apenas os dados da tabela user_profiles
 */
export const getUserProfileById = async (userId: string) => {
  const { data, error } = await supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle();

  if (error) {
    console.error('Error fetching user profile by ID:', error);
    return null;
  }
  return data;
};

/**
 * Alias útil: alguns lugares chamam isso
 */
export const getUserProfileByUserId = getUserProfileById;

/**
 * Atualiza o nome de exibição
 */
export const updateProfileName = async (userId: string, displayName: string) => {
  const { error } = await supabase.from('user_profiles').update({ display_name: displayName }).eq('user_id', userId);
  if (error) throw error;
};

export const updateUserName = updateProfileName;

/**
 * Busca configurações do cartão
 */
export const getCardSettings = async (userId: string) => {
  const { data, error } = await supabase.from('hero_card_settings').select('*').eq('user_id', userId).maybeSingle();
  if (error) return null;
  return data;
};

/**
 * Atualiza configurações do cartão
 */
export const updateCardSettings = async (userId: string, settings: any) => {
  const payload: any = {};
  if (settings.templateId !== undefined) payload.card_template_id = settings.templateId;
  if (settings.fontFamily !== undefined) payload.font_style = settings.fontFamily;
  if (settings.fontColor !== undefined) payload.font_color = settings.fontColor;
  if (settings.fontSize !== undefined) payload.font_size = settings.fontSize;
  if (settings.heroTheme !== undefined) payload.hero_theme = settings.heroTheme;
  if (settings.mode !== undefined) payload.mode = settings.mode;

  const { error } = await supabase.from('hero_card_settings').update(payload).eq('user_id', userId);
  if (error) throw error;
};

/**
 * Verifica se CPF existe
 */
export const checkCpfExists = async (cpf: string): Promise<boolean> => {
  const cleanCpf = normalizeCpf(cpf);
  if (!cleanCpf) return false;

  const { count, error } = await supabase
    .from('user_profiles')
    .select('user_id', { count: 'exact', head: true })
    .eq('cpf', cleanCpf);

  if (error) return false;
  return (count || 0) > 0;
};

/**
 * Upload de avatar
 */
export const uploadAndSyncAvatar = async (userId: string, file: File): Promise<string | null> => {
  const bucketName = 'avatars';
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `user-avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file, { upsert: true });
  if (uploadError) {
    console.error('Upload failed:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  const publicUrl = data.publicUrl;

  const { error: updateError } = await supabase.from('user_profiles').update({ avatar_url: publicUrl }).eq('user_id', userId);
  if (updateError) throw updateError;

  return publicUrl;
};

/**
 * Garante e retorna o código de herói
 * (se sua RPC não receber p_user_id, remova o arg e deixe só rpc('ensure_hero_identity'))
 */
export const ensureHeroIdentity = async (userId: string): Promise<string | null> => {
  const { data, error } = await supabase.rpc('ensure_hero_identity', { p_user_id: userId });
  if (error) {
    console.error('ensure_hero_identity error:', error);
    return null;
  }
  return data as string;
};

/**
 * Auto-cura de perfil na sessão
 * - agora envia whatsapp como null (e a coluna existe)
 */
export const ensureProfileFromSession = async (user: SupabaseUser) => {
  const { error } = await supabase.rpc('ensure_user_profile', {
    p_display_name: (user.user_metadata as any)?.full_name || 'Hero',
    p_email: user.email,
    p_cpf: null,
    p_whatsapp: null,
  });
  if (error) console.error('ensureProfileFromSession warning:', error);
};

/**
 * Perfil público por código
 */
export const getPublicProfileByCode = async (code: string): Promise<PublicProfile | null> => {
  const { data, error } = await supabase.rpc('get_public_profile_by_code', { p_code: code });

  if (error) {
    console.error('Erro ao buscar perfil público:', error);
    return null;
  }

  if (Array.isArray(data) && data.length > 0) return data[0] as PublicProfile;
  if (data && !Array.isArray(data)) return data as PublicProfile;

  return null;
};

/**
 * Alguns pontos do app pedem esse export.
 * Aqui ele só chama getFullUserProfile.
 */
export const getFullUserProfileById = async (userId: string): Promise<FullUserProfile | null> => {
  const { data: authUser, error } = await supabase.auth.getUser();
  if (error || !authUser?.user) return null;
  if (authUser.user.id !== userId) return null;
  return getFullUserProfile(authUser.user);
};

/**
 * Outro export que apareceu no seu erro: getFullUserProfile
 * (já existe, mas deixo aqui só pra ficar explícito)
 */
export const getFullUserProfileSafe = getFullUserProfile;
