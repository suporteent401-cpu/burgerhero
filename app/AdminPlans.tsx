import React, { useEffect, useState } from 'react';
import { plansService } from '../services/plans.service';
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
    plansService.listAllPlans().then(setPlans);
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
      await plansService.updatePlan(editingPlan.id, data);
    } else {
      await plansService.createPlan(data);
    }
    fetchPlans();
    closeModal();
  };
  
  const handleToggleStatus = async (plan: Plan) => {
    if (window.confirm(`Tem certeza que deseja ${plan.active ? 'desativar' : 'ativar'} o plano "${plan.name}"?`)) {
      await plansService.updatePlan(plan.id, { is_active: !plan.active } as any);
      fetchPlans();
    }
  };

  const handleDuplicate = async (plan: Plan) => {
    const newPlanData = { ...plan, name: `${plan.name} (Cópia)`, is_active: false };
    // @ts-ignore
    delete newPlanData.id;
    await plansService.createPlan(newPlanData as any);
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

      <Card>
        <CardBody className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <InsightPill icon={TrendingUp} label="Total Planos" value={plans.length.toString()} />
          <InsightPill icon={Award} label="Ativos" value={plans.filter(p => p.active).length.toString()} />
        </CardBody>
      </Card>

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