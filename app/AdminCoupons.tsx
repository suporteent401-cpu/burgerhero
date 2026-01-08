import React, { useState, useEffect, useCallback } from 'react';
import { couponsService } from '../services/coupons.service';
import { Coupon, CampaignLog } from '../types';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PlusCircle, Search, Trash2, Edit, Send, BarChart, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Modal } from '../components/ui/Modal';

// Coupon Form Modal
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Código" placeholder="EX: VOLTA10" {...register('code', { required: true })} />
        <Input label="Desconto (%)" type="number" {...register('discountPercent', { required: true, valueAsNumber: true })} />
        <Input label="Válido até" type="date" {...register('expiresAt', { required: true })} />
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-2"><input type="checkbox" {...register('active')} /><span>Ativo</span></div>
          <div className="flex items-center gap-2"><input type="checkbox" {...register('ruleOnlyForInactives')} /><span>Apenas para inativos</span></div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" isLoading={isSubmitting}>{editingCoupon ? 'Salvar' : 'Criar'}</Button>
        </div>
      </form>
    </Modal>
  );
};

const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{ search?: string; status?: 'active' | 'expired' }>({});
  const [isCouponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [couponsData, campaignsData] = await Promise.all([
        couponsService.listCoupons(filters),
        couponsService.listCampaignLogs()
      ]);
      setCoupons(couponsData);
      setCampaigns(campaignsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCouponSubmit = async (data: any) => {
    if (editingCoupon) {
      await couponsService.updateCoupon(editingCoupon.id, data);
    } else {
      await couponsService.createCoupon(data);
    }
    setCouponModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Excluir este cupom?")) {
      await couponsService.deleteCoupon(id);
      fetchData();
    }
  };

  const openCouponModal = (coupon: Coupon | null = null) => {
    setEditingCoupon(coupon);
    setCouponModalOpen(true);
  };

  const handleDispatch = async (couponId: string) => {
    if(window.confirm("Disparar campanha para inativos?")) {
      await couponsService.dispatchCampaign(couponId, "Inativos 30d");
      fetchData();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Cupons e Campanhas</h2>
          <p className="text-slate-500 font-medium">Crie descontos e reative seus heróis.</p>
        </div>
        <Button onClick={() => openCouponModal()}><PlusCircle size={18} className="mr-2" /> Novo Cupom</Button>
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
                    <th className="p-4 text-xs font-bold text-slate-500">Código</th>
                    <th className="p-4 text-xs font-bold text-slate-500">Desconto</th>
                    <th className="p-4 text-xs font-bold text-slate-500">Validade</th>
                    <th className="p-4 text-xs font-bold text-slate-500">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c.id} className="border-b border-slate-100">
                      <td className="p-4 font-mono font-bold text-slate-700">{c.code}</td>
                      <td className="p-4 font-bold text-green-600">{c.discountPercent}%</td>
                      <td className="p-4 text-sm">{new Date(c.expiresAt).toLocaleDateString()}</td>
                      <td className="p-4 flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openCouponModal(c)}><Edit size={16} /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)} className="text-red-500"><Trash2 size={16} /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDispatch(c.id)} title="Disparar Campanha"><Send size={16} /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <h3 className="font-bold text-slate-600">Histórico de Campanhas</h3>
          {campaigns.map(camp => (
            <Card key={camp.id}>
              <CardBody className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-sm">{camp.couponCode}</p>
                  <p className="text-xs text-slate-400">{new Date(camp.dispatchedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex justify-between text-xs bg-slate-50 p-2 rounded-lg">
                  <span><BarChart size={12} className="inline mr-1" /> {camp.reach} enviados</span>
                  <span><CheckCircle size={12} className="inline mr-1 text-green-500" /> {camp.reactivations} ativos</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      <CouponFormModal isOpen={isCouponModalOpen} onClose={() => setCouponModalOpen(false)} onSubmit={handleCouponSubmit} editingCoupon={editingCoupon} />
    </div>
  );
};

export default AdminCoupons;