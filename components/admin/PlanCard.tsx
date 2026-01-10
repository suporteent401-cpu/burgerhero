import React from 'react';
import { Plan } from '../../types';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Edit, Copy, ToggleLeft, ToggleRight, Users, BarChart2, Trash2 } from 'lucide-react';

interface PlanCardProps {
  plan: Plan;
  onEdit: (plan: Plan) => void;
  onDuplicate: (plan: Plan) => void;
  onToggleStatus: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, onEdit, onDuplicate, onToggleStatus, onDelete }) => {
  return (
    <Card className="flex flex-col h-full group">
      <div className="relative">
        {/* Tamanho da imagem reduzido de aspect-video para aspect-[3/1] para ocupar menos espaço vertical */}
        <div className="aspect-[3/1] bg-slate-100 rounded-t-2xl overflow-hidden">
          <img src={plan.imageUrl} alt={plan.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 text-white ${plan.active ? 'bg-green-500' : 'bg-slate-500'}`}>
          <div className="w-2 h-2 rounded-full bg-white/80"></div>
          {plan.active ? 'Ativo' : 'Inativo'}
        </div>
      </div>
      <CardBody className="p-5 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-black text-slate-800">{plan.name}</h3>
            <span className="text-xl font-black text-hero-primary">R$ {(plan.priceCents / 100).toFixed(2).replace('.', ',')}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 mb-4 h-8">{plan.description}</p>
          
          <div className="space-y-2">
            {plan.benefits.slice(0, 2).map((b, i) => (
              <p key={i} className="text-xs font-semibold text-slate-600 truncate">✓ {b}</p>
            ))}
            {plan.benefits.length > 2 && <p className="text-xs font-bold text-slate-400">...e mais {plan.benefits.length - 2} benefício(s)</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-slate-400" />
            <div>
              <p className="text-sm font-bold text-slate-700">{plan.subscriberCount}</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Assinantes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-slate-400" />
            <div>
              <p className="text-sm font-bold text-slate-700">{plan.popularity}%</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Popularidade</p>
            </div>
          </div>
        </div>
      </CardBody>
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="flex-1 min-w-[80px]" onClick={() => onEdit(plan)}>
          <Edit size={14} className="mr-2" /> Editar
        </Button>
        <Button size="sm" variant="outline" className="flex-1 min-w-[80px]" onClick={() => onDuplicate(plan)}>
          <Copy size={14} className="mr-2" /> Duplicar
        </Button>
        <Button size="sm" variant="outline" className="flex-1 min-w-[100px]" onClick={() => onToggleStatus(plan)}>
          {plan.active ? <ToggleRight size={14} className="mr-2 text-green-500" /> : <ToggleLeft size={14} className="mr-2 text-slate-500" />}
          {plan.active ? 'Desativar' : 'Ativar'}
        </Button>
        <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => onDelete(plan)} title="Excluir Plano">
          <Trash2 size={14} />
        </Button>
      </div>
    </Card>
  );
};