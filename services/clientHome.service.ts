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
 * - Lê da tabela subscriptions por user_id
 * - Retorna null se não achar
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

export type MonthlyBenefitDTO = {
  title: string;
  subtitle?: string;
  monthLabel?: string;
  locked?: boolean;
};

const formatMonthLabel = (isoDateOrDate: string | Date | null | undefined) => {
  if (!isoDateOrDate) return '';
  const d = isoDateOrDate instanceof Date ? isoDateOrDate : new Date(isoDateOrDate);
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${mm}/${yyyy}`;
};

const getMonthDateUTC = () => {
  const now = new Date();
  // primeiro dia do mês em UTC, formato YYYY-MM-DD
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
    .toISOString()
    .slice(0, 10);
};

/**
 * Drop/benefício do mês atual (para Home/Voucher).
 * - Busca por month_date (primeiro dia do mês)
 * - NÃO depende da coluna month_label no banco (evita "estouro")
 */
export const getMonthlyBenefit = async (): Promise<MonthlyBenefitDTO | null> => {
  try {
    const monthDate = getMonthDateUTC();

    const { data, error } = await supabase
      .from('monthly_drops')
      .select('title, is_active, month_date')
      .eq('month_date', monthDate)
      .maybeSingle();

    if (error) {
      console.error('[getMonthlyBenefit] error:', error);
      return null;
    }

    if (!data) return null;

    const md = data as any;

    return {
      title: md.title || 'Drop Mensal',
      monthLabel: formatMonthLabel(md.month_date),
      locked: md.is_active === false,
    };
  } catch (e) {
    console.error('[getMonthlyBenefit] exception:', e);
    return null;
  }
};
