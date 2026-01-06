import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { Maximize2, Copy, Check, Sun, Smartphone } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { motion } from 'framer-motion';

const QRCodePage: React.FC = () => {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const qrData = JSON.stringify({
    type: 'USER_QR',
    userId: user?.id,
    customerCode: user?.customerCode
  });

  const handleCopy = () => {
    if (user?.customerCode) {
      navigator.clipboard.writeText(user.customerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Carteira Digital</h2>
        <p className="text-slate-500 text-sm font-medium">Apresente para resgatar benefícios</p>
      </div>

      {/* Ticket Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative max-w-sm mx-auto"
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-hero-primary/20 blur-3xl rounded-full -z-10"></div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800">
          
          {/* Top Banner / Header do Ticket */}
          <div className="bg-hero-primary h-24 relative overflow-hidden">
             <div className="absolute inset-0 bg-black/10"></div>
             <div className="absolute -right-4 -top-8 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
             
             <div className="absolute top-4 left-0 right-0 flex justify-center">
                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2">
                   <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                   <span className="text-[10px] font-bold text-white uppercase tracking-widest">Assinante Ativo</span>
                </div>
             </div>
          </div>

          {/* Avatar e Conteúdo */}
          <div className="px-8 pb-8 -mt-10 flex flex-col items-center relative z-10">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full border-4 border-white dark:border-slate-900 bg-slate-200 overflow-hidden shadow-md mb-6">
               <img src={user?.avatarUrl || `https://picsum.photos/seed/${user?.id}/100`} alt="User" className="w-full h-full object-cover" />
            </div>

            {/* Nome */}
            <h3 className="text-xl font-black text-slate-800 dark:text-white text-center leading-tight mb-1">{user?.name}</h3>
            <p className="text-sm font-medium text-slate-400 mb-6">{user?.email}</p>

            {/* QR Code Box */}
            <div 
              className="bg-white p-4 rounded-2xl shadow-inner border border-slate-100 cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={() => setIsModalOpen(true)}
            >
              <QRCodeSVG value={qrData} size={180} level="H" includeMargin />
            </div>
            
            <p className="mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <Sun size={12} /> Aumente o brilho da tela
            </p>

            {/* Separator Dashed */}
            <div className="w-full my-6 border-t-2 border-dashed border-slate-200 dark:border-slate-800 relative">
               <div className="absolute -left-12 -top-3 w-6 h-6 bg-slate-50 dark:bg-slate-950 rounded-full"></div>
               <div className="absolute -right-12 -top-3 w-6 h-6 bg-slate-50 dark:bg-slate-950 rounded-full"></div>
            </div>

            {/* ID Section */}
            <div className="w-full">
              <p className="text-center text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">ID do Cliente</p>
              <div 
                onClick={handleCopy}
                className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl flex items-center justify-between cursor-pointer active:scale-95 transition-transform group"
              >
                 <span className="font-mono font-bold text-lg text-slate-700 dark:text-slate-200 tracking-wider pl-2">
                    {user?.customerCode}
                 </span>
                 <div className={`p-2 rounded-lg ${copied ? 'bg-green-100 text-green-600' : 'bg-white dark:bg-slate-700 text-slate-400 group-hover:text-hero-primary'}`}>
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                 </div>
              </div>
              <p className="text-center text-[10px] text-slate-400 mt-2 h-4">
                 {copied ? 'Código copiado!' : 'Toque para copiar'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4">
          <Button variant="secondary" className="w-full dark:bg-slate-800 dark:text-white" onClick={() => setIsModalOpen(true)}>
             <Maximize2 size={18} className="mr-2" /> Expandir QR Code
          </Button>
        </div>
      </motion.div>

      {/* Dicas Finais */}
      <div className="max-w-sm mx-auto text-center space-y-2 pb-6">
         <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Smartphone size={14} />
            <span>Aproxime do leitor no balcão</span>
         </div>
      </div>

      {/* Modal Fullscreen */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="QR Code" size="default">
        <div className="flex flex-col items-center space-y-8 py-8">
          <div className="p-6 bg-white rounded-3xl shadow-2xl">
            <QRCodeSVG value={qrData} size={280} level="H" includeMargin />
          </div>
          <div className="text-center">
             <h3 className="text-2xl font-black text-slate-800 mb-2">{user?.customerCode}</h3>
             <p className="text-slate-500 text-sm">Mostre este código ao atendente</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QRCodePage;