import { supabase } from '../lib/supabaseClient';

export interface StaffLookupResult {
  user_id: string;
  display_name: string;
  cpf: string | null;
  avatar_url: string | null;

  hero_code: string;
  customer_id_public: string;

  subscription_active: boolean;

  // NOVO: status real do voucher do mês
  // 'available' | 'redeemed' | null
  voucher_status: string | null;

  // Mantido por compatibilidade (true quando voucher_status === 'available')
  has_current_voucher: boolean;

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
   * Busca um cliente por:
   *  - customer_id_public (principal)
   *  - hero_code (fallback)
   *  - cpf (fallback)
   * Também tenta enriquecer com o template do cartão.
   */
  async lookupClient(query: string): Promise<StaffLookupResult | null> {
    const { data, error } = await supabase.rpc('staff_lookup_client', {
      p_query: query,
    });

    if (error) {
      console.error('Erro no lookup do cliente:', error);
      throw error;
    }

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const client = data[0] as StaffLookupResult;

    // Enriquecer com a imagem do template do cartão (não pode travar o fluxo)
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

      const templateData = (settings as any)?.template as any;
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
   * Resgata o voucher do mês atual.
   * O "code" principal deve ser customer_id_public, mas a RPC aceita hero_code/CPF também.
   */
  async redeemVoucherByCode(code: string): Promise<RedeemResult> {
    const { data, error } = await supabase.rpc('redeem_voucher_by_code', {
      p_code: code,
    });

    if (error) {
      console.error('Erro na redenção do voucher:', error);
      return { ok: false, message: error.message, voucher_id: null };
    }

    // Supabase normalmente retorna array em RPC TABLE
    if (Array.isArray(data)) {
      const row = data[0] as any;
      return {
        ok: !!row?.ok,
        message: row?.message ?? 'unknown',
        voucher_id: row?.voucher_id ?? null,
      };
    }

    // fallback se vier objeto direto
    return data as RedeemResult;
  },
};
