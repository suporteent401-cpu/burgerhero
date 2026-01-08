import { supabase } from '../lib/supabaseClient';

export type VoucherStatus = 'available' | 'redeemed' | 'not_issued' | 'no_drop' | string;

export interface StaffLookupResult {
  user_id: string;
  display_name: string;
  cpf: string | null;
  avatar_url: string | null;
  hero_code: string;

  subscription_active: boolean;

  // Mantido pra não quebrar UI antiga
  has_current_voucher: boolean;

  // Novo (fonte da verdade)
  voucher_status: VoucherStatus;
  current_voucher_id: string | null;
  redeemed_at: string | null;

  card_image_url?: string;
}

export interface RedeemResult {
  ok: boolean;
  message: string;
  voucher_id?: string | null;
}

export const staffService = {
  async lookupClient(query: string): Promise<StaffLookupResult | null> {
    const { data, error } = await supabase.rpc('staff_lookup_client', {
      p_query: query,
    });

    if (error) {
      console.error('Erro no lookup do cliente:', error);
      throw error;
    }

    // Supabase RPC costuma retornar array
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;

    const client = row as StaffLookupResult;

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

      const templateData = (settings?.template as any) || null;
      const imageUrl = templateData?.preview_url || null;

      if (imageUrl) client.card_image_url = imageUrl;
    } catch (err) {
      console.warn('Não foi possível carregar a imagem do cartão do cliente:', err);
    }

    return client;
  },

  async redeemVoucherByCode(code: string): Promise<RedeemResult> {
    const { data, error } = await supabase.rpc('redeem_voucher_by_code', {
      p_code: code,
    });

    if (error) {
      console.error('Erro na redenção do voucher:', error);
      return { ok: false, message: error.message, voucher_id: null };
    }

    return data as RedeemResult;
  },
};
