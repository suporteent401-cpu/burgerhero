import React, { useState, useEffect, useCallback } from 'react';
import { couponsService } from '../services/coupons.service';
import { Coupon, CampaignLog } from '../types';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  PlusCircle, Search, Trash2, Edit, Send, 
  BarChart3, CheckCircle2, Ticket, Clock, 
  AlertCircle, Zap, Megaphone, Copy 
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Modal } from '../components/ui/Modal';

// --- MODAL DE FORMULÁRIO ---
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
    <Modal isOpen={isOpen} onClose={onClose} title={editingCoupon ? 'Editar Campanha' : 'Nova Campanha'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-hero-primary/10 rounded-full flex items-center justify-center text-hero-primary">
            <Ticket size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-700">Configuração do Cupom</h3>
            <p className="text-xs text-slate-500">Defina o código e as regras de desconto.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Código do Cupom" placeholder="EX: HERO2024" {...register('code', { required: true })} />
          <Input label="Desconto (%)" type="number" {...register('discountPercent', { required: true, valueAsNumber: true })} />
        </div>
        
        <Input label="Válido até" type="date" {...register('expiresAt', { required: true })} />
        
        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase">Regras de Aplicação</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded text-hero-primary focus:ring-hero-primary" {...register('active')} />
            <span className="text-sm font-medium text-slate-700">Ativar Imediatamente</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded text-hero-primary focus:ring-hero-primary" {...register('ruleOnlyForInactives')} />
            <span className="text-sm font-medium text-slate-700">Exclusivo para recuperação (apenas inativos)</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" isLoading={isSubmitting}>{editingCoupon ? 'Salvar Alterações' : 'Criar Campanha'}</Button>
        </div>
      </form>
    </Modal>
  );
};

// --- COMPONENTES VISUAIS ---

const MetricCard: React.FC<{ title: string; value: string; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => (
  <Card className="flex-1">
    <CardBody className="p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
    </CardBody>
  </Card>
);

const CouponCard: React.FC<{ 
  coupon: Coupon; 
  onEdit: () => void; 
  onDelete: () => void; 
  onDispatch: () => void 
}> = ({ coupon, onEdit, onDelete, onDispatch }) => {
  const isExpired = new Date(coupon.expiresAt) < new Date();
  const statusColor = !coupon.active ? 'bg-slate-100 text-slate-400' : isExpired ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600';
  const statusText = !coupon.active ? 'Inativo' : isExpired ? 'Expirado' : 'Ativo';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cupom</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-black text-slate-800">{coupon.code}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(coupon.code)}
                className="text-slate-300 hover:text-hero-primary transition-colors"
                title="Copiar"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${statusColor}`}>
            {statusText === 'Ativo' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
            {statusText}
          </div>
        </div>

        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-4xl font-black text-hero-primary">{coupon.discountPercent}%</span>
          <span className="text-sm font-bold text-slate-400">OFF</span>
        </div>

        <div className="space-y-2 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-300" />
            <span>Expira em: {new Date(coupon.expiresAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={14} className={coupon.ruleOnlyForInactives ? "text-amber-500" : "text-slate-300"} />
            <span>Público: {coupon.ruleOnlyForInactives ? 'Apenas Inativos' : 'Todos os Usuários'}</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border-t border-slate-100 p-3 flex gap-2">
        <Button size="sm" variant="ghost" className="flex-1 text-slate-600" onClick={onEdit}>
          <Edit size={14} className="mr-2" /> Editar
        </Button>
        <div className="w-px bg-slate-200 my-1"></div>
        <Button size="sm" variant="ghost" className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={onDelete}>
          <Trash2 size={14} />
        </Button>
        <div className="w-px bg-slate-200 my-1"></div>
        <Button size="sm" variant="ghost" className="flex-1 text-hero-primary hover:bg-blue-50" onClick={onDispatch} title="Disparar Push">
          <Send size={14} />
        </Button>
      </div>
    </div>
  );
};

// --- PÁGINA PRINCIPAL ---

const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCouponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [couponsData, campaignsData] = await Promise.all([
        couponsService.listCoupons({ search: searchTerm }),
        couponsService.listCampaignLogs()
      ]);
      setCoupons(couponsData);
      setCampaigns(campaignsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

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
    if (window.confirm("Tem certeza que deseja excluir esta campanha?")) {
      await couponsService.deleteCoupon(id);
      fetchData();
    }
  };

  const openCouponModal = (coupon: Coupon | null = null) => {
    setEditingCoupon(coupon);
    setCouponModalOpen(true);
  };

  const handleDispatch = async (couponId: string) => {
    if(window.confirm("Disparar campanha para a base selecionada?")) {
      await couponsService.dispatchCampaign(couponId, "Segmento Automático");
      fetchData();
    }
  };

  // Metrics
  const activeCount = coupons.filter(c => c.active && new Date(c.expiresAt) > new Date()).length;
  const totalDispatched = campaigns.reduce((acc, curr) => acc + (curr.reach || 0), 0);

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Central de Campanhas</h2>
          <p className="text-slate-500 font-medium">Crie cupons e gerencie o engajamento dos heróis.</p>
        </div>
        <Button onClick={() => openCouponModal()} size="lg" className="shadow-lg shadow-hero-primary/20">
          <PlusCircle size={20} className="mr-2" /> Criar Nova Campanha
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard 
          title="Campanhas Ativas" 
          value={activeCount.toString()} 
          icon={Megaphone} 
          color="bg-blue-100 text-blue-600" 
        />
        <MetricCard 
          title="Cupons Criados" 
          value={coupons.length.toString()} 
          icon={Ticket} 
          color="bg-purple-100 text-purple-600" 
        />
        <MetricCard 
          title="Alcance Total" 
          value={totalDispatched.toLocaleString()} 
          icon={BarChart3} 
          color="bg-green-100 text-green-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal: Lista de Cupons */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <Ticket size={20} className="text-hero-primary" /> Meus Cupons
            </h3>
            <div className="relative w-64">
              <Input 
                placeholder="Buscar código..." 
                icon={<Search size={16} />} 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-10 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coupons.map(coupon => (
              <CouponCard 
                key={coupon.id}
                coupon={coupon}
                onEdit={() => openCouponModal(coupon)}
                onDelete={() => handleDelete(coupon.id)}
                onDispatch={() => handleDispatch(coupon.id)}
              />
            ))}
            
            {coupons.length === 0 && (
              <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <Ticket size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="font-bold text-slate-500">Nenhuma campanha encontrada</p>
                <p className="text-sm text-slate-400">Crie seu primeiro cupom para começar.</p>
              </div>
            )}
          </div>
        </div>

        {/* Coluna Lateral: Histórico (Timeline) */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
            <Clock size={20} className="text-slate-400" /> Histórico de Disparos
          </h3>
          
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 h-[600px] overflow-y-auto">
             <div className="space-y-6 relative pl-4 before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-[2px] before:bg-slate-100">
                {campaigns.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Nenhum registro de envio.</p>
                ) : campaigns.map(log => (
                  <div key={log.id} className="relative pl-8">
                    <div className="absolute left-0 top-1 w-10 h-10 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center z-10">
                      <Send size={16} className="text-hero-primary" />
                    </div>
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">{log.couponCode}</span>
                        <span className="text-[10px] text-slate-400">{new Date(log.dispatchedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1 font-medium">Disparo para {log.segment}</p>
                      <div className="flex gap-3 mt-2">
                        <div className="text-xs text-slate-500">
                          <strong className="text-slate-800">{log.reach}</strong> <span className="text-[10px] uppercase">Enviados</span>
                        </div>
                        {/* Mock de reativação para visual */}
                        <div className="text-xs text-green-600">
                           <strong className="text-green-700">{(log.reach * 0.12).toFixed(0)}</strong> <span className="text-[10px] uppercase">Usados</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      <CouponFormModal 
        isOpen={isCouponModalOpen} 
        onClose={() => setCouponModalOpen(false)} 
        onSubmit={handleCouponSubmit} 
        editingCoupon={editingCoupon} 
      />
    </div>
  );
};

export default AdminCoupons;