import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { getFavoriteBurgerIds, toggleFavoriteBurger } from '../services/burgers.service';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const favIds = await getFavoriteBurgerIds(user.id);
      setFavorites(favIds);
    } catch (error) {
      console.error('Erro ao buscar favoritos:', error);
      // Em caso de erro, a lista de favoritos ficará vazia.
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = async (id: string) => {
    if (!user) return;

    const isCurrentlyFavorite = favorites.includes(id);

    // Atualização otimista da UI para resposta imediata
    setFavorites(prev => 
      isCurrentlyFavorite ? prev.filter(favId => favId !== id) : [...prev, id]
    );

    try {
      // Sincroniza com o Supabase em segundo plano
      await toggleFavoriteBurger(user.id, id, isCurrentlyFavorite);
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
      // Reverte a UI em caso de falha na API
      setFavorites(prev => 
        isCurrentlyFavorite ? [...prev, id] : prev.filter(favId => favId !== id)
      );
    }
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return { favorites, toggleFavorite, isFavorite, loadingFavorites: loading, refetchFavorites: fetchFavorites };
};