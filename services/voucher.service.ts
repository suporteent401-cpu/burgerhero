import { supabase } from '../lib/supabaseClient';

/**
 * VoucherService
 *
 * Problema recorrente no PostgREST/Supabase:
 * filtrar por campo de tabela “embutida” usando alias (ex: monthly_drop.month_date)
 * pode falhar silenciosamente e retornar null.
 *
 * Estratégia segura:
 * 1) Buscar o drop do mês atual pela tabela monthly_drops (month_date = 1º dia do mês)
 * 2) Com o monthly_drop.id, buscar o voucher do usuário em vouchers (monthly_drop_id)
 * 3) Se não existir, tenta (opcional) chamar uma RPC "ensure_current_voucher"
 *    — caso você crie essa função no banco.
 */

const getCurrentMonthDate = () => {
  const now = new Date();
  // usa UTC para evitar edge-case de fuso no dia 1
  const monthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  return monthDate.toISOString().slice(0, 10); // YYYY-MM-DD
};

const getCurrentMonthlyDrop = async () => {
  const monthDate = getCurrentMonthDate();

  const { data, error } = await supabase
    .from('monthly_drops')
    .select(
      `
      *,
      burger:burgers(*)
    `
    )
    .eq('month_date', monthDate)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[VoucherService] Erro ao buscar monthly_drop do mês:', error);
    return null;
  }

  return data ?? null;
};

/**
 * Tenta garantir (criar) voucher do mês para o usuário via RPC.
 * - Se a RPC não existir, falha silenciosamente (não quebra a página).
 */
const tryEnsureCurrentVoucher = async (userId: string) => {
  try {
    // RPC sugerida (você cria via SQL): ensure_current_voucher(p_user_id uuid)
    await supabase.rpc('ensure_current_voucher', { p_user_id: userId });
  } catch (e) {
    // não faz throw: o app continua funcionando e só exibirá "Aguardando liberação"
    console.warn('[VoucherService] ensure_current_voucher indisponível ou falhou (ok):', e);
  }
};

/**
 * Busca o voucher do mês atual para um usuário.
 */
export const getCurrentVoucher = async (userId: string) => {
  if (!userId) return null;

  const drop = await getCurrentMonthlyDrop();
  if (!drop?.id) return null;

  const fetchVoucher = async () => {
    const { data, error } = await supabase
      .from('vouchers')
      .select(
        `
        *,
        monthly_drop:monthly_drops(
          *,
          burger:burgers(*)
        ),
        voucher_redemptions:voucher_redemptions(*)
      `
      )
      .eq('user_id', userId)
      .eq('monthly_drop_id', drop.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[VoucherService] Erro ao buscar voucher atual:', error);
      return null;
    }
    return data ?? null;
  };

  // 1) tenta pegar o voucher
  let voucher = await fetchVoucher();
  if (voucher) return voucher;

  // 2) se não existe, tenta criar via RPC (se houver)
  await tryEnsureCurrentVoucher(userId);

  // 3) refaz a busca (mesmo se a RPC não existir, isso não quebra)
  voucher = await fetchVoucher();
  return voucher;
};

/**
 * Histórico completo de vouchers (todos os meses)
 */
export const getVoucherHistory = async (userId: string) => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('vouchers')
    .select(
      `
      *,
      monthly_drop:monthly_drops(
        *,
        burger:burgers(*)
      ),
      voucher_redemptions:voucher_redemptions(*)
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[VoucherService] Erro ao buscar histórico de vouchers:', error);
    return [];
  }

  return data || [];
};
