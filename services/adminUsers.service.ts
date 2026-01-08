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
    
    // Chama a RPC 'admin_list_users' que faz o JOIN entre app_users, user_profiles e subscriptions
    const { data, error } = await supabase.rpc('admin_list_users', {
      p_page: page,
      p_search: search,
      p_limit: limit,
      p_status: filters?.status || null,
      p_role: filters?.role || null
    });

    if (error) {
      console.error('Erro ao listar usuários:', error);
      throw error;
    }

    // Mapeamento exato dos campos retornados pela RPC
    const users: AdminUserListItem[] = (data || []).map((u: any) => ({
      id: u.id,
      name: u.display_name || 'Usuário sem nome',
      email: u.email,
      role: u.role,
      avatarUrl: u.avatar_url,
      customerCode: u.hero_code || '---',
      subscriptionStatus: u.subscription_status, // Pode ser null se não tiver assinatura
      nextBillingDate: u.next_billing_date // Timestamp ou null
    }));

    // A RPC retorna o total_count em todas as linhas (window function)
    const total = data?.[0]?.total_count || 0;

    return {
      data: users,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit)
    };
  },

  async getUserDetails(userId: string) {
    // 1. Dados do perfil (Tabela user_profiles)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('Perfil de usuário não encontrado.');
    }

    // 2. Dados de sistema (Tabela app_users) para pegar a role
    const { data: appUser } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', userId)
      .single();

    // 3. Assinatura e Plano (Tabela subscriptions + join com plans)
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('user_id', userId)
      .maybeSingle();

    // 4. Histórico de Vouchers (Últimos 5 resgates)
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