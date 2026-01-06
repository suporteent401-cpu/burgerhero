import { TrendingUp, TrendingDown, UserPlus, UserMinus, CreditCard, Gift, Zap, BarChart, PieChart, AlertTriangle, Sparkles, Clock, Award } from 'lucide-react';

// Simula uma chamada de API com delay
export const getAdminDashboardMetrics = async (period: string) => {
  await new Promise(res => setTimeout(res, 1200)); // Simula delay de rede

  // Lógica de mock baseada no período (simplificada)
  const multiplier = period === '7d' ? 0.25 : period === '30d' ? 1 : 1.1;

  return {
    kpis: [
      { title: 'Assinantes Ativos', value: '1,284', delta: '+1.2%', icon: TrendingUp, tooltip: 'Total de assinaturas com status ATIVO.' },
      { title: 'Novas Assinaturas', value: `${Math.floor(88 * multiplier)}`, delta: '+15%', icon: UserPlus, tooltip: 'Novos clientes no período selecionado.' },
      { title: 'Cancelamentos', value: `${Math.floor(12 * multiplier)}`, delta: '-3%', icon: UserMinus, tooltip: 'Clientes que cancelaram no período.' },
      { title: 'MRR Estimado', value: 'R$ 42.850', delta: '+8%', icon: CreditCard, tooltip: 'Receita Mensal Recorrente (Monthly Recurring Revenue).' },
      { title: 'Resgates do Mês', value: '852', delta: '+5.4%', icon: Gift, tooltip: 'Vouchers de hambúrguer resgatados no mês atual.' },
      { title: 'Taxa de Resgate', value: '66.3%', delta: '+2.1%', icon: Award, tooltip: 'Percentual de assinantes ativos que resgataram o burger do mês.' },
    ],
    insights: [
      { icon: AlertTriangle, title: 'Risco de Churn Elevado', description: '18 usuários não resgatam há 2 meses. Considere uma campanha de reengajamento.', color: 'amber' },
      { icon: Sparkles, title: 'Plano Vingador Converte Mais', description: 'O Plano Vingador teve 45% mais adesões que o Justiceiro nos últimos 7 dias.', color: 'blue' },
      { icon: Clock, title: 'Pico de Resgates às 19h', description: 'Sextas e Sábados entre 19h e 20h são os horários de maior movimento.', color: 'purple' },
    ],
    charts: {
      activesOverTime: {
        labels: ['-30d', '-20d', '-10d', 'Hoje'],
        data: [800, 1000, 950, 1284].map(v => Math.round(v * multiplier)),
      },
      redemptionsByDay: {
        labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
        data: [60, 25, 30, 45, 70, 95, 110],
      },
      popularPlans: [
        { name: 'Plano Vingador', percentage: 68, color: 'bg-hero-primary' },
        { name: 'Plano Justiceiro', percentage: 32, color: 'bg-slate-400' },
      ]
    }
  };
};