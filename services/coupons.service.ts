import { supabase } from '../lib/supabaseClient';
import { Coupon, CampaignLog } from '../types';

export const couponsService = {
  async listCoupons(filters: { search?: string; status?: 'active' | 'expired' }): Promise<Coupon[]> {
    let query = supabase.from('coupons').select('*').order('created_at', { ascending: false });

    if (filters.search) {
      query = query.ilike('code', `%${filters.search}%`);
    }

    if (filters.status === 'active') {
      query = query.eq('is_active', true).gt('expires_at', new Date().toISOString());
    } else if (filters.status === 'expired') {
      query = query.or(`is_active.eq.false,expires_at.lte.${new Date().toISOString()}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(c => ({
      id: c.id,
      code: c.code,
      discountPercent: c.discount_percent,
      expiresAt: c.expires_at,
      active: c.is_active,
      ruleOnlyForInactives: c.rule_only_inactives
    }));
  },

  async createCoupon(coupon: Omit<Coupon, 'id'>): Promise<void> {
    const { error } = await supabase.from('coupons').insert({
      code: coupon.code,
      discount_percent: coupon.discountPercent,
      expires_at: coupon.expiresAt,
      is_active: coupon.active,
      rule_only_inactives: coupon.ruleOnlyForInactives
    });
    if (error) throw error;
  },

  async updateCoupon(id: string, updates: Partial<Coupon>): Promise<void> {
    const payload: any = {};
    if (updates.code) payload.code = updates.code;
    if (updates.discountPercent) payload.discount_percent = updates.discountPercent;
    if (updates.expiresAt) payload.expires_at = updates.expiresAt;
    if (updates.active !== undefined) payload.is_active = updates.active;
    if (updates.ruleOnlyForInactives !== undefined) payload.rule_only_inactives = updates.ruleOnlyForInactives;

    const { error } = await supabase.from('coupons').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteCoupon(id: string): Promise<void> {
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) throw error;
  },

  async listCampaignLogs(): Promise<CampaignLog[]> {
    const { data, error } = await supabase.from('campaign_logs').select('*').order('dispatched_at', { ascending: false });
    if (error) throw error;

    return (data || []).map(l => ({
      id: l.id,
      couponCode: l.coupon_code,
      segment: l.segment,
      reach: l.reach,
      reactivations: l.reactivations,
      dispatchedAt: l.dispatched_at
    }));
  },

  async dispatchCampaign(couponId: string, segment: string): Promise<void> {
    // 1. Busca código do cupom
    const { data: coupon } = await supabase.from('coupons').select('code').eq('id', couponId).single();
    if (!coupon) throw new Error('Cupom não encontrado');

    // 2. Registra log (mock de envio por enquanto, pois envio real requer edge function)
    const { error } = await supabase.from('campaign_logs').insert({
      coupon_code: coupon.code,
      segment: segment,
      reach: Math.floor(Math.random() * 100) + 10, // Mock de alcance
      reactivations: 0
    });
    
    if (error) throw error;
  }
};