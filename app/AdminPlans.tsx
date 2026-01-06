import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { fakeApi } from '../lib/fakeApi';
import { Plan } from '../types';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PlusCircle, Edit, ToggleLeft, ToggleRight } from 'lucide-react';

const AdminPlans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const { register, handleSubmit, reset } = useForm<Plan>();

  const fetchPlans = () => {
    fakeApi.adminListAllPlans().then(setPlans);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openModal = (plan: Plan | null = null) => {
    setEditingPlan(plan);
    if (plan) {
      const planData = {
        ...plan,
        benefits: Array.isArray(plan.benefits) ? plan.benefits.join(', ') : '',
      };
      reset(planData);
    } else {
      reset({
        name: '',
        priceCents: 0,
        description: '',
        benefits: [],
        imageUrl: '',
        active: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
    reset();
  };

  const onSubmit = async (data: any) => {
    const priceCents = parseInt(String(data.priceCents), 10);
    const benefits = typeof data.benefits === 'string' ? data.benefits.split(',').map(b => b.trim()) : [];

    const payload = { ...data, priceCents, benefits };

    if (editingPlan) {
      await fakeApi.adminUpdatePlan(editingPlan.id, payload);
    } else {
      await fakeApi.adminCreatePlan(payload);
    }
    fetchPlans();
    closeModal();
  };
  
  const togglePlanStatus = async (plan: Plan) => {
    await fakeApi.adminUpdatePlan(plan.id, { active: !plan.active });
    fetchPlans();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black">Planos</h2>
          <p className="text-slate-500 font-medium">Gerencie os planos de assinatura disponíveis.</p>
        </div>
        <Button onClick={() => openModal()}>
          <PlusCircle size={18} className="mr-2" /> Novo Plano
        </Button>
      </div>

      <Card>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Plano</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Preço</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {plans.map(plan => (
                <tr key={plan.id}>
                  <td className="px-6 py-4">
                    <div className="font-black">{plan.name}</div>
                    <div className="text-xs text-slate-400 max-w-xs truncate">{plan.description}</div>
                  </td>
                  <td className="px-6 py-4 font-bold">R$ {(plan.priceCents / 100).toFixed(2).replace('.',',')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${plan.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {plan.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => togglePlanStatus(plan)}>
                        {plan.active ? <ToggleRight className="text-green-500" size={20} /> : <ToggleLeft className="text-slate-400" size={20} />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openModal(plan)}>
                        <Edit size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingPlan ? 'Editar Plano' : 'Novo Plano'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome do Plano" {...register('name', { required: true })} />
          <Input label="Preço (em centavos)" type="number" {...register('priceCents', { required: true, valueAsNumber: true })} />
          <Input label="Descrição" {...register('description', { required: true })} />
          <Input label="Benefícios (separados por vírgula)" {...register('benefits')} />
          <Input label="URL da Imagem" {...register('imageUrl', { required: true })} />
          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="active" {...register('active')} />
            <label htmlFor="active" className="font-medium text-sm text-slate-700">Plano Ativo</label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button type="submit">{editingPlan ? 'Salvar Alterações' : 'Criar Plano'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPlans;