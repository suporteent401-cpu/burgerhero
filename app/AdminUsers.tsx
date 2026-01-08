import React, { useEffect, useState, useCallback } from 'react';
import { adminUsersService, AdminUserListItem } from '../services/adminUsers.service';
import { Input } from '../components/ui/Input';
import { Card, CardBody } from '../components/ui/Card';
import { Search, X, ChevronLeft, ChevronRight, SlidersHorizontal, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useDebounce } from '../hooks/useDebounce';
import { AdminUserFilters } from '../components/admin/AdminUserFilters';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({});
  
  const debouncedSearch = useDebounce(search, 300);
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminUsersService.listUsers({
        page,
        search: debouncedSearch,
        limit: 10,
        filters
      });
      setUsers(result.data);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-600';
    }
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
                placeholder="Buscar por nome, Código HE, email..." 
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
        
        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Herói</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Código</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Próx. Cobrança</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Carregando heróis...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhum usuário encontrado.</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={u.avatarUrl || `https://picsum.photos/seed/${u.id}/100`} alt={u.name} className="w-10 h-10 rounded-full bg-slate-200" />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${getStatusBadge(u.subscriptionStatus)}`}>
                        {u.subscriptionStatus || 'INATIVO'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">
                      {u.customerCode}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {u.nextBillingDate ? new Date(u.nextBillingDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/users/${u.id}`)}>
                        <MoreHorizontal size={18} className="text-slate-400" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
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
        onApply={(newFilters) => { setFilters(newFilters); setPage(1); }}
      />
    </div>
  );
};

export default AdminUsers;