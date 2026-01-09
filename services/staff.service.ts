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

export const staffService = {
  async lookupClient(query: string): Promise<StaffLookupResult | null> {
    const { data, error } = await supabase.rpc('staff_lookup_client', { p_query: query });

    if (error) {
      // padroniza mensagens comuns
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('jwt') || msg.includes('expired')) throw new Error('SESSION_EXPIRED');
      throw error;
    }

    if (!data || data.length === 0) return null;
    return data[0] as StaffLookupResult;
  },

  async redeemVoucherByCode(heroCode: string, restaurantId?: string) {
    const { data, error } = await supabase.rpc('staff_redeem_voucher', {
      p_qr_token: null,
      p_hero_code: heroCode,
      p_restaurant_id: restaurantId ?? null,
    });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('jwt') || msg.includes('expired')) return { ok: false, message: 'session_expired' };
      return { ok: false, message: error.message || 'error' };
    }

    // rpc returns table -> array com 1 item
    const row = Array.isArray(data) ? data[0] : data;

    return {
      ok: !!row?.ok,
      message: row?.message || 'error',
      client_id: row?.client_id || null,
      voucher_id: row?.voucher_id || null,
      voucher_status: row?.voucher_status || null,
    };
  },
};
