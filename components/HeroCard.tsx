import React from 'react';
import { User, HeroTheme } from '../types';

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
    <div className={`w-full max-w-[360px] mx-auto ${className}`}>
      {/* 
        CARTÃO FÍSICO 
        - Sem animações (hover/scale removidos)
        - Sem overlay/gradiente
        - Imagem original intacta via <img>
        - Aspect ratio fixo de cartão
        - object-contain para não cortar
      */}
      <div className="relative aspect-[1.586/1] rounded-2xl overflow-hidden shadow-xl bg-transparent">
        <img
          src={imageUrl}
          alt={`Cartão tema ${theme}`}
          className="w-full h-full object-contain select-none pointer-events-none"
        />
      </div>

      {/* DADOS ABAIXO DO CARTÃO (Para não sujar a arte) */}
      <div className="mt-4 px-1 flex justify-between items-end">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Identidade</p>
          <p className="text-sm font-black text-slate-800">{user?.name || 'Visitante'}</p>
          <p className="text-xs font-mono text-slate-500 font-bold mt-0.5">{user?.customerCode || 'HE-----'}</p>
        </div>
        
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Membro Desde</p>
          <p className="text-xs font-bold text-slate-700">
            {getFormattedDate(memberSince)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeroCard;