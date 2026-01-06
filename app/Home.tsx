import React, { useEffect, useState } from 'react';
import { Card, CardBody } from '../components/ui/Card';
import { useAuthStore } from '../store/authStore';
import { fakeApi } from '../lib/fakeApi';
import { Subscription, MonthlyBenefit, HeroTheme } from '../types';
import { Zap, Clock, Ticket, Utensils, ChevronRight, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';

const heroCardImages: Record<HeroTheme, string> = {
  'sombra-noturna': 'https://ik.imagekit.io/lflb43qwh/Heros/1.png',
  'guardiao-escarlate': 'https://ik.imagekit.io/lflb43qwh/Heros/2.png',
  'tita-dourado': 'https://ik.imagekit.io/lflb43qwh/Heros/4.png',
  'tempestade-azul': 'https://ik.imagekit.io/lflb43qwh/Heros/1.png', // Placeholder
  'sentinela-verde': 'https://ik.imagekit.io/lflb43qwh/Heros/4.png', // Placeholder
  'aurora-rosa': 'https://ik.imagekit.io/lflb43qwh/Heros/2.png', // Placeholder
};

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
  const cardImageUrl = user ? heroCardImages[user.heroTheme] : heroCardImages['sombra-noturna'];
  
  const getFormattedDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const formatted = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black">Olá, {user?.name.split(' ')[0]}!</h2>
        <p className="text-slate-400 text-sm font-medium">Status: 
          <span className={isActive ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
            {isActive ? ' Assinatura Ativa' : ' Sem Plano Ativo'}
          </span>
        </p>
      </div>

      {/* Hero Card */}
      <div 
        style={{ backgroundImage: `url(${cardImageUrl})` }}
        className="relative aspect-[16/10] w-full rounded-2xl bg-cover bg-center shadow-lg text-white overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
        <div className="relative h-full flex flex-col justify-between p-5">
          <div className="text-right">
            <p className="text-xs font-light opacity-80">Membro desde</p>
            <p className="font-bold text-sm">{getFormattedDate(sub?.currentPeriodStart)}</p>
          </div>
          <div>
            <p className="text-xs font-light opacity-80">ID de Herói</p>
            <p className="font-mono font-bold text-lg tracking-widest">{user?.customerCode}</p>
            <p className="font-black text-2xl mt-1">{user?.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardBody className="p-4">
            <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Próxima Cobrança</p>
            <p className="font-bold text-sm">{sub ? new Date(sub.nextBillingDate).toLocaleDateString() : '--/--'}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Burger do Mês</p>
            <p className={`font-bold text-sm ${benefit?.burgerRedeemed ? 'text-red-400' : 'text-green-400'}`}>
              {benefit?.burgerRedeemed ? 'Resgatado' : 'Disponível'}
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link to="/app/qrcode" className="block">
          <Card className="hover:border-hero-primary transition-colors h-full bg-slate-800 text-white border-slate-700">
            <CardBody className="flex flex-col items-center py-6 text-center">
              <QrCode size={24} className="text-hero-primary mb-2" />
              <span className="text-sm font-bold">Meu QR Code</span>
            </CardBody>
          </Card>
        </Link>
        <Link to="/app/voucher" className="block">
          <Card className="hover:border-hero-primary transition-colors h-full">
            <CardBody className="flex flex-col items-center py-6 text-center">
              <Ticket size={24} className="text-hero-primary mb-2" />
              <span className="text-sm font-bold">Voucher Mensal</span>
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