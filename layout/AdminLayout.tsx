import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Tag, LogOut, Image as ImageIcon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { supabase } from '../lib/supabaseClient';

const AdminLayout: React.FC = () => {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const heroTheme = useThemeStore(s => s.heroTheme);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    logout();
    navigate('/auth');
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro silencioso ao deslogar do Supabase:", error);
    }
  };

  const navItems = [
    { label: 'Painel', icon: LayoutDashboard, path: '/admin' },
    { label: 'Usuários', icon: Users, path: '/admin/users' },
    { label: 'Planos', icon: CreditCard, path: '/admin/plans' },
    { label: 'Modelos', icon: ImageIcon, path: '/admin/templates' },
    { label: 'Cupons', icon: Tag, path: '/admin/coupons' },
  ];

  // Lógica de cor condicional para o 'Hero' no Admin
  const heroTextColor = heroTheme === 'preto-absoluto' ? 'text-blue-400' : 'text-hero-primary';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 bg-slate-800 text-white flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-black tracking-tighter">
            Admin<span className={heroTextColor}>Hero</span>
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.path}
                to={item.path} 
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive ? 'bg-hero-primary/10 text-hero-primary font-bold' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={20} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <img src={user?.avatarUrl || `https://picsum.photos/seed/${user?.id}/100`} alt={user?.name} className="w-10 h-10 rounded-full bg-slate-700" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 p-2 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-xl font-black">Admin<span className={heroTextColor}>Hero</span></h1>
        <button onClick={handleLogout}><LogOut size={20} /></button>
      </header>

      <main className="flex-1 p-4 md:p-8 lg:p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around z-10">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={`p-2 rounded-lg ${isActive ? 'text-hero-primary' : 'text-slate-500'}`}>
              <item.icon size={24}/>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminLayout;