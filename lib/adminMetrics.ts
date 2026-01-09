import { supabase } from '../lib/supabaseClient';
import {
  TrendingUp,
  UserPlus,
  UserMinus,
  CreditCard,
  Gift,
  Award,
  AlertTriangle,
  Sparkles,
  Clock,
} from 'lucide-react';

type Period = '7d' | '30d' | 'month';

type RpcResponse = {
  kpis: {
    activeSubscribers: number;
    newSubscriptions: number;
    cancellations: number;
    mrrCents: number;
    monthlyRedemptions: number;
    monthlyRedemptionRate: number; // 0..1
  };
  charts: {
    popularPlans: Array<{ name: string; percentage: number }>;
    redemptionsByDay: { labels: string[]; data: number[] };
    activesOverTime: { labels: string[]; data: number[] };
  };
  insights: Array<{ key: string; value: any }>;
};

const safeEmpty = () => ({
  kpis: {
    activeSubscribers: 0,
    newSubscriptions: 0,
    cancellations: 0,
    mrrCents: 0,
    monthlyRedemptions: 0,
    monthlyRedemptionRate: 0,
  },
  charts: {
    popularPlans: [],
    redemptionsByDay: { labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], data: [0, 0, 0, 0, 0, 0, 0] },
    activesOverTime: { labels: ['-30d', '-20d', '-10d', 'Hoje'], data: [0, 0, 0, 0] },
  },
  insights: [],
});

const formatBRL = (cents: number) => {
  const value = (Number(cents || 0) / 100);
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const pct = (v: number) => `${(Number(v || 0)).toFixed(1)}%`;

export const getAdminDashboardMetrics = async (period: Period) => {
  try {
    const { data, error } = await supabase.rpc('admin_dashboard_metrics', { p_period: period });

    if (error) {
      console.error('[adminMetrics] admin_dashboard_metrics RPC error:', error);
      const fallback = safeEmpty();
      return buildUiPayload(fallback);
    }

    const parsed = (data || safeEmpty()) as RpcResponse;
    return buildUiPayload(parsed);
  } catch (e) {
    console.error('[adminMetrics] exception:', e);
    const fallback = safeEmpty();
    return buildUiPayload(fallback);
  }
};

function buildUiPayload(r: RpcResponse) {
  const active = Number(r.kpis.activeSubscribers || 0);
  const redemptions = Number(r.kpis.monthlyRedemptions || 0);
  const rate = Number(r.kpis.monthlyRedemptionRate || 0);

  // insights do banco (mínimos)
  const topPlan = r.charts.popularPlans?.[0]?.name || '';
  const ratePct = pct(rate * 100);

  return {
    kpis: [
      {
        title: 'Assinantes Ativos',
        value: active.toLocaleString('pt-BR'),
        delta: '—',
        icon: TrendingUp,
        tooltip: 'Total de assinaturas com status ATIVO e período vigente.',
      },
      {
        title: 'Novas Assinaturas',
        value: Number(r.kpis.newSubscriptions || 0).toLocaleString('pt-BR'),
        delta: '—',
        icon: UserPlus,
        tooltip: 'Assinaturas criadas dentro do período selecionado.',
      },
      {
        title: 'Cancelamentos',
        value: Number(r.kpis.cancellations || 0).toLocaleString('pt-BR'),
        delta: '—',
        icon: UserMinus,
        tooltip: 'Assinaturas com status CANCELED no período selecionado.',
      },
      {
        title: 'MRR Estimado',
        value: formatBRL(Number(r.kpis.mrrCents || 0)),
        delta: '—',
        icon: CreditCard,
        tooltip: 'Soma do preço dos planos dos assinantes ativos (estimativa).',
      },
      {
        title: 'Resgates do Mês',
        value: redemptions.toLocaleString('pt-BR'),
        delta: '—',
        icon: Gift,
        tooltip: 'Total de vouchers resgatados no mês atual (UTC).',
      },
      {
        title: 'Taxa de Resgate',
        value: ratePct,
        delta: '—',
        icon: Award,
        tooltip: 'Resgates do mês / assinantes ativos.',
      },
    ],

    insights: [
      {
        icon: AlertTriangle,
        title: 'Taxa de Resgate do Mês',
        description: `Taxa atual: ${ratePct}.`,
        color: 'amber',
      },
      {
        icon: Sparkles,
        title: 'Plano mais popular',
        description: topPlan ? `No momento, o plano mais popular é: ${topPlan}.` : 'Ainda sem dados suficientes de planos.',
        color: 'blue',
      },
      {
        icon: Clock,
        title: 'Distribuição de Resgates',
        description: 'Confira o gráfico por dia da semana para ajustar equipe e operação.',
        color: 'purple',
      },
    ],

    charts: {
      activesOverTime: r.charts.activesOverTime || safeEmpty().charts.activesOverTime,
      redemptionsByDay: r.charts.redemptionsByDay || safeEmpty().charts.redemptionsByDay,
      popularPlans: (r.charts.popularPlans || []).map((p) => ({
        name: p.name,
        percentage: Number(p.percentage || 0),
        color: 'bg-hero-primary',
      })),
    },
  };
}
