import React, { useEffect, useState } from 'react';
import { fakeApi } from '../lib/fakeApi';
import { Plan } from '../types';
import { Button } from '../components/ui/Button';
import { PlusCircle, TrendingUp, Award, AlertTriangle, BarChart } from 'lucide-react';
import { PlanCard } from '../components/admin/PlanCard';
import { PlanFormModal } from '../components/admin/PlanFormModal';
import { Card, CardBody } from '../components/ui/Card';

const InsightPill: React.FC<{ icon: React.ElementType, label: string, value: string }> = ({ icon: Icon, label, value }) => (
  <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-3">
    <div className="bg-white p-2 rounded-md text-hero-primary"><Icon size={16} /></div>
    <div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="text-sm font-black text-slate-800">{value}</p>
    </div>
  </div>
);

const AdminPlans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const fetchPlans = () => {
    fakeApi.adminListAllPlans().then(setPlans);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openModal = (plan: Plan | null = null) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const onSubmit = async (data: Plan) => {
    if (editingPlan) {
      await fakeApi.adminUpdatePlan(editingPlan.id, data);
    } else {
      await fakeApi.adminCreatePlan(data);
    }
    fetchPlans();
    closeModal();
  };
  
  const handleToggleStatus = async (plan: Plan) => {
    if (window.confirm(`Tem certeza que deseja ${plan.active ? 'desativar' : 'ativar'} o plano "${plan.name}"?`)) {
      await fakeApi.adminUpdatePlan(plan.id, { active: !plan.active });
      fetchPlans();
    }
  };

  const handleDuplicate = async (plan: Plan) => {
    const newPlanData = { ...plan, name: `${plan.name} (Cópia)`, active: false };
    delete (newPlanData as any).id;
    await fakeApi.adminCreatePlan(newPlanData);
    fetchPlans();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Planos</h2>
          <p className="text-slate-500 font-medium">Gerencie os planos de assinatura disponíveis.</p>
        </div>
        <Button onClick={() => openModal()}>
          <PlusCircle size={18} className="mr-2" /> Novo Plano
        </Button>
      </div>

      {/* Insights Section */}
      <Card>
        <CardBody className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <InsightPill icon={TrendingUp} label="Mais Vendido" value="Plano Vingador" />
          <InsightPill icon={Award} label="Maior Resgate" value="Plano Vingador" />
          <InsightPill icon={AlertTriangle} label="Maior Churn" value="Plano Justiceiro" />
          <InsightPill icon={BarChart} label="Ticket Médio" value="R$ 39,90" />
        </CardBody>
      </Card>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <PlanCard 
            key={plan.id} 
            plan={plan}
            onEdit={openModal}
            onDuplicate={handleDuplicate}
            onToggleStatus={handleToggleStatus}
          />
        ))}
      </div>

      <PlanFormModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={onSubmit}
        editingPlan={editingPlan}
      />
    </div>
  );
};

export default AdminPlans;