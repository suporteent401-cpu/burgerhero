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
    
    // Normaliza filtros para lowercase para bater com a RPC (active, client, admin...)
    const statusFilter = filters?.status ? String(filters.status).toLowerCase() : null;
    const roleFilter = filters?.role ? String(filters.role).toLowerCase() : null;

    console.log('[AdminUsers] Fetching with:', { page, search, statusFilter, roleFilter });

    const { data, error } = await supabase.rpc('admin_list_users', {
      p_page: page,
      p_search: search || '',
      p_limit: limit,
      p_status: statusFilter,
      p_role: roleFilter
    });

    if (error) {
      console.error('[AdminUsers] RPC Error:', error);
      throw error;
    }

    if (!data || !Array.isArray(data)) {
      return { data: [], total: 0, totalPages: 0 };
    }

    // Mapeamento defensivo: aceita variações de snake_case ou alias que o Postgres possa retornar
    const users: AdminUserListItem[] = data.map((u: any) => ({
      id: u.id,
      name: u.display_name || 'Sem nome',
      email: u.email,
      role: u.role,
      avatarUrl: u.avatar_url,
      customerCode: u.hero_code || '---',
      // Tenta pegar pelo nome definido no TYPE ou pelo alias interno da query
      subscriptionStatus: u.subscription_status || u.sub_status || null,
      nextBillingDate: u.next_billing_date || u.next_billing_at || null
    }));

    // O total_count vem repetido em todas as linhas
    const total = data.length > 0 ? Number(data[0].total_count) : 0;

    return {
      data: users,
      total: total,
      totalPages: Math.ceil(total / limit)
    };
  },

  async getUserDetails(userId: string) {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('Perfil não encontrado.');
    }

    const { data: appUser } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

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
      customerCode: profile.hero_code || profile.customer_id_public,
      avatarUrl: profile.avatar_url,
      role: (appUser?.role as any) || 'client',
      whatsapp: profile.whatsapp,
      birthDate: profile.birthdate
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