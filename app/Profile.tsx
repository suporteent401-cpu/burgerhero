import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useCardStore, FONT_OPTIONS, COLOR_OPTIONS } from '../store/cardStore';
import { LogOut, Palette, Moon, Sun, Monitor, CreditCard, CheckCircle2, Type, Pencil, Check, X, TextQuote, Download, Fingerprint, Loader2, ShieldCheck, ShieldAlert, Camera, Save, RefreshCw } from 'lucide-react';
import { HeroTheme, Subscription } from '../types';
import { fakeApi } from '../lib/fakeApi';
import { supabase } from '../lib/supabaseClient';
import { 
  updateUserProfile, 
  updateCardSettings, 
  getCardSettings 
} from '../services/users.service';
import { templatesService } from '../services/templates.service';
import HeroCard from '../components/HeroCard';
import { toPng } from 'html-to-image';
import { subscriptionMockService } from '../services/subscriptionMock.service';

const Profile: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  
  const heroTheme = useThemeStore(state => state.heroTheme);
  const setHeroTheme = useThemeStore(state => state.setHeroTheme);
  const mode = useThemeStore(state => state.mode);
  const setMode = useThemeStore(state => state.setMode);

  // Estados de Edição Local
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', avatarUrl: '' });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<any>(null); // Armazena erro completo do Supabase
  const [successMsg, setSuccessMsg] = useState('');

  const cardRef = React.useRef<HTMLDivElement>(null);
  const [sub, setSub] = useState<Subscription | null>(null);

  // Card Store
  const { 
    selectedTemplateId, setTemplateId, getSelectedTemplate,
    selectedFont, setFont,
    selectedColor, setColor,
    selectedFontSize, setFontSize,
    setAll, setTemplates, availableTemplates
  } = useCardStore();

  // Load Inicial
  useEffect(() => {
    if (user) {
      // Sincroniza estado local com user do store
      setFormData({ 
        name: user.name, 
        avatarUrl: user.avatarUrl || '' 
      });

      // Carrega dependências
      templatesService.getActiveTemplates().then(dbTemplates => {
        setTemplates(templatesService.mapToStoreFormat(dbTemplates));
      });

      const mockSub = subscriptionMockService.getActiveSubscription(user.id);
      if (mockSub && mockSub.status === 'active') {
        setSub({ status: 'active', currentPeriodStart: mockSub.startedAt, currentPeriodEnd: mockSub.nextBillingDate });
      } else {
        fakeApi.getSubscriptionStatus(user.id).then(setSub);
      }

      getCardSettings(user.id).then(settings => {
        if (settings) {
          setAll({
            templateId: settings.card_template_id,
            font: settings.font_style,
            color: settings.font_color,
            fontSize: settings.font_size_px
          });
          if (settings.hero_theme) setHeroTheme(settings.hero_theme as HeroTheme);
          if (settings.theme_mode) setMode(settings.theme_mode);
        }
      });
    }
  }, [user, setAll, setHeroTheme, setMode, setTemplates]);

  // Handler: Salvar Perfil
  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveError(null);
    setSuccessMsg('');

    try {
      // Chama service unificado
      await updateUserProfile(user.id, {
        name: formData.name,
        avatarUrl: formData.avatarUrl || undefined
      });

      // Se passou, atualiza store global
      updateUser({ 
        name: formData.name, 
        avatarUrl: formData.avatarUrl || null 
      });

      setSuccessMsg('Perfil salvo e persistido com sucesso!');
      setIsEditing(false);
    } catch (err: any) {
      console.error('Erro ao salvar perfil:', err);
      // Salva o erro completo para exibir na UI
      setSaveError(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler: Mock Upload (Gera URL aleatória para testar persistência)
  const handleMockUpload = () => {
    const randomId = Math.floor(Math.random() * 1000);
    const mockUrl = `https://picsum.photos/seed/${randomId}/300/300`;
    setFormData(prev => ({ ...prev, avatarUrl: mockUrl }));
    setSuccessMsg('Nova foto selecionada (Mock). Clique em Salvar para persistir.');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleExportCard = () => {
    if (cardRef.current) {
      toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `hero-card-${user?.customerCode}.png`;
          link.href = dataUrl;
          link.click();
        });
    }
  };

  // Helpers de Settings
  const saveSetting = async (key: string, value: any) => {
    if (!user) return;
    try {
      await updateCardSettings(user.id, { [key]: value });
    } catch (e) { console.error('Erro auto-save setting', e); }
  };

  const isActive = sub?.status === 'active' || sub?.status === 'ACTIVE';

  return (
    <div className="space-y-6 pb-20">
      
      {/* ERROR DEBUG BOX */}
      {saveError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
          <div className="flex items-center gap-2 text-red-700 font-bold mb-1">
            <ShieldAlert size={18} /> Erro ao salvar no Supabase
          </div>
          <p className="text-sm text-red-600 font-mono mb-2">{saveError.message}</p>
          <div className="text-xs text-red-500 bg-red-100 p-2 rounded overflow-x-auto">
            <p>Code: {saveError.code}</p>
            <p>Details: {saveError.details}</p>
            <p>Hint: {saveError.hint}</p>
          </div>
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* CABEÇALHO DE PERFIL */}
      <div className="flex flex-col items-center">
        <div className="relative group">
          <div className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-xl bg-slate-200 overflow-hidden relative">
            <img 
              src={formData.avatarUrl || user?.avatarUrl || 'https://picsum.photos/seed/hero/200'} 
              alt="Avatar" 
              className="w-full h-full object-cover" 
            />
          </div>
          {isEditing && (
            <button 
              onClick={handleMockUpload}
              type="button"
              className="absolute bottom-0 right-0 bg-hero-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
              title="Gerar foto aleatória (Teste de Persistência)"
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>
        
        <div className="mt-6 flex flex-col items-center w-full max-w-xs">
          {isEditing ? (
            <div className="space-y-3 w-full animate-in fade-in zoom-in-95 duration-200">
               <input
                 className="w-full text-center text-xl font-black bg-white dark:bg-slate-800 border-2 border-hero-primary rounded-xl py-2 px-4 focus:outline-none"
                 value={formData.name}
                 onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                 placeholder="Seu nome de Herói"
               />
               <div className="flex gap-2">
                  <Button onClick={handleSaveProfile} isLoading={isSaving} className="w-full rounded-xl">
                    <Save size={16} className="mr-2" /> Salvar
                  </Button>
                  <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={isSaving} className="w-full rounded-xl bg-slate-200 dark:bg-slate-700">
                    Cancelar
                  </Button>
               </div>
               <p className="text-[10px] text-center text-slate-400">
                 *A foto gerada no botão acima será salva ao confirmar.
               </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 group cursor-pointer p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => { setIsEditing(true); setSuccessMsg(''); setSaveError(null); }}>
                <h2 className="text-2xl font-black dark:text-white">{user?.name}</h2>
                <Pencil size={16} className="text-slate-400 group-hover:text-hero-primary transition-colors" />
              </div>
              <p className="text-slate-400 text-sm mb-2">{user?.email}</p>
            </>
          )}

          {!isEditing && (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-1.5 rounded-full border border-slate-100 dark:border-slate-700 mt-2">
              <Fingerprint size={14} className="text-hero-primary" />
              <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300 select-all">{user?.customerCode}</span>
            </div>
          )}
        </div>
      </div>

      {/* CONFIGURAÇÃO DO CARTÃO */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400">
            <CreditCard size={14} /> Cartão do Herói
          </div>
        </CardHeader>
        <CardBody className="p-6 space-y-8">
          
          {/* Templates */}
          <div>
            <p className="text-sm font-bold text-slate-500 mb-3">Modelo:</p>
            <div className="grid grid-cols-3 gap-3">
              {availableTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTemplateId(t.id); saveSetting('templateId', t.id); }}
                  className={`relative rounded-xl overflow-hidden aspect-[1.586/1] transition-all ${selectedTemplateId === t.id ? 'ring-4 ring-hero-primary scale-[1.02]' : 'ring-1 ring-slate-200'}`}
                >
                  <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Customização */}
          <div className="space-y-6">
             <div>
                <p className="text-sm font-bold text-slate-500 mb-2 flex items-center gap-2"><Type size={16}/> Fonte</p>
                <div className="flex flex-wrap gap-2">
                  {FONT_OPTIONS.map(f => (
                    <button key={f.name} onClick={() => { setFont(f.value); saveSetting('fontFamily', f.value); }} style={{fontFamily: f.value}} 
                      className={`px-3 py-1.5 text-xs border rounded-lg ${selectedFont === f.value ? 'bg-hero-primary text-white border-hero-primary' : 'bg-white text-slate-600'}`}>
                      {f.name}
                    </button>
                  ))}
                </div>
             </div>

             <div>
                <p className="text-sm font-bold text-slate-500 mb-2">Cor</p>
                <div className="flex flex-wrap gap-3">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c.name} onClick={() => { setColor(c.value); saveSetting('fontColor', c.value); }}
                      className={`w-8 h-8 rounded-full border shadow-sm ${selectedColor === c.value ? 'ring-2 ring-hero-primary ring-offset-2' : ''}`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
             </div>
          </div>

          {/* Preview */}
          <div className="border-t border-slate-100 pt-6 flex flex-col items-center">
             <div className="flex justify-between w-full mb-4">
                <span className="text-xs font-bold text-slate-400">PRÉVIA</span>
                <Button variant="outline" size="sm" onClick={handleExportCard}><Download size={14} className="mr-1"/> Baixar</Button>
             </div>
             <HeroCard 
               ref={cardRef}
               user={{ ...user!, name: isEditing ? formData.name : user!.name, avatarUrl: isEditing ? formData.avatarUrl : user!.avatarUrl }} 
               imageUrl={getSelectedTemplate().imageUrl} 
               memberSince={sub?.currentPeriodStart}
               fontFamily={selectedFont}
               textColor={selectedColor}
               fontSize={selectedFontSize}
             />
          </div>
        </CardBody>
      </Card>

      {/* APARÊNCIA DA APP */}
      <Card>
        <CardHeader><div className="font-black text-xs uppercase text-slate-400 flex gap-2"><Monitor size={14}/> Aparência do App</div></CardHeader>
        <CardBody className="p-4 flex gap-4">
           <button onClick={() => { setMode('light'); saveSetting('mode', 'light'); }} className={`flex-1 p-3 border-2 rounded-xl flex items-center justify-center gap-2 ${mode === 'light' ? 'border-hero-primary bg-hero-primary/5 text-hero-primary' : 'border-slate-100 text-slate-400'}`}>
              <Sun size={18}/> Claro
           </button>
           <button onClick={() => { setMode('dark'); saveSetting('mode', 'dark'); }} className={`flex-1 p-3 border-2 rounded-xl flex items-center justify-center gap-2 ${mode === 'dark' ? 'border-hero-primary bg-hero-primary/5 text-hero-primary' : 'border-slate-100 text-slate-400'}`}>
              <Moon size={18}/> Escuro
           </button>
        </CardBody>
      </Card>

      <div className="pt-4">
        <Button variant="danger" className="w-full py-4 rounded-2xl" onClick={handleLogout}>
          <LogOut size={20} className="mr-2" /> Sair da Conta
        </Button>
      </div>
    </div>
  );
};

export default Profile;