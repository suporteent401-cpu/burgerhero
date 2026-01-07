import { supabase } from '../lib/supabaseClient';
import type { Subscription, MonthlyBenefit } from '../types';

/**
 * Busca o status da assinatura de um usuário.
 * Retorna null se ainda não existir assinatura.
 */
export const getSubscriptionStatus = async (userId: string): Promise<Subscription | null> => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, current_period_start, current_period_end')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar assinatura:', error);
    return null; // não derruba a tela
  }

  if (!data) return null;

  return {
    status: (data.status as any) || 'canceled',
    currentPeriodStart: data.current_period_start || null,
    currentPeriodEnd: data.current_period_end || null,
  };
};

/**
 * Busca o benefício mensal (voucher) de um usuário para um mês específico.
 * Por enquanto retorna null sem quebrar fluxo.
 */
export const getMonthlyBenefit = async (userId: string, monthKey: string): Promise<MonthlyBenefit | null> => {
  // Quando você tiver tabela de vouchers/benefits, a gente implementa aqui.
  // Mantém estável por agora:
  console.log('Buscando benefício para:', userId, monthKey);
  return null;
};
