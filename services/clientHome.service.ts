// services/clientHome.service.ts
import { supabase } from '../lib/supabaseClient';

export type SubscriptionDTO =
  | {
      status: 'active' | 'inactive' | 'past_due' | 'canceled' | 'trialing' | string;
      currentPeriodStart?: string | null;
      currentPeriodEnd?: string | null;
      nextBillingAt?: string | null;
    }
  | null;

/**
 * Status de assinatura do usuário (cliente).
 * - tenta ler da tabela subscriptions por user_id
 * - retorna null se não achar
 */
export const getSubscriptionStatus = async (userId: string): Promise<SubscriptionDTO> => {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, current_period_start, current_period_end, next_billing_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[getSubscriptionStatus] error:', error);
    return null;
  }

  if (!data) return null;

  return {
    status: (data as any).status,
    currentPeriodStart: (data as any).current_period_start ?? null,
    currentPeriodEnd: (data as any).current_period_end ?? null,
    nextBillingAt: (data as any).next_billing_at ?? null,
  };
};

/**
 * ✅ EXPORT QUE ESTÁ FALTANDO NO SEU APP
 * getMonthlyBenefit(): retorna o “benefício do mês” para o cliente.
 *
 * Como você já tem tabelas monthly_drops / vouchers, o mais seguro é:
 * - buscar o drop do mês atual (o mais recente ativo)
 * - retornar algo simples que a Home consegue renderizar
 *
 * Se sua Home espera outro formato, me diz o shape que ela usa e eu ajusto.
 */
export type MonthlyBenefitDTO = {
  title: string;
  subtitle?: string;
  monthLabel?: string;
  locked?: boolean;
};

export const getMonthlyBenefit = async (): Promise<MonthlyBenefitDTO | null> => {
  try {
    // Pega o drop mais recente (ou do mês atual se você tiver campo de mês/ano)
    const { data, error } = await supabase
      .from('monthly_drops')
      .select('title, month_label, is_active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[getMonthlyBenefit] error:', error);
      return null;
    }

    if (!data) return null;

    return {
      title: (data as any).title || 'Drop Mensal',
      monthLabel: (data as any).month_label || '',
      locked: (data as any).is_active === false,
    };
  } catch (e) {
    console.error('[getMonthlyBenefit] exception:', e);
    return null;
  }
};
