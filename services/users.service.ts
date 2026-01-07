import { supabase } from '../lib/supabaseClient';
import { User as AppUser, Role } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';

// --- LEITURA ---

export const getFullUserProfile = async (authUser: SupabaseUser): Promise<AppUser | null> => {
  const [appUserResponse, clientProfileResponse, settingsResponse] = await Promise.all([
    supabase.from('app_users').select('role, is_active').eq('id', authUser.id).maybeSingle(),
    supabase.from('client_profiles').select('*').eq('user_id', authUser.id).maybeSingle(),
    supabase.from('hero_card_settings').select('hero_theme').eq('user_id', authUser.id).maybeSingle()
  ]);

  if (appUserResponse.error) {
    console.error('Erro app_users:', appUserResponse.error.message);
    return null;
  }
  
  const appUserData = appUserResponse.data;
  if (!appUserData) return null;

  const role = appUserData.role as Role;
  const clientProfileData = clientProfileResponse.data;
  const settingsData = settingsResponse.data;
  const savedTheme = settingsData?.hero_theme as any || 'sombra-noturna';

  return {
    id: authUser.id,
    email: authUser.email || '',
    role,
    name: clientProfileData?.display_name || (authUser.user_metadata as any)?.full_name || 'Herói',
    customerCode: clientProfileData?.customer_id_public || clientProfileData?.hero_code || '',
    avatarUrl: clientProfileData?.avatar_url || null,
    cpf: clientProfileData?.cpf || '',
    whatsapp: '',
    birthDate: '',
    heroTheme: savedTheme,
  };
};

// --- ESCRITA (PERSISTÊNCIA) ---

/**
 * Atualiza o perfil do usuário de forma unificada.
 * Retorna erro cru do Supabase se falhar, para debug na UI.
 */
export const updateUserProfile = async (userId: string, data: { name?: string; avatarUrl?: string }) => {
  const payload: any = {};
  
  // Só adiciona ao payload se tiver valor (evita apagar dados acidentalmente)
  if (data.name !== undefined) payload.display_name = data.name;
  if (data.avatarUrl !== undefined) payload.avatar_url = data.avatarUrl;

  console.log('[UsersService] Tentando update em client_profiles:', payload);

  const { data: result, error } = await supabase
    .from('client_profiles')
    .update(payload)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[UsersService] Erro REAL do Supabase:', error);
    throw error; // Lança o erro completo (code, message, details)
  }
  
  return result;
};

// --- SETTINGS (Card & Tema) ---

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

// --- HELPERS ---

export const checkCpfExists = async (cpf: string): Promise<boolean> => {
  const normalizedCpf = cpf.replace(/[^\d]/g, '');
  if (!normalizedCpf) return false;
  const { data } = await supabase.from('client_profiles').select('cpf').eq('cpf', normalizedCpf).limit(1);
  return Array.isArray(data) && data.length > 0;
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
  if (error) return null;
  return (data && data.length > 0) ? data[0] : null;
};