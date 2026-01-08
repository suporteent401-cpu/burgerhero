import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useCardStore, FONT_OPTIONS, COLOR_OPTIONS } from '../store/cardStore';
import {
  LogOut, Palette, Moon, Sun, Monitor, CreditCard, CheckCircle2,
  Camera, Download, Fingerprint, Loader2, Save, RotateCcw,
  AlertTriangle, User as UserIcon
} from 'lucide-react';
import { HeroTheme } from '../types';
import { supabase } from '../lib/supabaseClient';
import {
  updateUserProfile,
  uploadAvatarFile,
  updateCardSettings
} from '../services/users.service';
import { templatesService } from '../services/templates.service';
import HeroCard from '../components/HeroCard';
import { toPng } from 'html-to-image';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

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

  // --- ESTADO DE IDENTIDADE (Nome e Foto) ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [identityName, setIdentityName] = useState(user?.name || '');
  const [identityAvatarPreview, setIdentityAvatarPreview] = useState(user?.avatarUrl || '');
  const [identityAvatarFile, setIdentityAvatarFile] = useState<File | null>(null);
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [identitySuccess, setIdentitySuccess] = useState(false);

  // Detecta mudanças na identidade para habilitar botão salvar
  const hasIdentityChanges = useMemo(() => {
    if (!user) return false;
    const nameChanged = identityName.trim() !== user.name;
    const avatarChanged = !!identityAvatarFile;
    return nameChanged || avatarChanged;
  }, [identityName, identityAvatarFile, user]);

  // --- ESTADO DE CONFIGURAÇÕES DO CARTÃO ---
  const cardRef = useRef<HTMLDivElement>(null);
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
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Inicialização
  useEffect(() => {
    if (!user?.id) return;

    // Carrega templates
    templatesService.getActiveTemplates().then(dbTemplates => {
      setTemplates(templatesService.mapToStoreFormat(dbTemplates));
    });

    // Inicializa rascunho de configurações
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

    // Inicializa inputs de identidade
    setIdentityName(user.name);
    setIdentityAvatarPreview(user.avatarUrl || '');

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const hasSettingsChanges = useMemo(() => {
    if (!draft || !lastSavedState) return false;
    return JSON.stringify(draft) !== JSON.stringify(lastSavedState);
  }, [draft, lastSavedState]);

  // --- HANDLERS IDENTIDADE ---

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIdentityAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setIdentityAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveIdentity = async () => {
    if (!user) return;
    setIsSavingIdentity(true);
    setIdentitySuccess(false);

    try {
      let finalAvatarUrl = user.avatarUrl;

      // 1. Upload da imagem se houver novo arquivo
      if (identityAvatarFile) {
        finalAvatarUrl = await uploadAvatarFile(user.id, identityAvatarFile);
      }

      // 2. Atualiza banco de dados com Nome e URL
      await updateUserProfile(user.id, {
        display_name: identityName,
        avatar_url: finalAvatarUrl || undefined
      });

      // 3. Atualiza estado global (Zustand)
      updateUser({
        name: identityName,
        avatarUrl: finalAvatarUrl
      });

      setIdentityAvatarFile(null); // Limpa arquivo pendente
      setIdentitySuccess(true);
      setTimeout(() => setIdentitySuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar identidade:', error);
      alert('Erro ao salvar alterações. Verifique sua conexão.');
    } finally {
      setIsSavingIdentity(false);
    }
  };

  // --- HANDLERS CONFIGURAÇÕES ---

  const updateDraft = (key: keyof DraftSettings, value: any) => {
    if (!draft) return;
    const newDraft = { ...draft, [key]: value };
    setDraft(newDraft);

    // Aplica temas visualmente em tempo real
    if (key === 'heroTheme') setHeroTheme(value);
    if (key === 'mode') setMode(value);
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
      });

      setLastSavedState(draft);
      useCardStore.getState().setAll({
        templateId: draft.templateId,
        font: draft.fontFamily,
        color: draft.fontColor,
        fontSize: draft.fontSize
      });

      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar configurações.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCancelSettings = () => {
    if (!lastSavedState) return;
    setDraft(lastSavedState);
    setHeroTheme(lastSavedState.heroTheme);
    setMode(lastSavedState.mode);
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
  ];

  if (!draft) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="animate-spin mx-auto text-hero-primary" />
        <p className="text-slate-500 text-sm mt-2">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      
      {/* 1. CARTÃO MINHA IDENTIDADE (NOME + FOTO) */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400">
            <UserIcon size={14} /> Minha Identidade
          </div>
          {identitySuccess && (
            <span className="text-xs font-bold text-green-600 flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 size={12} /> Salvo
            </span>
          )}
        </CardHeader>
        
        <CardBody className="p-6">
          <div className="flex flex-col items-center gap-6">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-28 h-28 rounded-full border-4 border-slate-100 dark:border-slate-800 shadow-lg bg-slate-200 overflow-hidden relative">
                <img
                  src={identityAvatarPreview || 'https://picsum.photos/seed/hero/200'}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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

            <div className="w-full space-y-4">
               <Input 
                 label="Nome de Herói"
                 value={identityName}
                 onChange={(e) => setIdentityName(e.target.value)}
                 placeholder="Seu nome público"
               />
               
               <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-100 dark:border-slate-700">
                 <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-500">
                    <Fingerprint size={16} />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Código de Identificação</p>
                    <p className="font-mono font-bold text-slate-700 dark:text-slate-200">{user?.customerCode}</p>
                 </div>
               </div>

               <Button 
                 onClick={handleSaveIdentity} 
                 className="w-full"
                 disabled={!hasIdentityChanges || isSavingIdentity}
                 isLoading={isSavingIdentity}
               >
                 {isSavingIdentity ? 'Salvando...' : 'Salvar Dados'}
               </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 2. EDITOR DO CARTÃO */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400">
            <CreditCard size={14} /> Editor do Cartão
          </div>
          {settingsSuccess && (
            <span className="text-xs font-bold text-green-600 flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 size={12} /> Salvo
            </span>
          )}
        </CardHeader>

        <CardBody className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {availableTemplates.map(t => (
              <button
                key={t.id}
                onClick={() => updateDraft('templateId', t.id)}
                className={`relative rounded-xl overflow-hidden aspect-[1.586/1] transition-all ${draft.templateId === t.id ? 'ring-4 ring-hero-primary scale-[1.02] shadow-md' : 'ring-1 ring-slate-200 hover:ring-hero-primary/50'}`}
              >
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
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Tipografia</p>
              <div className="flex flex-wrap gap-2">
                {FONT_OPTIONS.map(f => (
                  <button
                    key={f.name}
                    onClick={() => updateDraft('fontFamily', f.value)}
                    style={{ fontFamily: f.value }}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${draft.fontFamily === f.value ? 'bg-hero-primary text-white border-hero-primary shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
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
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${draft.fontColor === c.value ? 'ring-2 ring-hero-primary scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c.value, borderColor: c.value === '#FFFFFF' ? '#e2e8f0' : 'transparent' }}
                    title={c.name}
                  />
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

            <HeroCard
              ref={cardRef}
              // Usa o NOME e AVATAR do estado local (prévia) se tiver alterado, senão usa do user
              user={{ ...user!, name: identityName, avatarUrl: identityAvatarPreview || null }} 
              imageUrl={availableTemplates.find(t => t.id === draft.templateId)?.imageUrl || ''}
              fontFamily={draft.fontFamily}
              textColor={draft.fontColor}
              fontSize={draft.fontSize}
            />
          </div>

          {hasSettingsChanges && (
             <div className="flex gap-2 animate-in fade-in pt-4 border-t border-slate-100">
               <Button variant="outline" onClick={handleCancelSettings} className="flex-1">Cancelar</Button>
               <Button onClick={handleSaveSettings} isLoading={isSavingSettings} className="flex-1">Salvar Aparência</Button>
             </div>
          )}
        </CardBody>
      </Card>

      {/* 3. TEMA E MODO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 font-black text-xs uppercase text-slate-400">
              <Palette size={14} /> Tema do App
            </div>
          </CardHeader>
          <CardBody className="p-4 grid grid-cols-5 gap-3">
            {themes.map(t => (
              <button
                key={t.name}
                onClick={() => updateDraft('heroTheme', t.name)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${draft.heroTheme === t.name ? 'border-hero-primary scale-110 shadow-lg ring-2 ring-offset-1 ring-hero-primary/30' : 'border-transparent hover:scale-110'}`}
                style={{ backgroundColor: t.color }}
                title={t.name.replace('-', ' ')}
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
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${draft.mode === 'light' ? 'border-hero-primary text-hero-primary bg-hero-primary/5' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
            >
              <Sun size={18} /> <span className="text-xs font-bold">CLARO</span>
            </button>
            <button
              onClick={() => updateDraft('mode', 'dark')}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${draft.mode === 'dark' ? 'border-hero-primary text-hero-primary bg-hero-primary/5' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
            >
              <Moon size={18} /> <span className="text-xs font-bold">ESCURO</span>
            </button>
          </CardBody>
        </Card>
      </div>

      {hasSettingsChanges && (
         <div className="sticky bottom-20 z-30 mx-auto max-w-sm">
            <div className="bg-slate-800 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-4">
              <span className="text-sm font-bold">Alterações de tema pendentes</span>
              <Button size="sm" onClick={handleSaveSettings} isLoading={isSavingSettings} className="bg-white text-slate-900 hover:bg-slate-100">
                 Salvar Tudo
              </Button>
            </div>
         </div>
      )}

      <Button variant="danger" className="w-full py-4 rounded-2xl mt-8" onClick={handleLogout}>
        <LogOut size={20} className="mr-2" /> Encerrar Sessão
      </Button>
    </div>
  );
};

export default Profile;