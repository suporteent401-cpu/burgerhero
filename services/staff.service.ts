import { supabase } from '../lib/supabaseClient';

export interface StaffLookupResult {
  user_id: string;
  display_name: string;
  email: string;
  cpf: string;
  hero_code: string;
  avatar_url: string | null;
  subscription_status: string | null;
  next_billing_date: string | null;
}

export const staffService = {
  async lookupClient(query: string): Promise<StaffLookupResult | null> {
    const q = String(query || '').trim();
    if (!q) return null;

    const { data, error } = await supabase.rpc('staff_lookup_client', { p_query: q });

    if (error) {
      console.error('RPC staff_lookup_client error:', error);
      throw error;
    }

    const row = Array.isArray(data) ? data[0] : data;
    return (row as StaffLookupResult) || null;
  },
};
