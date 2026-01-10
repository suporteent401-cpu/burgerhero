import { supabase } from '../lib/supabaseClient';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'inactive';

export type MySubscription = {
  id: string;
  user_id: string;
  status: SubscriptionStatus | string;
  plan_id: string | null;
  created_at?: string;
  updated_at?: string;
  canceled_at?: string | null;
};

export const subscriptionsService = {
  async getMyActiveSubscription(): Promise<MySubscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id,user_id,status,plan_id,created_at,updated_at,canceled_at')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[subscriptionsService.getMyActiveSubscription] error:', error);
      return null;
    }

    return (data && data[0]) ? (data[0] as MySubscription) : null;
  },

  async cancelMySubscription(reason?: string): Promise<{ ok: boolean; message: string }> {
    const { data, error } = await supabase.rpc('cancel_my_subscription', {
      p_reason: reason ?? null,
    });

    if (error) {
      console.error('[subscriptionsService.cancelMySubscription] error:', error);
      return { ok: false, message: error.message || 'cancel_failed' };
    }

    const res = (data ?? {}) as any;
    return { ok: !!res.ok, message: String(res.message || 'ok') };
  },
};
