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

const normalizeCpf = (cpf: string) => (cpf ? cpf.replace(/[^\d]/g, '') : '');

const normalizeRole = (input: any): Role => {
  const r = String(input || '').toLowerCase();
  if (r === 'admin' || r === 'staff' || r === 'client') return r;
  return 'client';
};

const generateHeroCode = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = 'BH-';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

export const checkCpfExists = async (cpf: string): Promise<boolean> => {
  const normalizedCpf = normalizeCpf(cpf);
  if (!normalizedCpf) return false;

  const { data, error } = await supabase
    .from('user_profiles')
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
    .from('user_profiles')
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
  const [appUserResponse, userProfileResponse, settingsResponse] = await Promise.all([
    supabase.from('app_users').select('role, is_active').eq('id', authUser.id).maybeSingle(),
    supabase.from('user_profiles').select('*').eq('user_id', authUser.id).maybeSingle(),
    supabase.from('hero_card_settings').select('*').eq('user_id', authUser.id).maybeSingle(),
  ]);

  if (appUserResponse.error) {
    console.error('CRÍTICO: erro ao buscar app_users:', appUserResponse.error);
    return null;
  }

  const appUserData = appUserResponse.data;
  if (!appUserData) return null;

  const role: Role = normalizeRole(appUserData.role);

  const userProfileData = userProfileResponse.data;
  const settingsData = settingsResponse.data;

  const profile: AppUser = {
    id: authUser.id,
    email: authUser.email || '',
    role,

    name: userProfileData?.display_name || (authUser.user_metadata as any)?.full_name || 'Herói',

    customerCode: userProfileData?.customer_id_public || userProfileData?.hero_code || '',

    avatarUrl: userProfileData?.avatar_url || (authUser.user_metadata as any)?.avatar_url || null,

    cpf: userProfileData?.cpf || '',
    whatsapp: userProfileData?.whatsapp || '',
    birthDate: userProfileData?.birthdate || '',

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

// ✅ garante que existe um perfil (RPC já existe no seu projeto)
export const ensureProfileExistsForEmail = async (email: string) => {
  try {
    if (!email) return;
    await supabase.rpc('ensure_user_profile_login', { p_email: email });
  } catch (e) {
    console.warn('ensure_user_profile_login falhou:', e);
  }
};

// ✅ garante que existe um código de herói (customer_id_public / hero_code)
export const ensureHeroIdentity = async (userId: string): Promise<string | null> => {
  const profile: any = await getUserProfileById(userId);
  const existing = profile?.customer_id_public || profile?.hero_code;
  if (existing) return existing;

  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateHeroCode();

    const { data: collision, error: colErr } = await supabase
      .from('user_profiles')
      .select('user_id')
      .or(`customer_id_public.eq.${code},hero_code.eq.${code}`)
      .limit(1);

    if (colErr) console.warn('Falha ao checar colisão de código:', colErr);
    if (Array.isArray(collision) && collision.length > 0) continue;

    // ⚠️ aqui sim é upsert, mas COMPLETO o suficiente pra não violar NOT NULL
    const { error } = await supabase
      .from('user_profiles')
      .update({ customer_id_public: code, hero_code: code })
      .eq('user_id', userId);

    if (!error) return code;

    console.error('Falha ao salvar hero code:', error);
  }

  return null;
};

// Função apenas de upload (retorna URL)
export const uploadAvatarFile = async (userId: string, file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      upsert: true,
      contentType: file.type || 'image/jpeg',
      cacheControl: '3600',
    });

  if (uploadError) {
    console.error('UPLOAD_AVATAR_ERROR:', uploadError);
    throw new Error(uploadError.message || 'Falha no upload do avatar');
  }

  const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
  return publicUrlData.publicUrl;
};

/**
 * ✅ ATENÇÃO:
 * Para NÃO quebrar hero_code NOT NULL, aqui é UPDATE (não upsert).
 * Pressupõe que o registro já existe (se não existir, AuthProvider/RPC cria).
 */
export const updateUserProfile = async (
  userId: string,
  updates: {
    display_name?: string;
    avatar_url?: string;
    whatsapp?: string;
    birthdate?: string;
  }
) => {
  // garante identidade antes de qualquer update, pra não ficar "visitante"
  await ensureHeroIdentity(userId);

  const { error } = await supabase.from('user_profiles').update(updates).eq('user_id', userId);

  if (error) {
    console.error('UPDATE_PROFILE_ERROR:', error);
    throw new Error(error.message || 'Falha ao salvar perfil no banco');
  }
};

// Mantida para compatibilidade
export const uploadAndSyncAvatar = async (userId: string, file: File): Promise<string | null> => {
  const publicUrl = await uploadAvatarFile(userId, file);
  await updateUserProfile(userId, { avatar_url: publicUrl });
  return publicUrl;
};

export const updateProfileName = async (userId: string, name: string) => {
  await updateUserProfile(userId, { display_name: name });
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
