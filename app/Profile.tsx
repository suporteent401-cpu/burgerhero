import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useCardStore, FONT_OPTIONS, COLOR_OPTIONS } from '../store/cardStore';
import { LogOut, Palette, Moon, Sun, Monitor, CreditCard, CheckCircle2, Type, Camera, Pencil, Check, X, TextQuote, Download, Fingerprint, Loader2, Save, RotateCcw, AlertTriangle } from 'lucide-react';
import { HeroTheme, Subscription } from '../types';
import { fakeApi } from '../lib/fakeApi';
import { supabase } from '../lib/supabaseClient';
import { 
  updateProfileName, 
  uploadAvatar, 
  updateCardSettings
} from '../services/users.service';
import { templatesService } from '../services/templates.service';
import HeroCard from '../components/HeroCard';
import { toPng } from 'html-to-image';
import { subscriptionMockService } from '../services/subscriptionMock.service';

// Estrutura para o estado de rascunho e salvo
interface CardSettings {
  templateId: string;
  fontFamily: string;
  fontColor: string;
  fontSize: number;
  heroTheme: HeroTheme;
  mode: 'light' | 'dark' | 'system';
}

const Profile: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  
  // Stores globais representam o estado "salvo"
  const { heroTheme, setHeroTheme, mode, setMode } = useThemeStore();
  const { 
    selectedTemplateId, 
    selectedFont, 
    selectedColor, 
    selectedFontSize,
    setAll: setAllCardSettings, 
    setTemplates, 
    availableTemplates 
  } = useCardStore();

  // Estado local para o "rascunho"
  const [draft, setDraft] = useState<CardSettings | null>(null);
  
  // Outros estados locais
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Carrega configurações na montagem do componente
  useEffect(() => {
    if (user?.id) {
      // Carrega templates de cartão disponíveis
      templatesService.getActiveTemplates().then(dbTemplates => {
        const mapped = templatesService.mapToStoreFormat(dbTemplates);
        setTemplates(mapped);
      });

      // Carrega status da assinatura
      const mockSub = subscriptionMockService.getActiveSubscription(user.id);
      if (mockSub?.status === 'active') {
        setSub({ status: 'active', currentPeriodStart: mockSub.startedAt, currentPeriodEnd: mockSub.nextBillingDate });
      } else {
        fakeApi.getSubscriptionStatus(user.id).then(setSub);
      }

      // Inicializa o estado de rascunho
      const storageKey = `burgerhero_card_settings_${user.id}`;
      const savedLocal = localStorage.getItem(storageKey);
      let initialSettings: CardSettings;

      if (savedLocal) {
        try {
          initialSettings = JSON.parse(savedLocal);
          // Sincroniza o store global com o que estava salvo localmente
          setAllCardSettings({ templateId: initialSettings.templateId, font: initialSettings.fontFamily, color: initialSettings.fontColor, fontSize: initialSettings.fontSize });
          setHeroTheme(initialSettings.heroTheme);
          setMode(initialSettings.mode as any);
        } catch (e) {
          initialSettings = getSettingsFromStore();
        }
      } else {
        initialSettings = getSettingsFromStore();
      }
      setDraft(initialSettings);
    }
  }, [user?.id]);

  // Helper para obter o estado "salvo" atual dos stores
  const getSettingsFromStore = (): CardSettings => ({
    templateId: selectedTemplateId,
    fontFamily: selectedFont,
    fontColor: selectedColor,
    fontSize: selectedFontSize,
    heroTheme: heroTheme,
    mode: mode,
  });

  // Verifica se há alterações não salvas
  const hasUnsavedChanges = useMemo(() => {
    if (!draft) return false;
    const saved = getSettingsFromStore();
    return JSON.stringify(draft) !== JSON.stringify(saved);
  }, [draft, selectedTemplateId, selectedFont, selectedColor, selectedFontSize, heroTheme, mode]);

  // Handlers
  const updateDraft = (key: keyof CardSettings, value: any) => {
    setDraft(prev => prev ? { ...prev, [key]: value } : null);
    setSaveSuccess(false);
  };

  const handleSaveSettings = async () => {
    if (!user || !draft) return;
    setIsSaving(true);

    try {
      // 1. Salva no localStorage
      const storageKey = `burgerhero_card_settings_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(draft));

      // 2. Atualiza os stores globais com os dados do rascunho
      setAllCardSettings({ templateId: draft.templateId, font: draft.fontFamily, color: draft.fontColor, fontSize: draft.fontSize });
      setHeroTheme(draft.heroTheme);
      setMode(draft.mode as any);

      // 3. (Opcional) Persiste no DB em segundo plano
      updateCardSettings(user.id, draft).catch(err => console.warn("Falha ao sincronizar com DB:", err));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      alert("Erro ao salvar configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelChanges = () => {
    setDraft(getSettingsFromStore());
    setSaveSuccess(false);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
      setUploadingAvatar(true);
      try {
        const publicUrl = await uploadAvatar(user.id, file);
        if (publicUrl) {
          await supabase.from('client_profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
          updateUser({ avatarUrl: publicUrl });
        }
      } catch (err) { alert('Erro ao enviar imagem.'); } 
      finally { setUploadingAvatar(false); }
    }
  };

  const handleSaveName = async () => {
    if (!user || !editName.trim()) return;
    const oldName = user.name;
    updateUser({ name: editName });
    setIsEditingName(false);
    try {
      await updateProfileName(user.id, editName);
    } catch (err) {
      updateUser({ name: oldName });
      alert('Erro ao salvar nome.');
    }
  };

  const handleCancelEditName = () => {
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
      .catch((err) => alert('Ocorreu um erro ao exportar o cartão.'));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

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

  if (!draft) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-hero-primary" /></div>;

  const currentTemplate = availableTemplates.find(t => t.id === draft.templateId) || availableTemplates[0];

  return (
    <div className="space-y-6 pb-10">
      
      {/* BARRA DE AÇÕES STICKY */}
      {hasUnsavedChanges && (
        <div className="sticky top-[70px] z-30 bg-amber-500/95 backdrop-blur-sm p-3 rounded-2xl shadow-lg flex items-center justify-between animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-white" />
            <span className="text-xs font-bold text-white">Você tem alterações não salvas.</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleCancelChanges} className="text-white hover:bg-white/20 h-8">
              <RotateCcw size={14} className="mr-1.5" /> Cancelar
            </Button>
            <Button size="sm" onClick={handleSaveSettings} isLoading={isSaving} className="h-8 bg-white hover:bg-slate-100 border-transparent text-amber-700 shadow-sm">
              <Save size={14} className="mr-1.5" /> Salvar
            </Button>
          </div>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col items-center">
        <div className="relative group cursor-pointer" onClick={() => !uploadingAvatar && fileInputRef.current?.click()}>
          <div className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-xl bg-slate-200 overflow-hidden relative">
            {uploadingAvatar ? (
              <div className="w-full h-full flex items-center justify-center bg-black/50"><Loader2 className="animate-spin text-white" /></div>
            ) : (
              <img src={user?.avatarUrl || 'https://picsum.photos/seed/hero/200'} alt="Profile" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <Camera size={24} className="text-white" />
          </div>
          <button className="absolute bottom-0 right-0 bg-hero-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform pointer-events-none">
            <Camera size={16} />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploadingAvatar} />
        </div>
        
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
                  <button onClick={handleSaveName} className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-900/50"><Check size={16}/></button>
                  <button onClick={handleCancelEditName} className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50"><X size={16}/></button>
                </div>
             </div>
          ) : (
            <div className="flex items-center gap-2 group cursor-pointer p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors pr-3 pl-3" onClick={() => setIsEditingName(true)}>
              <h2 className="text-xl font-black dark:text-white">{user?.name}</h2>
              <Pencil size={14} className="text-slate-400 group-hover:text-hero-primary transition-colors" />
            </div>
          )}
          <p className="text-slate-400 font-medium text-sm mt-1 mb-3">{user?.email}</p>
          <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-1.5 rounded-full border border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Fingerprint size={14} className="text-hero-primary" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              ID: <span className="text-slate-800 dark:text-slate-200 select-all">{user?.customerCode || '—'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* SEÇÃO: CARTÃO DO HERÓI */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
        <CardHeader className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400">
            <CreditCard size={14} /> Cartão do Herói
          </div>
          {saveSuccess && (
            <span className="text-xs font-bold text-green-600 flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
              <CheckCircle2 size={12} /> Salvo!
            </span>
          )}
        </CardHeader>
        
        <CardBody className="p-6 space-y-8">
          <div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">Modelo:</p>
            <div className="grid grid-cols-3 gap-3">
              {availableTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => updateDraft('templateId', template.id)}
                  className={`relative rounded-xl overflow-hidden transition-all duration-200 aspect-[1.586/1] ${draft.templateId === template.id ? 'ring-4 ring-hero-primary shadow-lg scale-[1.02]' : 'ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-slate-300'}`}
                  title={template.name}
                >
                  <img src={template.imageUrl} alt={template.name} className="w-full h-full object-cover" />
                  {draft.templateId === template.id && <div className="absolute inset-0 bg-hero-primary/20 flex items-center justify-center"><div className="bg-white rounded-full p-1 shadow-sm"><CheckCircle2 size={16} className="text-hero-primary fill-white" /></div></div>}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2"><Type size={16} /> Tipografia:</p>
              <div className="flex flex-wrap gap-2">
                {FONT_OPTIONS.map((font) => (
                  <button key={font.name} onClick={() => updateDraft('fontFamily', font.value)} style={{ fontFamily: font.value }} className={`px-3 py-2 rounded-lg text-sm border transition-all ${draft.fontFamily === font.value ? 'bg-hero-primary text-white border-hero-primary shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>{font.name}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">Cor da Fonte:</p>
              <div className="flex flex-wrap gap-3">
                {COLOR_OPTIONS.map((color) => (
                  <button key={color.name} onClick={() => updateDraft('fontColor', color.value)} className={`w-10 h-10 rounded-full border-2 shadow-sm transition-all flex items-center justify-center relative group ${draft.fontColor === color.value ? 'scale-110 ring-2 ring-offset-2 ring-hero-primary dark:ring-offset-slate-900' : 'hover:scale-105'}`} style={{ backgroundColor: color.value, borderColor: color.value === '#FFFFFF' ? '#e2e8f0' : 'transparent' }} title={color.name}>
                    {draft.fontColor === color.value && <CheckCircle2 size={18} className="drop-shadow-md" style={{ color: ['#FFFFFF', '#FCD34D', '#C0C0C0', '#00FFFF', '#39FF14', '#08FF01'].includes(color.value) ? '#000' : '#FFF' }} />}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2"><TextQuote size={16} /> Tamanho da Fonte: <span className="font-black text-hero-primary">{draft.fontSize}px</span></p>
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold">A</span>
                <input type="range" min="16" max="32" step="1" value={draft.fontSize} onChange={(e) => updateDraft('fontSize', Number(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-hero-primary" />
                <span className="text-3xl font-bold">A</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center border-t border-slate-50 dark:border-slate-800 pt-6">
             <div className="flex justify-between items-center w-full mb-4">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 self-start">Prévia (Rascunho):</p>
                <Button onClick={handleExportCard} variant="outline" size="sm"><Download size={14} className="mr-2" /> Exportar</Button>
             </div>
             <HeroCard ref={cardRef} user={user} imageUrl={currentTemplate?.imageUrl || ''} memberSince={sub?.currentPeriodStart} fontFamily={draft.fontFamily} textColor={draft.fontColor} fontSize={draft.fontSize} />
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="h-full">
          <CardHeader><div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400"><Palette size={14} /> Tema</div></CardHeader>
          <CardBody className="p-4">
            <div className="grid grid-cols-5 gap-2">
              {themes.map(t => (
                <button key={t.name} onClick={() => updateDraft('heroTheme', t.name)} className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${draft.heroTheme === t.name ? 'border-hero-primary bg-hero-primary/5 shadow-inner' : 'border-slate-50 dark:border-slate-800 hover:border-slate-100'}`}>
                  <div className="w-6 h-6 rounded-full border dark:border-slate-600" style={{ backgroundColor: t.color }}></div>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card className="h-full">
          <CardHeader><div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400"><Monitor size={14} /> Modo</div></CardHeader>
          <CardBody className="p-4 flex flex-col gap-2">
              <button onClick={() => updateDraft('mode', 'light')} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${draft.mode === 'light' ? 'border-hero-primary text-hero-primary bg-hero-primary/5' : 'border-slate-50 dark:border-slate-800 text-slate-400'}`}><Sun size={18} /> <span className="text-xs font-bold uppercase">Claro</span></button>
              <button onClick={() => updateDraft('mode', 'dark')} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${draft.mode === 'dark' ? 'border-hero-primary text-hero-primary bg-hero-primary/5' : 'border-slate-50 dark:border-slate-800 text-slate-400'}`}><Moon size={18} /> <span className="text-xs font-bold uppercase">Escuro</span></button>
          </CardBody>
        </Card>
      </div>

      <div className="pt-4">
        <Button variant="danger" className="w-full py-4 rounded-2xl" onClick={handleLogout}><LogOut size={20} className="mr-2" /> Encerrar Sessão</Button>
      </div>
    </div>
  );
};

export default Profile;