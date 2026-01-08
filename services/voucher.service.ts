import { supabase } from '../lib/supabaseClient';

/**
 * Helpers: range do mês atual (início inclusive, próximo mês exclusive)
 */
const getMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
  };
};

/**
 * Busca o voucher do mês atual para um usuário.
 * (agora realmente filtra pelo mês atual)
 */
export const getCurrentVoucher = async (userId: string) => {
  const { startISO, endISO } = getMonthRange();

  const { data, error } = await supabase
    .from('vouchers')
    .select(
      `
      *,
      monthly_drop:monthly_drops (
        *,
        burger:burgers(*)
      )
    `
    )
    .eq('user_id', userId)
    // ✅ FILTRO DO MÊS ATUAL
    .gte('created_at', startISO)
    .lt('created_at', endISO)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar voucher atual:', error);
    // Não lançar erro se for "nenhuma linha"
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
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar histórico de vouchers:', error);
    throw error;
  }

  return data || [];
};
