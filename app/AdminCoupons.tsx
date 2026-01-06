import React, { useState, useEffect, useCallback } from 'react';
import { fakeApi } from '../lib/fakeApi';
import { Coupon, CampaignLog } from '../types';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PlusCircle, Search, Filter, MoreHorizontal, Trash2, Edit, Send, BarChart, CheckCircle, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Modal } from '../components/ui/Modal';

// Coupon Form Modal Component
const CouponFormModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (data: any) => void; editingCoupon: Coupon | null; }> = ({ isOpen, onClose, onSubmit, editingCoupon }) => {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Coupon>();

  useEffect(() => {
    if (isOpen) {
      if (editingCoupon) {
        reset({ ...editingCoupon, expiresAt: editingCoupon.expiresAt.split('T')[0] });
      } else {
        reset({ code: '', discountPercent: 10, expiresAt: '', active: true, ruleOnlyForInactives: false });
      }
    }
  }, [editingCoupon, isOpen, reset]);

  const modalFooter = (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
      <Button type="submit" form="coupon-form" isLoading={isSubmitting}>{editingCoupon ? 'Salvar' : 'Criar'}</Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingCoupon ? 'Editar Cupom' : 'Novo Cupom'} footer={modalFooter}>
      <form id="coupon-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Código" placeholder="EX: VOLTA10" {...register('code', { required: true, onChange: (e) => e.target.value = e.target.value.toUpperCase().replace(/\s/g, '') })} />
        <Input label="Desconto (%)" type="number" {...register('discountPercent', { required: true, valueAsNumber: true })} />
        <Input label="Válido até" type="date" {...register('expiresAt', { required: true })} />
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-2"><input type="checkbox" {...register('active')} /><span>Ativo</span></div>
          <div className="flex items-center gap-2"><input type="checkbox" {...register('ruleOnlyForInactives')} /><span>Apenas para inativos</span></div>
        </div>
      </form>
    </Modal>
  );
};

// Campaign Form Modal Component
const CampaignFormModal: React.FC<{ isOpen: boolean; onClose: () => void; coupons: Coupon[]; }> = ({ isOpen, onClose, coupons }) => {
  const [loading, setLoading] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState('');

  const handleDispatch = async () => {
    if (!selectedCoupon) { alert("Selecione um cupom."); return; }
    setLoading(true);
    await fakeApi.adminDispatchCampaign(selectedCoupon, 'Inativos 30 dias');
    setLoading(false);
    alert("Campanha disparada com sucesso!");
    onClose();
  };

  const modalFooter = (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" onClick={onClose}>Cancelar</Button>
      <Button onClick={handleDispatch} isLoading={loading}><Send size={16} className="mr-2" /> Disparar Campanha</Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Campanha de Reativação" footer={modalFooter}>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-700">1. Escolha o Cupom</label>
          <select value={selectedCoupon} onChange={e => setSelectedCoupon(e.target.value)} className="w-full mt-1 bg-slate-50 border-2 border-slate-200 rounded-lg px-3 py-2">
            <option value="">Selecione...</option>
            {coupons.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.code} ({c.discountPercent}%)</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">2. Escolha o Segmento</label>
          <div className="mt-1 p-3 bg-slate-50 rounded-lg font-semibold">Usuários Inativos (últimos 30 dias)</div>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-sm text-blue-700">Estimativa de Alcance</p>
          <p className="text-2xl font-black text-blue-800">~150 Heróis</p>
        </div>
      </div>
    </Modal>
  );
};


// Main Page Component
const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{ search?: string; status?: 'active' | 'expired' }>({});
  const [isCouponModalOpen, setCouponModalOpen] = useState(false);
  const [isCampaignModalOpen, setCampaignModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [couponsData, campaignsData] = await Promise.all([
      fakeApi.adminListCoupons(filters),
      fakeApi.adminGetCampaignLogs()
    ]);
    setCoupons(couponsData);
    setCampaigns(campaignsData);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCouponSubmit = async (data: any) => {
    if (editingCoupon) {
      await fakeApi.adminUpdateCoupon(editingCoupon.id, data);
    } else {
      await fakeApi.adminCreateCoupon(data);
    }
    setCouponModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este cupom?")) {
      await fakeApi.adminDeleteCoupon(id);
      fetchData();
    }
  };

  const openCouponModal = (coupon: Coupon | null = null) => {
    setEditingCoupon(coupon);
    setCouponModalOpen(true);
  };

  const getStatus = (c: Coupon) => {
    if (!c.active) return { text: 'Inativo', color: 'bg-slate-100 text-slate-600' };
    if (new Date(c.expiresAt) < new Date()) return { text: 'Expirado', color: 'bg-red-100 text-red-600' };
    return { text: 'Ativo', color: 'bg-green-100 text-green-600' };
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Cupons e Campanhas</h2>
          <p className="text-slate-500 font-medium">Crie descontos e reative seus heróis.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCampaignModalOpen(true)}><Send size={16} className="mr-2" /> Criar Campanha</Button>
          <Button onClick={() => openCouponModal()}><PlusCircle size={18} className="mr-2" /> Novo Cupom</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardBody className="p-4 flex gap-4">
              <Input placeholder="Buscar por código..." icon={<Search size={18} />} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
              <select onChange={e => setFilters(f => ({ ...f, status: e.target.value as any }))} className="bg-slate-50 border-2 border-slate-200 rounded-xl px-3 font-semibold text-sm">
                <option value="">Todos</option>
                <option value="active">Ativos</option>
                <option value="expired">Expirados</option>
              </select>
            </CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Código</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Desconto</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Válido até</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => {
                    const status = getStatus(c);
                    return (
                      <tr key={c.id} className="border-b border-slate-100">
                        <td className="p-4 font-mono font-bold text-slate-700">{c.code}</td>
                        <td className="p-4 font-bold text-slate-600">{c.discountPercent}%</td>
                        <td className="p-4"><span className={`px-2 py-1 text-xs font-bold rounded-full ${status.color}`}>{status.text}</span></td>
                        <td className="p-4 text-sm text-slate-500">{new Date(c.expiresAt).toLocaleDateString()}</td>
                        <td className="p-4 flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openCouponModal(c)}><Edit size={16} /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)} className="text-red-500"><Trash2 size={16} /></Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <h3 className="font-bold text-slate-600">Últimas Campanhas</h3>
          {campaigns.map(camp => (
            <Card key={camp.id}>
              <CardBody className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-sm">{camp.couponCode} <span className="text-xs font-normal text-slate-500">({camp.segment})</span></p>
                  <p className="text-xs text-slate-400">{new Date(camp.dispatchedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex justify-between text-xs bg-slate-50 p-2 rounded-lg">
                  <span><BarChart size={12} className="inline mr-1" /> {camp.reach} enviados</span>
                  <span><CheckCircle size={12} className="inline mr-1 text-green-500" /> {camp.reactivations} reativados</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      <CouponFormModal isOpen={isCouponModalOpen} onClose={() => setCouponModalOpen(false)} onSubmit={handleCouponSubmit} editingCoupon={editingCoupon} />
      <CampaignFormModal isOpen={isCampaignModalOpen} onClose={() => setCampaignModalOpen(false)} coupons={coupons} />
    </div>
  );
};

export default AdminCoupons;