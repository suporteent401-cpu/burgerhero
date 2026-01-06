import React, { useEffect, useState } from 'react';
import { fakeApi } from '../lib/fakeApi';
import { User } from '../types';
import { Input } from '../components/ui/Input';
import { Card, CardBody } from '../components/ui/Card';
import { Search, Filter, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fakeApi.adminListUsers(search).then(setUsers);
  }, [search]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-800">Usuários</h2>
        <p className="text-slate-500 font-medium">Gerencie heróis e colaboradores cadastrados.</p>
      </div>

      <Card>
        <CardBody className="p-4 flex gap-4">
           <div className="flex-1">
              <Input 
                placeholder="Buscar por nome, CPF ou Código HE..." 
                icon={<Search size={18} />} 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
           </div>
           <Button variant="outline">
              <Filter size={16} className="mr-2" /> Filtros
           </Button>
        </CardBody>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Herói</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">CPF</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Função</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
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
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{u.customerCode}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600 font-mono">{u.cpf}</td>
                  <td className="px-6 py-4">
                     <span className={`
                       text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full
                       ${u.role === 'ADMIN' ? 'bg-amber-100 text-amber-800' : u.role === 'STAFF' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}
                     `}>
                       {u.role}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/users/${u.id}`)}>
                      <MoreHorizontal size={18} className="text-slate-400" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
};

export default AdminUsers;