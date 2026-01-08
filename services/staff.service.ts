import { supabase } from '../lib/supabaseClient';

export interface StaffLookupResult {
  user_id: string;
  display_name: string;
  cpf: string | null;
  avatar_url: string | null;
  hero_code: string;
  subscription_active: boolean;
  has_current_voucher: boolean;
}

export interface RedeemResult {
  ok: boolean;
  message: string;
  voucher_id?: string;
}

export const staffService = {
  /**
   * Busca um cliente por Hero Code (BH-XXXX) ou CPF (apenas números).
   */
  async lookupClient(query: string): Promise<StaffLookupResult | null> {
    const { data, error } = await supabase.rpc('staff_lookup_client', {
      p_query: query
    });

    if (error) {
      console.error('Erro no lookup do cliente:', error);
      throw error;
    }

    // A RPC retorna uma tabela, mas como limitamos a 1 no SQL, pegamos o primeiro (se houver)
    if (Array.isArray(data) && data.length > 0) {
      return data[0] as StaffLookupResult;
    }
    
    return null;
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

    // O retorno é um JSON direto
    return data as RedeemResult;
  }
};