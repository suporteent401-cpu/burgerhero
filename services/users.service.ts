import { supabase } from '@/lib/supabaseClient';

/* ======================================================
 * TIPOS
 * ====================================================== */

export interface UserSettings {
  heroTheme: string;
  cardTemplateId: string | null;
  fontStyle: string;
  fontColor: string;
  fontSize: number;
  mode: 'light' | 'dark';
}

export interface UserProfile {
  user_id: string;
  display_name: string | null;
  email: string | null;
  cpf: string | null;
  hero_code: string | null;
  customer_id_public: string | null;
  avatar_url: string | null;
  role?: string | null;
  settings: UserSettings;
}

/* ======================================================
 * DEFAULT SETTINGS (BLINDAGEM TOTAL)
 * ====================================================== */

const DEFAULT_SETTINGS: UserSettings = {
  heroTheme: 'default',
  cardTemplateId: null,
  fontStyle: 'inter',
  fontColor: '#ffffff',
  fontSize: 14,
  mode: 'dark',
};

/* ======================================================
 * HELPER INTERNO
 * ====================================================== */

function withSafeSettings(profile: any): UserProfile {
  return {
    ...profile,
    settings: {
      heroTheme: profile?.settings?.heroTheme ?? DEFAULT_SETTINGS.heroTheme,
      cardTemplateId:
        profile?.settings?.cardTemplateId ?? DEFAULT_SETTINGS.cardTemplateId,
      fontStyle: profile?.settings?.fontStyle ?? DEFAULT_SETTINGS.fontStyle,
      fontColor: profile?.settings?.fontColor ?? DEFAULT_SETTINGS.fontColor,
      fontSize: profile?.settings?.fontSize ?? DEFAULT_SETTINGS.fontSize,
      mode: profile?.settings?.mode ?? DEFAULT_SETTINGS.mode,
    },
  };
}

/* ======================================================
 * PERFIL POR ID
 * ====================================================== */

export async function getUserProfileById(
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .limit(1);

  if (error || !data?.length) {
    console.error('[getUserProfileById]', error);
    return null;
  }

  return withSafeSettings(data[0]);
}

/* ======================================================
 * PERFIL COMPLETO (USADO NO AUTH)
 * ====================================================== */

export async function getFullUserProfile(
  userId: string
): Promise<UserProfile | null> {
  return getUserProfileById(userId);
}

/* ======================================================
 * PERFIL VIA SESSÃO (LOGIN)
 * ====================================================== */

export async function ensureProfileFromSession(): Promise<UserProfile | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) return null;

  return getFullUserProfile(session.user.id);
}

/* ======================================================
 * PERFIL PÚBLICO POR CÓDIGO (🔥 EXPORT FALTANTE)
 * ====================================================== */

export async function getPublicProfileByCode(
  code: string
): Promise<UserProfile | null> {
  const normalized = code.trim().toUpperCase();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .or(
      `hero_code.eq.${normalized},customer_id_public.eq.${normalized}`
    )
    .limit(1);

  if (error || !data?.length) {
    console.error('[getPublicProfileByCode]', error);
    return null;
  }

  return withSafeSettings(data[0]);
}

/* ======================================================
 * UPDATE NOME
 * ====================================================== */

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

/* ======================================================
 * CHECK CPF
 * ====================================================== */

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

/* ======================================================
 * AVATAR
 * ====================================================== */

export async function uploadAndSyncAvatar(
  userId: string,
  file: File
): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const path = `avatars/${userId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });

  if (uploadError) {
    console.error('[uploadAvatar]', uploadError);
    return null;
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const avatarUrl = data.publicUrl;

  await supabase
    .from('user_profiles')
    .update({ avatar_url: avatarUrl })
    .eq('user_id', userId);

  return avatarUrl;
}

/* ======================================================
 * HERO IDENTITY (SEM GERAR NOVO CÓDIGO)
 * ====================================================== */

export async function ensureHeroIdentity(userId: string): Promise<{
  hero_code: string | null;
  customer_id_public: string | null;
}> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('hero_code, customer_id_public')
    .eq('user_id', userId)
    .limit(1);

  if (error || !data?.length) {
    console.error('[ensureHeroIdentity]', error);
    return { hero_code: null, customer_id_public: null };
  }

  return {
    hero_code: data[0].hero_code,
    customer_id_public: data[0].customer_id_public,
  };
}

/* ======================================================
 * CARD SETTINGS
 * ====================================================== */

export async function updateCardSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<boolean> {
  const { data } = await supabase
    .from('user_profiles')
    .select('settings')
    .eq('user_id', userId)
    .limit(1);

  const current = data?.[0]?.settings ?? DEFAULT_SETTINGS;
  const merged = { ...current, ...settings };

  const { error } = await supabase
    .from('user_profiles')
    .update({ settings: merged })
    .eq('user_id', userId);

  if (error) {
    console.error('[updateCardSettings]', error);
    return false;
  }

  return true;
}
