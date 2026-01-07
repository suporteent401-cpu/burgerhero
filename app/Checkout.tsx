import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { CheckCircle2, CreditCard, QrCode } from "lucide-react";
import { subscriptionsService } from "../services/subscriptions.service";

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Checkout: React.FC = () => {
  const navigate = useNavigate();

  const [plan, setPlan] = useState<{ planSlug: string; planName: string; price: number } | null>(null);
  const [method, setMethod] = useState<"card" | "pix">("card");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const pendingPlanJSON = localStorage.getItem('pending_plan');
    if (!pendingPlanJSON) {
      navigate('/plans', { replace: true });
      return;
    }
    
    try {
      const pendingPlan = JSON.parse(pendingPlanJSON);
      setPlan({
        planSlug: pendingPlan.planId,
        planName: pendingPlan.planName,
        price: pendingPlan.priceCents / 100,
      });
    } catch (e) {
      console.error("Falha ao parsear o plano pendente", e);
      localStorage.removeItem('pending_plan');
      navigate('/plans', { replace: true });
    }
  }, [navigate]);

  const handleFinish = async () => {
    if (!plan) return;

    setErrorMsg("");
    setLoading(true);

    try {
      await subscriptionsService.refreshMyStatus();
      await subscriptionsService.activateMock(plan.planSlug, 30);
      
      localStorage.removeItem('pending_plan');
      navigate("/app", { replace: true });
    } catch (err: any)
    {
      console.error(err);
      setErrorMsg(err?.message || "Não foi possível finalizar a assinatura.");
    } finally {
      setLoading(false);
    }
  };

  if (!plan) {
    return (
      <div className="min-h-[calc(100vh-40px)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-hero-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-40px)] flex items-start justify-center px-4 py-8">
      <div className="w-full max-w-[520px] space-y-4">
        <Card>
          <CardHeader>
            <div className="text-xs uppercase tracking-widest font-black text-slate-400">
              Resumo da Assinatura
            </div>
          </CardHeader>
          <CardBody className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  {plan.planName}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Cobrança mensal
                </div>
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                {formatBRL(plan.price)}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <CheckCircle2 size={14} className="text-emerald-500" />
              Por enquanto, este checkout aprova automaticamente (modo mock).
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-xs uppercase tracking-widest font-black text-slate-400">
              Método de Pagamento
            </div>
          </CardHeader>
          <CardBody className="p-5 space-y-3">
            <button
              type="button"
              onClick={() => setMethod("card")}
              className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                method === "card"
                  ? "border-hero-primary"
                  : "border-slate-100 dark:border-slate-800 hover:border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard size={18} />
                <span className="font-bold">Cartão de Crédito</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${method === "card" ? "bg-hero-primary" : "bg-slate-300"}`} />
            </button>

            <button
              type="button"
              onClick={() => setMethod("pix")}
              className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                method === "pix"
                  ? "border-hero-primary"
                  : "border-slate-100 dark:border-slate-800 hover:border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <QrCode size={18} />
                <span className="font-bold">PIX Automático</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${method === "pix" ? "bg-hero-primary" : "bg-slate-300"}`} />
            </button>

            <div className="pt-2 text-xs text-slate-400 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              Suas informações estarão criptografadas (quando plugar gateway real).
            </div>
          </CardBody>
        </Card>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 text-red-700 border border-red-200 text-sm">
            {errorMsg}
          </div>
        )}

        <Button
          className="w-full py-4 rounded-2xl"
          onClick={handleFinish}
          disabled={loading}
          isLoading={loading}
        >
          {loading ? "Ativando..." : `Finalizar Assinatura - ${formatBRL(plan.price)}`}
        </Button>

        <div className="text-center text-xs text-slate-400">
          Próximo passo: integrar gateway (webhook) para ativação real.
        </div>
      </div>
    </div>
  );
};

export default Checkout;