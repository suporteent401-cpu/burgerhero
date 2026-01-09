import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody } from '../components/ui/Card';
import { useAuthStore } from '../store/authStore';
import { useCardStore } from '../store/cardStore';
import { getSubscriptionStatus } from '../services/clientHome.service';
import { subscriptionMockService } from '../services/subscriptionMock.service';
import { Subscription } from '../types';
import { Clock, ChevronRight, QrCode, Ticket, Tag, Copy, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import HeroCard from '../components/HeroCard';
import NearbyRestaurants from '../components/NearbyRestaurants';
import { couponsService } from '../services/coupons.service';
import { getCurrentVoucher } from '../services/voucher.service';

type UiBurgerStatus = 'DISPONIVEL' | 'JA_UTILIZADO' | 'BLOQUEADO' | 'EM_BREVE';

const Home: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const { getSelectedTemplate, selectedFont, selectedColor } = useCardStore();

  const [sub, setSub] = useState<Subscription | null>(null);
  const [nextBillingLabel, setNextBillingLabel] = useState<string>('--/--');
  const [coupons, setCoupons] = useState<any[]>([]);

  // fonte canônica do “burger do mês”
  const [burgerStatus, setBurgerStatus] = useState<UiBurgerStatus>('EM_BREVE');
  const [isActive, setIsActive] = useState<boolean>(false);

  const cardTemplate = getSelectedTemplate();

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        // 1) Fonte canônica: voucher do mês + eligibility (usa is_subscription_active lá dentro)
        const cv = await getCurrentVoucher(user.id);

        const subActive = !!cv?.eligibility?.subscriptionActive;
        setIsActive(subActive);

        // Burger status coerente:
        // - se drop não está ativo => EM_BREVE (ou BLOQUEADO se quiser diferenciar)
        // - se drop ativo e sub inativa => BLOQUEADO
        // - se voucher existe e redeemed => JA_UTILIZADO
        // - se voucher existe e available => DISPONIVEL
        // - se sub ativa mas ainda não tem voucher (caso raro) => EM_BREVE
        const dropActive = !!cv?.eligibility?.dropActive;
        const v = cv?.voucher;

        let bs: UiBurgerStatus = 'EM_BREVE';
        if (!dropActive) {
          bs = 'EM_BREVE';
        } else if (!subActive) {
          bs = 'BLOQUEADO';
        } else if (v?.status === 'redeemed' || !!v?.redeemed_at) {
          bs = 'JA_UTILIZADO';
        } else if (v?.status === 'available') {
          bs = 'DISPONIVEL';
        } else {
          bs = 'EM_BREVE';
        }
        setBurgerStatus(bs);

        // 2) Próxima cobrança (mantém teu fluxo atual com fallback)
        // - tenta mock/local (se existir)
        // - senão tenta tabela subscriptions
        const activeSub = await subscriptionMockService.getActiveSubscription(user.id);

        if (activeSub?.nextBillingDate) {
          setNextBillingLabel(new Date(activeSub.nextBillingDate).toLocaleDateString());
          setSub({
            status: 'active',
            currentPeriodStart: activeSub.startedAt,
            currentPeriodEnd: activeSub.nextBillingDate,
          } as any);
        } else {
          const subscriptionData = await getSubscriptionStatus(user.id);
          setSub(subscriptionData as any);

          const next =
            (subscriptionData as any)?.nextBillingAt ||
            (subscriptionData as any)?.currentPeriodEnd ||
            null;

          setNextBillingLabel(next ? new Date(next).toLocaleDateString() : '--/--');
        }

        // 3) Cupons (campanhas) - depende apenas se está ativo ou não
        const availableCoupons = await couponsService.getAvailableCouponsForUser(subActive);
        setCoupons(availableCoupons);
      } catch (error) {
        console.error('Falha ao buscar dados da Home.', error);
      }
    };

    fetchData();
  }, [user?.id]);

  const burgerLabel = useMemo(() => {
    if (burgerStatus === 'DISPONIVEL') return 'Disponível';
    if (burgerStatus === 'JA_UTILIZADO') return 'Já utilizado';
    if (burgerStatus === 'BLOQUEADO') return 'Bloqueado';
    return 'Em breve';
  }, [burgerStatus]);

  const burgerLabelClass = useMemo(() => {
    if (burgerStatus === 'DISPONIVEL') return 'text-green-500 dark:text-green-400';
    if (burgerStatus === 'JA_UTILIZADO') return 'text-slate-500 dark:text-slate-400';
    if (burgerStatus === 'BLOQUEADO') return 'text-red-500 dark:text-red-400';
    return 'text-slate-400 dark:text-slate-500';
  }, [burgerStatus]);

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`Código ${code} copiado!`);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">
            Olá, {user?.name?.split(' ')?.[0] || 'Herói'}!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-1">
            Status:
            <span className={`ml-1 ${isActive ? 'text-green-500 dark:text-green-400' : 'text-slate-500'}`}>
              {isActive ? '● Ativo' : '● Visitante'}
            </span>
          </p>
        </div>
        <Link to="/app/profile" className="relative">
          <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-700 shadow-md">
            <img
              src={user?.avatarUrl || `https://picsum.photos/seed/${user?.id}/100`}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </Link>
      </div>

      {/* Hero Card */}
      <div className="py-2">
        <HeroCard
          user={user}
          imageUrl={cardTemplate.imageUrl}
          memberSince={(sub as any)?.currentPeriodStart}
          fontFamily={selectedFont}
          textColor={selectedColor}
          isActive={isActive}
        />
      </div>

      {/* Restaurantes */}
      <NearbyRestaurants />

      {/* Grid status */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardBody className="p-4">
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1">
              Próxima Cobrança
            </p>
            <p className="font-bold text-slate-800 dark:text-white text-sm">{nextBillingLabel}</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1">
              Burger do Mês
            </p>
            <p className={`font-bold text-sm ${burgerLabelClass}`}>{burgerLabel}</p>
          </CardBody>
        </Card>
      </div>

      {/* Ações rápidas */}
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

      {/* Atividades Recentes (placeholder - a gente vai ligar no histórico real depois) */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-black text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">
            Atividades Recentes
          </h3>
        </div>
        <Card>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              <div className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer opacity-70">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <Clock size={18} />
                </div>
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

      {/* Cupons */}
      {coupons.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 px-1">
            <Sparkles size={16} className="text-hero-primary" />
            <h3 className="font-black text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">
              Ofertas Especiais
            </h3>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 px-1 no-scrollbar snap-x">
            {coupons.map(coupon => (
              <div key={coupon.id} className="min-w-[260px] snap-center">
                <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-lg overflow-hidden border border-slate-700">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-50 dark:bg-slate-950 rounded-full"></div>
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-50 dark:bg-slate-950 rounded-full"></div>

                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-hero-primary/20 text-hero-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-hero-primary/30">
                      {coupon.ruleOnlyForInactives ? 'Reativação' : 'Promoção'}
                    </span>
                    <Tag size={16} className="text-slate-400" />
                  </div>

                  <div className="text-center mb-4">
                    <span className="text-4xl font-black text-white">{coupon.discountPercent}%</span>
                    <span className="text-lg font-bold text-slate-400 ml-1">OFF</span>
                    <p className="text-xs text-slate-400 mt-1">
                      Válido até {new Date(coupon.expiresAt).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={() => copyCoupon(coupon.code)}
                    className="w-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all py-2 rounded-xl flex items-center justify-center gap-2 border border-white/10 group"
                  >
                    <span className="font-mono font-bold tracking-wider">{coupon.code}</span>
                    <Copy size={14} className="text-slate-400 group-hover:text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
