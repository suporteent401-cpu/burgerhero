import React from 'react';
import { User, HeroTheme } from '../types';
import { ShieldCheck } from 'lucide-react';

interface HeroCardProps {
  user: User | null;
  memberSince?: string;
  className?: string;
}

const heroCardImages: Record<HeroTheme, string> = {
  'sombra-noturna': 'https://ik.imagekit.io/lflb43qwh/Heros/1.png',
  'guardiao-escarlate': 'https://ik.imagekit.io/lflb43qwh/Heros/2.png',
  'tita-dourado': 'https://ik.imagekit.io/lflb43qwh/Heros/4.png',
  'tempestade-azul': 'https://ik.imagekit.io/lflb43qwh/Heros/1.png', // Placeholder
  'sentinela-verde': 'https://ik.imagekit.io/lflb43qwh/Heros/4.png', // Placeholder
  'aurora-rosa': 'https://ik.imagekit.io/lflb43qwh/Heros/2.png', // Placeholder
};

const HeroCard: React.FC<HeroCardProps> = ({ user, memberSince, className = '' }) => {
  const theme = user?.heroTheme || 'sombra-noturna';
  const imageUrl = heroCardImages[theme];

  const getFormattedDate = (dateString?: string) => {
    if (!dateString) return 'Recente';
    const date = new Date(dateString);
    const formatted = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    return formatted.replace('.', '').charAt(0).toUpperCase() + formatted.slice(1);
  };

  return (
    <div className={`relative w-full max-w-[360px] mx-auto ${className}`}>
      {/* Aspect Ratio Container (Credit Card approx 1.58:1) */}
      <div className="relative aspect-[1.58/1] rounded-2xl overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] duration-300 group">
        
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />

        {/* Overlay Gradients for Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />

        {/* Card Border/Shine Effect */}
        <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none" />

        {/* Content Structure */}
        <div className="absolute inset-0 p-5 flex flex-col justify-between text-white select-none">
          
          {/* Top Section */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-black italic tracking-tighter opacity-90">
                Burger<span className="text-hero-primary">Hero</span>
              </h3>
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-70 font-medium mt-0.5">Membership</p>
            </div>
            <ShieldCheck className="text-white/80 w-6 h-6" strokeWidth={1.5} />
          </div>

          {/* Bottom Section */}
          <div>
            <div className="mb-4">
              <p className="font-mono text-lg tracking-widest text-white/90 shadow-black drop-shadow-md">
                {user?.customerCode || 'HE-----'}
              </p>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-white/60 uppercase tracking-wider font-bold mb-0.5">Nome do Herói</p>
                <p className="font-bold text-sm tracking-wide text-white truncate max-w-[180px]">
                  {user?.name || 'Visitante'}
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-[9px] text-white/60 uppercase tracking-wider font-bold mb-0.5">Membro Desde</p>
                <p className="font-medium text-xs text-white">
                  {getFormattedDate(memberSince)}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HeroCard;