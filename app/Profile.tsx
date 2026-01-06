import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useCardStore, CARD_TEMPLATES } from '../store/cardStore';
import { LogOut, Palette, Moon, Sun, Monitor, CreditCard, CheckCircle2 } from 'lucide-react';
import { HeroTheme, Subscription } from '../types';
import { fakeApi } from '../lib/fakeApi';
import HeroCard from '../components/HeroCard';

const Profile: React.FC = () => {
  const { user, logout, updateUser } = useAuthStore();
  const { heroTheme, setHeroTheme, mode, setMode } = useThemeStore();
  const { selectedTemplateId, setTemplateId, getSelectedTemplate } = useCardStore();
  const [sub, setSub] = useState<Subscription | null>(null);

  useEffect(() => {
    if (user) {
      fakeApi.getSubscriptionStatus(user.id).then(setSub);
    }
  }, [user]);

  const themes: { name: HeroTheme, color: string, label: string }[] = [
    { name: 'sombra-noturna', color: '#1e40af', label: 'Sombra' },
    { name: 'guardiao-escarlate', color: '#ef4444', label: 'Escarlate' },
    { name: 'tita-dourado', color: '#f59e0b', label: 'Dourado' },
    { name: 'tempestade-azul', color: '#3b82f6', label: 'Tempestade' },
    { name: 'sentinela-verde', color: '#10b981', label: 'Sentinela' },
    { name: 'aurora-rosa', color: '#ec4899', label: 'Aurora' },
  ];

  const handleThemeChange = async (theme: HeroTheme) => {
    setHeroTheme(theme);
    if (user) {
      await fakeApi.updateUserTheme(user.id, theme);
      updateUser({ heroTheme: theme });
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 rounded-3xl border-4 border-white shadow-xl bg-slate-200 overflow-hidden mb-4 relative">
          <img src={user?.avatarUrl || 'https://picsum.photos/seed/hero/200'} alt="Profile" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-xl font-black">{user?.name}</h2>
        <p className="text-slate-400 font-medium text-sm">{user?.email}</p>
      </div>

      {/* SEÇÃO: CARTÃO DO HERÓI */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400">
            <CreditCard size={14} /> Cartão do Herói
          </div>
        </CardHeader>
        <CardBody className="p-6 space-y-8">
          
          {/* Grid de Seleção */}
          <div>
            <p className="text-sm font-bold text-slate-500 mb-3">Escolha seu modelo:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CARD_TEMPLATES.map((template) => {
                const isSelected = selectedTemplateId === template.id;
                return (
                  <button
                    key={template.id}
                    onClick={() => setTemplateId(template.id)}
                    className={`
                      relative rounded-xl overflow-hidden transition-all duration-200 aspect-[1.586/1]
                      ${isSelected ? 'ring-4 ring-hero-primary shadow-lg scale-[1.02]' : 'ring-1 ring-slate-200 hover:ring-slate-300'}
                    `}
                  >
                    <img 
                      src={template.imageUrl} 
                      alt="Template" 
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-hero-primary/20 flex items-center justify-center">
                        <div className="bg-white rounded-full p-1 shadow-sm">
                          <CheckCircle2 size={16} className="text-hero-primary fill-white" />
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Prévia */}
          <div className="flex flex-col items-center border-t border-slate-50 pt-6">
             <p className="text-sm font-bold text-slate-500 mb-4 self-start">Prévia Atual:</p>
             <HeroCard 
               user={user} 
               imageUrl={getSelectedTemplate().imageUrl} 
               memberSince={sub?.currentPeriodStart}
             />
          </div>

        </CardBody>
      </Card>

      {/* TEMA HEROICO */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400">
            <Palette size={14} /> Tema do App
          </div>
        </CardHeader>
        <CardBody className="p-6">
          <div className="grid grid-cols-3 gap-3">
            {themes.map(t => (
              <button 
                key={t.name}
                onClick={() => handleThemeChange(t.name)}
                className={`
                  flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all
                  ${heroTheme === t.name ? 'border-hero-primary bg-hero-primary/5 shadow-inner' : 'border-slate-50 hover:border-slate-100'}
                `}
              >
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: t.color }}></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">{t.label}</span>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* APARÊNCIA */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400">
            <Monitor size={14} /> Aparência
          </div>
        </CardHeader>
        <CardBody className="p-4 flex gap-2">
            <button 
              onClick={() => setMode('light')}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 ${mode === 'light' ? 'border-hero-primary text-hero-primary' : 'border-slate-50 text-slate-400'}`}
            >
              <Sun size={18} /> <span className="text-xs font-bold uppercase">Claro</span>
            </button>
            <button 
              onClick={() => setMode('dark')}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 ${mode === 'dark' ? 'border-hero-primary text-hero-primary' : 'border-slate-50 text-slate-400'}`}
            >
              <Moon size={18} /> <span className="text-xs font-bold uppercase">Escuro</span>
            </button>
        </CardBody>
      </Card>

      <div className="pt-4">
        <Button variant="danger" className="w-full py-4 rounded-2xl" onClick={() => logout()}>
          <LogOut size={20} className="mr-2" /> Encerrar Sessão
        </Button>
      </div>
    </div>
  );
};

export default Profile;