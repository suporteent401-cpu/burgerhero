import { Plan } from '../types';

const PENDING_PLAN_KEY = 'bh_pending_plan';
const SUB_PREFIX = 'bh_subscription_';

export interface MockSubscription {
  planId: string;
  planName: string;
  status: 'active' | 'canceled' | 'past_due';
  startedAt: string;
  nextBillingDate: string;
  priceCents: number;
}

export const subscriptionMockService = {
  // --- Gestão de Plano Pendente (Fluxo de Compra) ---

  /**
   * Salva o plano que o usuário quer assinar (antes do login ou checkout)
   */
  setPendingPlan: (plan: { id: string; name: string; priceCents: number }) => {
    localStorage.setItem(PENDING_PLAN_KEY, JSON.stringify(plan));
  },

  /**
   * Recupera o plano pendente para exibir no checkout
   */
  getPendingPlan: (): { id: string; name: string; priceCents: number } | null => {
    const data = localStorage.getItem(PENDING_PLAN_KEY);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Limpa o plano pendente após finalizar a assinatura
   */
  clearPendingPlan: () => {
    localStorage.removeItem(PENDING_PLAN_KEY);
  },

  // --- Gestão de Assinatura Ativa (Mock por Usuário) ---

  /**
   * Ativa uma assinatura mock para o usuário específico
   */
  setActiveSubscription: (userId: string, planData: { id: string; name: string; priceCents: number }) => {
    const sub: MockSubscription = {
      planId: planData.id,
      planName: planData.name,
      priceCents: planData.priceCents,
      status: 'active',
      startedAt: new Date().toISOString(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 dias
    };
    localStorage.setItem(`${SUB_PREFIX}${userId}`, JSON.stringify(sub));
  },

  /**
   * Busca a assinatura ativa do usuário
   */
  getActiveSubscription: (userId: string): MockSubscription | null => {
    const data = localStorage.getItem(`${SUB_PREFIX}${userId}`);
    if (!data) return null;
    return JSON.parse(data) as MockSubscription;
  },

  /**
   * Verifica se o usuário tem assinatura ativa (boolean)
   */
  isSubscriptionActive: (userId: string): boolean => {
    const sub = subscriptionMockService.getActiveSubscription(userId);
    return sub?.status === 'active';
  }
};