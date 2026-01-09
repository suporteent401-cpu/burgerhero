import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, FontSize } from '../store/themeStore';
import { useCardStore, FONT_OPTIONS, COLOR_OPTIONS } from '../store/cardStore';
import {
  LogOut, Palette, Moon, Sun, Monitor, CreditCard, CheckCircle2,
  Camera, Pencil, Check, X, Download, Fingerprint,
  Loader2, Save, RotateCcw, AlertTriangle, Type
} from 'lucide-react';
import { HeroTheme, Subscription } from '../types';
import { supabase } from '../lib/supabaseClient';
import {
  updateProfileName,
  uploadAndSyncAvatar,
  updateCardSettings,
  ensureHeroIdentity
} from '../services/users.service';
import { templatesService } from '../services/templates.service';
import HeroCard from '../components/HeroCard';
import { toPng } from 'html-to-image';
import { subscriptionMockService } from '../services/subscriptionMock.service';
import { getSubscriptionStatus } from '../services/clientHome.service';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  const refreshUserFromDb = useAuthStore(state => state.refreshUserFromDb);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  const globalHeroTheme = useThemeStore(state => state.heroTheme);
  const setHeroTheme = useThemeStore(state => state.setHeroTheme);
  const globalMode = useThemeStore(state => state.mode);
  const setMode = useThemeStore(state => state.setMode);
  const globalFontSize = useThemeStore(state => state.appFontSize);
  const setAppFontSize = useThemeStore(state => state.setAppFontSize);

  const {
    selectedTemplateId,
    selectedFont,
    selectedColor,
    selectedFontSize,
    setTemplates,
    availableTemplates
  } = useCardStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [sub, setSub] = useState<Subscription | null>(null);

  interface DraftSettings {
    templateId: string;
    fontFamily: string;
    fontColor: string;
    fontSize: number;
    heroTheme: HeroTheme;
    mode: 'light' | 'dark' | 'system';
    appFontSize: FontSize;
  }

  const [draft, setDraft] = useState<DraftSettings | null>(null);
  const [lastSavedState, setLastSavedState] = useState<DraftSettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    templatesService.getActiveTemplates().then(dbTemplates => {
      setTemplates(templatesService.mapToStoreFormat(dbTemplates));
    });

    (async () => {
      try {
        const mockSub = subscriptionMockService.getActiveSubscription(user.id);
        if (await mockSub && (await mockSub)?.status === 'active') {
          const s = await mockSub;
          setSub({
            status: 'active',
            currentPeriodStart: s?.startedAt,
            currentPeriodEnd: s?.nextBillingDate,
          } as any);
        } else {
          const supaSub = await getSubscriptionStatus(user.id);
          setSub(supaSub);
        }
      } catch (e) {
        console.error('Falha ao buscar subscription no Profile', e);
      }
    })();

    const initialState: DraftSettings = {
      templateId: selectedTemplateId || (availableTemplates[0]?.id ?? ''),
      fontFamily: selectedFont,
      fontColor: selectedColor,
      fontSize: selectedFontSize,
      heroTheme: globalHeroTheme,
      mode: globalMode,
      appFontSize: globalFontSize,
    };

    setDraft(initialState);
    setLastSavedState(initialState);
    setEditName(user.name);

    (async () => {
      try {
        if (!user.customerCode) {
          const code = await ensureHeroIdentity(user.id);
          if (code) updateUser({ customerCode: code });
        }
        await refreshUserFromDb(user.id);
      } catch (e) {
        console.warn('Falha ao garantir identidade do herói no Profile:', e);
      }
    })();
  }, [user?.id]);

  const hasUnsavedChanges = useMemo(() => {
    if (!draft || !lastSavedState) return false;
    return JSON.stringify(draft) !== JSON.stringify(lastSavedState);
  }, [draft, lastSavedState]);

  const updateDraft = (key: keyof DraftSettings, value: any) => {
    if (!draft) return;
    const newDraft = { ...draft, [key]: value };
    setDraft(newDraft);

    if (key === 'heroTheme') setHeroTheme(value);
    if (key === 'mode') setMode(value);
    if (key === 'appFontSize') setAppFontSize(value);
  };

  const handleSaveSettings = async () => {
    if (!user || !draft) return;
    setIsSavingSettings(true);

    try {
      await updateCardSettings(user.id, {
        templateId: draft.templateId,
        fontFamily: draft.fontFamily,
        fontColor: draft.fontColor,
        fontSize: draft.fontSize,
        heroTheme: draft.heroTheme,
        mode: draft.mode,
        appFontSize: draft.appFontSize,
      });

      setLastSavedState(draft);

      useCardStore.getState().setAll({
        templateId: draft.templateId,
        font: draft.fontFamily,
        color: draft.fontColor,
        fontSize: draft.fontSize
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      console.error(e);
      alert(`Erro ao salvar configurações: ${e?.message || 'Verifique sua conexão.'}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCancelChanges = () => {
    if (!lastSavedState) return;
    setDraft(lastSavedState);
    setHeroTheme(lastSavedState.heroTheme);
    setMode(lastSavedState.mode);
    setAppFontSize(lastSavedState.appFontSize);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onload = (e) => updateUser({ avatarUrl: e.target?.result as string });
      reader.readAsDataURL(file);

      setUploadingAvatar(true);
      try {
        const finalUrl = await uploadAndSyncAvatar(user.id, file);
        if (finalUrl) {
          updateUser({ avatarUrl: finalUrl });
          await refreshUserFromDb(user.id);
        }
      } catch (err: any) {
        console.error(err);
        alert(`Erro ao enviar imagem: ${err?.message || 'Tente novamente.'}`);
        await refreshUserFromDb(user.id);
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleSaveName = async () => {
    if (!user || !editName.trim()) return;
    const newName = editName.trim();
    if (newName === user.name) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    const oldName = user.name;
    updateUser({ name: newName });
    setIsEditingName(false);
    try {
      await updateProfileName(user.id, newName);
      await refreshUserFromDb(user.id);
    } catch (err: any) {
      console.error(err);
      updateUser({ name: oldName });
      setEditName(oldName);
      alert(`Não foi possível salvar o nome: ${err?.message || 'Tente novamente.'}`);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleExportCard = () => {
    if (cardRef.current === null) return;
    toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 })
      .then((url) => {
        const a = document.createElement('a');
        a.download = `hero-card.png`;
        a.href = url;
        a.click();
      });
  };

  const handleLogout = async () => {
    logout();
    navigate('/auth');
    await supabase.auth.signOut();
  };

  const themes: { name: HeroTheme, color: string }[] = [
    { name: 'sombra-noturna', color: '#1e40af' },
    { name: 'guardiao-escarlate', color: '#ef4444' },
    { name: 'tita-dourado', color: '#f59e0b' },
    { name: 'tempestade-azul', color: '#3b82f6' },
    { name: 'sentinela-verde', color: '#10b981' },
    { name: 'aurora-rosa', color: '#ec4899' },
    { name: 'vermelho-heroi', color: '#FF0004' },
    { name: 'verde-neon', color: '#08FF01' },
    { name: 'laranja-vulcanico', color: '#FF4F02' },
    { name: 'azul-eletrico', color: '#0300FF' },
    { name: 'preto-absoluto', color: '#000000' },
  ];

  if (!draft) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="animate-spin mx-auto text-hero-primary" />
        <p className="text-slate-500 text-sm mt-2">Carregando seu QG...</p>
      </div>
    );
  }

  const isActive = sub?.status === 'ACTIVE' || sub?.status === 'active';

  return (
    <div className="space-y-6 pb-10">
      {hasUnsavedChanges && (
        <div className="sticky top-[70px] z-30 bg-amber-500 p-3 rounded-2xl shadow-lg flex items-center justify-between text-white animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} /> <span className="text-xs font-bold">Alterações pendentes</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleCancelChanges} className="text-white hover:bg-white/20 h-8" disabled={isSavingSettings}>
              <RotateCcw size={14} />
            </Button>
            <Button size="sm" onClick={handleSaveSettings} isLoading={isSavingSettings} className="h-8 bg-white text-amber-700 shadow-sm border-none hover:bg-amber-50">
              <Save size={14} className="mr-1.5" /> Salvar
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center">
        <div className="relative group cursor-pointer" onClick={() => !uploadingAvatar && fileInputRef.current?.click()}>
          <div className={`w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-xl bg-slate-200 overflow-hidden relative transition-all ${uploadingAvatar ? 'opacity-50' : ''}`}>
            {uploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 backdrop-blur-sm">
                <Loader2 className="animate-spin text-white" size={32} />
              </div>
            )}
            <img src={user?.avatarUrl || 'https://picsum.photos/seed/hero/200'} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <Camera size={24} className="text-white" />
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploadingAvatar} />
        </div>

        <div className="mt-4 flex flex-col items-center w-full max-w-xs">
          {isEditingName ? (
            <div className="flex items-center gap-2 w-full justify-center animate-in fade-in">
              <input className="bg-transparent border-b-2 border-hero-primary text-xl font-black text-center dark:text-white outline-none w-full min-w-[150px]" value={editName} onChange={e => setEditName(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} />
              <button onClick={handleSaveName} disabled={isSavingName} className="p-1.5 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors disabled:opacity-50">
                {isSavingName ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              </button>
              <button onClick={() => { setIsEditingName(false); setEditName(user?.name || ''); }} className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors" disabled={isSavingName}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1 rounded-lg transition-colors" onClick={() => setIsEditingName(true)}>
              <h2 className="text-xl font-black dark:text-white">{user?.name}</h2>
              <span className="text-slate-400 group-hover:text-hero-primary transition-colors">
                <Pencil size={14} />
              </span>
            </div>
          )}
          <p className="text-slate-400 text-sm mt-1 mb-3">{user?.email}</p>
          <div className={`bg-slate-50 dark:bg-slate-800 px-4 py-1.5 rounded-full flex items-center gap-2 border border-slate-100 dark:border-slate-700 ${!isActive && 'opacity-50'}`}>
            <Fingerprint size={14} className="text-hero-primary" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {isActive ? `ID: ${user?.customerCode || '--'}` : 'Visitante'}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400">
            <Palette size={14} /> Aparência e Tema
          </div>
        </CardHeader>
        <CardBody className="p-6 space-y-8">
          {/* Cor do Tema */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tema do App</p>
            <div className="grid grid-cols-6 gap-3">
              {themes.map(t => (
                <button
                  key={t.name}
                  onClick={() => updateDraft('heroTheme', t.name)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${draft.heroTheme === t.name ? 'border-hero-primary scale-110 shadow-lg ring-2 ring-offset-2 ring-hero-primary/30' : 'border-transparent hover:scale-110'}`}
                  style={{ backgroundColor: t.color }}
                  title={t.name.replace('-', ' ')}
                />
              ))}
            </div>
          </div>

          {/* Modo Claro/Escuro */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Esquema de Cores</p>
            <div className="flex gap-2">
              <button onClick={() => updateDraft('mode', 'light')} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${draft.mode === 'light' ? 'border-hero-primary text-hero-primary bg-hero-primary/5' : 'border-slate-100 text-slate-500 dark:border-slate-800 hover:bg-slate-50'}`}>
                <Sun size={18} /> <span className="text-xs font-bold">CLARO</span>
              </button>
              <button onClick={() => updateDraft('mode', 'dark')} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${draft.mode === 'dark' ? 'border-hero-primary text-hero-primary bg-hero-primary/5' : 'border-slate-100 text-slate-500 dark:border-slate-800 hover:bg-slate-50'}`}>
                <Moon size={18} /> <span className="text-xs font-bold">ESCURO</span>
              </button>
            </div>
          </div>

          {/* Tamanho da Fonte */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tamanho da Fonte</p>
            <div className="flex gap-2 bg-slate-50 dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800">
              {(['small', 'medium', 'large'] as FontSize[]).map(size => (
                <button
                  key={size}
                  onClick={() => updateDraft('appFontSize', size)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${draft.appFontSize === size ? 'bg-white dark:bg-slate-800 text-hero-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Type size={size === 'small' ? 14 : size === 'medium' ? 18 : 22} />
                  {size === 'small' ? 'A-' : size === 'medium' ? 'A' : 'A+'}
                </button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400">
            <CreditCard size={14} /> Personalização do Cartão
          </div>
        </CardHeader>
        <CardBody className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {availableTemplates.map(t => (
              <button key={t.id} onClick={() => updateDraft('templateId', t.id)} className={`relative rounded-xl overflow-hidden aspect-[1.586/1] transition-all ${draft.templateId === t.id ? 'ring-4 ring-hero-primary scale-[1.02] shadow-md' : 'ring-1 ring-slate-200 hover:ring-hero-primary/50'}`}>
                <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover" />
                {draft.templateId === t.id && (
                  <div className="absolute inset-0 bg-hero-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="text-white drop-shadow-md" size={24} />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Tipografia do Cartão</p>
              <div className="flex flex-wrap gap-2">
                {FONT_OPTIONS.map(f => (
                  <button key={f.name} onClick={() => updateDraft('fontFamily', f.value)} style={{ fontFamily: f.value }} className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${draft.fontFamily === f.value ? 'bg-hero-primary text-white border-hero-primary shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Cor do Texto do Cartão</p>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(c => (
                  <button key={c.name} onClick={() => updateDraft('fontColor', c.value)} className={`w-8 h-8 rounded-full border-2 transition-transform ${draft.fontColor === c.value ? 'ring-2 ring-hero-primary scale-110' : 'hover:scale-110'}`} style={{ backgroundColor: c.value, borderColor: c.value === '#FFFFFF' ? '#e2e8f0' : 'transparent' }} title={c.name} />
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col items-center">
            <div className="flex justify-between w-full mb-2">
              <p className="text-xs font-bold text-slate-400">PRÉVIA EM TEMPO REAL</p>
              <Button onClick={handleExportCard} variant="ghost" size="sm" className="h-6 text-xs">
                <Download size={12} className="mr-1" /> Baixar
              </Button>
            </div>
            <HeroCard ref={cardRef} user={user} imageUrl={availableTemplates.find(t => t.id === draft.templateId)?.imageUrl || ''} fontFamily={draft.fontFamily} textColor={draft.fontColor} fontSize={draft.fontSize} isActive={isActive} />
          </div>
        </CardBody>
      </Card>

      <Button variant="danger" className="w-full py-4 rounded-2xl mt-8" onClick={handleLogout}>
        <LogOut size={20} className="mr-2" /> Encerrar Sessão
      </Button>
    </div>
  );
};

export default Profile;