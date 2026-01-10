import { supabase } from '../lib/supabaseClient';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'inactive';

export type MySubscription = {
  id: string;
  user_id: string;
  status: SubscriptionStatus | string;
  plan_slug: string | null; // no teu banco é plan_slug (text)
  current_period_start?: string | null;
  current_period_end?: string | null;
  created_at?: string;
  updated_at?: string;
  canceled_at?: string | null;
};

const getAuthedUserId = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
};

export const subscriptionsService = {
  async getMyActiveSubscription(): Promise<MySubscription | null> {
    const userId = await getAuthedUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('id,user_id,status,plan_slug,current_period_start,current_period_end,created_at,updated_at,canceled_at')
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

  async activateMock(planRef: string, periodDays = 30): Promise<{ ok: boolean; message: string; detail?: string }> {
    const { data, error } = await supabase.rpc('activate_mock_subscription', {
      p_plan_ref: planRef,
      p_period_days: periodDays,
    });

    if (error) {
      console.error('[subscriptionsService.activateMock] error:', error);
      return { ok: false, message: error.message || 'activate_failed' };
    }

    const res = (data ?? {}) as any;
    return {
      ok: !!res.ok,
      message: String(res.message || 'ok'),
      detail: res.detail ? String(res.detail) : undefined,
    };
  },

  async cancelMySubscription(reason?: string): Promise<{ ok: boolean; message: string; detail?: string }> {
    const { data, error } = await supabase.rpc('cancel_my_subscription', {
      p_reason: reason ?? null,
    });

    if (error) {
      console.error('[subscriptionsService.cancelMySubscription] error:', error);
      return { ok: false, message: error.message || 'cancel_failed' };
    }

    const res = (data ?? {}) as any;
    return {
      ok: !!res.ok,
      message: String(res.message || 'ok'),
      detail: res.detail ? String(res.detail) : undefined,
    };
  },
};
