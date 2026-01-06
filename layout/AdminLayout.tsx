
import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Tag, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const AdminLayout: React.FC = () => {
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col">
        <div className="p-8">
          <h1 className="text-2xl font-black">Admin<span className="text-hero-primary">Hero</span></h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link to="/admin" className="flex items-center gap-3 p-3 hover:bg-white/10 rounded-xl">
            <LayoutDashboard size={20} /> Painel
          </Link>
          <Link to="/admin/users" className="flex items-center gap-3 p-3 hover:bg-white/10 rounded-xl">
            <Users size={20} /> Usuários
          </Link>
          <Link to="/admin/plans" className="flex items-center gap-3 p-3 hover:bg-white/10 rounded-xl">
            <CreditCard size={20} /> Planos
          </Link>
          <Link to="/admin/coupons" className="flex items-center gap-3 p-3 hover:bg-white/10 rounded-xl">
            <Tag size={20} /> Cupons
          </Link>
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="flex items-center gap-3 p-3 w-full text-left text-red-400 hover:bg-red-500/10 rounded-xl">
            <LogOut size={20} /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-black">Admin<span className="text-hero-primary">Hero</span></h1>
        <button onClick={handleLogout}><LogOut size={20} /></button>
      </header>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around">
          <Link to="/admin" className="p-2"><LayoutDashboard size={20}/></Link>
          <Link to="/admin/users" className="p-2"><Users size={20}/></Link>
          <Link to="/admin/plans" className="p-2"><CreditCard size={20}/></Link>
          <Link to="/admin/coupons" className="p-2"><Tag size={20}/></Link>
      </nav>
    </div>
  );
};

export default AdminLayout;
