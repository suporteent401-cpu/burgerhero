
import React, { useState } from 'react';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Search, QrCode, ShieldCheck, ShieldAlert, CheckCircle, User as UserIcon } from 'lucide-react';
import { fakeApi } from '../lib/fakeApi';
import { User } from '../types';

const StaffValidate: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; user?: User } | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerInput, setScannerInput] = useState('');

  const handleValidate = async (val: string) => {
    if (!val) return;
    setLoading(true);
    const res = await fakeApi.staffValidateByPayload(val);
    setResult(res);
    setLoading(false);
  };

  const confirmRedeem = async () => {
    if (!result?.user) return;
    try {
      await fakeApi.redeemMonthlyBurger(result.user.id);
      alert('Resgate realizado com sucesso!');
      setResult(null);
      setQuery('');
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4">
      <div className="max-w-xl mx-auto w-full pt-10">
        <h2 className="text-3xl font-black mb-2 text-center">Validação de <span className="text-hero-primary">Herói</span></h2>
        <p className="text-slate-500 text-center mb-10">Escaneie o QR Code ou busque pelo CPF/ID.</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
           <Button className="h-24 flex flex-col gap-2 rounded-3xl" onClick={() => setIsScannerOpen(true)}>
              <QrCode size={28} />
              <span className="text-xs uppercase font-black">Abrir Scanner</span>
           </Button>
           <div className="bg-white border-2 border-slate-100 rounded-3xl p-4 flex flex-col justify-center items-center text-center">
              <span className="text-2xl font-black text-slate-800 tracking-tighter">00/00</span>
              <span className="text-[10px] uppercase font-black text-slate-400">Resgates Hoje</span>
           </div>
        </div>

        <div className="flex gap-2 mb-10">
          <Input 
            placeholder="CPF ou Código HE..." 
            value={query} 
            onChange={e => setQuery(e.target.value)}
          />
          <Button variant="secondary" onClick={() => handleValidate(query)} isLoading={loading}>
            <Search size={20} />
          </Button>
        </div>

        {result && (
          <Card className={`border-4 ${result.success ? 'border-green-500' : 'border-red-500'}`}>
            <CardBody className="p-8 flex flex-col items-center text-center space-y-6">
              {result.success ? (
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <ShieldCheck size={32} />
                </div>
              ) : (
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                  <ShieldAlert size={32} />
                </div>
              )}

              <div>
                <h3 className={`text-2xl font-black ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  {result.success ? 'APTO PARA RESGATE' : 'NÃO APTO'}
                </h3>
                <p className="font-bold text-slate-500">{result.message}</p>
              </div>

              {result.user && (
                <div className="w-full bg-slate-50 p-4 rounded-2xl flex items-center gap-4 text-left">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl overflow-hidden">
                    <img src={result.user.avatarUrl || `https://picsum.photos/seed/${result.user.id}/100`} alt="" />
                  </div>
                  <div>
                    <p className="text-sm font-black">{result.user.name}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{result.user.customerCode}</p>
                  </div>
                </div>
              )}

              {result.success && (
                <Button className="w-full bg-green-500 hover:bg-green-600" size="lg" onClick={confirmRedeem}>
                   <CheckCircle size={20} className="mr-2" /> Confirmar Resgate
                </Button>
              )}
              
              <Button variant="ghost" onClick={() => setResult(null)}>Cancelar</Button>
            </CardBody>
          </Card>
        )}
      </div>

      <Modal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} title="Simulador de Scanner">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Cole aqui o conteúdo do QR Code (JSON) ou o código do cliente:</p>
          <Input 
            autoFocus
            placeholder="Conteúdo do QR..." 
            value={scannerInput} 
            onChange={e => setScannerInput(e.target.value)}
          />
          <Button className="w-full" onClick={() => { handleValidate(scannerInput); setIsScannerOpen(false); setScannerInput(''); }}>
            Simular Leitura
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default StaffValidate;
