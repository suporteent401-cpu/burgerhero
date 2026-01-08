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

export interface Plan {
  // Formato usado na UI/Admin (camelCase)
  id: string;
  name: string;
  priceCents: number;
  description: string;
  benefits: string[];
  imageUrl: string;
  active: boolean;
  subscriberCount: number;
  popularity: number;

  // Campos do banco (snake_case) opcionais — mantidos por compatibilidade
  // (evita quebrar telas/serviços que ainda referenciam o formato do banco)
  price_cents?: number;
  image_url?: string;
  is_active?: boolean;
  created_at?: string;
  subscriber_count?: number;
  popularity_db?: number;
}
