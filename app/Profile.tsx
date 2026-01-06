import React from 'react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { LogOut, Palette, Moon, Sun, Monitor, User as UserIcon } from 'lucide-react';
import { HeroTheme } from '../types';
import { fakeApi } from '../lib/fakeApi';

const Profile: React.FC = () => {
  const { user, logout, updateUser } = useAuthStore();
  const { heroTheme, setHeroTheme, mode, setMode } = useThemeStore();

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
    <div className="space-y-6">
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 rounded-3xl border-4 border-white shadow-xl bg-slate-200 overflow-hidden mb-4 relative">
          <img src={user?.avatarUrl || 'https://picsum.photos/seed/hero/200'} alt="Profile" className="w-full h-full object-cover" />
          <button className="absolute bottom-1 right-1 bg-hero-primary p-1.5 rounded-lg text-white shadow-lg">
            <UserIcon size={12} fill="currentColor" />
          </button>
        </div>
        <h2 className="text-xl font-black">{user?.name}</h2>
        <p className="text-slate-400 font-medium text-sm">{user?.email}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400">
            <Palette size={14} /> Tema Heroico
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