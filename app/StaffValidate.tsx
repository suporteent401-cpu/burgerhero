import React, { useState, useCallback } from 'react';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Search, QrCode, ShieldCheck, ShieldAlert, CheckCircle, Award } from 'lucide-react';
import { fakeApi } from '../lib/fakeApi';
import { User } from '../types';
import QrScanner from '../components/QrScanner';

const StaffValidate: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; user?: User } | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleValidate = useCallback(async (val: string) => {
    if (!val) return;
    setLoading(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 500)); // Simulate network delay
    const res = await fakeApi.staffValidateByPayload(val);
    setResult(res);
    setLoading(false);
  }, []);

  const handleScanSuccess = useCallback((decodedText: string) => {
    setIsScannerOpen(false);
    setQuery(decodedText);
    handleValidate(decodedText);
  }, [handleValidate]);

  const confirmRedeem = async () => {
    if (!result?.user) return;
    try {
      await fakeApi.redeemMonthlyBurger(result.user.id);
      setFeedback({ type: 'success', message: 'Resgate realizado com sucesso!' });
      setResult(null);
      setQuery('');
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Ocorreu um erro desconhecido.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 pt-12">
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <img 
            src="https://ik.imagekit.io/lflb43qwh/Heros/images.jpg" 
            alt="BurgerHero Logo" 
            className="w-24 h-24 rounded-full mx-auto mb-6 border-4 border-white shadow-lg" 
          />
          <h2 className="text-3xl font-black text-slate-800">Validação de <span className="text-hero-primary">Herói</span></h2>
          <p className="text-slate-500 mt-1">Escaneie o QR Code ou busque pelo CPF/ID.</p>
        </div>

        <Card className="mb-6">
          <CardBody className="p-6 space-y-4">
            <Button size="lg" className="w-full flex items-center justify-center gap-3 rounded-2xl" onClick={() => setIsScannerOpen(true)}>
              <QrCode size={24} />
              <span className="text-base">Escanear QR Code</span>
            </Button>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Ou</span></div>
            </div>

            <div className="flex gap-2">
              <Input 
                placeholder="Buscar por CPF ou Código HE..." 
                value={query} 
                onChange={e => setQuery(e.target.value)}
                className="rounded-2xl"
              />
              <Button variant="secondary" onClick={() => handleValidate(query)} isLoading={loading} className="rounded-2xl">
                <Search size={20} />
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card className="mb-8 bg-slate-900 text-white">
          <CardBody className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award size={20} className="text-hero-primary" />
              <span className="font-bold text-sm">Resgates no Turno</span>
            </div>
            <span className="text-2xl font-black tracking-tighter">14</span>
          </CardBody>
        </Card>

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
              
              <Button variant="ghost" onClick={() => setResult(null)}>Fechar</Button>
            </CardBody>
          </Card>
        )}
      </div>

      <Modal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} title="Aponte para o QR Code" size="fullscreen">
        <div className="w-full h-full flex flex-col items-center justify-center relative">
          <QrScanner onScan={handleScanSuccess} />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent text-center">
            <Button variant="secondary" onClick={() => setIsScannerOpen(false)} className="bg-white/90 text-slate-800 border-slate-200 hover:bg-white">
              Usar digitação manual
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={feedback !== null} onClose={() => setFeedback(null)} title={feedback?.type === 'success' ? 'Operação Concluída' : 'Atenção'}>
        <div className="flex flex-col items-center text-center p-4 space-y-4">
          {feedback?.type === 'success' ? (
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle size={32} />
            </div>
          ) : (
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <ShieldAlert size={32} />
            </div>
          )}
          <p className="text-lg font-bold text-slate-800">{feedback?.message}</p>
          <Button onClick={() => setFeedback(null)} className="w-full !mt-6">
            OK
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default StaffValidate;