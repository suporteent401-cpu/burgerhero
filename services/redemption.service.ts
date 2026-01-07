import { supabase } from '../lib/supabaseClient';

/**
 * Valida e resgata um voucher através do QR Token ou Hero Code usando uma RPC.
 */
export const validateVoucher = async (qrToken?: string, heroCode?: string, restaurantId?: string) => {
  const params: any = {
    p_restaurant_id: restaurantId || null
  };
  if (qrToken) params.p_qr_token = qrToken;
  if (heroCode) params.p_hero_code = heroCode;

  // A RPC 'redeem_voucher' retorna um array com um único objeto de resultado.
  const { data, error } = await supabase.rpc('redeem_voucher', params);

  if (error) {
    console.error('Erro ao chamar RPC redeem_voucher:', error);
    // Retorna um erro estruturado para a UI tratar.
    return [{ 
      ok: false, 
      message: `Erro de comunicação: ${error.message}`,
      user_id: null,
      voucher_id: null,
      status: null
    }];
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