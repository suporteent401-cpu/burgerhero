import React, { useMemo, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { useCardStore } from '../store/cardStore';
import { getSubscriptionStatus } from '../services/clientHome.service';
import { subscriptionMockService } from '../services/subscriptionMock.service';
import {
  Maximize2,
  Copy,
  Check,
  Sun,
  Smartphone,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const QRCodePage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const isLoadingAuth = useAuthStore((s) => s.isLoading);
  const selectedTemplateId = useCardStore((s) => s.selectedTemplateId);
  const availableTemplates = useCardStore((s) => s.availableTemplates);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [subStatus, setSubStatus] = useState<'active' | 'inactive' | 'loading'>('loading');

  // Busca o status real para exibir no QR
  useEffect(() => {
    if (user?.id) {
      const checkStatus = async () => {
        try {
          // Mock primeiro, depois banco
          const mockSub = subscriptionMockService.getActiveSubscription(user.id);
          if (mockSub && mockSub.status === 'active') {
            setSubStatus('active');
            return;
          }

          const data = await getSubscriptionStatus(user.id);
          const isDbActive = data?.status === 'active' || data?.status === 'ACTIVE';
          setSubStatus(isDbActive ? 'active' : 'inactive');
        } catch (e) {
          setSubStatus('inactive');
        }
      };

      checkStatus();
    }
  }, [user?.id]);

  const template = useMemo(() => {
    if (!availableTemplates?.length) return null;
    return availableTemplates.find((t) => t.id === selectedTemplateId) || availableTemplates[0] || null;
  }, [availableTemplates, selectedTemplateId]);

  const customerCode = user?.customerCode;

  const qrUrl = useMemo(() => {
    if (!customerCode) return '';

    // ✅ hash router correto:
    // Sempre gera: https://seu-dominio/#/public/client/CODIGO
    const origin = window.location.origin;
    return `${origin}/#/public/client/${customerCode}`;
  }, [customerCode]);

  const handleCopy = async () => {
    if (!customerCode) return;
    try {
      await navigator.clipboard.writeText(customerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoadingAuth || subStatus === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-hero-primary animate-spin" />
        <p className="mt-4 text-sm font-medium text-slate-500">Sincronizando identidade...</p>
      </div>
    );
  }

  if (!user || !customerCode) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
        <h3 className="font-black text-lg text-slate-700 dark:text-slate-200">Identidade Não Encontrada</h3>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          Não conseguimos localizar seu ID de Herói. Tente atualizar seu perfil.
        </p>
        <Link to="/app/profile">
          <Button variant="secondary">Verificar Perfil</Button>
        </Link>
      </div>
    );
  }

  const templateImageUrl = template?.imageUrl || 'https://picsum.photos/seed/hero-card/800/400';
  const isActive = subStatus === 'active';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Carteira Digital</h2>
        <p className="text-slate-500 text-sm font-medium">Apresente no balcão para resgate</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-sm mx-auto"
      >
        {/* Glow Effect */}
        <div
          className={`absolute inset-0 blur-3xl rounded-full -z-10 opacity-30 ${
            isActive ? 'bg-green-500' : 'bg-hero-primary'
          }`}
        ></div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800">
          {/* Top Banner */}
          <div className="h-32 relative overflow-hidden">
            <img
              src={templateImageUrl}
              alt="Bg"
              className="absolute inset-0 w-full h-full object-cover scale-125"
            />
            <div className="absolute inset-0 bg-black/40"></div>

            <div className="absolute top-4 inset-x-0 flex justify-center">
              <div
                className={`px-3 py-1 rounded-full backdrop-blur-md border border-white/20 flex items-center gap-2 ${
                  isActive ? 'bg-green-500/30' : 'bg-slate-500/30'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`}></div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  {isActive ? 'Assinatura Ativa' : 'Assinatura Inativa'}
                </span>
              </div>
            </div>
          </div>

          <div className="px-8 pb-8 -mt-12 flex flex-col items-center relative z-10">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full border-[6px] border-white dark:border-slate-900 bg-slate-200 overflow-hidden shadow-xl mb-4">
              <img
                src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/100`}
                alt="User"
                className="w-full h-full object-cover"
              />
            </div>

            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6">{user.name}</h3>

            {/* QR Code Container */}
            <div
              className="bg-white p-5 rounded-3xl shadow-inner border border-slate-100 relative group cursor-pointer"
              onClick={() => setIsModalOpen(true)}
            >
              <QRCodeSVG
                value={qrUrl}
                size={180}
                level="H"
                includeMargin={false}
                imageSettings={
                  isActive
                    ? {
                        src: 'https://ik.imagekit.io/lflb43qwh/Heros/images.jpg',
                        x: undefined,
                        y: undefined,
                        height: 40,
                        width: 40,
                        excavate: true,
                      }
                    : undefined
                }
              />

              {!isActive && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] rounded-3xl flex flex-col items-center justify-center p-4 text-center">
                  <ShieldAlert className="text-red-500 mb-2" size={32} />
                  <p className="text-[10px] font-black text-red-600 uppercase">Resgate Bloqueado</p>
                </div>
              )}
            </div>

            <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Sun size={12} className="text-amber-500" /> Aumente o brilho para escanear
            </p>

            <div className="w-full my-6 border-t-2 border-dashed border-slate-100 dark:border-slate-800"></div>

            {/* Manual Code */}
            <div className="w-full">
              <p className="text-center text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                ID do Herói
              </p>
              <div
                onClick={handleCopy}
                className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl flex items-center justify-between cursor-pointer active:scale-95 transition-all"
              >
                <span className="font-mono font-bold text-lg text-slate-700 dark:text-slate-200 tracking-widest pl-2">
                  {customerCode}
                </span>
                <div
                  className={`p-2 rounded-xl ${
                    copied ? 'bg-green-500 text-white' : 'bg-white dark:bg-slate-700 text-slate-400'
                  }`}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            variant="secondary"
            className="w-full py-4 rounded-2xl dark:bg-slate-800"
            onClick={() => setIsModalOpen(true)}
          >
            <Maximize2 size={18} className="mr-2" /> Tela Cheia
          </Button>

          {!isActive && (
            <Link to="/plans">
              <Button className="w-full py-4 rounded-2xl bg-red-500 hover:bg-red-600">
                <ShieldCheck size={18} className="mr-2" /> Ativar Plano
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      <div className="flex items-center justify-center gap-2 py-4 text-slate-400">
        <Smartphone size={16} />
        <span className="text-xs font-medium">Aproxime do leitor no balcão</span>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="QR Code de Resgate">
        <div className="flex flex-col items-center justify-center py-10 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl">
            <QRCodeSVG value={qrUrl} size={280} level="H" includeMargin />
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-slate-800">{customerCode}</p>
            <p className="text-slate-500 text-sm">Mostre este código ao atendente</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QRCodePage;
