import { supabase } from '../lib/supabaseClient';

export interface StaffLookupResult {
  user_id: string;
  display_name: string;
  cpf: string | null;
  avatar_url: string | null;
  hero_code: string;

  subscription_active: boolean;

  // continua pro botão habilitar/desabilitar
  has_current_voucher: boolean;

  // novo: status real vindo do banco
  voucher_status: string | null;
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

    // Supabase pode retornar array (set-returning) ou objeto (depende do client/config)
    const row = Array.isArray(data) ? data[0] : data;

    if (!row) return null;

    const client: StaffLookupResult = {
      user_id: row.user_id,
      display_name: row.display_name,
      cpf: row.cpf ?? null,
      avatar_url: row.avatar_url ?? null,
      hero_code: row.hero_code,

      subscription_active: !!row.subscription_active,
      has_current_voucher: !!row.has_current_voucher,

      voucher_status: row.voucher_status ?? null,
      current_voucher_id: row.current_voucher_id ?? null,
      redeemed_at: row.redeemed_at ?? null,

      card_image_url: undefined,
    };

    // Enriquecer imagem do cartão (sem quebrar o fluxo)
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
      return { ok: false, message: error.message };
    }

    return data as RedeemResult;
  },
};
