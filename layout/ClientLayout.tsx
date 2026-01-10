import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, QrCode, Ticket, User, Crown } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';

const ClientLayout: React.FC = () => {
  const location = useLocation();
  const heroTheme = useThemeStore((state) => state.heroTheme);
  const user = useAuthStore((state) => state.user);

  const isActive = (path: string) => location.pathname === path;

  // Ajuste fino de cor para temas (mantive simples pra não quebrar teu tema atual)
  const barBg = heroTheme === 'preto-absoluto' ? 'bg-black/80' : 'bg-slate-900/90';
  const activeColor = 'text-hero-primary';
  const inactiveColor = 'text-slate-300';

  const navItems = [
    { to: '/app', label: 'Início', icon: <Home size={22} /> },
    { to: '/app/qrcode', label: 'QR Code', icon: <QrCode size={22} /> },
    { to: '/app/voucher', label: 'Voucher', icon: <Ticket size={22} /> },
    { to: '/app/plans', label: 'Planos', icon: <Crown size={22} /> },
    { to: '/app/profile', label: 'Perfil', icon: <User size={22} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Conteúdo */}
      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className={`fixed bottom-0 left-0 right-0 ${barBg} backdrop-blur-md border-t border-white/10`}>
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="grid grid-cols-5 gap-2">
            {navItems.map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center justify-center gap-1 py-2 rounded-2xl transition ${
                    active ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <span className={active ? activeColor : inactiveColor}>{item.icon}</span>
                  <span className={`text-[10px] font-bold ${active ? activeColor : inactiveColor}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* opcional: mini status do usuário (não quebra nada) */}
          {user?.display_name && (
            <div className="text-center text-[10px] text-slate-300 mt-1">
              Logado como <span className="font-bold">{user.display_name}</span>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default ClientLayout;
