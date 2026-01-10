import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { CheckCircle2, ChevronLeft, ShieldCheck, Loader2, Ban, XCircle } from 'lucide-react';
import type { Plan } from '../types';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { subscriptionMockService } from '../services/subscriptionMock.service';
import { plansService } from '../services/plans.service';
import { subscriptionsService } from '../services/subscriptions.service';

const Plans: React.FC = () => {
  const navigate = useNavigate();
  const isAuthed = useAuthStore((state) => state.isAuthed);
  const user = useAuthStore((state) => state.user);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const [myActiveSubPlanId, setMyActiveSubPlanId] = useState<string | null>(null);
  const [checkingSub, setCheckingSub] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const hasActiveSubscription = useMemo(() => !!myActiveSubPlanId, [myActiveSubPlanId]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const data = await plansService.listActivePlans();
        setPlans(data);
      } catch (err) {
        console.error('Erro ao carregar planos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!isAuthed || !user?.id) {
        setMyActiveSubPlanId(null);
        return;
      }

      try {
        setCheckingSub(true);
        const sub = await subscriptionsService.getMyActiveSubscription();
        setMyActiveSubPlanId(sub?.plan_id ?? null);
      } finally {
        setCheckingSub(false);
      }
    };
    run();
  }, [isAuthed, user?.id]);

  const handleSelectPlan = (plan: Plan) => {
    try {
      // Regra: se já tem plano ativo, não assina novamente
      if (hasActiveSubscription) {
        alert('Você já possui um plano ativo. No momento, você só pode cancelar.');
        return;
      }

      subscriptionMockService.setPendingPlan({
        id: plan.id,
        name: plan.name,
        priceCents: plan.priceCents,
      });

      if (isAuthed) navigate('/checkout');
      else navigate('/auth');
    } catch (err) {
      console.error('Erro ao selecionar plano:', err);
      alert('Não foi possível selecionar o plano. Tente novamente.');
    }
  };

  const handleCancel = async () => {
    if (!isAuthed) {
      navigate('/auth');
      return;
    }

    const ok = confirm('Tem certeza que deseja cancelar seu plano?');
    if (!ok) return;

    try {
      setCancelLoading(true);
      const res = await subscriptionsService.cancelMySubscription('cancelado_pelo_app');
      if (!res.ok) {
        alert(`Não foi possível cancelar agora (${res.message}).`);
        return;
      }

      alert('Plano cancelado com sucesso.');
      setMyActiveSubPlanId(null);
    } catch (e) {
      console.error(e);
      alert('Erro ao cancelar. Tente novamente.');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-slate-500 font-bold hover:text-hero-primary transition-colors"
        >
          <ChevronLeft size={20} /> Voltar
        </button>

        <div className="text-center mb-10">
          <motion.img
            src="https://ik.imagekit.io/lflb43qwh/Heros/images.jpg"
            alt="BurgerHero Logo"
            className="w-24 h-24 rounded-full mx-auto mb-8 border-4 border-white shadow-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-black mb-4 tracking-tighter"
          >
            Escolha sua patente de Herói
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-slate-500 max-w-lg mx-auto"
          >
            Assine e garanta seu burger sagrado todos os meses, além de descontos em toda a rede.
          </motion.p>
        </div>

        {/* Banner de status */}
        {isAuthed && (checkingSub ? (
          <div className="mb-10 flex items-center justify-center gap-2 text-slate-500 font-bold">
            <Loader2 className="w-4 h-4 animate-spin" /> Verificando assinatura...
          </div>
        ) : hasActiveSubscription ? (
          <div className="mb-10 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-bold">
              <Ban size={18} />
              Você já possui um plano ativo.
            </div>
            <Button
              onClick={handleCancel}
              isLoading={cancelLoading}
              className="rounded-xl"
              variant="secondary"
            >
              <XCircle size={18} />
              Cancelar plano
            </Button>
          </div>
        ) : null)}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 text-hero-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {plans.map((plan, index) => {
              const isMyPlan = hasActiveSubscription && myActiveSubPlanId === plan.id;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className="group relative rounded-[2.5rem] overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col"
                >
                  <div className="h-44 relative overflow-hidden bg-slate-800">
                    <img
                      src={
                        plan.imageUrl ||
                        'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={plan.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/10 to-transparent" />
                  </div>

                  <div className="p-8 pt-6 bg-slate-900 text-white flex-1 flex flex-col relative z-10">
                    <h3 className="text-3xl font-black mb-2 tracking-tight">{plan.name}</h3>
                    <p className="mb-8 text-slate-400 text-sm line-clamp-2 font-medium">{plan.description}</p>

                    <div className="mb-8">
                      <span className="text-5xl font-black">
                        R$ {(plan.priceCents / 100).toFixed(2).replace('.', ',')}
                      </span>
                      <span className="ml-1 font-bold text-slate-400">/mês</span>
                    </div>

                    {/* BOTÃO PRINCIPAL */}
                    {hasActiveSubscription ? (
                      <Button
                        disabled
                        className="w-full py-4 rounded-2xl opacity-70 cursor-not-allowed"
                        size="lg"
                        variant="primary"
                      >
                        {isMyPlan ? 'Plano ativo' : 'Indisponível (plano já ativo)'}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSelectPlan(plan)}
                        className="w-full py-4 rounded-2xl shadow-lg shadow-hero-primary/20"
                        size="lg"
                        variant="primary"
                      >
                        {isAuthed ? 'Assinar' : 'Cadastre-se para assinar'}
                      </Button>
                    )}
                  </div>

                  <div className="p-8 bg-slate-800 text-white">
                    <p className="font-bold mb-5 text-sm uppercase tracking-widest text-slate-400">O que está incluso:</p>
                    <ul className="space-y-4">
                      {plan.benefits.map((b, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-semibold text-slate-200">
                          <CheckCircle2 size={18} className="text-hero-primary flex-shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-16 text-center flex items-center justify-center gap-3 text-slate-400 font-medium text-sm">
          <ShieldCheck size={18} />
          <span>Pagamento 100% seguro. Cancele quando quiser.</span>
        </div>
      </div>
    </div>
  );
};

export default Plans;
