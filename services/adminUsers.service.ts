import { supabase } from '../lib/supabaseClient';
import { User } from '../types';

export type AdminUsersFilters = {
  status?: string | null;
  role?: string | null;
};

export type AdminUserRow = {
  id: string;
  display_name: string | null;
  email: string;
  role: string | null;
  avatar_url: string | null;
  hero_code: string | null;
  subscription_status: string | null;
  next_billing_date: string | null;
  total_count: number;
};

export type AdminUsersListResponse = {
  data: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    customerCode: string;
    subscriptionStatus: string | null;
    nextBillingDate: string | null;
  }>;
  total: number;
  totalPages: number;
};

export type AdminUserListItem = AdminUsersListResponse['data'][0];

export const adminUsersService = {
  async listUsers(params: { page: number; search: string; limit: number; filters?: AdminUsersFilters }): Promise<AdminUsersListResponse> {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.max(1, Number(params.limit || 10));
    const search = (params.search || '').trim();
    const filters = params.filters || {};

    try {
      const { data, error } = await supabase.rpc('admin_list_users', {
        p_page: page,
        p_search: search,
        p_limit: limit,
        p_status: filters.status ?? null,
        p_role: filters.role ?? null,
      });

      if (error) throw error;

      const rows = (data || []) as AdminUserRow[];
      const total = rows.length > 0 ? Number(rows[0].total_count || 0) : 0;

      const mapped = rows.map((r) => ({
        id: r.id,
        name: r.display_name || 'Sem Nome',
        email: r.email,
        role: r.role || 'client',
        avatarUrl: r.avatar_url || null,
        customerCode: r.hero_code || '',
        subscriptionStatus: r.subscription_status || null,
        nextBillingDate: r.next_billing_date || null,
      }));

      return {
        data: mapped,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    } catch (e) {
      console.error('[adminUsersService.listUsers] Falha RPC admin_list_users:', e);
      return { data: [], total: 0, totalPages: 1 };
    }
  },

  async getUserDetails(userId: string) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) throw new Error('Usuário não encontrado');

    const { data: appUser } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', userId)
      .single();

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('user_id', userId)
      .maybeSingle();

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
      role: (appUser?.role as any) || 'client'
    };

    return {
      user,
      subscription: sub ? {
        status: sub.status,
        nextBillingDate: sub.next_billing_at,
        currentPeriodEnd: sub.current_period_end
      } : null,
      plan: sub?.plan || null,
      redemptionHistory: (redemptions || []).map((r: any) => ({
        month: new Date(r.redeemed_at).toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
        redeemedAt: r.redeemed_at
      }))
    };
  }
};