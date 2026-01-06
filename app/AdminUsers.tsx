
import React, { useEffect, useState } from 'react';
import { fakeApi } from '../lib/fakeApi';
import { User } from '../types';
import { Input } from '../components/ui/Input';
import { Card, CardBody } from '../components/ui/Card';
import { Search, Filter, ChevronRight, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
        <h2 className="text-3xl font-black">Usuários</h2>
        <p className="text-slate-500 font-medium">Gerencie heróis e colaboradores cadastrados.</p>
      </div>

      <div className="flex gap-4">
         <div className="flex-1">
            <Input 
              placeholder="Buscar por nome, CPF ou Código HE..." 
              icon={<Search size={18} />} 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
         </div>
         <button className="bg-white border p-2 rounded-xl text-slate-500 hover:text-hero-primary transition-colors">
            <Filter size={24} />
         </button>
      </div>

      <Card>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Herói</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Código</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">CPF</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Função</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/admin/users/${u.id}`)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden">
                        <img src={u.avatarUrl || `https://picsum.photos/seed/${u.id}/100`} alt="" />
                      </div>
                      <div>
                        <p className="text-sm font-black">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-black bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{u.customerCode}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{u.cpf}</td>
                  <td className="px-6 py-4">
                     <span className={`
                       text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-full
                       ${u.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : u.role === 'STAFF' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}
                     `}>
                       {u.role}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                    <ChevronRight size={18} className="text-slate-300" />
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
