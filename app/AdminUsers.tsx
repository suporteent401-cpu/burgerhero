import React, { useEffect, useState, useCallback } from 'react';
import { adminUsersService, AdminUserListItem } from '../services/adminUsers.service';
import { Input } from '../components/ui/Input';
import { Card, CardBody } from '../components/ui/Card';
import { Search, X, ChevronLeft, ChevronRight, SlidersHorizontal, MoreHorizontal, Shield, User as UserIcon, Wrench } from 'lucide-react';
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
  const [totalRecords, setTotalRecords] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({});
  
  const debouncedSearch = useDebounce(search, 500); // 500ms para evitar muitas requisições
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
      setTotalRecords(result.total);
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
    if (!status) return <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-slate-100 text-slate-500">SEM PLANO</span>;
    
    const s = status.toLowerCase();
    switch (s) {
      case 'active': 
        return <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-green-100 text-green-700 border border-green-200">ATIVO</span>;
      case 'past_due': 
        return <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-amber-100 text-amber-700 border border-amber-200">PENDENTE</span>;
      case 'canceled': 
        return <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-red-100 text-red-700 border border-red-200">CANCELADO</span>;
      default: 
        return <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-slate-100 text-slate-600 border border-slate-200">{s.toUpperCase()}</span>;
    }
  };

  const getRoleIcon = (role: string) => {
    const r = role.toLowerCase();
    if (r === 'admin') return <Shield size={14} className="text-red-500" />;
    if (r === 'staff') return <Wrench size={14} className="text-blue-500" />;
    return <UserIcon size={14} className="text-slate-400" />;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Usuários</h2>
          <p className="text-slate-500 font-medium">Base de dados completa ({totalRecords} registros).</p>
        </div>
      </div>

      <Card>
        <CardBody className="p-4 flex flex-col md:flex-row gap-4">
           <div className="flex-1 relative">
              <Input 
                placeholder="Buscar por nome, Código HE ou email..." 
                icon={<Search size={18} />} 
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pr-10"
              />
              {search && (
                <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
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
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Herói</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Próx. Cobrança</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 animate-pulse">Carregando base de dados...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400">Nenhum usuário encontrado com os filtros atuais.</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                           <img src={u.avatarUrl || `https://picsum.photos/seed/${u.id}/100`} alt={u.name} className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
                           <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm" title={u.role}>
                              {getRoleIcon(u.role)}
                           </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(u.subscriptionStatus)}
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200">
                        {u.customerCode}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {u.nextBillingDate ? new Date(u.nextBillingDate).toLocaleDateString() : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/users/${u.id}`)} className="text-slate-400 hover:text-hero-primary hover:bg-hero-primary/10">
                        <MoreHorizontal size={18} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <CardBody className="p-4 flex justify-between items-center border-t border-slate-100 bg-slate-50/50">
          <span className="text-xs font-semibold text-slate-500">
            Página {page} de {totalPages}
          </span>
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