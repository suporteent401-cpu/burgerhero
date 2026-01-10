import { supabase } from '../lib/supabaseClient';
import { Plan } from '../types';

/**
 * PlansService
 * - Tenta ler de uma VIEW "plans_with_stats" (assinantes/popularidade em tempo real).
 * - Fallback seguro para tabela "plans" se a view não existir ou falhar.
 * - Escritas (create/update/delete) sempre vão na tabela "plans".
 */

type DbPlanRow = {
  id: string;
  name: string;
  price_cents: number;
  description?: string | null;
  benefits?: string[] | null;
  image_url?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;

  // stats (da view)
  subscriber_count?: number | null;
  popularity?: number | null;
};

const mapDbToPlan = (p: DbPlanRow): Plan => {
  return {
    id: p.id,
    name: p.name,
    priceCents: p.price_cents ?? 0,
    description: p.description || '',
    benefits: Array.isArray(p.benefits) ? p.benefits : [],
    imageUrl: p.image_url || '',
    active: Boolean(p.is_active),
    subscriberCount: Number(p.subscriber_count ?? 0),
    popularity: Number(p.popularity ?? 0),

    // snake_case opcionais (compatibilidade)
    price_cents: p.price_cents,
    image_url: p.image_url || '',
    is_active: Boolean(p.is_active),
    created_at: p.created_at || undefined,
    subscriber_count: p.subscriber_count ?? undefined,
    popularity_db: p.popularity ?? undefined,
  } as any;
};

const mapPlanToDbPayload = (plan: Partial<Plan>) => {
  const payload: any = {};

  if (typeof plan.name === 'string') payload.name = plan.name;
  if (typeof (plan as any).priceCents === 'number') payload.price_cents = (plan as any).priceCents;
  if (typeof (plan as any).description === 'string') payload.description = (plan as any).description;
  if (Array.isArray((plan as any).benefits)) payload.benefits = (plan as any).benefits;
  if (typeof (plan as any).imageUrl === 'string') payload.image_url = (plan as any).imageUrl;
  
  // Tratamento robusto para o boolean active/is_active
  if (typeof plan.active === 'boolean') payload.is_active = plan.active;
  if (typeof (plan as any).is_active === 'boolean') payload.is_active = (plan as any).is_active;

  return payload;
};

async function selectPlansFrom(source: 'plans_with_stats' | 'plans', onlyActive: boolean) {
  let q = supabase.from(source).select('*').order('price_cents', { ascending: true });
  if (onlyActive) q = q.eq('is_active', true);
  return q;
}

export const plansService = {
  /**
   * Lista TODOS os planos (ativos e inativos) — usado no Admin.
   * Tenta view primeiro, fallback para tabela.
   */
  async listAllPlans(): Promise<Plan[]> {
    // 1) tenta view (tempo real)
    const tryView = await selectPlansFrom('plans_with_stats', false);
    if (!tryView.error && tryView.data) {
      return tryView.data.map(mapDbToPlan);
    }

    if (tryView.error) {
      console.warn('[PlansService] View plans_with_stats indisponível, usando fallback:', tryView.error.message);
    }

    // 2) fallback tabela
    const { data, error } = await selectPlansFrom('plans', false);
    if (error) {
      console.error('[PlansService] Erro fatal ao listar planos:', error);
      return [];
    }
    return (data || []).map(mapDbToPlan);
  },

  /**
   * Lista apenas planos ativos — usado no /plans público.
   * Tenta view primeiro, fallback para tabela.
   */
  async listActivePlans(): Promise<Plan[]> {
    // 1) tenta view (tempo real)
    const tryView = await selectPlansFrom('plans_with_stats', true);
    if (!tryView.error && tryView.data) {
      return tryView.data.map(mapDbToPlan);
    }

    // 2) fallback tabela
    const { data, error } = await selectPlansFrom('plans', true);
    if (error) {
      console.error('[PlansService] Erro fatal ao listar planos ativos:', error);
      return [];
    }
    return (data || []).map(mapDbToPlan);
  },

  /**
   * Cria um plano na tabela oficial (public.plans).
   */
  async createPlan(plan: Partial<Plan>): Promise<Plan | null> {
    const payload = mapPlanToDbPayload(plan);

    const { data, error } = await supabase
      .from('plans')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      console.error('[PlansService] Erro ao criar plano:', error);
      throw error;
    }

    return data ? mapDbToPlan(data as any) : null;
  },

  /**
   * Atualiza um plano na tabela oficial (public.plans).
   */
  async updatePlan(planId: string, updates: Partial<Plan>): Promise<Plan | null> {
    const payload = mapPlanToDbPayload(updates);
    if (!planId) throw new Error('planId é obrigatório');

    const { data, error } = await supabase
      .from('plans')
      .update(payload)
      .eq('id', planId)
      .select('*')
      .single();

    if (error) {
      console.error('[PlansService] Erro ao atualizar plano:', error);
      throw error;
    }

    return data ? mapDbToPlan(data as any) : null;
  },

  /**
   * Remove permanentemente um plano.
   */
  async deletePlan(planId: string): Promise<void> {
    if (!planId) throw new Error('planId é obrigatório');

    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', planId);

    if (error) {
      console.error('[PlansService] Erro ao excluir plano:', error);
      throw error;
    }
  },
};