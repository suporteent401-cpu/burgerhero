import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, QrCode, Ticket, UtensilsCrossed, User } from 'lucide-react';

const ClientLayout: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { label: 'Home', icon: Home, path: '/app' },
    { label: 'QR', icon: QrCode, path: '/app/qrcode' },
    { label: 'Voucher', icon: Ticket, path: '/app/voucher' },
    { label: 'Burgers', icon: UtensilsCrossed, path: '/app/burgers' },
    { label: 'Perfil', icon: User, path: '/app/profile' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-300">
      <header className="sticky top-0 z-30 bg-hero-primary text-white px-4 py-3 shadow-md">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-xl font-extrabold tracking-tight text-white/90">
            Burger<span className="text-white">Hero</span>
          </h1>
          <img src="https://ik.imagekit.io/lflb43qwh/Heros/images.jpg" alt="BurgerHero Logo" className="h-10 w-10 rounded-full border-2 border-white/50" />
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

export default ClientLayout;