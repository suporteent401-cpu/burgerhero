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
}

const HeroCard = React.forwardRef<HTMLDivElement, HeroCardProps>(({ 
  user, 
  imageUrl, 
  className = '',
  fontFamily = 'Inter, sans-serif',
  textColor = '#FFFFFF',
  fontSize = 22
}, ref) => {
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
            className="tracking-wide drop-shadow-md truncate"
            style={{ 
              fontFamily: fontFamily, 
              fontWeight: 400,
              fontSize: `${fontSize}px`,
              lineHeight: 1.2
            }}
          >
            {user?.name || 'Visitante'}
          </p>
          <p 
            className="tracking-widest drop-shadow-md mt-0.5 opacity-90"
            style={{ 
              fontFamily: fontFamily, 
              fontWeight: 500,
              fontSize: `${fontSize * 0.6}px`
            }}
          >
            ID: {user?.customerCode || '—'}
          </p>
        </div>

      </div>
    </div>
  );
});

export default HeroCard;