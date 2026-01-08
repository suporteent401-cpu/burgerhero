import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { QrCode, Lock, CheckCircle2, Calendar, Utensils } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCurrentVoucher, getVoucherHistory } from '../services/voucher.service';
import { subscriptionMockService } from '../services/subscriptionMock.service';

const Voucher: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();

  const [isActive, setIsActive] = useState(false);
  const [currentVoucher, setCurrentVoucher] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentDate = new Date();
  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [voucherData, historyData, activeSub] = await Promise.all([
          getCurrentVoucher(user.id),
          getVoucherHistory(user.id),
          subscriptionMockService.getActiveSubscription(user.id),
        ]);

        setIsActive(!!activeSub);
        setCurrentVoucher(voucherData);

        const pastVouchers = historyData.filter(v => v.id !== voucherData?.id);
        setHistory(pastVouchers.slice(0, 2));
      } catch (error) {
        console.error("Erro ao buscar dados do voucher:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 gap-4">
      <div className="w-8 h-8 border-4 border-hero-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-medium animate-pulse">Sincronizando satélites...</p>
    </div>
  );

  const isRedeemed = currentVoucher?.status === 'redeemed';
  const isEligible = isActive && currentVoucher?.status === 'available';

  const burgerImage =
    currentVoucher?.monthly_drop?.burger?.image_url ||
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
  const burgerName = currentVoucher?.monthly_drop?.burger?.name;
  const burgerDescription = currentVoucher?.monthly_drop?.burger?.description;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Drops Mensal</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xs flex items-center gap-1">
            <Calendar size={12} /> {capitalizedMonth} de {currentYear}
          </p>
        </div>
      </div>

      {/* Main Voucher Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full h-[280px] rounded-2xl overflow-hidden shadow-xl group"
      >
        <div className="absolute inset-0 bg-slate-900">
          <img
            src={burgerImage}
            alt="Burger of the Month"
            className={`w-full h-full object-cover transition-transform duration-700 ${isEligible ? 'group-hover:scale-110' : 'grayscale opacity-40'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
        </div>

        <div className="absolute top-3 right-3">
          {isRedeemed ? (
            <div className="bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20 flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-green-500" /> Resgatado
            </div>
          ) : isEligible ? (
            <div className="bg-hero-primary text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-hero-primary/40 animate-pulse">
              Disponível
            </div>
          ) : (
            <div className="bg-red-500/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Lock size={12} /> Bloqueado
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-2">
          <div>
            <span className="text-hero-primary font-black text-[10px] uppercase tracking-[0.2em] mb-1 block">
              Burger do Mês
            </span>
            <h3 className="text-2xl font-black text-white leading-tight mb-1">
              {isRedeemed ? 'Missão Cumprida' : (burgerName || 'Drop Indisponível')}
            </h3>
            <p className="text-slate-300 text-xs max-w-sm line-clamp-2 leading-relaxed">
              {isRedeemed
                ? `Você saboreou este drop épico em ${new Date(currentVoucher!.redeemed_at!).toLocaleDateString()}.`
                : isEligible && burgerDescription
                  ? burgerDescription
                  : 'Sua assinatura está inativa ou o drop ainda não foi liberado.'}
            </p>
          </div>

          <div className="pt-1">
            {isEligible ? (
              <Button
                onClick={() => navigate('/app/qrcode')}
                className="w-full bg-white text-slate-900 hover:bg-slate-100 border-none h-10 text-sm rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all font-bold"
              >
                <QrCode className="mr-2 text-hero-primary" size={16} /> Usar no Balcão
              </Button>
            ) : isRedeemed ? (
              <Button
                disabled
                className="w-full bg-slate-800/50 text-slate-400 border border-slate-700 h-10 rounded-xl cursor-not-allowed text-xs font-bold"
              >
                Já Utilizado
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/plans')}
                className="w-full bg-red-600 hover:bg-red-700 text-white border-none h-10 rounded-xl shadow-lg shadow-red-900/20 text-xs font-bold"
              >
                Reativar Assinatura
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* History Timeline */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-2">Histórico</h3>

        <Card className="border-none shadow-none bg-transparent">
          <CardBody className="p-0 space-y-4">
            {history.map((voucher) => (
              <div key={voucher.id} className="relative pl-8 before:absolute before:left-[11px] before:top-8 before:bottom-[-16px] before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800 last:before:hidden">
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center z-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500">
                      <Utensils size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Resgate de {new Date(voucher.created_at).toLocaleString('pt-BR', { month: 'long' })}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{voucher.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="relative pl-8">
              <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-hero-primary/20 flex items-center justify-center z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-hero-primary animate-pulse"></div>
              </div>
              <div className="p-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center py-6 gap-1">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-300">Próximo drop em breve</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[180px]">Aguarde o início do próximo mês.</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Voucher;
