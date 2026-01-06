import React, { useEffect, useState, useCallback } from 'react';
import { fakeApi } from '../lib/fakeApi';
import { User, Subscription, MonthlyBenefit } from '../types';
import { Input } from '../components/ui/Input';
import { Card, CardBody } from '../components/ui/Card';
import { Search, Filter, MoreHorizontal, X, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useDebounce } from '../hooks/useDebounce';
import { AdminUserFilters } from '../components/admin/AdminUserFilters';

type AugmentedUser = User & {
  subscription: Subscription | null;
  monthlyBenefit: MonthlyBenefit | null;
};

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AugmentedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ sortBy: 'newest' });
  
  const debouncedSearch = useDebounce(search, 300);
  const navigate = useNavigate();

  const fetchUsers = useCallback(async (currentPage: number, currentSearch: string, currentFilters: any) => {
    setLoading(true);
    const result = await fakeApi.adminListUsers({
      page: currentPage,
      search: currentSearch,
      filters: currentFilters,
      limit: 10,
    });
    setUsers(result.data);
    setTotalPages(result.totalPages);
    setLoading(false);
  }, []);

  useEffect(() => {
    setPage(1);
    fetchUsers(1, debouncedSearch, filters);
  }, [debouncedSearch, filters, fetchUsers]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchUsers(newPage, debouncedSearch, filters);
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'CANCELED': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getRedemptionBadge = (sub: Subscription | null, benefit: MonthlyBenefit | null) => {
    if (sub?.status !== 'ACTIVE') return { text: 'N/A', class: 'bg-slate-100 text-slate-600' };
    if (benefit?.burgerRedeemed) return { text: 'Usado', class: 'bg-amber-100 text-amber-800' };
    return { text: 'Disponível', class: 'bg-blue-100 text-blue-800' };
  };

  const UserCard: React.FC<{ user: AugmentedUser }> = ({ user }) => {
    const redemption = getRedemptionBadge(user.subscription, user.monthlyBenefit);
    return (
      <Card>
        <CardBody className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <img src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/100`} alt={user.name} className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-bold text-slate-800">{user.name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/users/${user.id}`)}>
              <MoreHorizontal size={18} className="text-slate-400" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-50">
            <div>
              <p className="font-bold text-slate-400">Status</p>
              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${getStatusBadge(user.subscription?.status)}`}>
                {user.subscription?.status || 'INATIVO'}
              </span>
            </div>
            <div>
              <p className="font-bold text-slate-400">Resgate</p>
              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${redemption.class}`}>
                {redemption.text}
              </span>
            </div>
            <div>
              <p className="font-bold text-slate-400">Código</p>
              <p className="font-semibold">{user.customerCode}</p>
            </div>
            <div>
              <p className="font-bold text-slate-400">Próx. Cobrança</p>
              <p className="font-semibold">{user.subscription ? new Date(user.subscription.nextBillingDate).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-800">Usuários</h2>
        <p className="text-slate-500 font-medium">Gerencie heróis e colaboradores cadastrados.</p>
      </div>

      <Card>
        <CardBody className="p-4 flex flex-col md:flex-row gap-4">
           <div className="flex-1 relative">
              <Input 
                placeholder="Buscar por nome, CPF, Código HE, email..." 
                icon={<Search size={18} />} 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-10"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              )}
           </div>
           <Button variant="outline" onClick={() => setIsFilterOpen(true)}>
              <SlidersHorizontal size={16} className="mr-2" /> Filtros
           </Button>
        </CardBody>
        
        {/* Mobile View: Cards */}
        <div className="md:hidden p-4 space-y-4 bg-slate-50">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-36 bg-white rounded-2xl animate-pulse" />)
          ) : (
            users.map(u => <UserCard key={u.id} user={u} />)
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Herói</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Resgate do Mês</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Próx. Cobrança</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="p-6"><div className="h-8 bg-slate-100 rounded animate-pulse" /></td></tr>
                ))
              ) : (
                users.map(u => {
                  const redemption = getRedemptionBadge(u.subscription, u.monthlyBenefit);
                  return (
                    <tr key={u.id} className="hover:bg-hero-primary/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img src={u.avatarUrl || `https://picsum.photos/seed/${u.id}/100`} alt={u.name} className="w-10 h-10 rounded-full" />
                          <div>
                            <p className="text-sm font-bold text-slate-800">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${getStatusBadge(u.subscription?.status)}`}>
                          {u.subscription?.status || 'INATIVO'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${redemption.class}`}>
                          {redemption.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {u.subscription ? new Date(u.subscription.nextBillingDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/users/${u.id}`)}>
                          <MoreHorizontal size={18} className="text-slate-400" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <CardBody className="p-4 flex justify-between items-center border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500">Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
              <ChevronLeft size={16} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </CardBody>
      </Card>

      <AdminUserFilters 
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        initialFilters={filters}
        onApply={setFilters}
      />
    </div>
  );
};

export default AdminUsers;