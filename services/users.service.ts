import { supabase } from '@/lib/supabaseClient';

/**
 * Tipos básicos
 */
export interface UserProfile {
  user_id: string;
  display_name: string | null;
  email: string | null;
  cpf: string | null;
  hero_code: string | null;
  customer_id_public: string | null;
  avatar_url: string | null;
  role?: string | null;
  settings?: UserSettings;
}

export interface UserSettings {
  heroTheme: string;
  cardTemplateId: string | null;
  fontStyle: string;
  fontColor: string;
  fontSize: number;
  mode: 'light' | 'dark';
}

/**
 * SETTINGS PADRÃO (NUNCA QUEBRA LOGIN)
 */
const DEFAULT_SETTINGS: UserSettings = {
  heroTheme: 'default',
  cardTemplateId: null,
  fontStyle: 'inter',
  fontColor: '#ffffff',
  fontSize: 14,
  mode: 'dark',
};

/**
 * 🔐 GET USER PROFILE BY ID (SAFE)
 * - NÃO usa .single()
 * - SEMPRE retorna settings válidos
 */
export async function getUserProfileById(
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .limit(1);

  if (error) {
    console.error('[getUserProfileById] error:', error);
    return null;
  }

  const profile = data?.[0];
  if (!profile) return null;

  return {
    ...profile,
    settings: {
      heroTheme: profile.settings?.heroTheme ?? DEFAULT_SETTINGS.heroTheme,
      cardTemplateId:
        profile.settings?.cardTemplateId ?? DEFAULT_SETTINGS.cardTemplateId,
      fontStyle: profile.settings?.fontStyle ?? DEFAULT_SETTINGS.fontStyle,
      fontColor: profile.settings?.fontColor ?? DEFAULT_SETTINGS.fontColor,
      fontSize: profile.settings?.fontSize ?? DEFAULT_SETTINGS.fontSize,
      mode: profile.settings?.mode ?? DEFAULT_SETTINGS.mode,
    },
  };
}

/**
 * 🔍 GET USER PROFILE FROM SESSION
 * Usado no login / bootstrap do app
 */
export async function ensureProfileFromSession(): Promise<UserProfile | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) return null;

  return getUserProfileById(session.user.id);
}

/**
 * ✏️ UPDATE DISPLAY NAME
 */
export async function updateProfileName(
  userId: string,
  displayName: string
): Promise<boolean> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ display_name: displayName })
    .eq('user_id', userId);

  if (error) {
    console.error('[updateProfileName]', error);
    return false;
  }

  return true;
}

/**
 * 🆔 CHECK CPF EXISTS
 */
export async function checkCpfExists(cpf: string): Promise<boolean> {
  const cleanCpf = cpf.replace(/\D/g, '');

  const { data, error } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('cpf', cleanCpf)
    .limit(1);

  if (error) {
    console.error('[checkCpfExists]', error);
    return false;
  }

  return !!data?.length;
}

/**
 * 🖼️ UPLOAD AVATAR + SYNC PROFILE
 */
export async function uploadAndSyncAvatar(
  userId: string,
  file: File
): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const filePath = `avatars/${userId}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error('[uploadAvatar]', uploadError);
    return null;
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  const avatarUrl = data.publicUrl;

  await supabase
    .from('user_profiles')
    .update({ avatar_url: avatarUrl })
    .eq('user_id', userId);

  return avatarUrl;
}

/**
 * 🛡️ ENSURE HERO IDENTITY (NÃO GERA NOVO CÓDIGO)
 */
export async function ensureHeroIdentity(
  userId: string
): Promise<{ hero_code: string | null; customer_id_public: string | null }> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('hero_code, customer_id_public')
    .eq('user_id', userId)
    .limit(1);

  if (error || !data?.[0]) {
    console.error('[ensureHeroIdentity]', error);
    return { hero_code: null, customer_id_public: null };
  }

  return {
    hero_code: data[0].hero_code,
    customer_id_public: data[0].customer_id_public,
  };
}

/**
 * 🎴 UPDATE CARD SETTINGS (SAFE)
 */
export async function updateCardSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<boolean> {
  const { data } = await supabase
    .from('user_profiles')
    .select('settings')
    .eq('user_id', userId)
    .limit(1);

  const currentSettings = data?.[0]?.settings ?? DEFAULT_SETTINGS;

  const newSettings = {
    ...currentSettings,
    ...settings,
  };

  const { error } = await supabase
    .from('user_profiles')
    .update({ settings: newSettings })
    .eq('user_id', userId);

  if (error) {
    console.error('[updateCardSettings]', error);
    return false;
  }

  return true;
}
