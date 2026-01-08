import { supabase } from '../lib/supabaseClient';

export type VoucherStatus = 'available' | 'redeemed' | 'expired' | null;

export interface StaffLookupResult {
  user_id: string;
  display_name: string;
  cpf: string | null;
  avatar_url: string | null;
  hero_code: string;
  subscription_active: boolean;

  // Compatibilidade (continua existindo)
  has_current_voucher: boolean;

  // Novo: status real do voucher do mês
  voucher_status: VoucherStatus;
  current_voucher_id: string | null;

  // Visual
  card_image_url?: string;
}

export interface RedeemResult {
  ok: boolean;
  message: string;
  voucher_id?: string | null;
  user_id?: string | null;
}

export const staffService = {
  /**
   * Busca um cliente por Hero Code (BH-XXXX) ou CPF (apenas números).
   * Enriquecido com template do cartão (se existir).
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

    // Busca visual (template do cartão) sem travar o fluxo
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
   * Tenta resgatar o voucher do mês atual para o cliente informado via HERO CODE.
   */
  async redeemVoucherByCode(code: string): Promise<RedeemResult> {
    const { data, error } = await supabase.rpc('redeem_voucher_by_code', {
      p_code: code
    });

    if (error) {
      console.error('Erro na redenção do voucher:', error);
      return { ok: false, message: error.message };
    }

    // Algumas RPCs retornam array
    const payload = Array.isArray(data) ? data[0] : data;
    return payload as RedeemResult;
  }
};
