import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminUsersService } from '../services/adminUsers.service';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Mail, Phone, CreditCard, Calendar, CheckCircle, Gift, ShieldCheck, User as UserIcon } from 'lucide-react';

const DetailItem: React.FC<{ icon: React.ElementType, label: string, value: React.ReactNode }> = ({ icon: Icon, label, value }) => (
  <div>
    <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5"><Icon size={12} /> {label}</p>
    <p className="font-semibold text-slate-700">{value}</p>
  </div>
);

const AdminUserDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      adminUsersService.getUserDetails(id)
        .then(res => setData(res))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="text-center p-10">Carregando dados do herói...</div>;
  if (!data) return <div className="text-center p-10">Herói não encontrado.</div>;

  const { user, subscription, plan, redemptionHistory } = data;

  return (
    <div className="space-y-8">
      <Link to="/admin/users" className="flex items-center gap-2 font-bold text-slate-500 hover:text-hero-primary">
        <ArrowLeft size={18} /> Voltar para Usuários
      </Link>

      {/* Header */}
      <div className="flex items-center gap-6">
        <img src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/200`} alt={user.name} className="w-24 h-24 rounded-full shadow-lg" />
        <div>
          <h2 className="text-3xl font-black text-slate-800">{user.name}</h2>
          <p className="font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md inline-block text-sm mt-1">{user.customerCode}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader><h3 className="font-bold text-slate-700">Assinatura e Plano</h3></CardHeader>
            <CardBody className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <DetailItem icon={ShieldCheck} label="Status" value={
                <span className={`font-bold ${subscription?.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                  {subscription?.status?.toUpperCase() || 'INACTIVE'}
                </span>
              } />
              <DetailItem icon={CreditCard} label="Plano" value={plan?.name || 'N/A'} />
              <DetailItem icon={Calendar} label="Próxima Cobrança" value={subscription?.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString() : 'N/A'} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h3 className="font-bold text-slate-700">Últimos Resgates</h3></CardHeader>
            <CardBody className="p-0">
              {redemptionHistory.length === 0 ? (
                <p className="p-4 text-slate-500 text-sm">Nenhum resgate registrado.</p>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {redemptionHistory.map((item: any, i: number) => (
                    <li key={i} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 text-green-600 p-2 rounded-full"><Gift size={16} /></div>
                        <div>
                          <p className="font-bold text-sm text-slate-800">{item.month}</p>
                          <p className="text-xs text-slate-500">Realizado em {new Date(item.redeemedAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <CheckCircle size={20} className="text-green-500" />
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-8">
          <Card>
            <CardHeader><h3 className="font-bold text-slate-700">Informações Pessoais</h3></CardHeader>
            <CardBody className="space-y-4">
              <DetailItem icon={UserIcon} label="Nome Completo" value={user.name} />
              <DetailItem icon={Mail} label="Email" value={user.email} />
              <DetailItem icon={CreditCard} label="CPF" value={user.cpf || '-'} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetails;