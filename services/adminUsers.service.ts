import { supabase } from '../lib/supabaseClient';
import { User } from '../types';

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  customerCode: string;
  subscriptionStatus: string | null;
  nextBillingDate: string | null;
}

export const adminUsersService = {
  async listUsers(params: { page: number; search: string; limit: number; filters?: any }) {
    const { page, search, limit, filters } = params;

    const { data, error } = await supabase.rpc('admin_list_users', {
      p_page: page,
      p_search: search,
      p_limit: limit,
      p_status: filters?.status || null,
      p_role: filters?.role || null,
    });

    if (error) throw error;

    const users = (data || []).map((u: any) => ({
      id: u.id,
      name: u.display_name || 'Sem Nome',
      email: u.email,
      role: u.role,
      avatarUrl: u.avatar_url,
      customerCode: u.hero_code,
      subscriptionStatus: u.subscription_status,
      nextBillingDate: u.next_billing_date,
    }));

    const total = (data && data.length > 0 && data[0]?.total_count) ? Number(data[0].total_count) : 0;

    return {
      data: users,
      total,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getUserDetails(userId: string) {
    // 1) Perfil (tenta user_profiles, fallback para client_profiles)
    let profile: any = null;

    const { data: up, error: upErr } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!upErr && up) profile = up;

    if (!profile) {
      const { data: cp } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (cp) profile = cp;
    }

    if (!profile) throw new Error('Usuário não encontrado');

    // 2) Role
    const { data: appUser } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    // 3) Assinatura
    const { data: subRows } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('current_period_end', { ascending: false, nullsFirst: false });

    const sub = (subRows || []).sort((a: any, b: any) => {
      const aActive = a?.status === 'active' ? 1 : 0;
      const bActive = b?.status === 'active' ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;

      const aEnd = a?.current_period_end ? new Date(a.current_period_end).getTime() : 0;
      const bEnd = b?.current_period_end ? new Date(b.current_period_end).getTime() : 0;
      return bEnd - aEnd;
    })[0];

    // Busca plano manualmente (sub.plan_slug é UUID no seu banco)
    let planData: any = null;

    if (sub && sub.plan_slug) {
      const { data: pById } = await supabase
        .from('plans')
        .select('*')
        .eq('id', sub.plan_slug)
        .maybeSingle();

      if (pById) {
        planData = pById;
      } else {
        // fallback legado (se alguém salvou nome em plan_slug)
        const { data: pByName } = await supabase
          .from('plans')
          .select('*')
          .eq('name', sub.plan_slug)
          .maybeSingle();

        planData = pByName;
      }
    }

    // 4) Vouchers (últimos 5)
    const { data: redemptions } = await supabase
      .from('voucher_redemptions')
      .select('*')
      .eq('user_id', userId)
      .order('redeemed_at', { ascending: false })
      .limit(5);

    const user: User = {
      id: profile.user_id,
      name: profile.display_name,
      email: profile.email,
      cpf: profile.cpf,
      customerCode: profile.hero_code,
      avatarUrl: profile.avatar_url,
      role: (appUser?.role as any) || 'client',
    };

    return {
      user,
      subscription: sub
        ? {
            status: sub.status,
            nextBillingDate: sub.next_billing_at ?? null,
            currentPeriodEnd: sub.current_period_end ?? null,
          }
        : null,
      plan: planData,
      redemptionHistory: (redemptions || []).map((r: any) => ({
        month: new Date(r.redeemed_at).toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
        redeemedAt: r.redeemed_at,
      })),
    };
  },
};
