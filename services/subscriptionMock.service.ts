import { subscriptionsService } from './subscriptions.service';

type PendingPlan = {
  planSlug: string;
  createdAt: string;
};

type ActiveMock = {
  status: 'active';
  startedAt: string;       // ISO
  nextBillingDate: string; // ISO
};

const LS_PENDING = 'bh_pending_plan';
const LS_ACTIVE_PREFIX = 'bh_active_mock_sub:'; // + userId

export const subscriptionMockService = {
  // ====== PENDING PLAN (para fluxo Plans -> Checkout) ======
  setPendingPlan(planSlug: string) {
    const payload: PendingPlan = { planSlug, createdAt: new Date().toISOString() };
    localStorage.setItem(LS_PENDING, JSON.stringify(payload));
  },

  getPendingPlan(): PendingPlan | null {
    try {
      const raw = localStorage.getItem(LS_PENDING);
      return raw ? (JSON.parse(raw) as PendingPlan) : null;
    } catch {
      return null;
    }
  },

  clearPendingPlan() {
    localStorage.removeItem(LS_PENDING);
  },

  // ====== ACTIVE MOCK (para o app inteiro confiar no mesmo “ativo”) ======
  // 1) primeiro tenta localStorage (mock)
  // 2) se não tiver, tenta a tabela subscriptions (real) via subscriptionsService
  async getActiveSubscription(userId: string): Promise<ActiveMock | null> {
    const key = `${LS_ACTIVE_PREFIX}${userId}`;

    // 1) Mock no localStorage
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as ActiveMock;
        if (parsed?.status === 'active') return parsed;
      }
    } catch {
      // ignora
    }

    // 2) Banco (subscriptions)
    try {
      const sub = await subscriptionsService.getMySubscription();
      if (!sub) return null;

      const isActive = sub.status === 'active';
      if (!isActive) return null;

      const startedAt = sub.current_period_start || new Date().toISOString();
      const nextBillingDate =
        sub.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      return { status: 'active', startedAt, nextBillingDate };
    } catch {
      return null;
    }
  },

  // Ativa o mock de verdade (RPC + grava localStorage para o app ficar consistente)
  async activate(planSlug: string, userId: string, days = 30): Promise<void> {
    await subscriptionsService.activateMock(planSlug, days);

    const startedAt = new Date().toISOString();
    const nextBillingDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const key = `${LS_ACTIVE_PREFIX}${userId}`;
    const payload: ActiveMock = { status: 'active', startedAt, nextBillingDate };
    localStorage.setItem(key, JSON.stringify(payload));

    // opcional: forçar refresh (se existir RPC no banco)
    await subscriptionsService.refreshMyStatus();
  },

  clearActiveMock(userId: string) {
    localStorage.removeItem(`${LS_ACTIVE_PREFIX}${userId}`);
  },
};
