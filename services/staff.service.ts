// services/staff.service.ts
import { supabase } from '../lib/supabaseClient';

export interface StaffLookupResult {
  user_id: string;
  display_name: string;
  cpf: string | null;
  avatar_url: string | null;
  hero_code: string;
  subscription_active: boolean;
  has_current_voucher: boolean;
  card_image_url?: string; // imagem de capa do cartão (preview do template)
}

export interface RedeemResult {
  ok: boolean;
  message: string;
  voucher_id?: string | null;
}

export const staffService = {
  /**
   * Busca um cliente por Hero Code (BH-XXXX) ou CPF (apenas números).
   * Enriquece o resultado com a imagem do template do cartão.
   *
   * Regras de segurança:
   * - Não quebra a tela se falhar o carregamento visual (template).
   * - Não oculta nada: se não achar template, segue sem card_image_url.
   */
  async lookupClient(query: string): Promise<StaffLookupResult | null> {
    const { data, error } = await supabase.rpc('staff_lookup_client', {
      p_query: query,
    });

    if (error) {
      console.error('Erro no lookup do cliente:', error);
      throw error;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;

    const client: StaffLookupResult = {
      user_id: row.user_id,
      display_name: row.display_name,
      cpf: row.cpf ?? null,
      avatar_url: row.avatar_url ?? null,
      hero_code: row.hero_code,
      subscription_active: Boolean(row.subscription_active),
      has_current_voucher: Boolean(row.has_current_voucher),
      card_image_url: undefined,
    };

    // Busca dados visuais (Template do cartão) — não pode derrubar fluxo
    try {
      const { data: settings, error: settingsError } = await supabase
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

      if (!settingsError && settings?.template) {
        const templateData = settings.template as any;
        const imageUrl =
          (Array.isArray(templateData) ? templateData?.[0]?.preview_url : templateData?.preview_url) || null;

        if (imageUrl) client.card_image_url = imageUrl;
      }
    } catch (err) {
      console.warn('Não foi possível carregar a imagem do cartão do cliente:', err);
    }

    return client;
  },

  /**
   * Tenta resgatar o voucher do mês atual para o cliente informado via código.
   *
   * IMPORTANTÍSSIMO:
   * - Chamamos a NOVA RPC: redeem_voucher_staff (não mexe na antiga redeem_voucher_by_code)
   * - A RPC retorna TABLE => vem como array.
   * - Mantemos a assinatura do retorno para não quebrar o StaffValidate.tsx
   */
  async redeemVoucherByCode(code: string): Promise<RedeemResult> {
    const { data, error } = await supabase.rpc('redeem_voucher_staff', {
      p_code: code,
    });

    if (error) {
      console.error('Erro na validação do voucher (staff):', error);
      return { ok: false, message: error.message, voucher_id: null };
    }

    const row = Array.isArray(data) ? data[0] : data;

    return {
      ok: Boolean(row?.ok),
      message: row?.message ?? 'unknown_error',
      voucher_id: row?.voucher_id ?? null,
    };
  },
};
