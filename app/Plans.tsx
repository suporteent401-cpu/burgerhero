import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CheckCircle2, ChevronLeft, Star, ShieldCheck } from 'lucide-react';
import { fakeApi } from '../lib/fakeApi';
import { Plan } from '../types';

const Plans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fakeApi.listPlans().then(setPlans);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-slate-500 font-bold hover:text-hero-primary transition-colors">
          <ChevronLeft size={20} /> Voltar
        </button>

        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-4">Escolha sua patente de Herói</h2>
          <p className="text-slate-500 max-w-lg mx-auto">Assine um plano e garanta seu burger sagrado todos os meses, além de descontos em toda a rede.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {plans.map((plan, index) => {
            const isPopular = index === 1; // Highlighting the second plan
            return (
              <Card 
                key={plan.id} 
                className={`
                  relative flex flex-col transition-all duration-300
                  ${isPopular ? 'border-2 border-hero-primary scale-[1.03] shadow-2xl shadow-hero-primary/10' : 'hover:scale-[1.02]'}
                `}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-hero-primary text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Star size={14} fill="currentColor" />
                    Mais Popular
                  </div>
                )}

                <CardHeader className="p-0 h-48">
                   <img src={plan.imageUrl} className="w-full h-full object-cover" alt={plan.name} />
                </CardHeader>
                <CardBody className="flex-1 p-8">
                  <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-black">R$ {(plan.priceCents / 100).toFixed(2).replace('.', ',')}</span>
                    <span className="text-slate-400 font-bold">/mês</span>
                  </div>
                  <p className="text-slate-600 mb-8 font-medium">{plan.description}</p>
                  
                  <div className="space-y-3 mb-10">
                    {plan.benefits.map((b, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                        <CheckCircle2 size={18} className="text-hero-primary" />
                        {b}
                      </div>
                    ))}
                  </div>
                </CardBody>
                <div className="p-8 pt-0 mt-auto">
                  <Button 
                    onClick={() => navigate(`/checkout?planId=${plan.id}`)} 
                    className="w-full" 
                    size="lg"
                    variant={isPopular ? 'primary' : 'outline'}
                  >
                    Assinar Agora
                  </Button>
                </div>
              </Card>
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