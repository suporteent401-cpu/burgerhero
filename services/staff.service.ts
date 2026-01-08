import { supabase } from '../lib/supabaseClient';

export interface StaffLookupResult {
  user_id: string;
  display_name: string;
  cpf: string | null;
  avatar_url: string | null;
  hero_code: string;
  subscription_active: boolean;
  has_current_voucher: boolean;
  card_image_url?: string; // Novo campo para a imagem de capa
}

export interface RedeemResult {
  ok: boolean;
  message: string;
  voucher_id?: string;
}

export const staffService = {
  /**
   * Busca um cliente por Hero Code (BH-XXXX) ou CPF (apenas números).
   * Agora enriquece o resultado com a imagem do template do cartão.
   */
  async lookupClient(query: string): Promise<StaffLookupResult | null> {
    // 1. Busca dados funcionais via RPC
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

    // 2. Busca dados visuais (Template do cartão)
    try {
      const { data: settings } = await supabase
        .from('hero_card_settings')
        .select(`
          card_template_id,
          template:hero_card_templates (
            preview_url
          )
        `)
        .eq('user_id', client.user_id)
        .maybeSingle();

      // Extrai a URL se existir (Supabase retorna joined tables como objeto ou array)
      const templateData = settings?.template as any;
      const imageUrl = templateData?.preview_url || null;

      if (imageUrl) {
        client.card_image_url = imageUrl;
      }
    } catch (err) {
      console.warn('Não foi possível carregar a imagem do cartão do cliente:', err);
      // Não falha o fluxo principal, apenas fica sem a imagem customizada
    }

    return client;
  },

  /**
   * Tenta resgatar o voucher do mês atual para o cliente informado via código.
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