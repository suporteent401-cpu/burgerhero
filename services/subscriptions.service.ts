import { supabase } from "../lib/supabaseClient";

export type SubscriptionStatus = "active" | "past_due" | "canceled";

export interface SubscriptionRow {
  user_id: string;
  plan_slug: string;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export const subscriptionsService = {
  async refreshMyStatus(): Promise<void> {
    const { error } = await supabase.rpc("refresh_my_subscription_status");
    if (error) {
      console.warn("[subscriptions] refreshMyStatus failed:", error);
    }
  },

  async getMySubscription(): Promise<SubscriptionRow | null> {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("[subscriptions] getMySubscription error:", error);
      throw error;
    }

    return data ?? null;
  },

  async activateMock(planSlug: string, days = 30): Promise<void> {
    const { data, error } = await supabase.rpc(
      "set_subscription_active_mock",
      {
        p_plan_slug: planSlug,
        p_days: days,
      }
    );

    if (error) {
      console.error("[subscriptions] activateMock error:", error);
      throw error;
    }

    const ok = (data as any)?.ok;
    if (!ok) {
      throw new Error(
        (data as any)?.message || "Falha ao ativar assinatura (mock)."
      );
    }
  },
};