import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import {
  Search,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';
import QrScanner from '../components/QrScanner';
import { staffService, StaffLookupResult } from '../services/staff.service';
import { supabase } from '../lib/supabaseClient';

const StaffValidate: React.FC = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  const [client, setClient] = useState<StaffLookupResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Modal "Entregue ✅"
  const [deliveredOpen, setDeliveredOpen] = useState(false);
  const [deliveredInfo, setDeliveredInfo] = useState<{ name: string; code: string } | null>(null);

  // Extrai código do herói OU CPF, mesmo se vier em URL
  const extractSearchTerm = (input: string): string | null => {
    if (!input) return null;
    const cleanInput = input.trim();

    const heroCodeMatch = cleanInput.match(/(BH-[A-Z0-9]+)/i);
    if (heroCodeMatch) return heroCodeMatch[1].toUpperCase();

    // CPF (mantém só dígitos)
    if (/^[\d.\-\/\s]+$/.test(cleanInput)) {
      const digits = cleanInput.replace(/\D/g, '');
      return digits.length ? digits : null;
    }

    return cleanInput.toUpperCase();
  };

  const forceRelogin = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    navigate('/auth'); // ajuste se sua rota for outra
  };

  const handleLookup = useCallback(async (rawValue: string) => {
    const term = extractSearchTerm(rawValue);
    if (!term) return;

    setLoading(true);
    setClient(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setQuery(term);

    try {
      const data = await staffService.lookupClient(term);
      if (data) {
        setClient(data);
      } else {
        setErrorMsg('Cliente não encontrado. Verifique o código do herói ou CPF.');
      }
    } catch (err: any) {
      console.error('Lookup failed:', err);

      if (err?.message === 'SESSION_EXPIRED') {
        setErrorMsg('Sua sessão expirou. Faça login novamente.');
        // faz relogin automático sem quebrar o app
        setTimeout(() => forceRelogin(), 700);
        return;
      }

      setErrorMsg(err?.message ? `Erro ao buscar cliente: ${err.message}` : 'Erro ao buscar cliente.');
    } finally {
      setLoading(false);
    }
  }, []);

  const onScan = (scannedText: string) => {
    setIsScannerOpen(false);
    handleLookup(scannedText);
  };

  const voucherIsAvailable = useMemo(() => {
    if (!client) return false;
    if (client.voucher_status) return client.voucher_status === 'available';
    return !!client.has_current_voucher;
  }, [client]);

  const getSubStatusUI = (active: boolean) =>
    active
      ? { text: 'Ativa', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 }
      : { text: 'Inativa/Pendente', color: 'text-red-600', bg: 'bg-red-100', icon: XCircle };

  const getVoucherStatusUI = (clientData: StaffLookupResult) => {
    if (!clientData.subscription_active) {
      return { text: 'Bloqueado', color: 'text-slate-400', bg: 'bg-slate-100', icon: ShieldAlert };
    }

    const st = clientData.voucher_status;
    if (st === 'available') {
      return { text: 'Disponível', color: 'text-blue-600', bg: 'bg-blue-100', icon: ShieldCheck };
    }
    if (st === 'redeemed') {
      return { text: 'Já Utilizado', color: 'text-amber-600', bg: 'bg-amber-100', icon: AlertTriangle };
    }
    if (st) {
      return { text: String(st), color: 'text-amber-600', bg: 'bg-amber-100', icon: AlertTriangle };
    }

    return clientData.has_current_voucher
      ? { text: 'Disponível', color: 'text-blue-600', bg: 'bg-blue-100', icon: ShieldCheck }
      : { text: 'Já Utilizado', color: 'text-amber-600', bg: 'bg-amber-100', icon: AlertTriangle };
  };

  const handleRedeem = async () => {
    if (!client) return;

    const okConfirm = confirm(`Confirmar entrega do burger para ${client.display_name}?`);
    if (!okConfirm) return;

    setRedeeming(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await staffService.redeemVoucherByCode(client.hero_code);

      if (res.ok) {
        // 3) Mensagem clara de entregue ✅
        setDeliveredInfo({ name: client.display_name, code: client.hero_code });
        setDeliveredOpen(true);

        setSuccessMsg('Resgate realizado com sucesso! ✅');

        // Atualiza status na tela
        await handleLookup(client.hero_code);
      } else {
        let msg = res.message;

        if (msg === 'session_expired') msg = 'Sua sessão expirou. Faça login novamente.';
        if (msg === 'subscription_inactive') msg = 'Assinatura do cliente não está ativa.';
        if (msg === 'no_voucher_available') msg = 'Cliente não possui voucher disponível para este mês.';
        if (msg === 'already_redeemed') msg = 'Voucher deste mês já foi resgatado.';
        if (msg === 'client_not_found') msg = 'Cliente não encontrado pelo código do herói.';

        setErrorMsg(msg);

        if (res.message === 'session_expired') {
          setTimeout(() => forceRelogin(), 700);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message ? `Erro ao processar resgate: ${err.message}` : 'Erro ao processar resgate.');
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">
          Validação <span className="text-hero-primary">Hero</span>
        </h2>
        <p className="text-slate-500 text-sm">Identifique o herói para liberar o benefício.</p>
      </div>

      <Card>
        <CardBody className="p-4 space-y-4">
          <Button
            size="lg"
            className="w-full h-14 text-lg rounded-2xl shadow-lg shadow-hero-primary/20"
            onClick={() => setIsScannerOpen(true)}
          >
            <QrCode size={24} className="mr-2" /> Escanear QR Code
          </Button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-400 uppercase">Ou digite</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup(query);
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Código do herói (BH-XXXX) ou CPF (apenas números)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rounded-xl h-12"
            />
            <Button
              type="submit"
              variant="secondary"
              isLoading={loading}
              className="rounded-xl w-14 h-12 flex items-center justify-center"
            >
              <Search size={20} />
            </Button>
          </form>
        </CardBody>
      </Card>

      {errorMsg && !client && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100 animate-in fade-in slide-in-from-top-2">
          <ShieldAlert size={24} />
          <p className="font-bold text-sm">{errorMsg}</p>
        </div>
      )}

      {client && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <Card className="overflow-hidden border-0 shadow-2xl">
            <div className="relative h-48 bg-slate-900 overflow-hidden">
              {client.card_image_url ? (
                <img
                  src={client.card_image_url}
                  alt="Background"
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800"></div>
              )}

              <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"></div>

              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                <div className="w-20 h-20 rounded-full border-[3px] border-white bg-slate-200 overflow-hidden shadow-xl mb-3 relative">
                  <img
                    src={client.avatar_url || `https://picsum.photos/seed/${client.user_id}/200`}
                    alt={client.display_name}
                    className="w-full h-full object-cover"
                  />
                  {client.subscription_active && (
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                <h3 className="text-xl font-black text-white drop-shadow-md leading-tight">{client.display_name}</h3>

                <div className="inline-block bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full mt-2">
                  <p className="text-xs font-mono font-bold text-white tracking-widest drop-shadow-sm">
                    {client.hero_code}
                  </p>
                </div>
              </div>
            </div>

            <CardBody className="p-6 space-y-6 bg-white dark:bg-slate-800">
              <div className="grid grid-cols-2 gap-4">
                {(() => {
                  const subUI = getSubStatusUI(client.subscription_active);
                  const voucherUI = getVoucherStatusUI(client);
                  const VoucherIcon = voucherUI.icon;

                  return (
                    <>
                      <div className={`p-3 rounded-xl border flex flex-col items-center text-center gap-2 ${subUI.bg} border-transparent`}>
                        <CreditCard size={20} className={subUI.color} />
                        <div>
                          <p className="text-[10px] font-bold uppercase text-slate-500 opacity-70">Assinatura</p>
                          <p className={`text-sm font-black ${subUI.color}`}>{subUI.text}</p>
                        </div>
                      </div>

                      <div className={`p-3 rounded-xl border flex flex-col items-center text-center gap-2 ${voucherUI.bg} border-transparent`}>
                        <VoucherIcon size={20} className={voucherUI.color} />
                        <div>
                          <p className="text-[10px] font-bold uppercase text-slate-500 opacity-70">Voucher Mês</p>
                          <p className={`text-sm font-black ${voucherUI.color}`}>{voucherUI.text}</p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {successMsg && (
                <div className="bg-green-50 text-green-700 p-4 rounded-xl text-center font-bold border border-green-200">
                  {successMsg}
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-center font-bold text-sm border border-red-200">
                  {errorMsg}
                </div>
              )}

              <div className="pt-2">
                <Button
                  size="lg"
                  className="w-full h-14 text-base rounded-2xl"
                  onClick={handleRedeem}
                  disabled={!client.subscription_active || !voucherIsAvailable || redeeming}
                  isLoading={redeeming}
                  variant={(!client.subscription_active || !voucherIsAvailable) ? 'secondary' : 'primary'}
                >
                  {redeeming ? 'Validando...' : 'Validar Resgate'}
                </Button>

                {(!client.subscription_active || !voucherIsAvailable) && (
                  <p className="text-center text-xs text-slate-400 mt-3 font-medium">
                    {!client.subscription_active ? 'Assinatura inativa. Oriente o cliente.' : 'Voucher indisponível ou já utilizado.'}
                  </p>
                )}
              </div>

              {client.cpf && (
                <div className="text-center border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-400">
                    CPF: ***.{client.cpf.slice(3, 6)}.{client.cpf.slice(6, 9)}-**
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      <Modal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} title="Escanear Cartão" size="fullscreen">
        <div className="w-full h-full flex flex-col relative bg-black">
          <div className="flex-1 relative">
            <QrScanner onScan={onScan} onError={(err) => console.log(err)} />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/30 rounded-3xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-hero-primary -translate-x-1 -translate-y-1"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-hero-primary translate-x-1 -translate-y-1"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-hero-primary -translate-x-1 translate-y-1"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-hero-primary translate-x-1 translate-y-1"></div>
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-900 text-center">
            <p className="text-white font-medium mb-4">Aponte para o QR Code do cliente</p>
            <Button variant="secondary" onClick={() => setIsScannerOpen(false)} className="w-full bg-slate-800 text-white border-slate-700">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Entregue ✅ */}
      <Modal isOpen={deliveredOpen} onClose={() => setDeliveredOpen(false)} title="Entregue com sucesso" size="md">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
            <CheckCircle2 className="text-green-600" />
            <div>
              <p className="font-black text-green-800">Voucher marcado como ENTREGUE ✅</p>
              {deliveredInfo && (
                <p className="text-sm text-green-700">
                  {deliveredInfo.name} • {deliveredInfo.code}
                </p>
              )}
            </div>
          </div>

          <Button className="w-full h-12 rounded-xl" onClick={() => setDeliveredOpen(false)}>
            Ok
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default StaffValidate;
