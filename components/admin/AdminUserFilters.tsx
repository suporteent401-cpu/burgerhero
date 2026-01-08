import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { plansService } from '../../services/plans.service';
import { Plan } from '../../types';

interface AdminUserFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilters: any;
  onApply: (filters: any) => void;
}

const FilterGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="py-4 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{title}</h4>
    {children}
  </div>
);

const ToggleButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-sm font-semibold rounded-lg border-2 transition-all ${
      active ? 'bg-hero-primary/10 border-hero-primary text-hero-primary' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 dark:text-slate-300 hover:border-slate-200 dark:hover:border-slate-700'
    }`}
  >
    {children}
  </button>
);

export const AdminUserFilters: React.FC<AdminUserFiltersProps> = ({ isOpen, onClose, initialFilters, onApply }) => {
  const [filters, setFilters] = useState(initialFilters);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    // Substituindo fakeApi por plansService
    plansService.listAllPlans().then(setPlans);
  }, []);

  useEffect(() => {
    if (isOpen) setFilters(initialFilters);
  }, [initialFilters, isOpen]);

  const handleToggle = (key: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [key]: prev[key] === value ? null : value }));
  };

  const handleSelect = (key: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => { onApply(filters); onClose(); };
  const handleClear = () => { const cleared = { sortBy: 'newest' }; setFilters(cleared); onApply(cleared); onClose(); };

  const modalContent = (
    <div className="space-y-2">
      <FilterGroup title="Status da Assinatura">
        <div className="flex flex-wrap gap-2">
          <ToggleButton active={filters.status === 'ACTIVE'} onClick={() => handleToggle('status', 'ACTIVE')}>Ativo</ToggleButton>
          <ToggleButton active={filters.status === 'INACTIVE'} onClick={() => handleToggle('status', 'INACTIVE')}>Inativo</ToggleButton>
          <ToggleButton active={filters.status === 'CANCELED'} onClick={() => handleToggle('status', 'CANCELED')}>Cancelado</ToggleButton>
        </div>
      </FilterGroup>
      <FilterGroup title="Resgate do Mês">
        <div className="flex flex-wrap gap-2">
          <ToggleButton active={filters.canRedeem === 'yes'} onClick={() => handleToggle('canRedeem', 'yes')}>Disponível</ToggleButton>
          <ToggleButton active={filters.hasRedeemed === 'yes'} onClick={() => handleToggle('hasRedeemed', 'yes')}>Já Resgatou</ToggleButton>
        </div>
      </FilterGroup>
      <FilterGroup title="Função (Role)">
        <div className="flex flex-wrap gap-2">
          <ToggleButton active={filters.role === 'CLIENT'} onClick={() => handleToggle('role', 'CLIENT')}>Cliente</ToggleButton>
          <ToggleButton active={filters.role === 'STAFF'} onClick={() => handleToggle('role', 'STAFF')}>Staff</ToggleButton>
          <ToggleButton active={filters.role === 'ADMIN'} onClick={() => handleToggle('role', 'ADMIN')}>Admin</ToggleButton>
        </div>
      </FilterGroup>
      <FilterGroup title="Plano">
        <select value={filters.planId || ''} onChange={(e) => handleSelect('planId', e.target.value || null)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold">
          <option value="">Todos os Planos</option>
          {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </FilterGroup>
      <FilterGroup title="Ordenar por">
        <select value={filters.sortBy} onChange={(e) => handleSelect('sortBy', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold">
          <option value="newest">Mais Recentes</option>
          <option value="oldest">Mais Antigos</option>
        </select>
      </FilterGroup>
    </div>
  );

  const modalFooter = (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleClear} className="w-full">Limpar</Button>
      <Button onClick={handleApply} className="w-full">Aplicar Filtros</Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filtros e Ordenação" footer={modalFooter}>
      {modalContent}
    </Modal>
  );
};