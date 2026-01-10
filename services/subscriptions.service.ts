import { supabase } from '../lib/supabaseClient';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'inactive';

export type MySubscription = {
  id: string;
  user_id: string;
  status: SubscriptionStatus | string;
  plan_id: string | null; // (se você mudar p/ plan_slug no banco, a gente ajusta depois)
  created_at?: string;
  updated_at?: string;
  canceled_at?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  plan_slug?: string | null; // se existir no banco, vem aqui
};

const safeUserId = async (): Promise<string> => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? '';
};

export const subscriptionsService = {
  async getMyActiveSubscription(): Promise<MySubscription | null> {
    const userId = await safeUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('subscriptions')
      .select(
        'id,user_id,status,plan_id,plan_slug,created_at,updated_at,canceled_at,current_period_start,current_period_end'
      )
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[subscriptionsService.getMyActiveSubscription] error:', error);
      return null;
    }

    return data?.[0] ? (data[0] as MySubscription) : null;
  },

  // pega a mais recente (ativa OU cancelada), útil pra UI do "Planos"
  async getMySubscriptionStatus(): Promise<MySubscription | null> {
    const userId = await safeUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('subscriptions')
      .select(
        'id,user_id,status,plan_id,plan_slug,created_at,updated_at,canceled_at,current_period_start,current_period_end'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[subscriptionsService.getMySubscriptionStatus] error:', error);
      return null;
    }

    return data?.[0] ? (data[0] as MySubscription) : null;
  },

  // ✅ cancelar (fallback: com p_reason OU sem args)
  async cancelMySubscription(reason?: string): Promise<{ ok: boolean; message: string }> {
    // 1) tenta versão com p_reason (caso você tenha criado assim)
    try {
      const { data, error } = await supabase.rpc('cancel_my_subscription', {
        p_reason: reason ?? null,
      });

      if (!error) {
        const res = (data ?? {}) as any;
        return { ok: !!res.ok, message: String(res.message || 'ok') };
      }

      // se erro for "função não existe / argumento não existe", cai pro fallback
      console.warn('[subscriptionsService.cancelMySubscription] try p_reason failed:', error);
    } catch (e) {
      console.warn('[subscriptionsService.cancelMySubscription] try p_reason exception:', e);
    }

    // 2) fallback: versão sem parâmetros (a que eu recomendei)
    const { data, error } = await supabase.rpc('cancel_my_subscription');

    if (error) {
      console.error('[subscriptionsService.cancelMySubscription] error:', error);
      return { ok: false, message: error.message || 'cancel_failed' };
    }

    const res = (data ?? {}) as any;
    return { ok: !!res.ok, message: String(res.message || 'ok') };
  },

  // ✅ assinar/reativar (RPC real)
  // fallback de nomes: start_my_subscription -> activate_mock_subscription -> activate_subscription
  async startMySubscription(planSlugOrId: string): Promise<{ ok: boolean; message: string }> {
    const ref = String(planSlugOrId || '').trim();
    if (!ref) return { ok: false, message: 'missing_plan' };

    const tryRpc = async (fn: string, args: any) => {
      const { data, error } = await supabase.rpc(fn as any, args);
      if (error) return { ok: false, message: error.message, _error: error } as any;
      const res = (data ?? {}) as any;
      return { ok: !!res.ok, message: String(res.message || 'ok') };
    };

    // 1) recomendado (SQL que eu te passei): start_my_subscription(p_plan_slug text)
    {
      const r = await tryRpc('start_my_subscription', { p_plan_slug: ref });
      if (r.ok) return r;
      // só loga e tenta próximos
      console.warn('[subscriptionsService.startMySubscription] start_my_subscription failed:', (r as any)._error);
    }

    // 2) fallback caso você tenha outra RPC antiga
    {
      const r = await tryRpc('activate_mock_subscription', { p_plan_slug: ref, p_days: 30 });
      if (r.ok) return r;
      console.warn(
        '[subscriptionsService.startMySubscription] activate_mock_subscription failed:',
        (r as any)._error
      );
    }

    // 3) fallback genérico
    {
      const r = await tryRpc('activate_subscription', { p_plan_slug: ref });
      if (r.ok) return r;
      console.warn('[subscriptionsService.startMySubscription] activate_subscription failed:', (r as any)._error);
    }

    return { ok: false, message: 'activate_failed' };
  },

  // ✅ garante voucher (fallback de nomes, sem quebrar fluxo)
  async ensureVoucherNow(userId?: string): Promise<void> {
    const uid = userId || (await safeUserId());
    if (!uid) return;

    // tenta algumas RPCs possíveis sem travar o app
    const candidates: Array<{ fn: string; args: any }> = [
      { fn: 'ensure_current_voucher', args: { p_user_id: uid } },
      { fn: 'ensure_voucher_for_user', args: { p_user_id: uid, p_force: true } },
      { fn: 'ensure_current_voucher', args: { p_user_id: uid, p_force: true } }, // se você tiver variação
    ];

    for (const c of candidates) {
      const { error } = await supabase.rpc(c.fn as any, c.args);
      if (!error) return;
      console.warn(`[subscriptionsService.ensureVoucherNow] ${c.fn} failed:`, error);
    }
  },
};
