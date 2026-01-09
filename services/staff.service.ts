import { supabase } from '../lib/supabaseClient';

export type StaffLookupResult = {
  user_id: string;
  display_name: string;
  email: string;
  cpf: string | null;
  hero_code: string | null;
  avatar_url: string | null;

  // capa do cartão (mesma do perfil)
  card_image_url: string | null;

  // assinatura
  subscription_active: boolean;
  subscription_status: string | null;
  next_billing_date: string | null;

  // voucher do mês
  has_current_voucher: boolean;
  voucher_status: string | null; // available | redeemed | none | blocked | ...
};

export type RedeemResult = {
  ok: boolean;
  message: string;
  user_id: string | null;
  voucher_id: string | null;
  status: string | null;
};

export const staffService = {
  async lookupClient(query: string): Promise<StaffLookupResult | null> {
    const q = String(query || '').trim();
    if (!q) return null;

    const { data, error } = await supabase.rpc('staff_lookup_client', { p_query: q });

    if (error) {
      console.error('RPC staff_lookup_client error:', error);
      return null;
    }

    if (Array.isArray(data) && data.length > 0) return data[0] as StaffLookupResult;
    if (data && !Array.isArray(data)) return data as StaffLookupResult;

    return null;
  },

  async redeemVoucherByCode(heroCode: string, restaurantId?: string): Promise<RedeemResult> {
    const code = String(heroCode || '').trim();
    if (!code) {
      return { ok: false, message: 'missing_code', user_id: null, voucher_id: null, status: null };
    }

    const { data, error } = await supabase.rpc('redeem_voucher', {
      p_hero_code: code,
      p_restaurant_id: restaurantId || null,
    });

    if (error) {
      console.error('RPC redeem_voucher error:', error);
      return {
        ok: false,
        message: error.message || 'Erro de comunicação',
        user_id: null,
        voucher_id: null,
        status: null,
      };
    }

    const row = Array.isArray(data) ? (data[0] as any) : (data as any);
    return {
      ok: Boolean(row?.ok),
      message: String(row?.message || 'unknown'),
      user_id: row?.user_id ?? null,
      voucher_id: row?.voucher_id ?? null,
      status: row?.status ?? null,
    };
  },
};
