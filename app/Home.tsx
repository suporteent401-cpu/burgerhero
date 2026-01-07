import React, { useEffect, useState } from 'react';
import { Card, CardBody } from '../components/ui/Card';
import { useAuthStore } from '../store/authStore';
import { useCardStore } from '../store/cardStore';
import { getSubscriptionStatus, getMonthlyBenefit } from '../services/clientHome.service';
import { subscriptionMockService } from '../services/subscriptionMock.service';
import { Subscription, MonthlyBenefit } from '../types';
import { Clock, Ticket, Utensils, ChevronRight, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import HeroCard from '../components/HeroCard';
import NearbyRestaurants from '../components/NearbyRestaurants';

const Home: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const { getSelectedTemplate, selectedFont, selectedColor } = useCardStore();
  
  // Estado local compatível com a interface Subscription
  const [sub, setSub] = useState<Subscription | null>(null);
  const [benefit, setBenefit] = useState<MonthlyBenefit | null>(null);

  const cardTemplate = getSelectedTemplate();

  useEffect(() => {
    if (user?.id) {
      const fetchData = async () => {
        try {
          // 1. Tenta buscar do Mock Service primeiro (Prioridade Local)
          const mockSub = subscriptionMockService.getActiveSubscription(user.id);
          
          if (mockSub && mockSub.status === 'active') {
            // Converte MockSubscription para Subscription (types)
            setSub({
              status: 'active', // Forçando lowercase para bater com types
              currentPeriodStart: mockSub.startedAt,
              currentPeriodEnd: mockSub.nextBillingDate
            });
          } else {
            // 2. Se não tiver mock, busca do serviço original (Supabase)
            const subscriptionData = await getSubscriptionStatus(user.id);
            setSub(subscriptionData);
          }

          // Busca benefício mensal (mantido igual)
          const monthKey = new Date().toISOString().slice(0, 7);
          const benefitData = await getMonthlyBenefit(user.id, monthKey);
          setBenefit(benefitData);
        } catch (error) {
          console.error("Falha ao buscar dados da Home.", error);
        }
      };
      fetchData();
    }
  }, [user?.id]);

  // Verifica status (aceita 'ACTIVE' do banco ou 'active' do mock)
  const isActive = sub?.status === 'ACTIVE' || sub?.status === 'active';

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Olá, {user?.name.split(' ')[0]}!</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-1">
            Status: 
            <span className={`ml-1 ${isActive ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
              {isActive ? '● Ativo' : '● Inativo'}
            </span>
          </p>
        </div>
        <Link to="/app/profile" className="relative">
          <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-700 shadow-md">
            <img src={user?.avatarUrl || `https://picsum.photos/seed/${user?.id}/100`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </Link>
      </div>

      {/* Hero Card Section */}
      <div className="py-2">
        <HeroCard 
          user={user} 
          imageUrl={cardTemplate.imageUrl} 
          memberSince={sub?.currentPeriodStart}
          fontFamily={selectedFont}
          textColor={selectedColor}
        />
      </div>

      {/* Nearby Restaurants Section */}
      <NearbyRestaurants />

      {/* Status Info Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardBody className="p-4">
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1">Próxima Cobrança</p>
            <p className="font-bold text-slate-800 dark:text-white text-sm">
              {/* Usa nextBillingDate se vier do mock (via adaptação no useEffect) ou do tipo original se existir */}
              {sub && (sub as any).nextBillingDate 
                ? new Date((sub as any).nextBillingDate).toLocaleDateString() 
                : sub?.currentPeriodEnd 
                  ? new Date(sub.currentPeriodEnd).toLocaleDateString() 
                  : '--/--'}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1">Burger do Mês</p>
            <p className={`font-bold text-sm ${benefit?.burgerRedeemed ? 'text-amber-500' : 'text-green-500 dark:text-green-400'}`}>
              {benefit?.burgerRedeemed ? 'Resgatado' : 'Disponível'}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/app/qrcode" className="block group">
          <Card className="h-full group-hover:border-hero-primary transition-all group-hover:-translate-y-1">
            <CardBody className="flex flex-col items-center py-6 text-center">
              <QrCode size={24} className="text-hero-primary mb-2" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Meu QR Code</span>
            </CardBody>
          </Card>
        </Link>
        <Link to="/app/voucher" className="block group">
          <Card className="h-full group-hover:border-hero-primary transition-all group-hover:-translate-y-1">
            <CardBody className="flex flex-col items-center py-6 text-center">
              <Ticket size={24} className="text-hero-primary mb-2" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Voucher Mensal</span>
            </CardBody>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-black text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">Atividades Recentes</h3>
          <button className="text-[10px] font-bold text-hero-primary hover:underline">VER TUDO</button>
        </div>
        <Card>
          <CardBody className="p-0">
             <div className="divide-y divide-slate-50 dark:divide-slate-800">
                <div className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 bg-hero-primary/10 rounded-xl flex items-center justify-center text-hero-primary"><Utensils size={18} /></div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Hambúrguer de Outubro</p>
                    <p className="text-xs text-slate-400 font-medium">Pendente de resgate</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
                </div>
                <div className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer opacity-70">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400"><Clock size={18} /></div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Hambúrguer de Setembro</p>
                    <p className="text-xs text-slate-400 font-medium">Resgatado em 12/09</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
                </div>
             </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Home;