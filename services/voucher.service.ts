import { supabase } from '../lib/supabaseClient';

/**
 * Busca o voucher mais recente (do mês atual) para um usuário.
 * Também traz voucher_redemptions para sabermos se foi resgatado.
 */
export const getCurrentVoucher = async (userId: string) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('vouchers')
    .select(
      `
      *,
      voucher_redemptions:voucher_redemptions (
        id,
        created_at,
        staff_user_id
      ),
      monthly_drop:monthly_drops (
        *,
        burger:burgers(*)
      )
    `
    )
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar voucher atual:', error);
    // PGRST116 = no rows
    if ((error as any).code !== 'PGRST116') throw error;
    return null;
  }

  return data ?? null;
};

/**
 * Busca o histórico de vouchers de um usuário.
 */
export const getVoucherHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar histórico de vouchers:', error);
    throw error;
  }
  return data || [];
};
