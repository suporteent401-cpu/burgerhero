import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPublicProfileByCode, PublicProfile } from '../services/users.service';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loader2, AlertCircle, CheckCircle2, XCircle, ChevronLeft, CreditCard } from 'lucide-react';

const StaffClientProfile: React.FC = () => {
  const { customerCode } = useParams<{ customerCode: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!customerCode) return;
      
      try {
        setLoading(true);
        const data = await getPublicProfileByCode(customerCode);
        
        if (data) {
          setProfile(data);
        } else {
          setError('Cliente não encontrado.');
        }
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar perfil.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [customerCode]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="w-10 h-10 text-hero-primary animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Carregando dados do herói...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-2">Cliente não identificado</h2>
        <p className="text-slate-500 mb-6">{error || 'Verifique o código e tente novamente.'}</p>
        <Button variant="outline" onClick={() => navigate('/staff/validate')}>
          <ChevronLeft size={16} className="mr-2" /> Voltar para Validação
        </Button>
      </div>
    );
  }

  const isActive = profile.subscription_status === 'active' || profile.subscription_status === 'ACTIVE';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/staff/validate')}>
          <ChevronLeft size={20} />
        </Button>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Perfil do Cliente</h2>
      </div>

      <Card className="overflow-hidden shadow-lg border-0">
        {/* Header Status */}
        <div className={`h-24 ${isActive ? 'bg-green-600' : 'bg-slate-600'} relative`}>
           <div className="absolute inset-0 bg-black/10"></div>
           <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
             {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
             {isActive ? 'Assinante Ativo' : 'Inativo'}
           </div>
        </div>

        <CardBody className="pt-0 relative px-6 pb-8 text-center">
          {/* Avatar */}
          <div className="relative -mt-12 mb-4 inline-block">
            <div className="w-24 h-24 rounded-full border-[4px] border-white bg-slate-200 overflow-hidden shadow-md">
              <img 
                src={profile.avatar_url || `https://picsum.photos/seed/${profile.customer_code}/200`} 
                alt={profile.display_name} 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>

          {/* Dados Principais */}
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-1">{profile.display_name}</h2>
          
          <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
            <CreditCard size={14} className="text-slate-400" />
            <span className="font-mono font-bold text-slate-600 dark:text-slate-300 tracking-wider">
              {profile.customer_code}
            </span>
          </div>

          {/* Detalhes Extras */}
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Membro Desde</p>
              <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plano Atual</p>
              <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                {isActive ? 'Hero Premium' : 'Nenhum'}
              </p>
            </div>
          </div>

        </CardBody>
      </Card>
      
      {/* Aqui poderiam entrar ações futuras como "Lançar Visita", "Histórico", etc. */}
      <div className="p-4 bg-blue-50 text-blue-800 rounded-xl text-sm text-center">
         <p>✨ Perfil carregado com sucesso pelo Staff.</p>
      </div>
    </div>
  );
};

export default StaffClientProfile;