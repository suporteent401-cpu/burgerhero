import { supabase } from '../lib/supabaseClient';

/**
 * Busca o voucher mais recente (do mês atual) para um usuário.
 */
export const getCurrentVoucher = async (userId: string) => {
  const { data, error } = await supabase
    .from('vouchers')
    .select(`
      *,
      monthly_drop:monthly_drops (
        *,
        burger:burgers(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Erro ao buscar voucher atual:', error);
    // Não lançar erro se for 'PGRST116' (nenhuma linha encontrada), apenas retornar null.
    if (error.code !== 'PGRST116') {
      throw error;
    }
  }
  return data;
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
  return data;
};