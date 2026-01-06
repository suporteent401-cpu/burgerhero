import React from 'react';
import { User } from '../types';

interface HeroCardProps {
  user: User | null;
  imageUrl: string;
  memberSince?: string; 
  className?: string;
}

const HeroCard: React.FC<HeroCardProps> = ({ user, imageUrl, className = '' }) => {
  return (
    <div className={`w-full max-w-[420px] mx-auto ${className}`}>
      {/* Container Principal: Aspecto Cartão de Crédito, Borda Sutil, Sombra Física */}
      <div className="relative aspect-[1.586/1] w-full rounded-2xl shadow-xl overflow-hidden ring-1 ring-black/10 isolate bg-slate-900">
        
        {/* 1. Imagem de Fundo (Edge-to-Edge 100%) */}
        <img
          src={imageUrl}
          alt="Cartão Hero"
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{ filter: 'none' }}
        />

        {/* 2. Logo BurgerHero (Canto Superior Direito) */}
        <div className="absolute top-5 right-5 z-10">
          <img 
            src="https://ik.imagekit.io/lflb43qwh/Heros/images.jpg" 
            alt="Logo" 
            className="w-10 h-10 rounded-full border-2 border-white/30 shadow-sm"
          />
        </div>

        {/* 3. Nome e ID (Direto na imagem, sem fundo) */}
        <div className="absolute bottom-6 left-6 z-10 pr-4">
          <p className="text-xl md:text-2xl font-normal text-white tracking-wide drop-shadow-md truncate">
            {user?.name || 'Visitante'}
          </p>
          <p className="text-sm font-medium text-white/90 tracking-widest drop-shadow-md mt-0.5 font-mono">
            {user?.customerCode || 'HE-----'}
          </p>
        </div>

      </div>
    </div>
  );
};

export default HeroCard;