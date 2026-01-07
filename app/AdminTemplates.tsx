import React, { useEffect, useState } from 'react';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { templatesService, CardTemplateDB } from '../services/templates.service';
import { PlusCircle, ToggleLeft, ToggleRight, Loader2, Image as ImageIcon } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { useForm } from 'react-hook-form';

const AdminTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<CardTemplateDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm<{ name: string; preview_url: string }>();
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
      // Optimistic update
      setTemplates(prev => prev.map(item => item.id === t.id ? { ...item, is_active: !item.is_active } : item));
      await templatesService.toggleTemplateStatus(t.id, t.is_active);
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar status.');
      fetchTemplates(); // Revert
    }
  };

  const onSubmit = async (data: { name: string; preview_url: string }) => {
    try {
      await templatesService.createTemplate(data.name, data.preview_url);
      fetchTemplates();
      setIsModalOpen(false);
      reset();
    } catch (error) {
      console.error(error);
      alert('Erro ao criar template.');
    }
  };

  return (
    <div className="space-y-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(t => (
            <Card key={t.id} className="overflow-hidden group">
              <div className="aspect-[1.586/1] bg-slate-900 relative">
                <img src={t.preview_url} alt={t.name} className="w-full h-full object-cover" />
                <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded-full ${t.is_active ? 'bg-green-500 text-white' : 'bg-slate-500 text-white'}`}>
                  {t.is_active ? 'Ativo' : 'Inativo'}
                </div>
              </div>
              <CardBody className="p-4">
                <h3 className="font-bold text-lg text-slate-800 mb-1">{t.name}</h3>
                <p className="text-xs text-slate-400 font-mono truncate mb-4">{t.id}</p>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleToggle(t)}
                >
                  {t.is_active ? (
                    <><ToggleRight size={16} className="mr-2 text-green-600" /> Desativar</>
                  ) : (
                    <><ToggleLeft size={16} className="mr-2 text-slate-400" /> Ativar</>
                  )}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Modelo de Cartão">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome do Modelo" placeholder="Ex: Cyber Punk" {...register('name', { required: true })} />
          <Input label="URL da Imagem (Background)" placeholder="https://..." {...register('preview_url', { required: true })} />
          
          <div className="mt-4">
            <p className="text-sm font-bold text-slate-500 mb-2">Prévia da Imagem:</p>
            <div className="aspect-[1.586/1] bg-slate-100 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center">
              {watchUrl ? (
                <img src={watchUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = '')} />
              ) : (
                <ImageIcon className="text-slate-300" size={32} />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSubmitting}>Criar Modelo</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminTemplates;