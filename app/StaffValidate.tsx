import React, { useState, useCallback } from 'react';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Search, QrCode, ShieldCheck, ShieldAlert, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import QrScanner from '../components/QrScanner';
import { validateVoucher } from '../services/redemption.service';
import { getUserProfileById } from '../services/users.service';

const StaffValidate: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; user?: User } | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const navigate = useNavigate();

  const handleValidate = useCallback(async (val: string) => {
    if (!val) return;
    const input = val.trim();

    // 1. Verificar se é uma URL de Perfil Público ou Código BH Direto
    // Ex: .../#/public/client/BH-12345 ou apenas BH-12345
    let extractedCode = null;

    if (input.includes('/public/client/')) {
      const parts = input.split('/public/client/');
      if (parts[1]) extractedCode = parts[1].split('?')[0].split('#')[0]; // Limpa sufixos
    } else if (input.toUpperCase().startsWith('BH-')) {
      extractedCode = input.toUpperCase();
    }

    // Se for um código de cliente, redireciona para o perfil (não valida voucher)
    if (extractedCode) {
      navigate(`/staff/client/${extractedCode}`);
      return;
    }

    // 2. Se não for perfil, assume que é tentativa de resgate de Voucher (QR Token ou Hero Code legado)
    setLoading(true);
    setResult(null);

    let rpcResult;
    try {
      const isQrData = input.startsWith('{') && input.endsWith('}');
      const qrToken = isQrData ? input : undefined;
      const heroCode = isQrData ? undefined : input;
      
      const data = await validateVoucher(qrToken, heroCode);
      rpcResult = data[0];

    } catch (error: any) {
      setResult({ success: false, message: error.message || 'Ocorreu um erro inesperado.' });
      setLoading(false);
      return;
    }

    if (!rpcResult) {
      setResult({ success: false, message: 'Resposta inválida do servidor.' });
      setLoading(false);
      return;
    }

    let userProfile: User | null = null;
    if (rpcResult.user_id) {
      const profileData = await getUserProfileById(rpcResult.user_id);
      if (profileData) {
        userProfile = {
          id: profileData.user_id,
          name: profileData.display_name,
          customerCode: profileData.hero_code,
          avatarUrl: profileData.avatar_url,
          email: profileData.email || '',
          cpf: '', whatsapp: '', birthDate: '', role: 'CLIENT', heroTheme: 'sombra-noturna',
        };
      }
    }
    
    setResult({
      success: rpcResult.ok,
      message: rpcResult.message,
      user: userProfile || undefined,
    });

    setLoading(false);
  }, [navigate]);

  const handleScanSuccess = useCallback((decodedText: string) => {
    setIsScannerOpen(false);
    setQuery(''); // Limpa o campo após o scan
    handleValidate(decodedText);
  }, [handleValidate]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 pt-12">
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <img 
            src="https://ik.imagekit.io/lflb43qwh/Heros/images.jpg" 
            alt="BurgerHero Logo" 
            className="w-24 h-24 rounded-full mx-auto mb-6 border-4 border-white shadow-lg" 
          />
          <h2 className="text-3xl font-black text-slate-800">Leitor <span className="text-hero-primary">Hero</span></h2>
          <p className="text-slate-500 mt-1">Valide vouchers ou veja perfis de clientes.</p>
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

            <form onSubmit={(e) => { e.preventDefault(); handleValidate(query); }} className="flex gap-2">
              <Input 
                placeholder="Ex: BH-12345" 
                value={query} 
                onChange={e => setQuery(e.target.value)}
                className="rounded-2xl"
              />
              <Button type="submit" variant="secondary" isLoading={loading} className="rounded-2xl">
                <Search size={20} />
              </Button>
            </form>
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
                  {result.success ? 'RESGATE CONFIRMADO' : 'FALHA NO RESGATE'}
                </h3>
                <p className="font-bold text-slate-500">{result.message}</p>
              </div>

              {result.user && (
                <div className="w-full bg-slate-50 p-4 rounded-2xl flex items-center gap-4 text-left cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => navigate(`/staff/client/${result.user?.customerCode}`)}>
                  <div className="w-12 h-12 bg-slate-200 rounded-xl overflow-hidden">
                    <img src={result.user.avatarUrl || `https://picsum.photos/seed/${result.user.id}/100`} alt={result.user.name} />
                  </div>
                  <div>
                    <p className="text-sm font-black">{result.user.name}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{result.user.customerCode}</p>
                  </div>
                </div>
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
    </div>
  );
};

export default StaffValidate;