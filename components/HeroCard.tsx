import React from 'react';
import { User } from '../types';

interface HeroCardProps {
  user: User | null;
  imageUrl: string;
  memberSince?: string; // Data formatada ou string bruta
  className?: string;
}

const HeroCard: React.FC<HeroCardProps> = ({ user, imageUrl, memberSince, className = '' }) => {
  // Formatação da data para "Membro desde: Mês de Ano"
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Membro Recente';
    try {
      const date = new Date(dateString);
      return `Membro desde: ${date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '')}`;
    } catch {
      return 'Membro Recente';
    }
  };

  return (
    <div className={`w-full max-w-[420px] mx-auto ${className}`}>
      {/* Container Principal: Proporção de cartão de crédito, cantos arredondados, sem overflow */}
      <div className="relative aspect-[1.586/1] w-full rounded-2xl shadow-xl overflow-hidden bg-slate-900 isolate">
        
        {/* 1. Imagem de Fundo (Ocupa tudo, sem efeitos) */}
        <img
          src={imageUrl}
          alt="Cartão Hero"
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{ filter: 'none' }}
        />

        {/* 2. Logo BurgerHero (Canto Superior Direito) */}
        <div className="absolute top-4 right-4 z-10">
          <img 
            src="https://ik.imagekit.io/lflb43qwh/Heros/images.jpg" 
            alt="Logo" 
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
          />
        </div>

        {/* 3. Bloco de Informações (Canto Inferior Esquerdo com fundo local) */}
        <div className="absolute bottom-4 left-4 max-w-[85%] z-10">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl p-3 text-white border border-white/10 shadow-lg">
            {/* Nome do Usuário */}
            <p className="text-lg font-black tracking-tight leading-tight mb-1 truncate">
              {user?.name || 'Visitante'}
            </p>
            
            <div className="flex flex-col gap-0.5">
              {/* ID do Herói */}
              <p className="text-xs font-mono font-bold text-slate-300 tracking-wider">
                ID: {user?.customerCode || 'HE-----'}
              </p>
              
              {/* Data de Assinatura */}
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                {formatDate(memberSince)}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HeroCard;