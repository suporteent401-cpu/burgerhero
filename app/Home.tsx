
import React, { useEffect, useState } from 'react';
import { Card, CardBody } from '../components/ui/Card';
import { useAuthStore } from '../store/authStore';
import { fakeApi } from '../lib/fakeApi';
import { Subscription, MonthlyBenefit } from '../types';
import { Zap, Clock, Ticket, Utensils, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">Olá, {user?.name.split(' ')[0]}!</h2>
          <p className="text-slate-400 text-sm font-medium">Status: {isActive ? 'Assinatura Ativa' : 'Sem Plano Ativo'}</p>
        </div>
        <div className="w-12 h-12 bg-hero-primary/10 rounded-2xl flex items-center justify-center text-hero-primary">
          <Zap size={24} fill="currentColor" />
        </div>
      </div>

      <Card className="bg-slate-900 text-white border-none overflow-visible relative">
        <CardBody className="p-6">
           <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Seu ID de Herói</p>
                <h3 className="text-2xl font-black">{user?.customerCode}</h3>
              </div>
              <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                Premium
              </div>
           </div>
           
           <div className="flex gap-4">
              <div className="flex-1 bg-white/5 rounded-2xl p-4">
                <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Próxima Cobrança</p>
                <p className="font-bold text-sm">{sub ? new Date(sub.nextBillingDate).toLocaleDateString() : '--/--'}</p>
              </div>
              <div className="flex-1 bg-white/5 rounded-2xl p-4">
                <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Burger do Mês</p>
                <p className={`font-bold text-sm ${benefit?.burgerRedeemed ? 'text-red-400' : 'text-green-400'}`}>
                  {benefit?.burgerRedeemed ? 'Resgatado' : 'Disponível'}
                </p>
              </div>
           </div>
        </CardBody>
        <div className="absolute -bottom-2 right-6 w-24 h-24 bg-hero-primary blur-[40px] opacity-40 rounded-full -z-0"></div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Link to="/app/qrcode" className="block">
          <Card className="hover:border-hero-primary transition-colors h-full">
            <CardBody className="flex flex-col items-center py-6 text-center">
              <div className="p-3 bg-slate-50 rounded-xl mb-3"><Zap size={20} className="text-hero-primary" /></div>
              <span className="text-sm font-bold">Meu QR Code</span>
            </CardBody>
          </Card>
        </Link>
        <Link to="/app/voucher" className="block">
          <Card className="hover:border-hero-primary transition-colors h-full">
            <CardBody className="flex flex-col items-center py-6 text-center">
              <div className="p-3 bg-slate-50 rounded-xl mb-3"><Ticket size={20} className="text-hero-primary" /></div>
              <span className="text-sm font-bold">Voucher</span>
            </CardBody>
          </Card>
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-black">Atividades Recentes</h3>
          <button className="text-xs font-bold text-hero-primary">Ver tudo</button>
        </div>
        <Card>
          <CardBody className="p-0">
             <div className="divide-y divide-slate-50">
                <div className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500"><Utensils size={20} /></div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">Hambúrguer de Outubro</p>
                    <p className="text-xs text-slate-400">Pendente de resgate</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
                <div className="p-4 flex items-center gap-4 opacity-60">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500"><Clock size={20} /></div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">Hambúrguer de Setembro</p>
                    <p className="text-xs text-slate-400">Resgatado em 12/09</p>
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
