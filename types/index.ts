// /types/index.ts

export type Role = 'client' | 'staff' | 'admin';

export type HeroTheme =
  | 'sombra-noturna'
  | 'guardiao-escarlate'
  | 'tita-dourado'
  | 'tempestade-azul'
  | 'sentinela-verde'
  | 'aurora-rosa'
  | 'vermelho-heroi'
  | 'verde-neon'
  | 'laranja-vulcanico'
  | 'azul-eletrico';

export interface User {
  id: string;
  email: string;
  role: Role;

  name: string;
  customerCode: string;

  avatarUrl: string | null;
  cpf: string;

  whatsapp?: string;
  birthDate?: string;

  heroTheme?: HeroTheme;
}

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled';

export interface Subscription {
  status: SubscriptionStatus;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
}
