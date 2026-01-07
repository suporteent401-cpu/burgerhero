import { supabase } from '../lib/supabaseClient';

/**
 * Valida um voucher através do QR Token ou Hero Code.
 * Esta função chama uma RPC (Remote Procedure Call) no Supabase.
 */
export const validateVoucher = async (qrToken?: string, heroCode?: string) => {
  const params: any = {};
  if (qrToken) params.p_qr_token = qrToken;
  if (heroCode) params.p_hero_code = heroCode;

  const { data, error } = await supabase.rpc('redeem_voucher', params);

  if (error) {
    console.error('Erro ao validar voucher via RPC:', error);
    throw error;
  }
  return data;
};

/**
 * Confirma o resgate de um voucher.
 * (A lógica de confirmação já está na RPC 'redeem_voucher', 
 * mas esta função poderia ser usada para lógicas adicionais se necessário).
 */
export const confirmRedemption = async (voucherId: string, restaurantId: string) => {
  const { data, error } = await supabase
    .from('vouchers')
    .update({
      status: 'redeemed',
      redeemed_at: new Date().toISOString(),
      redeemed_restaurant_id: restaurantId,
      // redeemed_by_staff_id é preenchido pela RPC
    })
    .eq('id', voucherId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao confirmar resgate:', error);
    throw error;
  }
  return data;
};