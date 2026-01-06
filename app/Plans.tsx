import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { CheckCircle2, ChevronLeft, Star, ShieldCheck } from 'lucide-react';
import { fakeApi } from '../lib/fakeApi';
import { Plan } from '../types';
import { motion } from 'framer-motion';

const Plans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fakeApi.listPlans().then(setPlans);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-slate-500 font-bold hover:text-hero-primary transition-colors">
          <ChevronLeft size={20} /> Voltar
        </button>

        <div className="text-center mb-16">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {plans.map((plan, index) => {
            const isPopular = index === 1;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                className={`
                  relative rounded-3xl overflow-hidden shadow-xl transition-all duration-300
                  ${isPopular ? 'scale-[1.05] shadow-hero-primary/20' : 'hover:scale-[1.02]'}
                `}
              >
                {isPopular && (
                  <div className="absolute top-6 -right-12 transform rotate-45 bg-hero-primary text-white px-12 py-1.5 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Star size={14} fill="currentColor" />
                    Popular
                  </div>
                )}
                
                <div className={`p-8 ${isPopular ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                  <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                  <p className={`mb-8 h-10 ${isPopular ? 'text-slate-400' : 'text-slate-500'}`}>{plan.description}</p>
                  
                  <div className="mb-8">
                    <span className="text-5xl font-black">R$ {(plan.priceCents / 100).toFixed(2).replace('.', ',')}</span>
                    <span className={`ml-1 font-bold ${isPopular ? 'text-slate-400' : 'text-slate-500'}`}>/mês</span>
                  </div>

                  <Button 
                    onClick={() => navigate(`/checkout?planId=${plan.id}`)} 
                    className="w-full" 
                    size="lg"
                    variant={isPopular ? 'primary' : 'outline'}
                  >
                    Assinar Agora
                  </Button>
                </div>

                <div className={`p-8 ${isPopular ? 'bg-slate-800 text-white' : 'bg-slate-50'}`}>
                  <p className="font-bold mb-4 text-sm">O que está incluso:</p>
                  <ul className="space-y-3">
                    {plan.benefits.map((b, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-medium">
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

        <div className="mt-16 text-center flex items-center justify-center gap-3 text-slate-400 font-medium text-sm">
          <ShieldCheck size={18} />
          <span>Pagamento 100% seguro. Cancele quando quiser.</span>
        </div>
      </div>
    </div>
  );
};

export default Plans;