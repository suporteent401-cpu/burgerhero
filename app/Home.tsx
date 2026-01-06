import React, { useEffect, useState } from 'react';
import { Card, CardBody } from '../components/ui/Card';
import { useAuthStore } from '../store/authStore';
import { fakeApi } from '../lib/fakeApi';
import { Subscription, MonthlyBenefit } from '../types';
import { Clock, Ticket, Utensils, ChevronRight, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import HeroCard from '../components/HeroCard';

const Home: React.FC = () => {
  const { user } = useAuthStore();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [benefit, setBenefit] = useState<MonthlyBenefit | null>(null);

  useEffect(() => {
    if (user) {
      fakeApi.getSubscriptionStatus(user.id).then(setSub);
      const monthKey = new Date().toISOString().slice(0, 7);
      fakeApi.getMonthlyBenefit(user.id, monthKey).then(setBenefit);
    }
  }, [user]);

  const isActive = sub?.status === 'ACTIVE';

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Olá, {user?.name.split(' ')[0]}!</h2>
          <p className="text-slate-500 text-xs font-bold mt-1">
            Status: 
            <span className={`ml-1 ${isActive ? 'text-green-500' : 'text-red-500'}`}>
              {isActive ? '● Ativo' : '● Inativo'}
            </span>
          </p>
        </div>
        <Link to="/app/profile" className="relative group">
          <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-md transition-transform group-hover:scale-105">
            <img src={user?.avatarUrl || `https://picsum.photos/seed/${user?.id}/100`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </Link>
      </div>

      {/* Hero Card Section */}
      <div className="py-2">
        <HeroCard user={user} memberSince={sub?.currentPeriodStart} />
      </div>

      {/* Status Info Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardBody className="p-4">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">Próxima Cobrança</p>
            <p className="font-bold text-slate-800 text-sm">{sub ? new Date(sub.nextBillingDate).toLocaleDateString() : '--/--'}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">Burger do Mês</p>
            <p className={`font-bold text-sm ${benefit?.burgerRedeemed ? 'text-amber-500' : 'text-green-500'}`}>
              {benefit?.burgerRedeemed ? 'Resgatado' : 'Disponível'}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/app/qrcode" className="block group">
          <Card className="h-full bg-slate-800 text-white border-slate-700 group-hover:border-hero-primary transition-all group-hover:-translate-y-1">
            <CardBody className="flex flex-col items-center py-6 text-center">
              <QrCode size={24} className="text-hero-primary mb-2" />
              <span className="text-sm font-bold">Meu QR Code</span>
            </CardBody>
          </Card>
        </Link>
        <Link to="/app/voucher" className="block group">
          <Card className="h-full group-hover:border-hero-primary transition-all group-hover:-translate-y-1">
            <CardBody className="flex flex-col items-center py-6 text-center">
              <Ticket size={24} className="text-hero-primary mb-2" />
              <span className="text-sm font-bold text-slate-700">Voucher Mensal</span>
            </CardBody>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-black text-slate-700 text-sm uppercase tracking-wide">Atividades Recentes</h3>
          <button className="text-[10px] font-bold text-hero-primary hover:underline">VER TUDO</button>
        </div>
        <Card>
          <CardBody className="p-0">
             <div className="divide-y divide-slate-50">
                <div className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 bg-hero-primary/10 rounded-xl flex items-center justify-center text-hero-primary"><Utensils size={18} /></div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">Hambúrguer de Outubro</p>
                    <p className="text-xs text-slate-400 font-medium">Pendente de resgate</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
                <div className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer opacity-70">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"><Clock size={18} /></div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">Hambúrguer de Setembro</p>
                    <p className="text-xs text-slate-400 font-medium">Resgatado em 12/09</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
             </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Home;