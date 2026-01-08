import React from 'react';
import { User } from '../types';

interface HeroCardProps {
  user: User | null;
  imageUrl: string;
  memberSince?: string; 
  className?: string;
  fontFamily?: string;
  textColor?: string;
  fontSize?: number;
  isActive?: boolean;
}

const HeroCard = React.forwardRef<HTMLDivElement, HeroCardProps>(({ 
  user, 
  imageUrl, 
  className = '',
  fontFamily = 'Inter, sans-serif',
  textColor = '#FFFFFF',
  fontSize = 22,
  isActive = false
}, ref) => {
  // O código do cliente deve vir do objeto user populado pelo Supabase
  const displayId = user?.customerCode || '—';

  return (
    <div ref={ref} className={`w-full max-w-[420px] mx-auto ${className}`}>
      {/* Container Principal */}
      <div className="relative aspect-[1.586/1] w-full rounded-2xl shadow-xl overflow-hidden ring-1 ring-black/10 isolate bg-slate-900">
        
        {/* Imagem de Fundo com Zoom Aumentado */}
        <img
          src={imageUrl}
          alt="Cartão Hero"
          className="absolute inset-0 w-full h-full object-cover z-0 scale-[1.35]"
          style={{ filter: 'none' }}
        />

        {/* Logo BurgerHero */}
        <div className="absolute top-5 right-5 z-10">
          <img 
            src="https://ik.imagekit.io/lflb43qwh/Heros/images.jpg" 
            alt="Logo" 
            className="w-10 h-10 rounded-full border-2 border-white/30 shadow-sm"
          />
        </div>

        {/* Nome e ID com Estilo Dinâmico */}
        <div 
          className="absolute bottom-6 left-6 z-10 pr-4"
          style={{ color: textColor }}
        >
          <p 
            className="tracking-wide drop-shadow-md truncate font-bold"
            style={{ 
              fontFamily: fontFamily, 
              fontSize: `${fontSize}px`,
              lineHeight: 1.2
            }}
          >
            {user?.name || 'Identidade Secreta'}
          </p>
          <div className="flex items-center gap-2 mt-1">
             <p 
               className="tracking-widest drop-shadow-md opacity-90 font-mono font-black"
               style={{ 
                 fontFamily: fontFamily, 
                 fontSize: `${fontSize * 0.65}px`
               }}
             >
               ID: {displayId}
             </p>
             {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" title="Herói Ativo"></div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
});

export default HeroCard;