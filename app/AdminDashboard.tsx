
import React from 'react';
import { Card, CardBody } from '../components/ui/Card';
import { Users, TrendingUp, CreditCard, Gift, ArrowUpRight } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const stats = [
    { label: 'Assinantes Ativos', value: '1.284', trend: '+12%', icon: Users, color: 'text-blue-500' },
    { label: 'Resgates do Mês', value: '852', trend: '+5%', icon: Gift, color: 'text-purple-500' },
    { label: 'MRR Estimado', value: 'R$ 42.850', trend: '+8%', icon: CreditCard, color: 'text-green-500' },
    { label: 'Taxa de Retenção', value: '94%', trend: '+2%', icon: TrendingUp, color: 'text-amber-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black">Dashboard</h2>
          <p className="text-slate-500 font-medium">Visão geral do ecossistema BurgerHero.</p>
        </div>
        <div className="bg-white border p-2 rounded-lg text-sm font-bold text-slate-500">
          Últimos 30 dias
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardBody className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-slate-50 ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div className="flex items-center gap-1 text-green-500 font-bold text-xs bg-green-50 px-2 py-1 rounded-full">
                  <ArrowUpRight size={12} /> {stat.trend}
                </div>
              </div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black">{stat.value}</h3>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
           <CardBody className="p-8">
              <h3 className="font-black text-xl mb-6">Volume de Resgates</h3>
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
           <CardBody className="p-8">
              <h3 className="font-black text-xl mb-6">Planos Populares</h3>
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-sm font-bold mb-2">
                       <span>Vingador</span>
                       <span>65%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                       <div className="bg-hero-primary h-full w-[65%]"></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-sm font-bold mb-2">
                       <span>Justiceiro</span>
                       <span>35%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                       <div className="bg-slate-900 h-full w-[35%]"></div>
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
