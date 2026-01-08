import { supabase } from '../lib/supabaseClient';
import { Plan } from '../types';

export const plansService = {
  // Cliente: Apenas ativos
  async listActivePlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price_cents', { ascending: true });

    if (error) {
      console.error('Erro ao listar planos ativos:', error);
      return [];
    }

    return (data || []).map(p => ({
      ...p,
      benefits: p.benefits || [], // Garante array
      price_cents: p.price_cents,
      image_url: p.image_url || ''
    }));
  },

  // Admin: Todos os planos
  async listAllPlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(p => ({
      ...p,
      benefits: p.benefits || [],
      price_cents: p.price_cents,
      image_url: p.image_url || ''
    }));
  },

  async createPlan(plan: Omit<Plan, 'id' | 'created_at' | 'subscriber_count' | 'popularity'>): Promise<Plan | null> {
    const { data, error } = await supabase
      .from('plans')
      .insert({
        name: plan.name,
        price_cents: plan.price_cents,
        description: plan.description,
        benefits: plan.benefits,
        image_url: plan.image_url,
        is_active: plan.is_active
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePlan(id: string, updates: Partial<Plan>): Promise<void> {
    const { error } = await supabase
      .from('plans')
      .update({
        name: updates.name,
        price_cents: updates.price_cents,
        description: updates.description,
        benefits: updates.benefits,
        image_url: updates.image_url,
        is_active: updates.is_active
      })
      .eq('id', id);

    if (error) throw error;
  }
};