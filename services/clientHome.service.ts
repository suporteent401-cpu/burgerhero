import { subscriptionsService, SubscriptionRow } from "./subscriptions.service";

export type AppSubscription = {
  status: "ACTIVE" | "INACTIVE";
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  planSlug?: string | null;
};

export const getSubscriptionStatus = async (_userId?: string): Promise<AppSubscription | null> => {
  // _userId é opcional porque no modelo atual a subscription é "minha" (auth.uid()) via RLS.
  const row: SubscriptionRow | null = await subscriptionsService.getMySubscription();
  if (!row) return { status: "INACTIVE" };

  const isActive = String(row.status).toLowerCase() === "active";
  return {
    status: isActive ? "ACTIVE" : "INACTIVE",
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    planSlug: row.plan_slug,
  };
};
