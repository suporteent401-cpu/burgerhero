// services/staff.service.ts
import { supabase } from '../lib/supabaseClient';

export type StaffLookupResult = {
  user_id: string;
  display_name: string;
  email: string | null;
  cpf: string | null;
  hero_code: string;
  avatar_url: string | null;
  card_image_url: string | null;
  subscription_active: boolean;
  voucher_status: 'available' | 'redeemed' | 'none' | string;
  has_current_voucher: boolean;
  voucher_redeemed: boolean;
  month_date: string | null;
};

export type StaffRedeemResult = {
  ok: boolean;
  message:
    | 'ok'
    | 'session_expired'
    | 'not_allowed'
    | 'missing_restaurant'
    | 'missing_token'
    | 'client_not_found'
    | 'subscription_inactive'
    | 'drop_inactive'
    | 'no_voucher'
    | 'already_redeemed'
    | string;
  client_user_id: string | null;
  voucher_id: string | null;
  voucher_status: string | null;
};

const isSessionExpired = (errMsg: string) => {
  const msg = (errMsg || '').toLowerCase();
  return msg.includes('jwt') || msg.includes('expired') || msg.includes('invalid token');
};

export const staffService = {
  async lookupClient(query: string): Promise<StaffLookupResult | null> {
    const { data, error } = await supabase.rpc('staff_lookup_client', { p_query: query });

    if (error) {
      if (isSessionExpired(error.message || '')) throw new Error('SESSION_EXPIRED');
      throw error;
    }

    if (!data || (Array.isArray(data) && data.length === 0)) return null;

    // rpc returns table -> array
    const row = Array.isArray(data) ? data[0] : data;
    return row as StaffLookupResult;
  },

  /**
   * Resgata voucher do cliente pelo hero_code (painel do staff).
   * IMPORTANTe: restaurantId deve ser UUID válido. Se vier vazio, a RPC retorna missing_restaurant.
   */
  async redeemVoucherByCode(heroCode: string, restaurantId: string): Promise<StaffRedeemResult> {
    if (!heroCode || !heroCode.trim()) {
      return {
        ok: false,
        message: 'missing_token',
        client_user_id: null,
        voucher_id: null,
        voucher_status: null,
      };
    }

    if (!restaurantId || !restaurantId.trim()) {
      return {
        ok: false,
        message: 'missing_restaurant',
        client_user_id: null,
        voucher_id: null,
        voucher_status: null,
      };
    }

    const { data, error } = await supabase.rpc('staff_redeem_voucher', {
      p_qr_token: null,
      p_hero_code: heroCode,
      p_restaurant_id: restaurantId,
    });

    if (error) {
      if (isSessionExpired(error.message || '')) {
        return { ok: false, message: 'session_expired', client_user_id: null, voucher_id: null, voucher_status: null };
      }
      return { ok: false, message: error.message || 'error', client_user_id: null, voucher_id: null, voucher_status: null };
    }

    // rpc returns table -> array com 1 item
    const row: any = Array.isArray(data) ? data[0] : data;

    return {
      ok: !!row?.ok,
      message: row?.message || 'error',
      client_user_id: row?.client_user_id ?? null, // ✅ alinhado com a RPC
      voucher_id: row?.voucher_id ?? null,
      voucher_status: row?.voucher_status ?? null,
    };
  },
};
