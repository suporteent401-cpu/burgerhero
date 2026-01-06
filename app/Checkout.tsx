
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CreditCard, QrCode as QrIcon, ChevronLeft, ShieldCheck } from 'lucide-react';
import { fakeApi } from '../lib/fakeApi';
import { useAuthStore } from '../store/authStore';
import { Plan } from '../types';

const Checkout: React.FC = () => {
  const [params] = useSearchParams();
  const planId = params.get('planId');
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [method, setMethod] = useState<'card' | 'pix'>('card');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!planId) {
      navigate('/plans');
      return;
    }
    fakeApi.listPlans().then(plans => {
      const p = plans.find(x => x.id === planId);
      if (p) setPlan(p);
      else navigate('/plans');
    });
  }, [planId]);

  const handlePayment = async () => {
    if (!user || !planId) return;
    setLoading(true);
    try {
      await fakeApi.createCheckout(user.id, planId);
      navigate('/app?welcome=true');
    } catch (e) {
      alert('Erro ao processar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  if (!plan) return <div className="p-10 text-center">Carregando plano...</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-500 font-bold">
          <ChevronLeft size={20} /> Voltar
        </button>

        <h2 className="text-3xl font-black mb-8">Checkout Seguro</h2>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest">Resumo da Assinatura</h3>
            </CardHeader>
            <CardBody className="flex justify-between items-center">
              <div>
                <h4 className="text-lg font-black">{plan.name}</h4>
                <p className="text-sm text-slate-500">Cobrança Mensal</p>
              </div>
              <span className="text-xl font-black">R$ {(plan.priceCents / 100).toFixed(2).replace('.', ',')}</span>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest">Método de Pagamento</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <button 
                onClick={() => setMethod('card')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${method === 'card' ? 'border-hero-primary bg-hero-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className={method === 'card' ? 'text-hero-primary' : 'text-slate-400'} />
                  <span className="font-bold">Cartão de Crédito</span>
                </div>
                {method === 'card' && <div className="w-2 h-2 rounded-full bg-hero-primary" />}
              </button>
              <button 
                onClick={() => setMethod('pix')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${method === 'pix' ? 'border-hero-primary bg-hero-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
              >
                <div className="flex items-center gap-3">
                  <QrIcon className={method === 'pix' ? 'text-hero-primary' : 'text-slate-400'} />
                  <span className="font-bold">PIX Automático</span>
                </div>
                {method === 'pix' && <div className="w-2 h-2 rounded-full bg-hero-primary" />}
              </button>
            </CardBody>
            <CardFooter className="flex items-center gap-3 text-xs text-slate-400">
              <ShieldCheck size={16} /> Suas informações estão criptografadas e seguras.
            </CardFooter>
          </Card>

          <Button 
            className="w-full" 
            size="lg" 
            isLoading={loading}
            onClick={handlePayment}
          >
            Finalizar Assinatura
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
