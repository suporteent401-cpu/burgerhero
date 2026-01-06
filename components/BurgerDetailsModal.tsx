import React, { useState } from 'react';
import { Burger } from '../lib/burgersCatalog';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Heart, Share2, Info } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';

interface BurgerDetailsModalProps {
  burger: Burger | null;
  isOpen: boolean;
  onClose: () => void;
}

const BurgerDetailsModal: React.FC<BurgerDetailsModalProps> = ({ burger, isOpen, onClose }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!burger) return null;

  const isFav = isFavorite(burger.id);

  const handleFavorite = () => {
    toggleFavorite(burger.id);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Herói">
      <div className="space-y-6">
        
        {/* Galeria de Imagens */}
        <div className="space-y-3">
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner">
            <img 
              src={burger.images[selectedImage] || burger.images[0]} 
              alt={burger.name} 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Miniaturas (apenas se tiver mais de 1) */}
          {burger.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {burger.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`
                    relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all
                    ${selectedImage === idx ? 'border-hero-primary ring-2 ring-hero-primary/20' : 'border-transparent opacity-60 hover:opacity-100'}
                  `}
                >
                  <img src={img} alt={`View ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações */}
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
                {burger.name}
              </h2>
              <p className="text-hero-primary font-bold text-xs uppercase tracking-widest mt-1">
                {burger.slogan}
              </p>
            </div>
            <div className="text-2xl font-black text-slate-800 dark:text-white">
              R$ {burger.price.toFixed(2).replace('.', ',')}
            </div>
          </div>

          <div className="h-px w-full bg-slate-100 dark:bg-slate-800 my-4" />

          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              <Info size={16} className="text-hero-primary" /> Ingredientes
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
              {burger.description}
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 pt-2">
          <Button onClick={onClose} className="rounded-xl">
            Fechar
          </Button>
          <Button 
            variant="secondary" 
            className={`rounded-xl px-4 ${isFav ? 'bg-red-50 text-red-500 border-red-200 dark:bg-red-900/20 dark:border-red-900' : ''}`} 
            onClick={handleFavorite}
          >
            <Heart size={20} className={isFav ? 'fill-current' : ''} />
          </Button>
          <Button variant="secondary" className="rounded-xl px-4">
            <Share2 size={20} />
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BurgerDetailsModal;