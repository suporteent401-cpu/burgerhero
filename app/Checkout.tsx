import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { CheckCircle2, CreditCard, QrCode } from "lucide-react";
import { subscriptionsService } from "../services/subscriptions.service";

type CheckoutState = {
  planSlug?: string;
  planName?: string;
  price?: number;
};

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const state = (location.state || {}) as CheckoutState;

  const plan = useMemo(() => {
    const planSlug = state.planSlug || "vingador";
    const planName = state.planName || "Plano Vingador";
    const price = typeof state.price === "number" ? state.price : 49.9;
    return { planSlug, planName, price };
  }, [state.planName, state.planSlug, state.price]);

  const [method, setMethod] = useState<"card" | "pix">("card");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleFinish = async () => {
    setErrorMsg("");
    setLoading(true);

    try {
      // 1) Atualiza status baseado em vencimento (boa prática)
      await subscriptionsService.refreshMyStatus();

      // 2) MOCK: considera o pagamento aprovado e ativa por 30 dias
      await subscriptionsService.activateMock(plan.planSlug, 30);

      // 3) Vai pro app e deixa o usuário “ativo”
      navigate("/app", { replace: true });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "Não foi possível finalizar a assinatura.");
    } finally {
      setLoading(false);
    }
  };

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
        >
          {loading ? "Ativando..." : "Finalizar Assinatura"}
        </Button>

        <div className="text-center text-xs text-slate-400">
          Próximo passo: integrar gateway (webhook) para ativação real.
        </div>
      </div>
    </div>
  );
};

export default Checkout;
