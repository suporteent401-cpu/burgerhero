import { supabase } from '../lib/supabaseClient';

export interface StaffLookupResult {
  user_id: string;
  display_name: string;
  cpf: string | null;
  avatar_url: string | null;
  hero_code: string;

  subscription_active: boolean;

  // compat
  has_current_voucher: boolean;

  voucher_status?: 'available' | 'redeemed' | 'expired' | 'blocked' | string | null;
  current_voucher_id?: string | null;
  redeemed_at?: string | null;

  card_image_url?: string;
}

export interface RedeemResult {
  ok: boolean;
  message: string;
  voucher_id?: string | null;
}

function isAuthTokenProblem(msg: string) {
  const m = (msg || '').toLowerCase();
  return (
    m.includes('invalid refresh token') ||
    m.includes('refresh token not found') ||
    m.includes('jwt') ||
    m.includes('not authenticated') ||
    m.includes('missing authorization')
  );
}

export const staffService = {
  async lookupClient(query: string): Promise<StaffLookupResult | null> {
    // Checa sessão antes (evita 400 maluco)
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      // força um erro “semântico” que a tela entende
      throw new Error('SESSION_EXPIRED');
    }

    const { data, error } = await supabase.rpc('staff_lookup_client', {
      p_query: query,
    });

    if (error) {
      console.error('RPC staff_lookup_client error:', error);

      // Se for token quebrado, manda a tela relogar
      if (isAuthTokenProblem(error.message)) {
        throw new Error('SESSION_EXPIRED');
      }

      // Qualquer outro erro real
      throw new Error(error.message || 'RPC_FAILED');
    }

    if (!Array.isArray(data) || data.length === 0) return null;

    const client = data[0] as StaffLookupResult;

    // Enriquecimento visual (não quebra fluxo)
    try {
      const { data: settings } = await supabase
        .from('hero_card_settings')
        .select(
          `
          card_template_id,
          template:hero_card_templates (
            preview_url
          )
        `
        )
        .eq('user_id', client.user_id)
        .maybeSingle();

      const templateData = (settings as any)?.template;
      const imageUrl = templateData?.preview_url || null;
      if (imageUrl) client.card_image_url = imageUrl;
    } catch (err) {
      console.warn('Card template preview não carregou (ok ignorar):', err);
    }

    return client;
  },

  async redeemVoucherByCode(code: string): Promise<RedeemResult> {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      return { ok: false, message: 'session_expired' };
    }

    const { data, error } = await supabase.rpc('redeem_voucher_by_code', {
      p_code: code,
    });

    if (error) {
      console.error('RPC redeem_voucher_by_code error:', error);
      if (isAuthTokenProblem(error.message)) {
        return { ok: false, message: 'session_expired' };
      }
      return { ok: false, message: error.message };
    }

    return data as RedeemResult;
  },
};
