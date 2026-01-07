import { supabase } from '../lib/supabaseClient';

/**
 * Busca todos os hambúrgueres ativos no catálogo.
 */
export const getAllBurgers = async () => {
  const { data, error } = await supabase
    .from('burgers')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar hambúrgueres:', error);
    throw error;
  }
  return data;
};

/**
 * Busca os IDs dos hambúrgueres favoritos de um usuário.
 */
export const getFavoriteBurgerIds = async (userId: string) => {
  const { data, error } = await supabase
    .from('burger_favorites')
    .select('burger_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao buscar favoritos:', error);
    throw error;
  }
  return data.map(fav => fav.burger_id);
};

/**
 * Adiciona ou remove um hambúrguer dos favoritos de um usuário.
 */
export const toggleFavoriteBurger = async (userId: string, burgerId: string, isCurrentlyFavorite: boolean) => {
  if (isCurrentlyFavorite) {
    const { error } = await supabase
      .from('burger_favorites')
      .delete()
      .match({ user_id: userId, burger_id: burgerId });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('burger_favorites')
      .insert({ user_id: userId, burger_id: burgerId });
    if (error) throw error;
  }
};