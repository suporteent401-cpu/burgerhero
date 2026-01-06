import React, { useState } from 'react';
import { BURGERS_CATALOG, Burger } from '../lib/burgersCatalog';
import BurgerCard from '../components/BurgerCard';
import BurgerDetailsModal from '../components/BurgerDetailsModal';
import { UtensilsCrossed, BellRing, Lock } from 'lucide-react';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const Burgers: React.FC = () => {
  const [selectedBurger, setSelectedBurger] = useState<Burger | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (burger: Burger) => {
    setSelectedBurger(burger);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedBurger(null), 300); // Wait for animation
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-hero-primary/10 flex items-center justify-center text-hero-primary">
          <UtensilsCrossed size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Burgers Épicos</h2>
          <p className="text-slate-500 font-medium text-sm">Escolha seu favorito do universo BurgerHero</p>
        </div>
      </div>

      {/* Grid de Burgers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {BURGERS_CATALOG.map((burger) => (
          <BurgerCard 
            key={burger.id} 
            burger={burger} 
            onClick={() => handleOpenModal(burger)} 
          />
        ))}

        {/* Card "Em Breve" */}
        <Card className="border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex flex-col items-center justify-center text-center p-8 min-h-[300px] group relative overflow-hidden">
          <div className="absolute inset-0 bg-slate-100/50 dark:bg-black/20 backdrop-blur-[2px] z-0" />
          
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
              <Lock size={32} />
            </div>
            
            <div className="max-w-[200px]">
              <h3 className="text-lg font-black text-slate-700 dark:text-slate-300">Novo Herói a Caminho</h3>
              <p className="text-sm text-slate-500 mt-1">Estamos desenvolvendo uma nova receita secreta.</p>
            </div>

            <Button variant="outline" size="sm" className="mt-2 rounded-full border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800">
              <BellRing size={16} className="mr-2" /> Avise-me
            </Button>
          </div>
        </Card>
      </div>

      {/* Modal de Detalhes */}
      <BurgerDetailsModal 
        burger={selectedBurger} 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
    </div>
  );
};

export default Burgers;