import { User, Plan, Subscription, MonthlyBenefit, Coupon, ScanPayload, HeroTheme } from '../types';

// Storage Keys
const USERS_KEY = 'bh_users';
const PLANS_KEY = 'bh_plans';
const SUBS_KEY = 'bh_subs';
const BENEFITS_KEY = 'bh_benefits';
const COUPONS_KEY = 'bh_coupons';

const INITIAL_USERS: User[] = [
  {
    id: 'u-1',
    name: 'Admin Burger',
    cpf: '111.111.111-11',
    whatsapp: '11999999999',
    email: 'admin@burgerhero.com',
    birthDate: '1990-01-01',
    role: 'ADMIN',
    heroTheme: 'tita-dourado',
    avatarUrl: 'https://picsum.photos/seed/admin/200',
    customerCode: 'HE00001'
  },
  {
    id: 'u-2',
    name: 'Staff Hero',
    cpf: '222.222.222-22',
    whatsapp: '11988888888',
    email: 'staff@burgerhero.com',
    birthDate: '1995-05-05',
    role: 'STAFF',
    heroTheme: 'tempestade-azul',
    avatarUrl: 'https://picsum.photos/seed/staff/200',
    customerCode: 'HE00002'
  },
  {
    id: 'u-3',
    name: 'Client Hero',
    cpf: '333.333.333-33',
    whatsapp: '11977777777',
    email: 'client@burgerhero.com',
    birthDate: '2000-10-10',
    role: 'CLIENT',
    heroTheme: 'sombra-noturna',
    avatarUrl: 'https://picsum.photos/seed/client/200',
    customerCode: 'HE12345'
  }
];

const INITIAL_PLANS: Plan[] = [
  {
    id: 'p-1',
    name: 'Plano Justiceiro',
    priceCents: 2990,
    description: '1 burger clássico por mês + 10% de desconto em extras.',
    benefits: ['1 Burger do Mês', '10% de desconto adicional', 'Fila prioritária'],
    imageUrl: 'https://picsum.photos/seed/plan1/400/250',
    active: true
  },
  {
    id: 'p-2',
    name: 'Plano Vingador',
    priceCents: 4990,
    description: '1 burger gourmet por mês + batata + 15% de desconto.',
    benefits: ['1 Burger Gourmet do Mês', 'Batata Média Inclusa', '15% de desconto adicional', 'Brinde surpresa'],
    imageUrl: 'https://picsum.photos/seed/plan2/400/250',
    active: true
  }
];

const INITIAL_SUBS: Subscription[] = [
  {
    userId: 'u-3',
    planId: 'p-1',
    status: 'ACTIVE',
    currentPeriodStart: '2023-10-01',
    currentPeriodEnd: '2023-11-01',
    nextBillingDate: '2023-11-01'
  }
];

// Helper to init storage
const initStorage = () => {
  if (!localStorage.getItem(USERS_KEY)) localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
  if (!localStorage.getItem(PLANS_KEY)) localStorage.setItem(PLANS_KEY, JSON.stringify(INITIAL_PLANS));
  if (!localStorage.getItem(SUBS_KEY)) localStorage.setItem(SUBS_KEY, JSON.stringify(INITIAL_SUBS));
  if (!localStorage.getItem(BENEFITS_KEY)) localStorage.setItem(BENEFITS_KEY, JSON.stringify([]));
  if (!localStorage.getItem(COUPONS_KEY)) localStorage.setItem(COUPONS_KEY, JSON.stringify([]));
};

initStorage();

const getFromStorage = <T,>(key: string): T[] => JSON.parse(localStorage.getItem(key) || '[]');
const saveToStorage = <T,>(key: string, data: T[]) => localStorage.setItem(key, JSON.stringify(data));

export const fakeApi = {
  authLogin: async (email: string, password: string): Promise<User> => {
    await new Promise(r => setTimeout(r, 800));
    const users = getFromStorage<User>(USERS_KEY);
    const user = users.find(u => u.email === email && password === '123456');
    if (!user) throw new Error('Credenciais inválidas. Use 123456 como senha.');
    return user;
  },

  authRegister: async (payload: Partial<User>): Promise<User> => {
    await new Promise(r => setTimeout(r, 800));
    const users = getFromStorage<User>(USERS_KEY);
    const newUser: User = {
      id: `u-${Date.now()}`,
      name: payload.name || '',
      cpf: payload.cpf || '',
      whatsapp: payload.whatsapp || '',
      email: payload.email || '',
      birthDate: payload.birthDate || '',
      role: 'CLIENT',
      heroTheme: 'sombra-noturna',
      avatarUrl: null,
      customerCode: `HE${Math.floor(Math.random() * 90000) + 10000}`
    };
    users.push(newUser);
    saveToStorage(USERS_KEY, users);
    return newUser;
  },

  listPlans: async (): Promise<Plan[]> => {
    return getFromStorage<Plan>(PLANS_KEY).filter(p => p.active);
  },

  adminListAllPlans: async (): Promise<Plan[]> => {
    return getFromStorage<Plan>(PLANS_KEY);
  },

  adminCreatePlan: async (data: Omit<Plan, 'id'>): Promise<Plan> => {
    await new Promise(r => setTimeout(r, 500));
    const plans = getFromStorage<Plan>(PLANS_KEY);
    const newPlan: Plan = {
      ...data,
      id: `p-${Date.now()}`,
    };
    plans.push(newPlan);
    saveToStorage(PLANS_KEY, plans);
    return newPlan;
  },

  adminUpdatePlan: async (planId: string, data: Partial<Plan>): Promise<Plan> => {
    await new Promise(r => setTimeout(r, 500));
    const plans = getFromStorage<Plan>(PLANS_KEY);
    const planIndex = plans.findIndex(p => p.id === planId);
    if (planIndex === -1) throw new Error('Plano não encontrado.');
    
    const updatedPlan = { ...plans[planIndex], ...data };
    plans[planIndex] = updatedPlan;
    saveToStorage(PLANS_KEY, plans);
    return updatedPlan;
  },

  createCheckout: async (userId: string, planId: string): Promise<void> => {
    await new Promise(r => setTimeout(r, 1000));
    const subs = getFromStorage<Subscription>(SUBS_KEY);
    const newSub: Subscription = {
      userId,
      planId,
      status: 'ACTIVE',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    const filtered = subs.filter(s => s.userId !== userId);
    saveToStorage(SUBS_KEY, [...filtered, newSub]);
  },

  getSubscriptionStatus: async (userId: string): Promise<Subscription | null> => {
    const subs = getFromStorage<Subscription>(SUBS_KEY);
    return subs.find(s => s.userId === userId) || null;
  },

  getMonthlyBenefit: async (userId: string, monthKey: string): Promise<MonthlyBenefit | null> => {
    const benefits = getFromStorage<MonthlyBenefit>(BENEFITS_KEY);
    return benefits.find(b => b.userId === userId && b.monthKey === monthKey) || {
      userId,
      monthKey,
      burgerRedeemed: false,
      redeemedAt: null
    };
  },

  redeemMonthlyBurger: async (userId: string): Promise<void> => {
    const monthKey = new Date().toISOString().slice(0, 7);
    const benefits = getFromStorage<MonthlyBenefit>(BENEFITS_KEY);
    const existingIdx = benefits.findIndex(b => b.userId === userId && b.monthKey === monthKey);
    
    if (existingIdx >= 0 && benefits[existingIdx].burgerRedeemed) {
      throw new Error('Hambúrguer já resgatado este mês!');
    }

    const newBenefit: MonthlyBenefit = {
      userId,
      monthKey,
      burgerRedeemed: true,
      redeemedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      benefits[existingIdx] = newBenefit;
    } else {
      benefits.push(newBenefit);
    }
    saveToStorage(BENEFITS_KEY, benefits);
  },

  adminListUsers: async (search?: string): Promise<User[]> => {
    let users = getFromStorage<User>(USERS_KEY);
    if (search) {
      const s = search.toLowerCase();
      users = users.filter(u => u.name.toLowerCase().includes(s) || u.cpf.includes(s) || u.customerCode.toLowerCase().includes(s));
    }
    return users;
  },

  adminGetUser: async (id: string): Promise<User | null> => {
    return getFromStorage<User>(USERS_KEY).find(u => u.id === id) || null;
  },

  staffValidateByPayload: async (input: string): Promise<{ success: boolean; message: string; user?: User }> => {
    const users = getFromStorage<User>(USERS_KEY);
    let targetUser: User | undefined;

    try {
      const parsed = JSON.parse(input) as ScanPayload;
      targetUser = users.find(u => u.id === parsed.userId);
    } catch {
      targetUser = users.find(u => u.cpf === input || u.customerCode === input);
    }

    if (!targetUser) return { success: false, message: 'Herói não encontrado.' };

    const sub = await fakeApi.getSubscriptionStatus(targetUser.id);
    if (!sub || sub.status !== 'ACTIVE') return { success: false, message: 'Assinatura inativa.', user: targetUser };

    const monthKey = new Date().toISOString().slice(0, 7);
    const benefit = await fakeApi.getMonthlyBenefit(targetUser.id, monthKey);
    if (benefit?.burgerRedeemed) return { success: false, message: 'Resgate mensal já realizado.', user: targetUser };

    return { success: true, message: 'Resgate disponível!', user: targetUser };
  },

  updateUserTheme: async (userId: string, theme: HeroTheme): Promise<void> => {
    const users = getFromStorage<User>(USERS_KEY);
    const idx = users.findIndex(u => u.id === userId);
    if (idx >= 0) {
      users[idx].heroTheme = theme;
      saveToStorage(USERS_KEY, users);
    }
  },

  updateUserAvatar: async (userId: string, avatarUrl: string): Promise<void> => {
    const users = getFromStorage<User>(USERS_KEY);
    const idx = users.findIndex(u => u.id === userId);
    if (idx >= 0) {
      users[idx].avatarUrl = avatarUrl;
      saveToStorage(USERS_KEY, users);
    }
  }
};