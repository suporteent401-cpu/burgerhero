import type { Plan } from '../types';

// Fonte local temporária.
// Quando você criar tabela de planos no Supabase, a gente troca só aqui.
const LOCAL_PLANS: Plan[] = [
  {
    id: 'p-1',
    name: 'Plano Justiceiro',
    priceCents: 2990,
    description: '1 burger clássico por mês + 10% de desconto em extras.',
    benefits: ['1 Burger do Mês', '10% de desconto adicional', 'Fila prioritária'],
    imageUrl: '',
    active: true,
  },
  {
    id: 'p-2',
    name: 'Plano Vingador',
    priceCents: 4990,
    description: '1 burger gourmet por mês + batata + 15% de desconto.',
    benefits: ['1 Burger Gourmet do Mês', 'Batata Média Inclusa', '15% de desconto adicional', 'Brinde surpresa'],
    imageUrl: '',
    active: true,
  },
];

export const plansService = {
  async listActivePlans(): Promise<Plan[]> {
    return LOCAL_PLANS.filter(p => p.active);
  }
};
