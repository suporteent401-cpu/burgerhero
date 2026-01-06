
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { Maximize2, ShieldCheck, Copy } from 'lucide-react';
import { Modal } from '../components/ui/Modal';

const QRCodePage: React.FC = () => {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const qrData = JSON.stringify({
    type: 'USER_QR',
    userId: user?.id,
    customerCode: user?.customerCode
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-black">Meu QR Code</h2>
        <p className="text-slate-500 text-sm">Apresente no balcão para validar seus benefícios</p>
      </div>

      <Card className="max-w-xs mx-auto">
        <CardBody className="p-8 flex flex-col items-center space-y-6">
          <div className="p-4 bg-slate-50 rounded-3xl">
            <QRCodeSVG value={qrData} size={200} level="H" includeMargin />
          </div>
          
          <div className="text-center">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Identificador Único</p>
            <h3 className="text-xl font-black text-hero-primary">{user?.customerCode}</h3>
          </div>

          <Button variant="outline" className="w-full" onClick={() => setIsModalOpen(true)}>
            <Maximize2 size={18} className="mr-2" /> Ampliar QR
          </Button>
        </CardBody>
      </Card>

      <div className="max-w-xs mx-auto space-y-4">
        <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100">
          <ShieldCheck size={20} />
          <p className="text-xs font-bold leading-tight">Código válido para resgate em todas as unidades BurgerHero.</p>
        </div>
        <button className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-slate-400 hover:text-slate-600">
          <Copy size={16} /> Copiar ID do Cliente
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Seu QR Code">
        <div className="flex flex-col items-center space-y-6">
          <div className="p-4 bg-slate-50 rounded-3xl w-full flex justify-center">
            <QRCodeSVG value={qrData} size={300} level="H" includeMargin />
          </div>
          <p className="text-sm font-medium text-slate-500 text-center">Aumente o brilho da tela se houver dificuldade na leitura.</p>
        </div>
      </Modal>
    </div>
  );
};

export default QRCodePage;
