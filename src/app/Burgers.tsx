import React, { useState, useMemo } from 'react';
import { BURGERS_CATALOG, Burger } from '../lib/burgersCatalog';
import BurgerCard from '../components/BurgerCard';
import BurgerDetailsModal from '../components/BurgerDetailsModal';
import { UtensilsCrossed, BellRing, Lock, Search, FilterX } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useFavorites } from '../hooks/useFavorites';
import { motion, AnimatePresence } from 'framer-motion';

type FilterType = 'all' | 'popular' | 'new' | 'favorites';

const Burgers: React.FC = () => {
  const [selectedBurger, setSelectedBurger] = useState<Burger | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State for Filters and Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  // Custom Hook for Favorites
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const handleOpenModal = (burger: Burger) => {
    setSelectedBurger(burger);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedBurger(null), 300);
  };

  // Filter Logic
  const filteredBurgers = useMemo(() => {
    return BURGERS_CATALOG.filter(burger => {
      // 1. Search Match
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        burger.name.toLowerCase().includes(searchLower) || 
        burger.slogan.toLowerCase().includes(searchLower) || 
        burger.description.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // 2. Chip Filter Match
      if (activeFilter === 'all') return true;
      if (activeFilter === 'popular') return burger.isBestSeller;
      if (activeFilter === 'new') return burger.isNew;
      if (activeFilter === 'favorites') return isFavorite(burger.id);

      return true;
    });
  }, [searchQuery, activeFilter, favorites]);

  const clearFilters = () => {
    setSearchQuery('');
    setActiveFilter('all');
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header & Search */}
      <div className="sticky top-[60px] z-20 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md pb-2 -mx-4 px-4 pt-2">
        <div className="space-y-4 max-w-lg mx-auto">
          {/* Title Row */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-hero-primary/10 flex items-center justify-center text-hero-primary">
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none">Burgers Épicos</h2>
              <p className="text-slate-500 font-medium text-xs">Escolha seu favorito</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Search size={18} />
            </div>
            <input 
              type="text"
              placeholder="Buscar burger, ingrediente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:border-hero-primary focus:outline-none transition-colors text-slate-800 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'popular', label: 'Mais Pedidos' },
              { id: 'new', label: 'Novos' },
              { id: 'favorites', label: 'Favoritos' },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setActiveFilter(chip.id as FilterType)}
                className={`
                  whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition-all
                  ${activeFilter === chip.id 
                    ? 'bg-hero-primary border-hero-primary text-white shadow-lg shadow-hero-primary/25' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'}
                `}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="min-h-[40vh]">
        {filteredBurgers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredBurgers.map((burger) => (
                <motion.div 
                  key={burger.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <BurgerCard 
                    burger={burger} 
                    isFavorite={isFavorite(burger.id)}
                    onToggleFavorite={(e) => {
                      e.stopPropagation();
                      toggleFavorite(burger.id);
                    }}
                    onClick={() => handleOpenModal(burger)} 
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Card "Em Breve" - Show only if explicitly 'all' and no search */}
            {activeFilter === 'all' && !searchQuery && (
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
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <FilterX size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">Nenhum burger encontrado</h3>
            <p className="text-slate-500 text-sm max-w-[250px] mb-6">
              Tente mudar os filtros ou busque por outro termo.
            </p>
            <Button onClick={clearFilters} variant="secondary">
              Limpar Filtros
            </Button>
          </div>
        )}
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