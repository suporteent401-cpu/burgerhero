import React from 'react';
import { User } from '../types';

interface HeroCardProps {
  user: User | null;
  imageUrl: string; // URL direta da imagem (vinda do store)
  className?: string;
}

const HeroCard: React.FC<HeroCardProps> = ({ user, imageUrl, className = '' }) => {
  return (
    <div className={`w-full max-w-[360px] mx-auto ${className}`}>
      {/* 
        CONTAINER DO CARTÃO FÍSICO
        - aspect-[1.586/1]: Proporção padrão de cartão de crédito
        - relative: para posicionar textos absolutos
        - rounded-2xl: bordas arredondadas físicas
        - shadow-xl: sombra para dar profundidade
        - overflow-hidden: garantir que a imagem não vaze as bordas
        - isolation-isolate: garante que blend-modes externos não afetem este componente
      */}
      <div className="relative aspect-[1.586/1] w-full rounded-2xl shadow-xl overflow-hidden bg-slate-900 isolate">
        
        {/* IMAGEM DO CARTÃO (Background Art) */}
        {/* object-cover garante que preencha tudo sem distorcer. Se a arte for crítica nas bordas, usar contain, mas cover é melhor para 'cartão fisico' */}
        <img
          src={imageUrl}
          alt="Cartão do Herói"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-0"
          style={{ filter: 'none' }} // Força remoção de filtros herdados
        />

        {/* OVERLAY DE LEITURA (Gradiente suave apenas na parte inferior para o texto aparecer) */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />

        {/* CONTEÚDO DE TEXTO (Dentro do cartão) */}
        <div className="absolute bottom-4 left-5 right-5 z-20 text-white">
          
          {/* Nome do Cliente */}
          <p className="text-lg font-black tracking-tight leading-tight drop-shadow-md">
            {user?.name || 'Visitante'}
          </p>

          {/* ID e Label */}
          <div className="flex items-center gap-2 mt-0.5 opacity-90">
            <span className="text-[10px] uppercase font-bold tracking-widest border border-white/30 px-1.5 rounded bg-black/20 backdrop-blur-sm">
              ID
            </span>
            <p className="text-sm font-mono font-bold tracking-wider drop-shadow-sm">
              {user?.customerCode || 'HE-----'}
            </p>
          </div>
        </div>
        
        {/* Detalhe Decorativo (Chip simulado ou Logo pequena no topo) */}
        <div className="absolute top-4 right-5 z-20">
           <div className="w-8 h-8 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-md flex items-center justify-center">
             <div className="w-4 h-4 bg-white/80 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default HeroCard;