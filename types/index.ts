
export type Role = 'CLIENT' | 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  name: string;
  cpf: string;
  whatsapp: string;
  email: string;
  birthDate: string;
  role: Role;
  heroTheme: string;
  avatarUrl: string | null;
  customerCode: string;
}

export interface Plan {
  id: string;
  name: string;
  priceCents: number;
  description: string;
  benefits: string[];
  imageUrl: string;
  active: boolean;
}

export interface Subscription {
  userId: string;
  planId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELED';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate: string;
}

export interface MonthlyBenefit {
  userId: string;
  monthKey: string; // YYYY-MM
  burgerRedeemed: boolean;
  redeemedAt: string | null;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  expiresAt: string;
  active: boolean;
}

export interface ScanPayload {
  type: 'USER_QR';
  userId: string;
  customerCode: string;
}

export type HeroTheme = 
  | 'sombra-noturna' 
  | 'guardiao-escarlate' 
  | 'tita-dourado' 
  | 'tempestade-azul' 
  | 'sentinela-verde' 
  | 'aurora-rosa';
