import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { 
  QrCode, Lock, CheckCircle2, Calendar, Utensils, 
  Loader2, Clock, MapPin, ChevronRight, Ticket 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getCurrentVoucher, getVoucherHistory } from '../services/voucher.service';
import { subscriptionMockService } from '../services/subscriptionMock.service';

const Voucher: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [isSubActive, setIsSubActive] = useState<boolean>(false);
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

        setCurrentVoucher(voucherData);
        setIsSubActive(!!activeSub && activeSub.status === 'active');

        const pastVouchers = historyData.filter((v) => v.id !== voucherData?.id);
        setHistory(pastVouchers.slice(0, 5)); // Mostra os últimos 5
      } catch (error) {
        console.error('Erro ao buscar dados do voucher:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const hasVoucherThisMonth = !!currentVoucher;

  const isRedeemed = useMemo(() => {
    if (currentVoucher?.redeemed_at) return true;
    const redemptions = currentVoucher?.voucher_redemptions;
    if (Array.isArray(redemptions) && redemptions.length > 0) return true;
    return false;
  }, [currentVoucher]);

  const isEligible = isSubActive && hasVoucherThisMonth && !isRedeemed;

  const burgerImage =
    currentVoucher?.monthly_drop?.burger?.image_url ||
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

  const burgerName = currentVoucher?.monthly_drop?.burger?.name;
  const burgerDescription = currentVoucher?.monthly_drop?.burger?.description;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-slate-400">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-800 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-hero-primary animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Carregando Missão</p>
          <p className="text-xs">Sincronizando satélites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between px-1">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Drop Mensal</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={12} /> {capitalizedMonth} {currentYear}
            </span>
          </div>
        </div>
      </div>

      {/* Hero Card do Drop */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="relative group w-full aspect-[4/5] sm:aspect-[16/10] rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200 dark:shadow-black/50"
      >
        {/* Imagem de Fundo */}
        <div className="absolute inset-0 bg-slate-900">
          <img
            src={burgerImage}
            alt="Burger of the Month"
            className={`w-full h-full object-cover transition-transform duration-[2s] ease-out ${
              isEligible ? 'scale-105 group-hover:scale-110' : 'grayscale opacity-50 scale-100'
            }`}
          />
          {/* Gradientes para legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90"></div>
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent opacity-60"></div>
        </div>

        {/* Status Badge (Top Right) */}
        <div className="absolute top-5 right-5 z-20">
          {isRedeemed ? (
            <div className="bg-slate-900/90 backdrop-blur-md text-white border border-slate-700 pl-2 pr-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
              <div className="bg-green-500 rounded-full p-1"><CheckCircle2 size={12} className="text-white" /></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Resgatado</span>
            </div>
          ) : isEligible ? (
            <div className="bg-hero-primary/90 backdrop-blur-md text-white pl-2 pr-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-hero-primary/20 animate-pulse">
              <div className="bg-white rounded-full p-1"><Ticket size={12} className="text-hero-primary" /></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Disponível</span>
            </div>
          ) : !isSubActive ? (
            <div className="bg-red-600/90 backdrop-blur-md text-white pl-2 pr-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
              <div className="bg-white/20 rounded-full p-1"><Lock size={12} className="text-white" /></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Bloqueado</span>
            </div>
          ) : (
            <div className="bg-slate-800/80 backdrop-blur-md text-slate-300 border border-slate-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
              Em Breve
            </div>
          )}
        </div>

        {/* Conteúdo do Card */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-hero-primary text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
                Missão do Mês
              </span>
              {isEligible && (
                <span className="text-green-400 text-[10px] font-bold flex items-center gap-1">
                  <Clock size={10} /> Expira em breve
                </span>
              )}
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-[0.9] mb-3 tracking-tight">
              {isRedeemed ? 'Missão Cumprida' : burgerName || 'Drop Secreto'}
            </h1>
            
            <p className="text-slate-300 text-sm leading-relaxed max-w-md line-clamp-3">
              {isRedeemed
                ? `Você completou esta missão em ${new Date(currentVoucher?.redeemed_at || new Date()).toLocaleDateString()}. O QG agradece.`
                : burgerDescription || 'Aguarde o sinal para a revelação do próximo alvo gastronômico.'}
            </p>
          </div>

          <div className="pt-2">
            {isEligible ? (
              <Button
                onClick={() => navigate('/app/qrcode')}
                className="w-full bg-white text-slate-900 hover:bg-slate-100 hover:scale-[1.02] border-none h-14 rounded-2xl shadow-xl font-black text-sm uppercase tracking-wide transition-all"
              >
                <QrCode className="mr-2 text-hero-primary" size={20} /> Resgatar Agora
              </Button>
            ) : isRedeemed ? (
              <Button disabled className="w-full bg-slate-800/50 text-slate-400 border border-slate-700 h-14 rounded-2xl font-bold text-xs uppercase tracking-wide">
                Recompensa Obtida
              </Button>
            ) : !isSubActive ? (
              <Button
                onClick={() => navigate('/plans')}
                className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white border-none h-14 rounded-2xl shadow-lg shadow-red-900/30 font-black text-xs uppercase tracking-wide"
              >
                <Lock size={16} className="mr-2" /> Desbloquear Acesso
              </Button>
            ) : (
              <Button disabled className="w-full bg-slate-800/50 text-slate-500 border border-slate-700 h-14 rounded-2xl font-bold text-xs uppercase tracking-wide">
                Aguardando Drop
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Histórico / Log de Missões */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-1">
          <div className="w-1 h-4 bg-hero-primary rounded-full"></div>
          <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Log de Missões
          </h3>
        </div>

        <div className="relative pl-4 space-y-6">
          {/* Linha conectora */}
          <div className="absolute left-[27px] top-4 bottom-4 w-[2px] bg-slate-100 dark:bg-slate-800 rounded-full"></div>

          {history.length === 0 ? (
            <div className="relative pl-10 py-4 opacity-60">
               <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-full border-4 border-slate-50 dark:border-slate-950 z-10"></div>
               <p className="text-sm text-slate-400 font-medium">Nenhum registro anterior encontrado.</p>
            </div>
          ) : (
            history.map((voucher, idx) => {
              const date = new Date(voucher.created_at);
              const isRedeemedLog = voucher.status === 'redeemed';
              
              return (
                <motion.div 
                  key={voucher.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative pl-10 group"
                >
                  {/* Dot do Timeline */}
                  <div className={`
                    absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-4 border-slate-50 dark:border-slate-950 z-10 flex items-center justify-center
                    ${isRedeemedLog ? 'bg-green-500' : 'bg-slate-300'}
                  `}>
                    {isRedeemedLog && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRedeemedLog ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                        {isRedeemedLog ? <Utensils size={18} /> : <Ticket size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                          {voucher.monthly_drop?.burger?.name || 'Drop Arquivado'}
                        </p>
                        <p className="text-xs text-slate-400 font-medium mt-0.5 capitalize">
                          {date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                       <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${isRedeemedLog ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                         {isRedeemedLog ? 'Resgatado' : 'Expirado'}
                       </span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}

          {/* Item Futuro */}
          <div className="relative pl-10 opacity-50">
             <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-full border-4 border-slate-50 dark:border-slate-950 z-10"></div>
             <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                   <Clock size={16} />
                </div>
                <p className="text-xs font-bold text-slate-400">Próximo drop em breve...</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Voucher;