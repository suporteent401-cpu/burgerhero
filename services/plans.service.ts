import { supabase } from '../lib/supabaseClient';
import { Plan } from '../types';

export const plansService = {
  /**
   * Lista apenas planos marcados como ativos no banco de dados.
   * Ordena por preço para manter a hierarquia visual.
   */
  async listActivePlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price_cents', { ascending: true });

    if (error) {
      console.error('[PlansService] Erro ao listar planos:', error);
      return [];
    }

    return (data || []).map(p => ({
      id: p.id,
      name: p.name,
      priceCents: p.price_cents,
      description: p.description || '',
      benefits: p.benefits || [],
      imageUrl: p.image_url || '',
      active: p.is_active,
    })) as Plan[];
  }
};