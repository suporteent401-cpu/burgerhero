// services/users.service.ts
import { supabase } from '../lib/supabaseClient'

/* ============================
   Tipos
============================ */

export interface UserProfile {
  id: string
  display_name: string | null
  email: string | null
  cpf: string | null
  hero_code: string | null
  avatar_url: string | null
  role: 'admin' | 'staff' | 'client'
  hero_theme: string
}

/* ============================
   Defaults (ANTI-CRASH)
============================ */

const DEFAULT_HERO_THEME = 'classic'

function normalizeProfile(row: any): UserProfile {
  return {
    id: row.id,
    display_name: row.display_name ?? '',
    email: row.email ?? '',
    cpf: row.cpf ?? null,
    hero_code: row.hero_code ?? null,
    avatar_url: row.avatar_url ?? null,
    role: row.role ?? 'client',
    hero_theme: row.hero_theme ?? DEFAULT_HERO_THEME
  }
}

/* ============================
   Core getters
============================ */

export async function getUserProfileById(userId: string): Promise<UserProfile | null> {
  if (!userId || typeof userId !== 'string') {
    console.warn('[getUserProfileById] invalid userId:', userId)
    return null
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    console.error('[getUserProfileById]', error)
    return null
  }

  return normalizeProfile(data)
}

/**
 * USADO NO LOGIN
 * → SEMPRE retorna UM perfil ou null
 */
export async function getFullUserProfile(userId: string): Promise<UserProfile | null> {
  return getUserProfileById(userId)
}

/**
 * PERFIL PÚBLICO PELO CÓDIGO DO HERÓI
 */
export async function getPublicProfileByCode(heroCode: string): Promise<UserProfile | null> {
  if (!heroCode) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('hero_code', heroCode)
    .maybeSingle()

  if (error || !data) {
    console.error('[getPublicProfileByCode]', error)
    return null
  }

  return normalizeProfile(data)
}

/* ============================
   Utilidades usadas no app
============================ */

export async function updateProfileName(userId: string, displayName: string) {
  return supabase
    .from('user_profiles')
    .update({ display_name: displayName })
    .eq('id', userId)
}

export async function updateCardSettings(
  userId: string,
  settings: { hero_theme?: string }
) {
  return supabase
    .from('user_profiles')
    .update({
      hero_theme: settings.hero_theme ?? DEFAULT_HERO_THEME
    })
    .eq('id', userId)
}

/**
 * BOOTSTRAP SEGURO
 * NÃO referencia colunas inexistentes
 */
export async function ensureProfileFromSession(sessionUser: any) {
  if (!sessionUser?.id) return null

  const existing = await getUserProfileById(sessionUser.id)
  if (existing) return existing

  const insert = {
    id: sessionUser.id,
    email: sessionUser.email,
    display_name: sessionUser.user_metadata?.name ?? '',
    role: 'client',
    hero_theme: DEFAULT_HERO_THEME
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .insert(insert)
    .select()
    .single()

  if (error) {
    console.error('[ensureProfileFromSession]', error)
    return null
  }

  return normalizeProfile(data)
}
