import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useCardStore, FONT_OPTIONS, COLOR_OPTIONS } from '../store/cardStore';
import {
  LogOut, Palette, Moon, Sun, Monitor, CreditCard, CheckCircle2,
  Camera, Pencil, Check, X, Download, Fingerprint,
  Loader2, Save, RotateCcw, AlertTriangle
} from 'lucide-react';
import { HeroTheme, Subscription } from '../types';
import { supabase } from '../lib/supabaseClient';
import {
  updateProfileName,
  uploadAndSyncAvatar,
  updateCardSettings
} from '../services/users.service';
import { templatesService } from '../services/templates.service';
import HeroCard from '../components/HeroCard';
import { toPng } from 'html-to-image';
import { subscriptionMockService } from '../services/subscriptionMock.service';
import { getSubscriptionStatus } from '../services/clientHome.service';

const Profile: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);

  // Global Themes
  const globalHeroTheme = useThemeStore(state => state.heroTheme);
  const setHeroTheme = useThemeStore(state => state.setHeroTheme);
  const globalMode = useThemeStore(state => state.mode);
  const setMode = useThemeStore(state => state.setMode);

  // Global Card Prefs
  const {
    selectedTemplateId,
    selectedFont,
    selectedColor,
    selectedFontSize,
    setTemplates,
    availableTemplates
  } = useCardStore();

  // Local State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [sub, setSub] = useState<Subscription | null>(null);

  interface DraftSettings {
    templateId: string;
    fontFamily: string;
    fontColor: string;
    fontSize: number;
    heroTheme: HeroTheme;
    mode: 'light' | 'dark' | 'system';
  }

  const [draft, setDraft] = useState<DraftSettings | null>(null);
  const [lastSavedState, setLastSavedState] = useState<DraftSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Efeito para buscar templates e inicializar o estado de rascunho (draft)
  useEffect(() => {
    if (!user?.id) return;

    // Templates
    templatesService.getActiveTemplates().then(dbTemplates => {
      setTemplates(templatesService.mapToStoreFormat(dbTemplates));
    });

    // Subscription: mock -> supabase
    (async () => {
      try {
        const mockSub = subscriptionMockService.getActiveSubscription(user.id);
        if (mockSub?.status === 'active') {
          setSub({
            status: 'active',
            currentPeriodStart: mockSub.startedAt,
            currentPeriodEnd: mockSub.nextBillingDate,
          });
        } else {
          const supaSub = await getSubscriptionStatus(user.id);
          setSub(supaSub);
        }
      } catch (e) {
        console.error('Falha ao buscar subscription no Profile', e);
      }
    })();

    // Inicializa o rascunho com os dados dos stores globais
    const initialState: DraftSettings = {
      templateId: selectedTemplateId || (availableTemplates[0]?.id ?? ''),
      fontFamily: selectedFont,
      fontColor: selectedColor,
      fontSize: selectedFontSize,
      heroTheme: globalHeroTheme,
      mode: globalMode,
    };
    setDraft(initialState);
    setLastSavedState(initialState);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const hasUnsavedChanges = useMemo(() => {
    if (!draft || !lastSavedState) return false;
    return JSON.stringify(draft) !== JSON.stringify(lastSavedState);
  }, [draft, lastSavedState]);

  const updateDraft = (key: keyof DraftSettings, value: any) => {
    if (!draft) return;
    const newDraft = { ...draft, [key]: value };
    setDraft(newDraft);

    // Aplica temas visualmente enquanto edita
    if (key === 'heroTheme') setHeroTheme(value);
    if (key === 'mode') setMode(value);
  };

  const handleSaveSettings = async () => {
    if (!user || !draft) return;
    setIsSaving(true);

    try {
      await updateCardSettings(user.id, {
        templateId: draft.templateId,
        fontFamily: draft.fontFamily,
        fontColor: draft.fontColor,
        fontSize: draft.fontSize,
        heroTheme: draft.heroTheme,
        mode: draft.mode,
      });

      setLastSavedState(draft);

      // Sincroniza o estado global permanentemente
      useCardStore.getState().setAll({
        templateId: draft.templateId,
        font: draft.fontFamily,
        color: draft.fontColor,
        fontSize: draft.fontSize
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelChanges = () => {
    if (!lastSavedState) return;
    setDraft(lastSavedState);
    setHeroTheme(lastSavedState.heroTheme);
    setMode(lastSavedState.mode);
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
        if (finalUrl) updateUser({ avatarUrl: finalUrl });
      } catch (err) {
        console.error(err);
        alert('Erro ao processar imagem.');
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleSaveName = async () => {
    if (!user || !editName.trim()) return;
    const old = user.name;
    updateUser({ name: editName });
    setIsEditingName(false);

    try {
      await updateProfileName(user.id, editName);
    } catch (err) {
      updateUser({ name: old });
      alert('Erro ao salvar nome.');
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro ao fazer logout:', error);
      alert('Erro ao sair. Tente novamente.');
    }
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
  ];

  if (!draft) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="animate-spin mx-auto text-hero-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {hasUnsavedChanges && (
        <div className="sticky top-[70px] z-30 bg-amber-500 p-3 rounded-2xl shadow-lg flex items-center justify-between text-white animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} /> <span className="text-xs font-bold">Alterações pendentes</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancelChanges}
              className="text-white hover:bg-white/20 h-8"
            >
              <RotateCcw size={14} />
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSettings}
              isLoading={isSaving}
              className="h-8 bg-white text-amber-700 shadow-sm"
            >
              <Save size={14} className="mr-1.5" /> Salvar
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center">
        <div
          className="relative group cursor-pointer"
          onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
        >
          <div className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-xl bg-slate-200 overflow-hidden relative">
            {uploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <Loader2 className="animate-spin text-white" />
              </div>
            )}
            <img
              src={user?.avatarUrl || 'https://picsum.photos/seed/hero/200'}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera size={24} className="text-white" />
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        <div className="mt-4 flex flex-col items-center">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                className="bg-transparent border-b-2 border-hero-primary text-xl font-black text-center dark:text-white"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                autoFocus
              />
              <button onClick={handleSaveName} className="p-1 bg-green-100 text-green-600 rounded-full">
                <Check size={16} />
              </button>
              <button onClick={() => setIsEditingName(false)} className="p-1 bg-red-100 text-red-600 rounded-full">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsEditingName(true)}>
              <h2 className="text-xl font-black dark:text-white">{user?.name}</h2>
              <span className="text-slate-400">
                <Pencil size={14} />
              </span>
            </div>
          )}

          <p className="text-slate-400 text-sm mt-1 mb-3">{user?.email}</p>

          <div className="bg-slate-50 dark:bg-slate-800 px-4 py-1.5 rounded-full flex items-center gap-2">
            <Fingerprint size={14} className="text-hero-primary" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              ID: {user?.customerCode}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400">
            <CreditCard size={14} /> Editor do Cartão
          </div>
          {saveSuccess && (
            <span className="text-xs font-bold text-green-600 flex items-center gap-1">
              <CheckCircle2 size={12} /> Sincronizado
            </span>
          )}
        </CardHeader>

        <CardBody className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {availableTemplates.map(t => (
              <button
                key={t.id}
                onClick={() => updateDraft('templateId', t.id)}
                className={`relative rounded-xl overflow-hidden aspect-[1.586/1] ${draft.templateId === t.id ? 'ring-4 ring-hero-primary scale-[1.02]' : 'ring-1 ring-slate-200'}`}
              >
                <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover" />
                {draft.templateId === t.id && (
                  <div className="absolute inset-0 bg-hero-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Tipografia</p>
              <div className="flex flex-wrap gap-2">
                {FONT_OPTIONS.map(f => (
                  <button
                    key={f.name}
                    onClick={() => updateDraft('fontFamily', f.value)}
                    style={{ fontFamily: f.value }}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${draft.fontFamily === f.value ? 'bg-hero-primary text-white' : 'bg-white'}`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Cor do Texto</p>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c.name}
                    onClick={() => updateDraft('fontColor', c.value)}
                    className={`w-8 h-8 rounded-full border-2 ${draft.fontColor === c.value ? 'ring-2 ring-hero-primary' : ''}`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col items-center">
            <div className="flex justify-between w-full mb-2">
              <p className="text-xs font-bold text-slate-400">PRÉVIA</p>
              <Button onClick={handleExportCard} variant="ghost" size="sm">
                <Download size={14} />
              </Button>
            </div>

            <HeroCard
              ref={cardRef}
              user={user}
              imageUrl={availableTemplates.find(t => t.id === draft.templateId)?.imageUrl || ''}
              fontFamily={draft.fontFamily}
              textColor={draft.fontColor}
              fontSize={draft.fontSize}
            />
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 font-black text-xs uppercase text-slate-400">
              <Palette size={14} /> Tema do App
            </div>
          </CardHeader>
          <CardBody className="p-4 grid grid-cols-5 gap-2">
            {themes.map(t => (
              <button
                key={t.name}
                onClick={() => updateDraft('heroTheme', t.name)}
                className={`w-8 h-8 rounded-full border-2 ${draft.heroTheme === t.name ? 'border-hero-primary scale-110 shadow-lg' : 'border-transparent'}`}
                style={{ backgroundColor: t.color }}
              />
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 font-black text-xs uppercase text-slate-400">
              <Monitor size={14} /> Modo
            </div>
          </CardHeader>
          <CardBody className="p-4 flex gap-2">
            <button
              onClick={() => updateDraft('mode', 'light')}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 ${draft.mode === 'light' ? 'border-hero-primary text-hero-primary' : ''}`}
            >
              <Sun size={18} /> <span className="text-xs font-bold">CLARO</span>
            </button>
            <button
              onClick={() => updateDraft('mode', 'dark')}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 ${draft.mode === 'dark' ? 'border-hero-primary text-hero-primary' : ''}`}
            >
              <Moon size={18} /> <span className="text-xs font-bold">ESCURO</span>
            </button>
          </CardBody>
        </Card>
      </div>

      <Button variant="danger" className="w-full py-4 rounded-2xl" onClick={handleLogout}>
        <LogOut size={20} className="mr-2" /> Encerrar Sessão
      </Button>
    </div>
  );
};

export default Profile;
