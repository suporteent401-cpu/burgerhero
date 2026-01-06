import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatCard } from '../components/admin/StatCard';
import { InsightCard } from '../components/admin/InsightCard';
import { LineChart } from '../components/admin/charts/LineChart';
import { BarChart } from '../components/admin/charts/BarChart';
import { ProgressList } from '../components/admin/charts/ProgressList';
import { getAdminDashboardMetrics } from '../lib/adminMetrics';
import { BarChart3, PieChart, TrendingUp, CheckCircle, Calendar } from 'lucide-react';

type Period = '7d' | '30d' | 'month';

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30d');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const metrics = await getAdminDashboardMetrics(period);
      setData(metrics);
      setLoading(false);
    };
    fetchData();
  }, [period]);

  const SkeletonCard = () => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/3 mb-6"></div>
      <div className="h-8 bg-slate-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-slate-200 rounded w-1/4"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Dashboard</h2>
          <p className="text-slate-500 font-medium">Visão geral do ecossistema BurgerHero.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded-xl border border-slate-100 shadow-sm flex gap-1">
            {(['7d', '30d', 'month'] as Period[]).map(p => (
              <button 
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${period === p ? 'bg-hero-primary text-white' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                {p === '7d' ? '7 Dias' : p === '30d' ? '30 Dias' : 'Mês Atual'}
              </button>
            ))}
          </div>
          <Link to="/staff/validate">
            <Button>
              <CheckCircle size={16} className="mr-2" /> Validar Resgate
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          data.kpis.map((stat: any, i: number) => <StatCard key={i} {...stat} />)
        )}
      </div>

      {/* Insights */}
      {loading ? null : (
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Insights Rápidos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.insights.map((insight: any, i: number) => <InsightCard key={i} {...insight} />)}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
           <CardHeader className="flex items-center gap-3">
              <TrendingUp size={18} className="text-slate-400" />
              <h3 className="font-bold text-slate-700">Assinantes Ativos</h3>
           </CardHeader>
           <CardBody className="p-6 h-64">
              {loading ? <div className="h-full bg-slate-100 rounded-lg animate-pulse" /> : <LineChart {...data.charts.activesOverTime} />}
           </CardBody>
        </Card>
        
        <Card>
           <CardHeader className="flex items-center gap-3">
              <PieChart size={18} className="text-slate-400" />
              <h3 className="font-bold text-slate-700">Planos Populares</h3>
           </CardHeader>
           <CardBody className="p-6">
              {loading ? <div className="h-full bg-slate-100 rounded-lg animate-pulse" /> : <ProgressList data={data.charts.popularPlans} />}
           </CardBody>
        </Card>

        <Card className="lg:col-span-3">
           <CardHeader className="flex items-center gap-3">
              <BarChart3 size={18} className="text-slate-400" />
              <h3 className="font-bold text-slate-700">Resgates por Dia da Semana</h3>
           </CardHeader>
           <CardBody className="p-6">
              {loading ? <div className="h-48 bg-slate-100 rounded-lg animate-pulse" /> : <BarChart {...data.charts.redemptionsByDay} />}
           </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;