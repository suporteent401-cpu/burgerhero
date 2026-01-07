import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicProfileByCode, PublicProfile } from '../services/users.service';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loader2, AlertCircle, CheckCircle2, XCircle, Home } from 'lucide-react';

const PublicClientProfile: React.FC = () => {
  const { customerCode } = useParams<{ customerCode: string }>();
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <Loader2 className="w-10 h-10 text-hero-primary animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Buscando identidade...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Ops!</h2>
        <p className="text-slate-500 mb-6">{error || 'Perfil indisponível.'}</p>
        <Link to="/">
          <Button variant="outline"><Home size={16} className="mr-2" /> Voltar ao Início</Button>
        </Link>
      </div>
    );
  }

  const isActive = profile.subscription_status === 'active' || profile.subscription_status === 'ACTIVE';

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img 
            src="https://ik.imagekit.io/lflb43qwh/Heros/images.jpg" 
            alt="BurgerHero" 
            className="w-16 h-16 rounded-full mx-auto border-4 border-white shadow-lg mb-4" 
          />
          <h1 className="text-xl font-black text-slate-800 tracking-tight">
            Identidade <span className="text-hero-primary">Hero</span>
          </h1>
        </div>

        <Card className="overflow-hidden shadow-2xl border-0">
          {/* Header Colorido */}
          <div className={`h-32 ${isActive ? 'bg-hero-primary' : 'bg-slate-600'} relative`}>
             <div className="absolute inset-0 bg-black/10"></div>
             {isActive && (
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <CheckCircle2 size={12} /> Assinante
                </div>
             )}
          </div>

          <CardBody className="pt-0 relative px-6 pb-8 text-center">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4 inline-block">
              <div className="w-32 h-32 rounded-full border-[6px] border-white bg-slate-200 overflow-hidden shadow-md">
                <img 
                  src={profile.avatar_url || `https://picsum.photos/seed/${profile.customer_code}/200`} 
                  alt={profile.display_name} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className={`
                absolute bottom-2 right-2 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center text-white
                ${isActive ? 'bg-green-500' : 'bg-slate-400'}
              `}>
                {isActive ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              </div>
            </div>

            {/* Info */}
            <h2 className="text-2xl font-black text-slate-800 mb-1">{profile.display_name}</h2>
            <div className="inline-block bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 mb-6">
              <p className="font-mono font-bold text-slate-600 text-lg tracking-wider">
                {profile.customer_code}
              </p>
            </div>

            {/* Status Details */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status da Assinatura</p>
               <p className={`text-lg font-black ${isActive ? 'text-green-600' : 'text-slate-500'}`}>
                 {isActive ? 'ATIVA' : 'INATIVA'}
               </p>
               <p className="text-xs text-slate-400 mt-1">
                 Membro desde {new Date(profile.created_at).getFullYear()}
               </p>
            </div>

            {!isActive && (
              <div className="mt-6">
                <Link to="/plans">
                   <Button className="w-full rounded-xl">Quero ser Assinante</Button>
                </Link>
              </div>
            )}
          </CardBody>
        </Card>

        <p className="text-center text-slate-400 text-xs mt-8">
          BurgerHero &copy; {new Date().getFullYear()} • Perfil Público
        </p>
      </div>
    </div>
  );
};

export default PublicClientProfile;