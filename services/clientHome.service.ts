import { supabase } from '../lib/supabaseClient';

/**
 * Busca o status da assinatura de um usuário.
 */
export const getSubscriptionStatus = async (userId: string) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Erro ao buscar assinatura:', error);
    throw error;
  }
  return data;
};

/**
 * Busca o benefício mensal (voucher) de um usuário para um mês específico.
 */
export const getMonthlyBenefit = async (userId: string, monthKey: string) => {
  // Esta função pode ser mais complexa, buscando o drop do mês e o voucher do usuário.
  // Por enquanto, é um placeholder.
  console.log('Buscando benefício para:', userId, monthKey);
  return null; 
};