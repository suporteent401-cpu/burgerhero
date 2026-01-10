import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import { Mail, Lock, User as UserIcon, Calendar, Phone, CreditCard } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { getFullUserProfile, checkCpfExists, ensureProfileFromSession } from '../services/users.service';
import { subscriptionMockService } from '../services/subscriptionMock.service';
import { useThemeStore } from '../store/themeStore';
import { useCardStore } from '../store/cardStore';
import { templatesService } from '../services/templates.service';
import { plansService } from '../services/plans.service';
import type { Role, HeroTheme, Plan } from '../types';

const normalizeRole = (input: any): Role => {
  const r = String(input || '').toLowerCase();
  if (r === 'admin' || r === 'staff' || r === 'client') return r;
  return 'client';
};

const normalizeCpf = (cpf: string) => (cpf ? cpf.replace(/[^\d]/g, '') : '');

const isValidCpf = (cpfInput: string): boolean => {
  const cpf = normalizeCpf(cpfInput);

  if (!cpf || cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  const calcDv = (base: string, factor: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) sum += parseInt(base[i], 10) * (factor - i);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const base9 = cpf.slice(0, 9);
  const dv1 = calcDv(base9, 10);
  const base10 = cpf.slice(0, 10);
  const dv2 = calcDv(base10, 11);

  return cpf === `${base9}${dv1}${dv2}`;
};

const DEFAULT_SETTINGS = {
  cardTemplateId: null as string | null,
  fontStyle: 'Inter',
  fontColor: '#FFFFFF',
  fontSize: 22,
  heroTheme: 'sombra-noturna' as HeroTheme,
  mode: 'system' as 'light' | 'dark' | 'system',
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const buildSupabaseErrorDebug = (e: any) => {
  if (!e) return '';
  const msg = e?.message ? String(e.message) : '';
  const details = e?.details ? String(e.details) : '';
  const hint = e?.hint ? String(e.hint) : '';
  const code = e?.code ? String(e.code) : '';
  const status = e?.status ? String(e.status) : '';
  const name = e?.name ? String(e.name) : '';
  return [
    name && `name=${name}`,
    status && `status=${status}`,
    code && `code=${code}`,
    msg && `message=${msg}`,
    details && `details=${details}`,
    hint && `hint=${hint}`,
  ]
    .filter(Boolean)
    .join(' | ');
};

const humanizeBootstrapMessage = (msg: string) => {
  const m = String(msg || '').toLowerCase();
  if (m.includes('invalid_cpf')) return 'CPF inválido. Digite um CPF válido para continuar.';
  if (m.includes('no_auth')) return 'Sessão inválida. Faça login novamente.';
  if (m.includes('refresh token')) return 'Sessão inconsistente. Volte para o login e entre novamente.';
  if (m.includes('jwt')) return 'Sessão inválida. Volte para o login e entre novamente.';
  if (m.includes('bootstrap_failed')) return 'Falha ao criar seu perfil. Tente novamente.';
  return msg || 'Falha ao criar seu perfil. Tente novamente.';
};

const sanitizeNextPath = (raw: string | null): string | null => {
  if (!raw) return null;
  const v = String(raw).trim();

  // Só aceitamos paths internos
  if (!v.startsWith('/')) return null;
  if (v.startsWith('//')) return null;

  // Evita enviar para telas protegidas indevidas
  // (checkout só faz sentido com pendingPlan; protegida por route)
  // Mantém simples e seguro.
  return v;
};

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<any>(null);
  const [recoverMode, setRecoverMode] = useState(false);
  const [recoverHint, setRecoverHint] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const login = useAuthStore((state) => state.login);

  // intenção vinda da URL: /auth?next=/plans&planId=uuid
  const intent = useMemo(() => {
    const sp = new URLSearchParams(location.search || '');
    const next = sanitizeNextPath(sp.get('next'));
    const planId = sp.get('planId') ? String(sp.get('planId')) : null;
    return { next, planId };
  }, [location.search]);

  const heroTheme = useThemeStore((state) => state.heroTheme);
  const heroTextColor = heroTheme === 'preto-absoluto' ? 'text-blue-400' : 'text-hero-primary';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    getValues,
    setValue,
    reset,
    resetField,
  } = useForm();

  const password = watch('password');

  const pageTitle = useMemo(() => {
    if (recoverMode) return 'Finalize seu cadastro';
    return isLogin ? 'Bem-vindo de volta, Herói!' : 'Crie sua identidade secreta';
  }, [isLogin, recoverMode]);

  // FIX: sempre que entrar no passo 2 (cadastro) ou recovery, limpa WhatsApp
  useEffect(() => {
    if (!isLogin && step === 2) {
      try {
        resetField('whatsapp');
      } catch {}
      setValue('whatsapp', '');
    }
  }, [isLogin, step, resetField, setValue]);

  // Se existe sessão, mas não existe perfil público ainda, entra em modo recuperação.
  useEffect(() => {
    const run = async () => {
      try {
        const { data: sessionWrap, error: sessErr } = await supabase.auth.getSession();
        if (sessErr) {
          console.warn('[AUTH] getSession error:', buildSupabaseErrorDebug(sessErr));
          return;
        }

        const session = sessionWrap?.session;
        if (!session?.user) return;

        const full = await getFullUserProfile(session.user);
        if (!full) {
          setRecoverMode(true);
          setRecoverHint(
            'Detectamos que seu usuário foi criado, mas seu perfil do app ainda não foi finalizado. Preencha os dados abaixo para concluir.'
          );

          setIsLogin(false);
          setStep(2);

          const metaName =
            (session.user.user_metadata as any)?.full_name || (session.user.user_metadata as any)?.name;

          setStep1Data({ name: metaName || 'Herói', cpf: '' });

          if (session.user.email) setValue('email', session.user.email);

          setValue('cpf', '');
          setValue('whatsapp', '');
        }
      } catch (e) {
        console.warn('[AUTH] recovery auto-run falhou:', e);
      }
    };
    run();
  }, [setValue]);

  const applySettingsAndLoadTemplates = async (settings: any) => {
    const safe = settings || DEFAULT_SETTINGS;

    useThemeStore.getState().setHeroTheme(safe.heroTheme || DEFAULT_SETTINGS.heroTheme);
    useThemeStore.getState().setMode(safe.mode || DEFAULT_SETTINGS.mode);

    useCardStore.getState().setAll({
      templateId: safe.cardTemplateId ?? undefined,
      font: safe.fontStyle || DEFAULT_SETTINGS.fontStyle,
      color: safe.fontColor || DEFAULT_SETTINGS.fontColor,
      fontSize: safe.fontSize || DEFAULT_SETTINGS.fontSize,
    });

    useThemeStore.getState().applyTheme();

    try {
      const dbTemplates = await templatesService.getActiveTemplates();
      if (dbTemplates && dbTemplates.length > 0) {
        useCardStore.getState().setTemplates(templatesService.mapToStoreFormat(dbTemplates));
      }
    } catch (e) {
      console.error('Erro ao carregar templates no login:', e);
    }
  };

  const findPlanById = async (planId: string): Promise<Plan | null> => {
    try {
      const plans = await plansService.listActivePlans();
      const found = plans?.find((p) => String(p.id) === String(planId));
      return found || null;
    } catch (e) {
      console.warn('[AUTH] falha ao buscar planos (planId intent):', e);
      return null;
    }
  };

  const handlePostAuthRedirect = async (role: Role) => {
    // Admin/Staff ignoram intenção de checkout/planos
    if (role === 'admin') {
      navigate('/admin', { replace: true });
      return;
    }
    if (role === 'staff') {
      navigate('/staff', { replace: true });
      return;
    }

    // Client: prioridade 1 = pendingPlan existente
    const pendingPlan = subscriptionMockService.getPendingPlan();
    if (pendingPlan) {
      navigate('/checkout', { replace: true });
      return;
    }

    // Client: prioridade 2 = intenção vinda da URL (planId)
    if (intent.planId) {
      const plan = await findPlanById(intent.planId);
      if (plan) {
        subscriptionMockService.setPendingPlan({
          id: plan.id,
          name: plan.name,
          priceCents: plan.priceCents,
        });
        navigate('/checkout', { replace: true });
        return;
      }

      // Se não achou plano, manda pro next ou /plans (melhor UX)
      if (intent.next) {
        navigate(intent.next, { replace: true });
        return;
      }
      navigate('/plans', { replace: true });
      return;
    }

    // Client: prioridade 3 = next (se existir)
    if (intent.next) {
      navigate(intent.next, { replace: true });
      return;
    }

    // Client: padrão
    navigate('/app', { replace: true });
  };

  /**
   * BOOTSTRAP SEM TRIGGER:
   * - não faz loop chamando getSession (isso costuma disparar refresh e quebrar com "Refresh Token Not Found")
   * - usa a sessão do fluxo (signUpData.session ou session atual no recovery)
   * - log completo de data+error
   */
  const ensureBootstrap = async (
    sessionUser: any,
    payload: {
      name: string;
      email: string;
      cpf: string;
      birthDate?: string | null;
      whatsapp?: string | null;
    }
  ) => {
    const cpf = normalizeCpf(payload.cpf);

    if (!isValidCpf(cpf)) {
      return { ok: false, message: 'invalid_cpf' };
    }

    if (!sessionUser?.id) {
      console.warn('[BOOTSTRAP] sem sessionUser.id (no_auth)');
      return { ok: false, message: 'no_auth' };
    }

    let lastErr: any = null;

    // Pequeno retry, mas sem getSession (pra não tentar refresh)
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase.rpc('ensure_user_bootstrap', {
        p_display_name: payload.name,
        p_email: payload.email,
        p_cpf: cpf,
        p_birthdate: payload.birthDate ? payload.birthDate : null,
        p_whatsapp: payload.whatsapp ? payload.whatsapp : null,
      });

      const result = Array.isArray(data) ? data[0] : data;

      console.log(`[BOOTSTRAP] attempt ${attempt + 1}/3 data:`, result);
      if (error) console.error(`[BOOTSTRAP] attempt ${attempt + 1}/3 error:`, error, buildSupabaseErrorDebug(error));

      if (!error) {
        return result || { ok: true, message: 'ok' };
      }

      lastErr = error;

      // se for erro de auth/refresh, não adianta insistir
      const msg = String(error?.message || '').toLowerCase();
      if (msg.includes('refresh token') || msg.includes('jwt') || msg.includes('no_auth')) break;

      await sleep(250 + attempt * 250);
    }

    return { ok: false, message: lastErr?.message || 'bootstrap_failed', detail: buildSupabaseErrorDebug(lastErr) };
  };

  const onSubmit = async (data: any) => {
    setError('');
    setLoading(true);

    try {
      // =========================
      // LOGIN
      // =========================
      if (isLogin) {
        const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (authError) {
          throw new Error(
            authError.message === 'Invalid login credentials' ? 'Credenciais inválidas.' : authError.message
          );
        }

        if (!signInData.session) throw new Error('Não foi possível iniciar a sessão.');

        let full = await getFullUserProfile(signInData.session.user);

        if (!full) {
          console.warn('Falha ao carregar perfil no login. Tentando auto-cura...');
          await ensureProfileFromSession(signInData.session.user);
          full = await getFullUserProfile(signInData.session.user);
        }

        if (!full) {
          setRecoverMode(true);
          setRecoverHint('Seu login foi aceito, mas seu perfil do app não existe/está incompleto. Vamos finalizar agora.');
          setIsLogin(false);
          setStep(2);

          const metaName =
            (signInData.session.user.user_metadata as any)?.full_name ||
            (signInData.session.user.user_metadata as any)?.name;

          setStep1Data({ name: metaName || 'Herói', cpf: '' });

          if (signInData.session.user.email) setValue('email', signInData.session.user.email);

          setValue('cpf', '');
          setValue('whatsapp', '');
          setLoading(false);
          return;
        }

        const role = normalizeRole(full.profile.role);
        const safeProfile = { ...full.profile, role };

        await applySettingsAndLoadTemplates(full.settings);

        login(safeProfile);
        await handlePostAuthRedirect(role);
        return;
      }

      // =========================
      // CADASTRO (step 1)
      // =========================
      if (step === 1 && !recoverMode) {
        const rawCpf = getValues('cpf') || data.cpf;
        const cleanCpf = normalizeCpf(rawCpf);

        if (!isValidCpf(cleanCpf)) throw new Error('CPF inválido. Digite um CPF válido para continuar.');

        const cpfExists = await checkCpfExists(cleanCpf);
        if (cpfExists) throw new Error('Este CPF já está cadastrado em nossa base.');

        setStep1Data({ name: data.name, cpf: cleanCpf });
        setStep(2);

        setValue('whatsapp', '');
        setLoading(false);
        return;
      }

      // =========================
      // CADASTRO (step 2) / RECOVERY
      // =========================
      const fullUserData = {
        ...step1Data,
        ...data,
        cpf: normalizeCpf(step1Data?.cpf || data.cpf || ''),
      };

      if (!isValidCpf(fullUserData.cpf)) throw new Error('CPF inválido. Volte e corrija seu CPF para continuar.');

      let sessionUser = null as any;

      if (!recoverMode) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: fullUserData.email,
          password: fullUserData.password,
          options: { data: { full_name: fullUserData.name } },
        });

        if (signUpError) {
          console.error('[SIGNUP] error:', signUpError, buildSupabaseErrorDebug(signUpError));
          throw new Error(signUpError.message || 'Falha no cadastro.');
        }

        // Se exigir confirmação de e-mail, sessão vem null
        if (!signUpData.session) {
          setLoading(false);
          alert('Cadastro realizado com sucesso! Faça login para continuar.');
          setIsLogin(true);
          return;
        }

        // FIX CRÍTICO: “fixar” sessão no storage (evita refresh token not found em seguida)
        try {
          await supabase.auth.setSession({
            access_token: signUpData.session.access_token,
            refresh_token: signUpData.session.refresh_token,
          });
        } catch (e: any) {
          console.warn('[SIGNUP] setSession falhou (segue mesmo assim):', e);
        }

        sessionUser = signUpData.session.user;
      } else {
        const { data: sessionWrap, error: sessErr } = await supabase.auth.getSession();
        if (sessErr) console.warn('[RECOVERY] getSession error:', buildSupabaseErrorDebug(sessErr));
        sessionUser = sessionWrap?.session?.user;
        if (!sessionUser) throw new Error('Sessão inválida. Faça login novamente.');
      }

      // 1) tenta bootstrap via RPC (sem trigger)
      const boot = await ensureBootstrap(sessionUser, {
        name: fullUserData.name,
        email: fullUserData.email,
        cpf: fullUserData.cpf,
        birthDate: fullUserData.birthDate || null,
        whatsapp: fullUserData.whatsapp || null,
      });

      if (!boot?.ok) {
        console.warn('[BOOTSTRAP] retorno ok=false:', boot);
      }

      // 2) tenta carregar perfil de verdade
      let full = await getFullUserProfile(sessionUser);

      // 3) se ainda não tem perfil, tenta auto-cura e busca de novo
      if (!full) {
        await ensureProfileFromSession(sessionUser);
        full = await getFullUserProfile(sessionUser);
      }

      // 4) se conseguiu, loga e navega (com redirect inteligente)
      if (full) {
        const role = normalizeRole(full.profile.role);
        const safeProfile = { ...full.profile, role };

        await applySettingsAndLoadTemplates(full.settings);

        login(safeProfile);
        await handlePostAuthRedirect(role);
        return;
      }

      // 5) se falhou, entra recovery com mensagem + debug em console
      setRecoverMode(true);
      setRecoverHint('Seu usuário foi criado, mas o perfil do app não foi finalizado. Revise os dados e tente novamente.');
      setIsLogin(false);
      setStep(2);
      setStep1Data((prev: any) => ({
        name: prev?.name || fullUserData.name,
        cpf: fullUserData.cpf,
      }));

      const debug = boot?.detail ? ` (debug: ${boot.detail})` : '';
      throw new Error(humanizeBootstrapMessage(boot?.message) + debug);
    } catch (err: any) {
      console.error('AUTH_ERROR', err);
      setError(`Erro: ${err.message || 'Ocorreu um erro inesperado.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex flex-col justify-center items-center px-4 py-12">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-10">
          <img
            src="https://ik.imagekit.io/lflb43qwh/Heros/images.jpg"
            alt="BurgerHero Logo"
            className="w-24 h-24 rounded-full mx-auto mb-6 border-4 border-white/20 shadow-lg"
          />
          <h1 className="text-3xl font-black mb-2 tracking-tight text-white">
            Burger<span className={heroTextColor}>Hero</span>
          </h1>
          <p className="text-slate-400 font-medium">{pageTitle}</p>

          {/* Mensagem sutil quando vem da intenção de assinar */}
          {intent.planId && (
            <p className="mt-2 text-xs font-bold text-slate-400">
              Entre ou crie sua conta para continuar a assinatura.
            </p>
          )}
        </div>

        <Card>
          <CardBody className="p-8 space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {isLogin ? (
                <>
                  <Input
                    label="E-mail"
                    placeholder="heroi@email.com"
                    icon={<Mail size={18} />}
                    autoComplete="email"
                    {...register('email', { required: true })}
                  />
                  <Input
                    label="Senha"
                    type="password"
                    placeholder="••••••••"
                    icon={<Lock size={18} />}
                    autoComplete="current-password"
                    {...register('password', { required: true })}
                  />
                </>
              ) : (
                <>
                  {step === 1 && !recoverMode ? (
                    <>
                      <Input
                        label="Nome Completo"
                        placeholder="Bruce Wayne"
                        icon={<UserIcon size={18} />}
                        autoComplete="name"
                        {...register('name', { required: true })}
                      />

                      <Input
                        label="CPF"
                        placeholder="000.000.000-00"
                        icon={<CreditCard size={18} />}
                        autoComplete="off"
                        {...register('cpf', {
                          required: 'CPF é obrigatório.',
                          validate: (v) => isValidCpf(v) || 'CPF inválido. Digite um CPF válido.',
                        })}
                      />

                      {errors.cpf && (
                        <p className="text-red-500 text-xs -mt-2 ml-1">{(errors.cpf as any).message}</p>
                      )}
                    </>
                  ) : (
                    <>
                      {recoverMode && (
                        <Input
                          label="Nome Completo"
                          placeholder="Bruce Wayne"
                          icon={<UserIcon size={18} />}
                          defaultValue={step1Data?.name || ''}
                          autoComplete="name"
                          {...register('name', { required: true })}
                        />
                      )}

                      <Input
                        label="WhatsApp"
                        placeholder="(11) 99999-9999"
                        icon={<Phone size={18} />}
                        autoComplete="tel"
                        {...register('whatsapp', { required: true })}
                      />

                      <Input
                        label="E-mail"
                        type="email"
                        placeholder="heroi@email.com"
                        icon={<Mail size={18} />}
                        disabled={recoverMode}
                        autoComplete="email"
                        {...register('email', { required: true })}
                      />

                      <Input
                        label="CPF"
                        placeholder="000.000.000-00"
                        icon={<CreditCard size={18} />}
                        defaultValue={step1Data?.cpf || ''}
                        autoComplete="off"
                        {...register('cpf', {
                          required: 'CPF é obrigatório.',
                          validate: (v) => isValidCpf(v) || 'CPF inválido. Digite um CPF válido.',
                        })}
                      />

                      {errors.cpf && (
                        <p className="text-red-500 text-xs -mt-2 ml-1">{(errors.cpf as any).message}</p>
                      )}

                      <Input
                        label="Nascimento"
                        type="date"
                        icon={<Calendar size={18} />}
                        autoComplete="bday"
                        {...register('birthDate', { required: true })}
                      />

                      {!recoverMode && (
                        <>
                          <Input
                            label="Senha"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            icon={<Lock size={18} />}
                            autoComplete="new-password"
                            {...register('password', { required: true, minLength: 6 })}
                          />
                          {errors.password && (
                            <p className="text-red-500 text-xs -mt-2 ml-1">A senha deve ter no mínimo 6 caracteres.</p>
                          )}
                          <Input
                            label="Confirmar Senha"
                            type="password"
                            placeholder="Repita a senha"
                            icon={<Lock size={18} />}
                            autoComplete="new-password"
                            {...register('confirmPassword', {
                              required: true,
                              validate: (value) => value === password || 'As senhas não coincidem',
                            })}
                          />
                          {errors.confirmPassword && (
                            <p className="text-red-500 text-xs -mt-2 ml-1">{(errors.confirmPassword as any).message}</p>
                          )}
                          <div className="flex items-start gap-2 pt-2">
                            <input type="checkbox" className="mt-1" {...register('terms', { required: true })} />
                            <label className="text-xs text-slate-500">
                              Aceito os termos e condições de uso da BurgerHero.
                            </label>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              {recoverMode && recoverHint && (
                <p className="text-amber-700 text-xs font-semibold text-center bg-amber-50 p-2 rounded-lg border border-amber-100">
                  {recoverHint}
                </p>
              )}

              {error && (
                <p className="text-red-500 text-sm font-semibold text-center bg-red-50 p-2 rounded-lg border border-red-100">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full rounded-full py-3" size="md" isLoading={loading}>
                {recoverMode
                  ? 'Finalizar Cadastro'
                  : !isLogin && step === 1
                    ? 'Próximo Passo'
                    : isLogin
                      ? 'Entrar'
                      : 'Finalizar Cadastro'}
              </Button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-bold">Ou</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setStep(1);
                setRecoverMode(false);
                setRecoverHint('');
                setError('');
                setStep1Data(null);
                reset();
              }}
              className="w-full text-center text-sm font-bold text-slate-600 hover:text-hero-primary transition-colors"
            >
              {recoverMode ? 'Voltar para Login' : isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça Login'}
            </button>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
