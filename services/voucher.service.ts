// services/voucher.service.ts
import { supabase } from '../lib/supabaseClient';

type VoucherStatus = 'available' | 'redeemed' | 'expired' | string;

export type CurrentVoucherResult = {
  drop: {
    id: string;
    month_date: string; // YYYY-MM-DD
    is_active: boolean;
    burger_id: string;
  } | null;

  burger: {
    id: string;
    name?: string;
    description?: string;
    image_url?: string;
    is_active?: boolean;
  } | null;

  voucher: {
    id: string;
    user_id: string;
    monthly_drop_id: string;
    status: VoucherStatus;
    qr_token: string | null;
    issued_at: string | null;
    expires_at: string | null;
    redeemed_at: string | null;
  } | null;

  eligibility: {
    subscriptionActive: boolean;
    dropActive: boolean;
  };

  debug?: {
    monthDate: string;
  };
};

const getMonthDateUTCString = () => {
  const now = new Date();
  const monthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  return monthDate.toISOString().slice(0, 10); // YYYY-MM-DD
};

const safeRpcBool = async (fnName: string, args: any): Promise<boolean | null> => {
  try {
    const { data, error } = await supabase.rpc(fnName, args);
    if (error) {
      console.warn(`[VoucherService] RPC ${fnName} error (ignoring):`, error);
      return null;
    }
    if (typeof data === 'boolean') return data;
    return null;
  } catch (e) {
    console.warn(`[VoucherService] RPC ${fnName} exception (ignoring):`, e);
    return null;
  }
};

const isSubscriptionActive = async (userId: string): Promise<boolean> => {
  // Preferência: função oficial do banco
  const rpc = await safeRpcBool('is_subscription_active', { p_user_id: userId });
  if (rpc !== null) return rpc;

  // Fallback (caso a RPC não exista por algum motivo)
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', userId)
    .order('current_period_end', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return false;

  const statusOk = (data as any).status === 'active';
  const end = (data as any).current_period_end as string | null;
  const endOk = !end || new Date(end).getTime() > Date.now();

  return statusOk && endOk;
};

const getCurrentDrop = async (monthDate: string) => {
  const { data, error } = await supabase
    .from('monthly_drops')
    .select('id, month_date, is_active, burger_id')
    .eq('month_date', monthDate)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[VoucherService] erro ao buscar monthly_drop:', error);
    return null;
  }

  return data ?? null;
};

const getBurgerById = async (burgerId: string) => {
  // burgers pode ter policy "is_active = true" — então se o burger estiver inativo
  // a consulta voltará null (o que é ok).
  const { data, error } = await supabase
    .from('burgers')
    .select('id, name, description, image_url, is_active')
    .eq('id', burgerId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[VoucherService] erro ao buscar burger:', error);
    return null;
  }
  return data ?? null;
};

const getVoucherForUserAndDrop = async (userId: string, dropId: string) => {
  const { data, error } = await supabase
    .from('vouchers')
    .select('id, user_id, monthly_drop_id, status, qr_token, issued_at, expires_at, redeemed_at')
    .eq('user_id', userId)
    .eq('monthly_drop_id', dropId)
    .order('issued_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[VoucherService] erro ao buscar voucher:', error);
    return null;
  }

  return data ?? null;
};

const tryEnsureCurrentVoucher = async (userId: string) => {
  try {
    const { error } = await supabase.rpc('ensure_current_voucher', { p_user_id: userId });
    if (error) {
      // não quebra a tela: só loga
      console.warn('[VoucherService] ensure_current_voucher falhou:', error);
    }
  } catch (e) {
    console.warn('[VoucherService] ensure_current_voucher exception:', e);
  }
};

export const getCurrentVoucher = async (userId: string): Promise<CurrentVoucherResult> => {
  const monthDate = getMonthDateUTCString();

  const base: CurrentVoucherResult = {
    drop: null,
    burger: null,
    voucher: null,
    eligibility: {
      subscriptionActive: false,
      dropActive: false,
    },
    debug: { monthDate },
  };

  if (!userId) return base;

  // 1) Drop do mês
  const drop = await getCurrentDrop(monthDate);
  if (!drop?.id) return base;

  base.drop = {
    id: drop.id,
    month_date: drop.month_date,
    is_active: Boolean((drop as any).is_active),
    burger_id: (drop as any).burger_id,
  };
  base.eligibility.dropActive = Boolean((drop as any).is_active);

  // 2) Burger (se policy permitir)
  if ((drop as any).burger_id) {
    base.burger = await getBurgerById((drop as any).burger_id);
  }

  // 3) Se drop não está ativo, UI deve “travar”
  if (!base.eligibility.dropActive) {
    // Não tenta emitir voucher para rascunho
    return base;
  }

  // 4) Assinatura ativa (regra oficial)
  base.eligibility.subscriptionActive = await isSubscriptionActive(userId);

  // 5) Busca voucher existente
  let voucher = await getVoucherForUserAndDrop(userId, drop.id);
  if (voucher) {
    base.voucher = {
      id: voucher.id,
      user_id: voucher.user_id,
      monthly_drop_id: voucher.monthly_drop_id,
      status: voucher.status,
      qr_token: voucher.qr_token ?? null,
      issued_at: voucher.issued_at ?? null,
      expires_at: voucher.expires_at ?? null,
      redeemed_at: voucher.redeemed_at ?? null,
    };
    return base;
  }

  // 6) Auto-cura (JIT): só tenta emitir se assinatura ativa
  if (base.eligibility.subscriptionActive) {
    await tryEnsureCurrentVoucher(userId);

    voucher = await getVoucherForUserAndDrop(userId, drop.id);
    if (voucher) {
      base.voucher = {
        id: voucher.id,
        user_id: voucher.user_id,
        monthly_drop_id: voucher.monthly_drop_id,
        status: voucher.status,
        qr_token: voucher.qr_token ?? null,
        issued_at: voucher.issued_at ?? null,
        expires_at: voucher.expires_at ?? null,
        redeemed_at: voucher.redeemed_at ?? null,
      };
    }
  }

  return base;
};
