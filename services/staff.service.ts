import { supabase } from '../lib/supabaseClient';

export type StaffLookupResult = {
  user_id: string;
  display_name: string;
  email: string;
  cpf: string | null;
  hero_code: string | null;
  avatar_url: string | null;
};

export const staffService = {
  async lookupClient(query: string): Promise<StaffLookupResult | null> {
    const q = String(query || '').trim();
    if (!q) return null;

    const { data, error } = await supabase.rpc('staff_lookup_client', { p_query: q });

    if (error) {
      console.error('RPC staff_lookup_client error:', error);
      return null;
    }

    if (Array.isArray(data) && data.length > 0) return data[0] as StaffLookupResult;
    if (data && !Array.isArray(data)) return data as StaffLookupResult;

    return null;
  },
};
