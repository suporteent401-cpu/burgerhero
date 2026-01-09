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

const normalizeCpf = (cpf?: string | null) => (cpf ? String(cpf).replace(/[^\d]/g, '') : '');

const mapSettingsRowToSettings = (row: any | null | undefined): FullUserProfile['settings'] => {
  // ✅ Resiliente a variações de schema:
  // - font_size OU font_size_px
  // - mode OU theme_mode
  // - hero_theme OU heroTheme (se vier errado de algum lugar)
  const fontSizeRaw =
    row?.font_size ??
    row?.font_size_px ??
    row?.fontSize ??
    DEFAULT_SETTINGS.fontSize;

  const modeRaw =
    row?.mode ??
    row?.theme_mode ??
    DEFAULT_SETTINGS.mode;

  const heroThemeRaw =
    row?.hero_theme ??
    row?.heroTheme ??
    DEFAULT_SETTINGS.heroTheme;

  return {
    cardTemplateId: row?.card_template_id ?? row?.cardTemplateId ?? DEFAULT_SETTINGS.cardTemplateId,
    fontStyle: row?.font_style ?? row?.fontStyle ?? DEFAULT_SETTINGS.fontStyle,
    fontColor: row?.font_color ?? row?.fontColor ?? DEFAULT_SETTINGS.fontColor,
    fontSize: typeof fontSizeRaw === 'number' ? fontSizeRaw : Number(fontSizeRaw) || DEFAULT_SETTINGS.fontSize,
    heroTheme: (heroThemeRaw as HeroTheme) ?? DEFAULT_SETTINGS.heroTheme,
    mode: (modeRaw as any) ?? DEFAULT_SETTINGS.mode,
  };
};

/**
 * ✅ Garante (via UPSERT) que existam:
 * - user_profiles (mínimo)
 * - app_users (role)
 * - hero_card_settings (defaults)
 *
 * Isso evita depender da RPC ensure_user_bootstrap (que está falhando no seu banco).
 */
export const ensureUserBootstrap = async (payload: {
  userId: string;
  email: string;
  displayName?: string | null;
  cpf?: string | null;
  birthdate?: string | null;
  avatarUrl?: string | null;
  role?: Role;
}) => {
  const userId = payload.userId;
  const email = payload.email || '';
  const displayName = payload.displayName || 'Herói';
  const cpf = normalizeCpf(payload.cpf);
  const birthdate = payload.birthdate ?? null;
  const avatarUrl = payload.avatarUrl ?? null;
  const role: Role = normalizeRole(payload.role || 'client');

  // 1) user_profiles (mínimo)
  // OBS: não inclui whatsapp aqui (pois não existe na sua tabela atual)
  const { error: upsertProfileError } = await supabase
    .from('user_profiles')
    .upsert(
      {
        user_id: userId,
        display_name: displayName,
        email,
        cpf: cpf || null,
        birthdate,
        avatar_url: avatarUrl,
      },
      { onConflict: 'user_id' }
    );

  if (upsertProfileError) {
    console.error('ensureUserBootstrap: upsert user_profiles falhou:', upsertProfileError);
    // não dá throw aqui pra não quebrar login; só loga
  }

  // 2) app_users (role)
  const { error: upsertAppUsersError } = await supabase
    .from('app_users')
    .upsert(
      { id: userId, role },
      { onConflict: 'id' }
    );

  if (upsertAppUsersError) {
    console.error('ensureUserBootstrap: upsert app_users falhou:', upsertAppUsersError);
  }

  // 3) hero_card_settings (defaults)
  // Respeita schema variável: tenta inserir com campos mais comuns.
  // Se o banco tiver colunas diferentes, o select em getFullUserProfile vai garantir defaults mesmo assim.
  const settingsInsert: any = {
    user_id: userId,
    card_template_id: DEFAULT_SETTINGS.cardTemplateId,
    font_style: DEFAULT_SETTINGS.fontStyle,
    font_color: DEFAULT_SETTINGS.fontColor,
    hero_theme: DEFAULT_SETTINGS.heroTheme,
  };

  // tenta ambos: font_size e mode (se existir)
  settingsInsert.font_size = DEFAULT_SETTINGS.fontSize;
  settingsInsert.mode = DEFAULT_SETTINGS.mode;

  const { error: upsertSettingsError } = await supabase
    .from('hero_card_settings')
    .upsert(settingsInsert, { onConflict: 'user_id' });

  if (upsertSettingsError) {
    // ✅ não quebra login caso a tabela/colunas sejam diferentes
    console.warn('ensureUserBootstrap: upsert hero_card_settings aviso:', upsertSettingsError);
  }

  // 4) garante hero_code (se sua RPC existir e estiver ok)
  try {
    await ensureHeroIdentity(userId);
  } catch (e) {
    // não quebra
  }

  return { ok: true };
};

/**
 * ✅ Busca o perfil completo do usuário (perfil + role + settings) com defaults sempre.
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

    const { data: roleData, error: roleError } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (roleError) {
      // não quebra; só loga
      console.warn('getFullUserProfile: erro ao buscar role em app_users:', roleError);
    }

    const { data: settingsData, error: settingsError } = await supabase
      .from('hero_card_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (settingsError) {
      // não quebra; defaults
      console.warn('getFullUserProfile: erro ao buscar settings:', settingsError);
    }

    const role = normalizeRole(roleData?.role);

    const profile: AppUser = {
      id: userId,
      name: userProfileData.display_name || (user.user_metadata as any)?.full_name || 'Herói',
      email: userProfileData.email || user.email || '',
      cpf: userProfileData.cpf || '',
      avatarUrl: userProfileData.avatar_url || (user.user_metadata as any)?.avatar_url || null,
      // ✅ Padroniza: preferir hero_code; fallback customer_id_public
      customerCode: userProfileData.hero_code || userProfileData.customer_id_public || '',
      role,
    };

    const settings = mapSettingsRowToSettings(settingsData);

    return { profile, settings };
  } catch (error) {
    console.error('Error in getFullUserProfile:', error);
    return null;
  }
};

/**
 * ✅ Busca apenas os dados da tabela user_profiles (resiliente a chamadas erradas)
 */
export const getUserProfileById = async (userIdOrUser: string | { id?: string } | any) => {
  const userId =
    typeof userIdOrUser === 'string'
      ? userIdOrUser
      : (userIdOrUser?.id as string | undefined);

  if (!userId) {
    console.error('getUserProfileById: userId inválido:', userIdOrUser);
    return null;
  }

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

/**
 * Atualiza o nome de exibição
 */
export const updateProfileName = async (userId: string, displayName: string) => {
  const { error } = await supabase
    .from('user_profiles')
    .update({ display_name: displayName })
    .eq('user_id', userId);

  if (error) throw error;
};

export const updateUserName = updateProfileName;

/**
 * Busca configurações do cartão
 */
export const getCardSettings = async (userId: string) => {
  const { data, error } = await supabase
    .from('hero_card_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return null;
  return data;
};

/**
 * Atualiza configurações do cartão (resiliente a variações de schema)
 */
export const updateCardSettings = async (userId: string, settings: any) => {
  const payload: any = {};

  if (settings.templateId) payload.card_template_id = settings.templateId;
  if (settings.fontFamily) payload.font_style = settings.fontFamily;
  if (settings.fontColor) payload.font_color = settings.fontColor;
  if (settings.fontSize) {
    // tenta duas colunas (se uma não existir, supabase pode avisar; não dá pra saber qual schema)
    payload.font_size = settings.fontSize;
    payload.font_size_px = settings.fontSize;
  }
  if (settings.heroTheme) payload.hero_theme = settings.heroTheme;
  if (settings.mode) {
    payload.mode = settings.mode;
    payload.theme_mode = settings.mode;
  }

  const { error } = await supabase
    .from('hero_card_settings')
    .update(payload)
    .eq('user_id', userId);

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

/**
 * Garante e retorna o código de herói (se sua RPC existir)
 * OBS: mantém assinatura para não quebrar chamadas existentes.
 */
export const ensureHeroIdentity = async (_userId?: string): Promise<string | null> => {
  const { data, error } = await supabase.rpc('ensure_hero_identity');
  if (error) {
    console.error('ensure_hero_identity error:', error);
    return null;
  }
  return data as string;
};

/**
 * Auto-cura de perfil na sessão
 * ✅ Agora faz bootstrap direto (sem RPC que está falhando).
 */
export const ensureProfileFromSession = async (user: SupabaseUser) => {
  try {
    await ensureUserBootstrap({
      userId: user.id,
      email: user.email || '',
      displayName: (user.user_metadata as any)?.full_name || 'Herói',
      avatarUrl: (user.user_metadata as any)?.avatar_url || null,
      // CPF não dá pra inventar; deixa null aqui
      cpf: null,
      birthdate: null,
      role: 'client',
    });
  } catch (e) {
    console.error('ensureProfileFromSession warning:', e);
  }
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
