import React from 'react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Users, TrendingUp, CreditCard, Gift, ArrowUpRight, BarChart3, PieChart } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const stats = [
    { label: 'Assinantes Ativos', value: '1.284', trend: '+12%', icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    { label: 'Resgates do Mês', value: '852', trend: '+5%', icon: Gift, color: 'text-purple-500', bgColor: 'bg-purple-50' },
    { label: 'MRR Estimado', value: 'R$ 42.850', trend: '+8%', icon: CreditCard, color: 'text-green-500', bgColor: 'bg-green-50' },
    { label: 'Taxa de Retenção', value: '94%', trend: '+2%', icon: TrendingUp, color: 'text-amber-500', bgColor: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-800">Dashboard</h2>
        <p className="text-slate-500 font-medium">Visão geral do ecossistema BurgerHero.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="hover:border-slate-300 transition-all hover:-translate-y-1">
            <CardBody className="p-5">
              <div className="flex justify-between items-center mb-2">
                <div className={`p-2.5 rounded-lg ${stat.bgColor} ${stat.color}`}>
                  <stat.icon size={22} />
                </div>
                <div className="flex items-center gap-1 text-green-600 font-bold text-xs bg-green-100 px-2 py-1 rounded-full">
                  <ArrowUpRight size={12} strokeWidth={3} /> {stat.trend}
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
              <p className="text-slate-500 text-sm font-semibold">{stat.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
           <CardHeader className="flex items-center gap-3">
              <BarChart3 size={20} className="text-slate-400" />
              <h3 className="font-bold text-slate-700">Volume de Resgates</h3>
           </CardHeader>
           <CardBody className="p-6">
              <div className="h-64 flex items-end gap-3">
                 {[40, 60, 45, 90, 70, 85, 100].map((h, i) => (
                   <div key={i} className="flex-1 bg-hero-primary/20 hover:bg-hero-primary rounded-t-lg transition-colors cursor-pointer" style={{ height: `${h}%` }}></div>
                 ))}
              </div>
              <div className="flex justify-between mt-4 text-[10px] font-black uppercase text-slate-400">
                <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sab</span><span>Dom</span>
              </div>
           </CardBody>
        </Card>
        
        <Card>
           <CardHeader className="flex items-center gap-3">
              <PieChart size={20} className="text-slate-400" />
              <h3 className="font-bold text-slate-700">Planos Populares</h3>
           </CardHeader>
           <CardBody className="p-6">
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-sm font-bold mb-2 text-slate-600">
                       <span>Vingador</span>
                       <span className="text-slate-800">65%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                       <div className="bg-hero-primary h-full w-[65%] rounded-full"></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-sm font-bold mb-2 text-slate-600">
                       <span>Justiceiro</span>
                       <span className="text-slate-800">35%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                       <div className="bg-slate-900 h-full w-[35%] rounded-full"></div>
                    </div>
                 </div>
              </div>
           </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;