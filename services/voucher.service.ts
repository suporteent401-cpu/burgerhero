import { supabase } from '../lib/supabaseClient';

/**
 * Mês atual em formato date (primeiro dia do mês)
 * Ex: 2026-01-01
 */
const getCurrentMonthDate = () => {
  const now = new Date();
  const monthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  // month_date é "date" no banco, então usamos YYYY-MM-DD
  return monthDate.toISOString().slice(0, 10);
};

/**
 * Busca o voucher do mês atual para um usuário.
 * Regra correta: pelo month_date do monthly_drop (não por created_at do voucher).
 */
export const getCurrentVoucher = async (userId: string) => {
  const monthDate = getCurrentMonthDate();

  const { data, error } = await supabase
    .from('vouchers')
    .select(
      `
      *,
      monthly_drop:monthly_drops (
        *,
        burger:burgers(*)
      ),
      voucher_redemptions:voucher_redemptions(*)
    `
    )
    .eq('user_id', userId)
    .eq('monthly_drop.month_date', monthDate)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar voucher atual:', error);
    if ((error as any).code !== 'PGRST116') {
      throw error;
    }
  }

  return data ?? null;
};

/**
 * Histórico completo de vouchers (todos os meses)
 */
export const getVoucherHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('vouchers')
    .select(
      `
      *,
      monthly_drop:monthly_drops(*),
      voucher_redemptions:voucher_redemptions(*)
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar histórico de vouchers:', error);
    throw error;
  }

  return data || [];
};
