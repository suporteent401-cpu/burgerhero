import { supabase } from '../lib/supabaseClient';

export interface StaffLookupResult {
  user_id: string;
  display_name: string;
  cpf: string | null;
  avatar_url: string | null;
  hero_code: string;

  subscription_active: boolean;

  // Compatibilidade: continua existindo
  has_current_voucher: boolean;

  // Novo (mais correto)
  voucher_status?: 'available' | 'redeemed' | 'expired' | 'blocked' | string | null;
  current_voucher_id?: string | null;
  redeemed_at?: string | null;

  // Visual
  card_image_url?: string;
}

export interface RedeemResult {
  ok: boolean;
  message: string;
  voucher_id?: string | null;
}

export const staffService = {
  /**
   * Busca um cliente por código do herói (ex: BH-XXXX) OU CPF.
   * A RPC agora também aceita aliases de código sem alterar hero_code.
   */
  async lookupClient(query: string): Promise<StaffLookupResult | null> {
    const { data, error } = await supabase.rpc('staff_lookup_client', {
      p_query: query
    });

    if (error) {
      console.error('Erro no lookup do cliente:', error);
      throw error;
    }

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const client = data[0] as StaffLookupResult;

    // Enriquecimento visual (não pode quebrar o fluxo)
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

      if (imageUrl) {
        client.card_image_url = imageUrl;
      }
    } catch (err) {
      console.warn('Não foi possível carregar a imagem do cartão do cliente:', err);
    }

    return client;
  },

  /**
   * Resgata o voucher do mês atual pelo código do herói.
   * (Mantém compatível com seu fluxo atual)
   */
  async redeemVoucherByCode(code: string): Promise<RedeemResult> {
    const { data, error } = await supabase.rpc('redeem_voucher_by_code', {
      p_code: code
    });

    if (error) {
      console.error('Erro na redenção do voucher:', error);
      return { ok: false, message: error.message };
    }

    return data as RedeemResult;
  }
};
