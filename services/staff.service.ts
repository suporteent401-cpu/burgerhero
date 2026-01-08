import { supabase } from '../lib/supabaseClient';

export interface StaffLookupResult {
  user_id: string;
  display_name: string;
  cpf: string | null;
  avatar_url: string | null;
  hero_code: string;
  subscription_active: boolean;
  has_current_voucher: boolean;
  card_image_url?: string;
}

export interface RedeemResult {
  ok: boolean;
  message: string;
  voucher_id?: string | null;
}

function normalizeRpcResult(data: any): RedeemResult {
  // algumas RPCs retornam array
  if (Array.isArray(data)) {
    const row = data[0] ?? null;
    if (!row) return { ok: false, message: 'empty_result', voucher_id: null };
    return {
      ok: !!row.ok,
      message: String(row.message ?? ''),
      voucher_id: row.voucher_id ?? null,
    };
  }

  // outras retornam objeto direto
  if (data && typeof data === 'object') {
    return {
      ok: !!data.ok,
      message: String(data.message ?? ''),
      voucher_id: data.voucher_id ?? null,
    };
  }

  return { ok: false, message: 'invalid_result', voucher_id: null };
}

export const staffService = {
  /**
   * Busca um cliente por Hero Code (BH-XXXX) ou CPF.
   * Enriquecido com imagem do template do cartão.
   */
  async lookupClient(query: string): Promise<StaffLookupResult | null> {
    const { data, error } = await supabase.rpc('staff_lookup_client', { p_query: query });

    if (error) {
      console.error('Erro no lookup do cliente:', error);
      throw error;
    }

    if (!Array.isArray(data) || data.length === 0) return null;

    const client = data[0] as StaffLookupResult;

    // Imagem do template (não quebra o fluxo se falhar)
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

      const templateData = (settings?.template as any) ?? null;
      const imageUrl = templateData?.preview_url || null;

      if (imageUrl) client.card_image_url = imageUrl;
    } catch (err) {
      console.warn('Não foi possível carregar a imagem do cartão do cliente:', err);
    }

    return client;
  },

  /**
   * Resgata voucher pelo código (hero_code ou qr_token dependendo da RPC).
   * Estratégia segura: tenta a RPC principal e faz fallback para a alternativa.
   */
  async redeemVoucherByCode(code: string): Promise<RedeemResult> {
    // 1) Tenta redeem_voucher_by_code
    const { data: d1, error: e1 } = await supabase.rpc('redeem_voucher_by_code', { p_code: code });

    if (!e1) return normalizeRpcResult(d1);

    console.warn('redeem_voucher_by_code falhou, tentando fallback:', e1);

    // 2) Fallback: redeem_voucher_staff
    const { data: d2, error: e2 } = await supabase.rpc('redeem_voucher_staff', { p_code: code });

    if (!e2) return normalizeRpcResult(d2);

    console.error('Falha nas duas RPCs de resgate:', { e1, e2 });
    return { ok: false, message: e2.message || e1.message, voucher_id: null };
  },
};
