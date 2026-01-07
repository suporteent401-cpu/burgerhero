import React, { useEffect, useState, useRef } from 'react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useCardStore, CARD_TEMPLATES, FONT_OPTIONS, COLOR_OPTIONS } from '../store/cardStore';
import { LogOut, Palette, Moon, Sun, Monitor, CreditCard, CheckCircle2, Type, Camera, Pencil, Check, X, TextQuote, Download } from 'lucide-react';
import { HeroTheme, Subscription } from '../types';
import { fakeApi } from '../lib/fakeApi';
import HeroCard from '../components/HeroCard';
import { toPng } from 'html-to-image';
import { supabase } from '../lib/supabaseClient';
import { subscriptionMockService } from '../services/subscriptionMock.service';

const Profile: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  
  const heroTheme = useThemeStore(state => state.heroTheme);
  const setHeroTheme = useThemeStore(state => state.setHeroTheme);
  const mode = useThemeStore(state => state.mode);
  const setMode = useThemeStore(state => state.setMode);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Name Edit State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  
  // Card Store hooks
  const { 
    selectedTemplateId, 
    setTemplateId, 
    getSelectedTemplate,
    selectedFont,
    setFont,
    selectedColor,
    setColor,
    selectedFontSize,
    setFontSize
  } = useCardStore();

  const [sub, setSub] = useState<Subscription | null>(null);

  useEffect(() => {
    if (user?.id) {
      // Prioriza o mock para consistência com o checkout
      const mockSub = subscriptionMockService.getActiveSubscription(user.id);
      if (mockSub && mockSub.status === 'active') {
        setSub({
          status: 'active',
          currentPeriodStart: mockSub.startedAt,
          currentPeriodEnd: mockSub.nextBillingDate
        });
      } else {
        fakeApi.getSubscriptionStatus(user.id).then(setSub);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isEditingName && user?.name && user.name !== editName) {
      setEditName(user.name);
    }
  }, [user?.name, isEditingName, editName]);

  const themes: { name: HeroTheme, color: string, label: string }[] = [
    { name: 'sombra-noturna', color: '#1e40af', label: 'Sombra' },
    { name: 'guardiao-escarlate', color: '#ef4444', label: 'Escarlate' },
    { name: 'tita-dourado', color: '#f59e0b', label: 'Dourado' },
    { name: 'tempestade-azul', color: '#3b82f6', label: 'Tempestade' },
    { name: 'sentinela-verde', color: '#10b981', label: 'Sentinela' },
    { name: 'aurora-rosa', color: '#ec4899', label: 'Aurora' },
    { name: 'vermelho-heroi', color: '#FF0004', label: 'Herói' },
    { name: 'verde-neon', color: '#08FF01', label: 'Neon' },
    { name: 'laranja-vulcanico', color: '#FF4F02', label: 'Vulcão' },
    { name: 'azul-eletrico', color: '#0300FF', label: 'Elétrico' },
  ];

  const handleThemeChange = async (theme: HeroTheme) => {
    setHeroTheme(theme);
    if (user) {
      await fakeApi.updateUserTheme(user.id, theme);
      updateUser({ heroTheme: theme });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await fakeApi.updateUserAvatar(user.id, base64);
        updateUser({ avatarUrl: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveName = async () => {
    if (!user || !editName.trim()) return;
    updateUser({ name: editName });
    setIsEditingName(false);
    await fakeApi.updateUserProfile(user.id, { name: editName });
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditName(user?.name || '');
  };

  const handleExportCard = () => {
    if (cardRef.current === null) return;
    toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `burgerhero-card-${user?.name.replace(/\s/g, '-')}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Erro ao exportar cartão:', err);
        alert('Ocorreu um erro ao exportar o cartão.');
      });
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* CABEÇALHO DO PERFIL */}
      <div className="flex flex-col items-center">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-xl bg-slate-200 overflow-hidden relative">
            <img src={user?.avatarUrl || 'https://picsum.photos/seed/hero/200'} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <Camera size={24} className="text-white" />
          </div>
          <button 
            className="absolute bottom-0 right-0 bg-hero-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform pointer-events-none"
          >
            <Camera size={16} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
          />
        </div>
        
        {/* Edição de Nome */}
        <div className="mt-4 flex flex-col items-center w-full">
          {isEditingName ? (
             <div className="flex items-center justify-center gap-2 w-full max-w-[280px]">
                <input
                  className="bg-transparent border-b-2 border-hero-primary text-xl font-black text-center text-slate-800 dark:text-white focus:outline-none w-full px-2 py-1"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                />
                <div className="flex gap-1 shrink-0">
                  <button onClick={handleSaveName} className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                    <Check size={16}/>
                  </button>
                  <button onClick={handleCancelEdit} className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                    <X size={16}/>
                  </button>
                </div>
             </div>
          ) : (
            <div 
              className="flex items-center gap-2 group cursor-pointer p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors pr-3 pl-3"
              onClick={() => setIsEditingName(true)}
            >
              <h2 className="text-xl font-black dark:text-white">{user?.name}</h2>
              <Pencil size={14} className="text-slate-400 group-hover:text-hero-primary transition-colors" />
            </div>
          )}
          <p className="text-slate-400 font-medium text-sm mt-1">{user?.email}</p>
        </div>
      </div>

      {/* SEÇÃO: CARTÃO DO HERÓI */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400">
            <CreditCard size={14} /> Cartão do Herói
          </div>
        </CardHeader>
        <CardBody className="p-6 space-y-8">
          
          {/* 1. Escolha do Template */}
          <div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">Modelo:</p>
            <div className="grid grid-cols-3 gap-3">
              {CARD_TEMPLATES.map((template) => {
                const isSelected = selectedTemplateId === template.id;
                return (
                  <button
                    key={template.id}
                    onClick={() => setTemplateId(template.id)}
                    className={`
                      relative rounded-xl overflow-hidden transition-all duration-200 aspect-[1.586/1]
                      ${isSelected ? 'ring-4 ring-hero-primary shadow-lg scale-[1.02]' : 'ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-slate-300'}
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

          {/* 2. Personalização de Texto */}
          <div className="grid grid-cols-1 gap-6">
            
            {/* Fontes */}
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                <Type size={16} /> Tipografia:
              </p>
              <div className="flex flex-wrap gap-2">
                {FONT_OPTIONS.map((font) => (
                  <button
                    key={font.name}
                    onClick={() => setFont(font.value)}
                    style={{ fontFamily: font.value }}
                    className={`
                      px-3 py-2 rounded-lg text-sm border transition-all
                      ${selectedFont === font.value 
                        ? 'bg-hero-primary text-white border-hero-primary shadow-md' 
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'}
                    `}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Cores */}
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">Cor da Fonte:</p>
              <div className="flex flex-wrap gap-3">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setColor(color.value)}
                    className={`
                      w-10 h-10 rounded-full border-2 shadow-sm transition-all flex items-center justify-center relative group
                      ${selectedColor === color.value ? 'scale-110 ring-2 ring-offset-2 ring-hero-primary dark:ring-offset-slate-900' : 'hover:scale-105'}
                    `}
                    style={{ backgroundColor: color.value, borderColor: color.value === '#FFFFFF' ? '#e2e8f0' : 'transparent' }}
                    title={color.name}
                  >
                    {selectedColor === color.value && (
                      <CheckCircle2 
                        size={18} 
                        className="drop-shadow-md"
                        style={{ color: ['#FFFFFF', '#FCD34D', '#C0C0C0', '#00FFFF', '#39FF14', '#08FF01'].includes(color.value) ? '#000' : '#FFF' }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size Slider */}
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                <TextQuote size={16} /> Tamanho da Fonte: <span className="font-black text-hero-primary">{selectedFontSize}px</span>
              </p>
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold">A</span>
                <input
                  type="range"
                  min="16"
                  max="32"
                  step="1"
                  value={selectedFontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-hero-primary"
                />
                <span className="text-3xl font-bold">A</span>
              </div>
            </div>
          </div>

          {/* Prévia */}
          <div className="flex flex-col items-center border-t border-slate-50 dark:border-slate-800 pt-6">
             <div className="flex justify-between items-center w-full mb-4">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 self-start">Prévia Atual:</p>
                <Button onClick={handleExportCard} variant="outline" size="sm">
                  <Download size={14} className="mr-2" /> Exportar
                </Button>
             </div>
             <HeroCard 
               ref={cardRef}
               user={user} 
               imageUrl={getSelectedTemplate().imageUrl} 
               memberSince={sub?.currentPeriodStart}
               fontFamily={selectedFont}
               textColor={selectedColor}
               fontSize={selectedFontSize}
             />
          </div>

        </CardBody>
      </Card>

      {/* TEMA E APARÊNCIA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400">
              <Palette size={14} /> Tema
            </div>
          </CardHeader>
          <CardBody className="p-4">
            <div className="grid grid-cols-5 gap-2">
              {themes.map(t => (
                <button 
                  key={t.name}
                  onClick={() => handleThemeChange(t.name)}
                  className={`
                    flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all
                    ${heroTheme === t.name ? 'border-hero-primary bg-hero-primary/5 shadow-inner' : 'border-slate-50 dark:border-slate-800 hover:border-slate-100'}
                  `}
                >
                  <div className="w-6 h-6 rounded-full border dark:border-slate-600" style={{ backgroundColor: t.color }}></div>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400">
              <Monitor size={14} /> Modo
            </div>
          </CardHeader>
          <CardBody className="p-4 flex flex-col gap-2">
              <button 
                onClick={() => setMode('light')}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${mode === 'light' ? 'border-hero-primary text-hero-primary bg-hero-primary/5' : 'border-slate-50 dark:border-slate-800 text-slate-400'}`}
              >
                <Sun size={18} /> <span className="text-xs font-bold uppercase">Claro</span>
              </button>
              <button 
                onClick={() => setMode('dark')}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${mode === 'dark' ? 'border-hero-primary text-hero-primary bg-hero-primary/5' : 'border-slate-50 dark:border-slate-800 text-slate-400'}`}
              >
                <Moon size={18} /> <span className="text-xs font-bold uppercase">Escuro</span>
              </button>
          </CardBody>
        </Card>
      </div>

      <div className="pt-4">
        <Button variant="danger" className="w-full py-4 rounded-2xl" onClick={handleLogout}>
          <LogOut size={20} className="mr-2" /> Encerrar Sessão
        </Button>
      </div>
    </div>
  );
};

export default Profile;