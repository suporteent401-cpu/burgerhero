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

// ✅ Gerador de código do herói (customer_id_public)
// 8 chars alfanumérico uppercase, ex: A7K2M9QX
const generateCustomerCode = (len = 8): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // evita 0/O/1/I (melhor leitura)
  let out = '';

  // Browser crypto (melhor)
  const hasCrypto =
    typeof window !== 'undefined' &&
    typeof window.crypto !== 'undefined' &&
    typeof window.crypto.getRandomValues === 'function';

  if (hasCrypto) {
    const buf = new Uint8Array(len);
    window.crypto.getRandomValues(buf);
    for (let i = 0; i < len; i++) out += chars[buf[i] % chars.length];
    return out;
  }

  // Fallback
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

// ✅ Garante que exista um user_profile no banco.
// Se não existir, cria com upsert e gera customer_id_public.
// Se existir sem código, complementa.
const ensureUserProfileRow = async (authUser: SupabaseUser) => {
  const userId = authUser.id;
  const email = authUser.email || '';
  const fullName =
    (authUser.user_metadata as any)?.full_name ||
    (authUser.user_metadata as any)?.name ||
    'Herói';
  const avatarUrl = (authUser.user_metadata as any)?.avatar_url || null;

  // 1) tenta ler
  const { data: existing, error: existingErr } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingErr) {
    console.warn('Aviso: erro ao buscar user_profiles (ensure).', existingErr);
    // continua mesmo assim (vai tentar upsert)
  }

  // Se existe e já tem código, só retorna
  if (existing && (existing.customer_id_public || existing.hero_code)) {
    return existing;
  }

  // 2) faz upsert (cria ou complementa)
  // Tentativas em caso de conflito de unique (se houver)
  const maxTries = 5;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxTries; attempt++) {
    const customerIdPublic = existing?.customer_id_public || generateCustomerCode(8);

    const payload: any = {
      user_id: userId,
      email,
      display_name: existing?.display_name || fullName,
      avatar_url: existing?.avatar_url || avatarUrl,
      customer_id_public: customerIdPublic,
    };

    const { error: upsertErr } = await supabase
      .from('user_profiles')
      .upsert(payload, { onConflict: 'user_id' });

    if (!upsertErr) {
      const { data: reloaded, error: reloadErr } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (reloadErr) {
        console.warn('Aviso: erro ao recarregar user_profiles após upsert.', reloadErr);
      }

      return reloaded || existing || null;
    }

    lastError = upsertErr;

    // Se for conflito (unique), tenta outro código
    // (Supabase geralmente usa code "23505" para unique_violation)
    const code = (upsertErr as any)?.code;
    if (code === '23505') continue;

    // Se for outro erro, não adianta tentar várias vezes
    break;
  }

  console.error('CRÍTICO: falha ao garantir user_profiles.', lastError);
  return existing || null;
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
  // ✅ PRIMEIRO: garante que exista user_profiles e que tenha código
  // (isso resolve: ID não aparece, QR não aparece, "identidade não encontrada")
  const ensuredProfile = await ensureUserProfileRow(authUser);

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

  // se a leitura normal falhar, usa o ensuredProfile como fallback
  const userProfileData = userProfileResponse.data || ensuredProfile;
  const settingsData = settingsResponse.data;

  const profile: AppUser = {
    id: authUser.id,
    email: authUser.email || '',
    role,

    name:
      userProfileData?.display_name ||
      (authUser.user_metadata as any)?.full_name ||
      'Herói',

    customerCode:
      userProfileData?.customer_id_public ||
      userProfileData?.hero_code ||
      '',

    avatarUrl:
      userProfileData?.avatar_url ||
      (authUser.user_metadata as any)?.avatar_url ||
      null,

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

// Função apenas de upload (retorna URL)
export const uploadAvatarFile = async (userId: string, file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
  return publicUrlData.publicUrl;
};

// ✅ Função unificada de atualização de perfil (nome + avatar)
// Agora é UPSERT (cria linha se não existir)
export const updateUserProfile = async (
  userId: string,
  updates: { display_name?: string; avatar_url?: string; cpf?: string; whatsapp?: string; birthdate?: string | null; email?: string }
) => {
  const payload: any = { user_id: userId, ...updates };

  const { error } = await supabase
    .from('user_profiles')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) throw error;
};

// Mantida para compatibilidade (mas agora usa as funções acima)
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
