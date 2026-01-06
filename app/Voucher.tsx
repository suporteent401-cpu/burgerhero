
import React, { useEffect, useState } from 'react';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { fakeApi } from '../lib/fakeApi';
import { MonthlyBenefit, Subscription } from '../types';
import { Ticket, Gift, AlertCircle, CheckCircle2 } from 'lucide-react';

const Voucher: React.FC = () => {
  const { user } = useAuthStore();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [benefit, setBenefit] = useState<MonthlyBenefit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const monthKey = new Date().toISOString().slice(0, 7);
      Promise.all([
        fakeApi.getSubscriptionStatus(user.id),
        fakeApi.getMonthlyBenefit(user.id, monthKey)
      ]).then(([s, b]) => {
        setSub(s);
        setBenefit(b);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading) return <div className="text-center p-10 font-bold text-slate-400">Consultando status...</div>;

  const isEligible = sub?.status === 'ACTIVE' && !benefit?.burgerRedeemed;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black">Resgate Mensal</h2>

      <Card className={`border-2 ${isEligible ? 'border-hero-primary' : 'border-slate-100'}`}>
        <CardBody className="p-8 text-center space-y-6">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${isEligible ? 'bg-hero-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
            <Ticket size={40} />
          </div>

          <div>
            <h3 className="text-xl font-black">
              {benefit?.burgerRedeemed ? 'Resgate Concluído!' : 'Seu Burger de Outubro'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {isEligible ? 'Você tem direito a 1 hambúrguer gratuito este mês.' : 'O benefício deste mês já foi utilizado ou sua assinatura está inativa.'}
            </p>
          </div>

          {!isEligible && benefit?.burgerRedeemed && (
            <div className="bg-green-50 p-4 rounded-xl flex items-center gap-3 text-green-700 text-left">
              <CheckCircle2 size={20} />
              <div>
                <p className="text-sm font-bold">Já Resgatado</p>
                <p className="text-xs">Data: {new Date(benefit.redeemedAt!).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          {!isEligible && !benefit?.burgerRedeemed && (
            <div className="bg-amber-50 p-4 rounded-xl flex items-center gap-3 text-amber-700 text-left">
              <AlertCircle size={20} />
              <div>
                <p className="text-sm font-bold">Assinatura Inativa</p>
                <p className="text-xs">Ative seu plano para liberar este benefício.</p>
              </div>
            </div>
          )}

          <Button 
            className="w-full" 
            size="lg" 
            disabled={!isEligible}
            onClick={() => alert('Para resgatar, mostre seu QR Code ao garçom!')}
          >
            <Gift className="mr-2" size={20} /> {isEligible ? 'Como Resgatar?' : 'Indisponível'}
          </Button>
        </CardBody>
      </Card>

      <div className="space-y-3">
        <h3 className="font-black text-slate-400 text-xs uppercase tracking-widest">Histórico de Resgates</h3>
        <Card>
          <CardBody className="p-0">
            <div className="p-5 flex items-center justify-center text-slate-400 text-sm font-medium">
               Nenhum resgate anterior encontrado.
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Voucher;
