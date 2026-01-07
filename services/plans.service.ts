import { supabase } from '../lib/supabaseClient';
import { Plan } from '../types';

export const plansService = {
  /**
   * Busca todos os planos ativos para exibição na landing page ou área de planos.
   */
  async getActivePlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price_cents', { ascending: true });

    if (error) {
      console.error('Erro ao buscar planos ativos:', error);
      return [];
    }
    return data as Plan[];
  },

  /**
   * Busca todos os planos (incluindo inativos) para o painel administrativo.
   */
  async getAllAdminPlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar todos os planos (admin):', error);
      throw error;
    }
    return data as Plan[];
  },

  /**
   * Cria um novo plano (Apenas Admin).
   */
  async createPlan(plan: Omit<Plan, 'id' | 'created_at'>): Promise<Plan | null> {
    const { data, error } = await supabase
      .from('plans')
      .insert(plan)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar plano:', error);
      throw error;
    }
    return data as Plan;
  },

  /**
   * Atualiza um plano existente (Apenas Admin).
   */
  async updatePlan(id: string, updates: Partial<Plan>): Promise<Plan | null> {
    const { data, error } = await supabase
      .from('plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar plano:', error);
      throw error;
    }
    return data as Plan;
  },

  /**
   * Remove um plano (Apenas Admin).
   */
  async deletePlan(id: string): Promise<void> {
    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir plano:', error);
      throw error;
    }
  }
};