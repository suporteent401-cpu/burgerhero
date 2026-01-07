import { Plan } from '../types';

const PENDING_PLAN_KEY = 'bh_pending_plan';
const SUB_PREFIX = 'burgerhero_subscription_';

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

  setPendingPlan: (plan: { id: string; name: string; priceCents: number }) => {
    localStorage.setItem(PENDING_PLAN_KEY, JSON.stringify(plan));
  },

  getPendingPlan: (): { id: string; name: string; priceCents: number } | null => {
    const data = localStorage.getItem(PENDING_PLAN_KEY);
    return data ? JSON.parse(data) : null;
  },

  clearPendingPlan: () => {
    localStorage.removeItem(PENDING_PLAN_KEY);
  },

  // --- Gestão de Assinatura Ativa (Mock por Usuário) ---

  setActiveSubscription: (userId: string, planData: { id: string; name: string; priceCents: number }) => {
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setDate(now.getDate() + 30);

    const sub: MockSubscription = {
      planId: planData.id,
      planName: planData.name,
      priceCents: planData.priceCents,
      status: 'active',
      startedAt: now.toISOString(),
      nextBillingDate: nextMonth.toISOString()
    };
    
    // Salva com a chave padronizada solicitada
    localStorage.setItem(`${SUB_PREFIX}${userId}`, JSON.stringify(sub));
  },

  getActiveSubscription: (userId: string): MockSubscription | null => {
    const data = localStorage.getItem(`${SUB_PREFIX}${userId}`);
    if (!data) return null;
    try {
      return JSON.parse(data) as MockSubscription;
    } catch (e) {
      console.error("Erro ao ler assinatura mock", e);
      return null;
    }
  },

  isSubscriptionActive: (userId: string): boolean => {
    const sub = subscriptionMockService.getActiveSubscription(userId);
    return sub?.status === 'active';
  }
};