import { supabase } from '../lib/supabaseClient';
import { User, Subscription } from '../types';

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
      p_role: filters?.role || null
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
      nextBillingDate: u.next_billing_date
    }));

    const total = data?.[0]?.total_count || 0;

    return {
      data: users,
      total,
      totalPages: Math.ceil(total / limit)
    };
  },

  async getUserDetails(userId: string) {
    // 1. Dados do perfil
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) throw new Error('Usuário não encontrado');

    // 2. Dados de sistema (role)
    const { data: appUser } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', userId)
      .single();

    // 3. Assinatura e Plano
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('user_id', userId)
      .maybeSingle();

    // 4. Histórico de Vouchers
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
      redemptionHistory: (redemptions || []).map(r => ({
        month: new Date(r.redeemed_at).toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
        redeemedAt: r.redeemed_at
      }))
    };
  }
};