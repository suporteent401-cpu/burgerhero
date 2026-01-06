import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plan } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Plan) => void;
  editingPlan: Plan | null;
}

export const PlanFormModal: React.FC<PlanFormModalProps> = ({ isOpen, onClose, onSubmit, editingPlan }) => {
  const { register, handleSubmit, control, reset, watch, formState: { isSubmitting } } = useForm<Plan>({
    defaultValues: {
      name: '', priceCents: 0, description: '', benefits: [], imageUrl: '', active: true,
    }
  });

  const { fields, append, remove } = useFieldArray({
    control, name: "benefits" as any,
  });

  const watchedImageUrl = watch('imageUrl');

  useEffect(() => {
    if (isOpen) {
      if (editingPlan) {
        const benefitsAsObjects = editingPlan.benefits.map(b => ({ value: b }));
        reset({ ...editingPlan, benefits: benefitsAsObjects as any });
      } else {
        reset({ name: '', priceCents: 0, description: '', benefits: [{ value: '' }] as any, imageUrl: '', active: true });
      }
    }
  }, [editingPlan, isOpen, reset]);

  const handleFormSubmit = (data: any) => {
    const benefitsAsStrings = data.benefits.map((b: { value: string }) => b.value).filter(Boolean);
    onSubmit({ ...data, benefits: benefitsAsStrings });
  };

  const formContent = (
    <form id="plan-form" onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col md:flex-row gap-8">
      <div className="flex-1 space-y-4">
        <Input label="Nome do Plano" {...register('name', { required: true })} />
        <Input label="Preço (em centavos)" type="number" {...register('priceCents', { required: true, valueAsNumber: true })} />
        <Input label="Descrição Curta" {...register('description', { required: true })} />
        <Input label="URL da Imagem" {...register('imageUrl', { required: true })} />
        <div>
          <label className="text-sm font-semibold text-slate-700 ml-1 mb-2 block">Benefícios</label>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input placeholder={`Benefício #${index + 1}`} {...register(`benefits.${index}.value` as const)} className="flex-1" />
                <Button type="button" variant="danger" size="icon" onClick={() => remove(index)}><Trash2 size={16} /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '' })}><Plus size={16} className="mr-2" /> Adicionar</Button>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <input type="checkbox" id="active" className="h-4 w-4 rounded" {...register('active')} />
          <label htmlFor="active" className="font-medium text-sm text-slate-700">Plano Ativo</label>
        </div>
      </div>
      <div className="w-full md:w-64 flex-shrink-0">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Preview</h4>
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="aspect-video bg-slate-100 flex items-center justify-center text-slate-400">
            {watchedImageUrl ? <img src={watchedImageUrl} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon size={32} />}
          </div>
          <div className="p-4">
            <h5 className="font-bold truncate">{watch('name') || 'Nome do Plano'}</h5>
            <p className="text-hero-primary font-bold">R$ {(watch('priceCents') / 100 || 0).toFixed(2).replace('.', ',')}</p>
          </div>
        </div>
      </div>
    </form>
  );

  const modalFooter = (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
      <Button type="submit" form="plan-form" isLoading={isSubmitting}>
        {editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
      </Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingPlan ? 'Editar Plano' : 'Novo Plano'} footer={modalFooter} size="lg">
      {formContent}
    </Modal>
  );
};