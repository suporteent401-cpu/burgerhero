import React, { useEffect, useState, useRef } from 'react';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { templatesService, CardTemplateDB } from '../services/templates.service';
import { PlusCircle, ToggleLeft, ToggleRight, Loader2, Image as ImageIcon, Upload, X } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { useForm } from 'react-hook-form';

const AdminTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<CardTemplateDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm<{ name: string; preview_url: string }>();
  const watchUrl = watch('preview_url');

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await templatesService.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error(error);
      alert('Erro ao carregar templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleToggle = async (t: CardTemplateDB) => {
    try {
      setTemplates(prev => prev.map(item => item.id === t.id ? { ...item, is_active: !item.is_active } : item));
      await templatesService.toggleTemplateStatus(t.id, t.is_active);
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar status.');
      fetchTemplates();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setValue('preview_url', ''); // Limpa URL manual para evitar conflito visual
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: { name: string; preview_url: string }) => {
    try {
      let finalUrl = data.preview_url;

      if (selectedFile) {
        finalUrl = await templatesService.uploadTemplateImage(selectedFile);
      }

      if (!finalUrl) {
        alert('Por favor, forneça uma URL ou faça upload de uma imagem.');
        return;
      }

      await templatesService.createTemplate(data.name, finalUrl);
      fetchTemplates();
      closeModal();
    } catch (error) {
      console.error(error);
      alert('Erro ao criar template.');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
    clearFile();
  };

  const displayPreview = preview || watchUrl;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Modelos de Cartão</h2>
          <p className="text-slate-500 font-medium">Gerencie os layouts disponíveis para os heróis.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusCircle size={18} className="mr-2" /> Novo Modelo
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-hero-primary" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {templates.map(t => (
            <Card key={t.id} className="overflow-hidden group">
              <div className="aspect-[1.586/1] bg-slate-900 relative">
                <img src={t.preview_url} alt={t.name} className="w-full h-full object-cover" />
                <div className={`absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${t.is_active ? 'bg-green-500 text-white' : 'bg-slate-500 text-white'}`}>
                  {t.is_active ? 'Ativo' : 'Inativo'}
                </div>
              </div>
              <CardBody className="p-3">
                <h3 className="font-bold text-sm text-slate-800 mb-1 truncate" title={t.name}>{t.name}</h3>
                <p className="text-[10px] text-slate-400 font-mono truncate mb-3">{t.id}</p>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-8 text-xs"
                  onClick={() => handleToggle(t)}
                >
                  {t.is_active ? (
                    <><ToggleRight size={14} className="mr-1.5 text-green-600" /> Desativar</>
                  ) : (
                    <><ToggleLeft size={14} className="mr-1.5 text-slate-400" /> Ativar</>
                  )}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Novo Modelo de Cartão">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input label="Nome do Modelo" placeholder="Ex: Cyber Punk" {...register('name', { required: true })} />
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Imagem do Cartão</label>
            
            {/* Opção de Upload */}
            <div 
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${selectedFile ? 'border-hero-primary bg-hero-primary/5' : 'border-slate-300 hover:border-hero-primary hover:bg-slate-50'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileSelect} 
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-hero-primary">
                  <Upload size={20} />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  {selectedFile ? selectedFile.name : 'Clique para fazer upload da imagem'}
                </p>
                {!selectedFile && <p className="text-xs text-slate-400">PNG, JPG ou WEBP (Max 2MB)</p>}
              </div>
            </div>

            {selectedFile && (
              <div className="flex justify-end">
                <button type="button" onClick={(e) => { e.stopPropagation(); clearFile(); }} className="text-xs text-red-500 flex items-center hover:underline">
                  <X size={12} className="mr-1" /> Remover arquivo
                </button>
              </div>
            )}

            {/* Opção de URL (Fallback) */}
            {!selectedFile && (
              <>
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-xs text-slate-400 font-bold uppercase">Ou use uma URL externa</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>
                <Input placeholder="https://..." {...register('preview_url')} />
              </>
            )}
          </div>
          
          <div className="mt-4">
            <p className="text-sm font-bold text-slate-500 mb-2">Prévia:</p>
            <div className="aspect-[1.586/1] bg-slate-100 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center relative">
              {displayPreview ? (
                <img src={displayPreview} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = '')} />
              ) : (
                <div className="flex flex-col items-center text-slate-300">
                  <ImageIcon size={32} />
                  <span className="text-xs font-bold mt-1">Sem imagem</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" isLoading={isSubmitting}>Criar Modelo</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminTemplates;