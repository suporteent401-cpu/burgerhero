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

export const staffService = {
  /**
   * Busca um cliente pelo Hero Code ou CPF para o Staff.
   */
  async lookupClient(query: string): Promise<StaffLookupResult | null> {
    const { data, error } = await supabase.rpc('staff_lookup_client', {
      p_query: query
    });

    if (error) {
      console.error('[staffService] lookupClient error:', error);
      return null;
    }

    if (!data || data.length === 0) return null;

    const result = data[0];

    // Busca o template do cartão para exibir no preview do staff
    const { data: settings } = await supabase
      .from('hero_card_settings')
      .select('card_template_id, hero_card_templates(preview_url)')
      .eq('user_id', result.user_id)
      .maybeSingle();

    return {
      ...result,
      card_image_url: (settings as any)?.hero_card_templates?.preview_url || null
    };
  },

  /**
   * Realiza o resgate do voucher do mês atual.
   */
  async redeemVoucherByCode(code: string): Promise<{ ok: boolean; message: string; voucher_id?: string }> {
    const { data, error } = await supabase.rpc('redeem_voucher_staff', {
      p_code: code
    });

    if (error) {
      console.error('[staffService] redeemVoucherByCode error:', error);
      return { ok: false, message: 'Erro ao processar resgate no servidor.' };
    }

    const result = data[0];
    return {
      ok: result.ok,
      message: result.message,
      voucher_id: result.voucher_id
    };
  }
};