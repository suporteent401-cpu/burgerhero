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

// Estrutura segura de fallback caso a API falhe ou retorne null
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

const pct = (v: number) => `${(Number(v || 0) * 100).toFixed(1)}%`;

export const getAdminDashboardMetrics = async (period: Period) => {
  try {
    const { data, error } = await supabase.rpc('admin_dashboard_metrics', { p_period: period });

    if (error) {
      console.error('[AdminMetrics] RPC Error:', error);
      return buildUiPayload(safeEmpty());
    }

    // Se vier null (banco vazio), usa fallback
    return buildUiPayload(data || safeEmpty());
  } catch (e) {
    console.error('[AdminMetrics] Exception:', e);
    return buildUiPayload(safeEmpty());
  }
};

function buildUiPayload(r: any) {
  // Garante acesso seguro às propriedades
  const kpis = r?.kpis || safeEmpty().kpis;
  const charts = r?.charts || safeEmpty().charts;
  
  // Lógica de apresentação para Insights
  const topPlanName = charts.popularPlans?.[0]?.name || 'N/A';
  const redeemRateVal = (kpis.monthlyRedemptionRate || 0) * 100;

  return {
    kpis: [
      {
        title: 'Assinantes Ativos',
        value: Number(kpis.activeSubscribers || 0).toLocaleString('pt-BR'),
        delta: '—', // Delta real exigiria comparação com período anterior (v2)
        icon: TrendingUp,
        tooltip: 'Total de assinaturas com status ATIVO e período vigente.',
      },
      {
        title: 'Novas Assinaturas',
        value: Number(kpis.newSubscriptions || 0).toLocaleString('pt-BR'),
        delta: '—',
        icon: UserPlus,
        tooltip: 'Assinaturas criadas dentro do período selecionado.',
      },
      {
        title: 'Cancelamentos',
        value: Number(kpis.cancellations || 0).toLocaleString('pt-BR'),
        delta: '—',
        icon: UserMinus,
        tooltip: 'Assinaturas com status CANCELED no período selecionado.',
      },
      {
        title: 'MRR Estimado',
        value: formatBRL(kpis.mrrCents),
        delta: '—',
        icon: CreditCard,
        tooltip: 'Soma do preço dos planos dos assinantes ativos (estimativa).',
      },
      {
        title: 'Resgates do Mês',
        value: Number(kpis.monthlyRedemptions || 0).toLocaleString('pt-BR'),
        delta: '—',
        icon: Gift,
        tooltip: 'Total de vouchers resgatados no mês atual (UTC).',
      },
      {
        title: 'Taxa de Resgate',
        value: pct(kpis.monthlyRedemptionRate),
        delta: '—',
        icon: Award,
        tooltip: 'Resgates do mês / assinantes ativos.',
      },
    ],

    insights: [
      {
        icon: AlertTriangle,
        title: 'Taxa de Resgate',
        description: `A taxa atual é de ${redeemRateVal.toFixed(1)}%.`,
        color: 'amber',
      },
      {
        icon: Sparkles,
        title: 'Plano Destaque',
        description: topPlanName !== 'N/A' ? `O plano ${topPlanName} é o favorito.` : 'Ainda sem dados suficientes.',
        color: 'blue',
      },
      {
        icon: Clock,
        title: 'Pico de Atividade',
        description: 'Veja o gráfico diário para alinhar a operação.',
        color: 'purple',
      },
    ],

    charts: {
      activesOverTime: charts.activesOverTime || { labels: [], data: [] },
      redemptionsByDay: charts.redemptionsByDay || { labels: [], data: [] },
      popularPlans: (charts.popularPlans || []).map((p: any) => ({
        name: p.name,
        percentage: Number(p.percentage || 0),
        color: 'bg-hero-primary',
      })),
    },
  };
}