import React, { useState } from 'react';
import { Burger } from '../lib/burgersCatalog';
import { Plus, Flame } from 'lucide-react';
import { Card, CardBody } from './ui/Card';

interface BurgerCardProps {
  burger: Burger;
  onClick: () => void;
}

const BurgerCard: React.FC<BurgerCardProps> = ({ burger, onClick }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div onClick={onClick} className="group cursor-pointer h-full">
      <Card className="h-full overflow-hidden border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:border-hero-primary/30 transition-all duration-300 relative bg-white dark:bg-slate-900">
        
        {/* Badge Popular */}
        {burger.isPopular && (
          <div className="absolute top-3 right-3 z-10 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
            <Flame size={10} fill="currentColor" /> Popular
          </div>
        )}

        {/* Imagem com Skeleton Loading */}
        <div className="aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
          <img 
            src={burger.images[0]} 
            alt={burger.name}
            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => {
              if (!loaded) setLoaded(true);
            }}
          />
          {!loaded && (
            <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Conteúdo */}
        <CardBody className="p-4 flex flex-col h-[calc(100%-aspect-[16/10])]">
          <div className="flex-1">
            <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight mb-1">
              {burger.name}
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 line-clamp-1">
              {burger.slogan}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
              {burger.description}
            </p>
          </div>

          <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-50 dark:border-slate-800">
            <span className="text-xl font-black text-slate-800 dark:text-white">
              R$ {burger.price.toFixed(2).replace('.', ',')}
            </span>
            <button className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-hero-primary flex items-center justify-center group-hover:bg-hero-primary group-hover:text-white transition-colors">
              <Plus size={18} />
            </button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default BurgerCard;