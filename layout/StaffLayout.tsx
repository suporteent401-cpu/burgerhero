import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, QrCode, LogOut } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/authStore';

const StaffLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const heroTheme = useThemeStore(state => state.heroTheme);
  
  const navItems = [
    { label: 'Início', icon: Home, path: '/staff' },
    { label: 'Validar', icon: QrCode, path: '/staff/validate' },
  ];

  const themesForBlueText = ['guardiao-escarlate', 'aurora-rosa', 'tita-dourado', 'vermelho-heroi', 'laranja-vulcanico'];
  const heroTextColor = themesForBlueText.includes(heroTheme) ? 'text-blue-300' : 'text-red-500';

  const handleLogout = async () => {
    // 1. Limpa estado local imediatamente
    logout();
    
    // 2. Redireciona
    navigate('/auth');

    // 3. Limpa sessão Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro ao fazer logout no servidor:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-300">
      <header className="sticky top-0 z-30 bg-hero-primary text-white px-4 py-3 shadow-md">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Link to="/staff" className="flex items-center gap-3">
            <img src="https://ik.imagekit.io/lflb43qwh/Heros/images.jpg" alt="BurgerHero Logo" className="h-10 w-10 rounded-full border-2 border-white/50" />
            <h1 className="text-xl font-extrabold tracking-tight">
              <span className="text-white/90">Staff</span><span className={heroTextColor}>Hero</span>
            </h1>
          </Link>
          <button 
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-hero-primary px-4 py-2 z-40 transition-colors shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${isActive ? 'text-white bg-white/25 scale-110' : 'text-white/70 hover:text-white'}`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default StaffLayout;