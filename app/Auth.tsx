import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
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
import type { Role, HeroTheme } from '../types';

const normalizeRole = (input: any): Role => {
  const r = String(input || '').toLowerCase();
  if (r === 'admin' || r === 'staff' || r === 'client') return r;
  return 'client';
};

const normalizeCpf = (cpf: string) => (cpf ? cpf.replace(/[^\d]/g, '') : '');

/**
 * Validação REAL de CPF (DV + bloqueio de repetidos)
 */
const isValidCpf = (cpfInput: string): boolean => {
  const cpf = normalizeCpf(cpfInput);

  if (!cpf || cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false; // 00000000000, 11111111111 etc.

  const calcDv = (base: string, factor: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
      sum += parseInt(base[i], 10) * (factor - i);
    }
    const mod = sum % 11;
    const dv = mod < 2 ? 0 : 11 - mod;
    return dv;
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

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const heroTheme = useThemeStore(state => state.heroTheme);
  const heroTextColor = heroTheme === 'preto-absoluto' ? 'text-blue-400' : 'text-hero-primary';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    getValues,
  } = useForm();

  const password = watch('password');

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

  const handlePostAuthRedirect = (role: Role) => {
    const pendingPlan = subscriptionMockService.getPendingPlan();
    if (pendingPlan) {
      navigate('/checkout', { replace: true });
      return;
    }

    if (role === 'admin') navigate('/admin', { replace: true });
    else if (role === 'staff') navigate('/staff', { replace: true });
    else navigate('/app', { replace: true });
  };

  const ensureBootstrap = async (payload: {
    name: string;
    email: string;
    cpf: string;
    birthDate?: string | null;
    whatsapp?: string | null;
  }) => {
    const cpf = normalizeCpf(payload.cpf);

    const { data, error } = await supabase.rpc('ensure_user_bootstrap', {
      p_display_name: payload.name,
      p_email: payload.email,
      p_cpf: cpf,
      p_birthdate: payload.birthDate ? payload.birthDate : null,
      p_whatsapp: payload.whatsapp ? payload.whatsapp : null,
    });

    if (error) {
      console.error('RPC ensure_user_bootstrap falhou:', error);
      return { ok: false, message: error.message };
    }

    const result = Array.isArray(data) ? data[0] : data;
    return result || { ok: true };
  };

  const onSubmit = async (data: any) => {
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (authError) {
          throw new Error(authError.message === 'Invalid login credentials' ? 'Credenciais inválidas.' : authError.message);
        }

        if (!signInData.session) {
          throw new Error('Não foi possível iniciar a sessão.');
        }

        let full = await getFullUserProfile(signInData.session.user);

        if (!full) {
          console.warn('Falha ao carregar perfil no login. Tentando auto-cura...');
          await ensureProfileFromSession(signInData.session.user);
          full = await getFullUserProfile(signInData.session.user);
        }

        if (full) {
          const role = normalizeRole(full.profile.role);
          const safeProfile = { ...full.profile, role };

          await applySettingsAndLoadTemplates(full.settings);

          login(safeProfile);
          handlePostAuthRedirect(role);
          return;
        }

        throw new Error('Não foi possível carregar seu perfil. Tente novamente em alguns segundos.');
      }

      // =========================
      // CADASTRO
      // =========================
      if (step === 1) {
        const rawCpf = getValues('cpf') || data.cpf;
        const cleanCpf = normalizeCpf(rawCpf);

        if (!isValidCpf(cleanCpf)) {
          throw new Error('CPF inválido. Digite um CPF válido para continuar.');
        }

        const cpfExists = await checkCpfExists(cleanCpf);
        if (cpfExists) throw new Error('Este CPF já está cadastrado em nossa base.');

        setStep1Data({
          name: data.name,
          cpf: cleanCpf,
        });

        setStep(2);
        setLoading(false);
        return;
      }

      const fullUserData = {
        ...step1Data,
        ...data,
        cpf: normalizeCpf(step1Data?.cpf || data.cpf),
      };

      // redundância de segurança (nunca deixar passar CPF ruim)
      if (!isValidCpf(fullUserData.cpf)) {
        throw new Error('CPF inválido. Volte e corrija seu CPF para continuar.');
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: fullUserData.email,
        password: fullUserData.password,
        options: { data: { full_name: fullUserData.name } },
      });

      if (signUpError) throw signUpError;

      // Se por algum motivo a sessão não vier, orienta o usuário (mesmo com email confirm desligado, pode acontecer em edge cases)
      if (!signUpData.session) {
        setLoading(false);
        alert('Cadastro realizado com sucesso! Faça login para continuar.');
        setIsLogin(true);
        return;
      }

      const boot = await ensureBootstrap({
        name: fullUserData.name,
        email: fullUserData.email,
        cpf: fullUserData.cpf,
        birthDate: fullUserData.birthDate || null,
        whatsapp: fullUserData.whatsapp || null,
      });

      if (!boot?.ok) {
        // se aqui ainda der invalid_cpf, significa que o banco está com regra diferente
        throw new Error(boot?.message || 'Falha ao criar seu perfil. Tente novamente.');
      }

      const full = await getFullUserProfile(signUpData.session.user);

      if (full) {
        const role = normalizeRole(full.profile.role);
        const safeProfile = { ...full.profile, role };

        await applySettingsAndLoadTemplates(full.settings);

        login(safeProfile);
        handlePostAuthRedirect(role);
      } else {
        navigate('/app', { replace: true });
      }
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
          <p className="text-slate-400 font-medium">{isLogin ? 'Bem-vindo de volta, Herói!' : 'Crie sua identidade secreta'}</p>
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
                    {...register('email', { required: true })}
                  />
                  <Input
                    label="Senha"
                    type="password"
                    placeholder="••••••••"
                    icon={<Lock size={18} />}
                    {...register('password', { required: true })}
                  />
                </>
              ) : (
                <>
                  {step === 1 ? (
                    <>
                      <Input
                        label="Nome Completo"
                        placeholder="Bruce Wayne"
                        icon={<UserIcon size={18} />}
                        {...register('name', { required: true })}
                      />

                      <Input
                        label="CPF"
                        placeholder="000.000.000-00"
                        icon={<CreditCard size={18} />}
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
                      <Input
                        label="WhatsApp"
                        placeholder="(11) 99999-9999"
                        icon={<Phone size={18} />}
                        {...register('whatsapp', { required: true })}
                      />
                      <Input
                        label="E-mail"
                        type="email"
                        placeholder="heroi@email.com"
                        icon={<Mail size={18} />}
                        {...register('email', { required: true })}
                      />
                      <Input
                        label="Nascimento"
                        type="date"
                        icon={<Calendar size={18} />}
                        {...register('birthDate', { required: true })}
                      />
                      <Input
                        label="Senha"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        icon={<Lock size={18} />}
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
                        <label className="text-xs text-slate-500">Aceito os termos e condições de uso da BurgerHero.</label>
                      </div>
                    </>
                  )}
                </>
              )}

              {error && (
                <p className="text-red-500 text-sm font-semibold text-center bg-red-50 p-2 rounded-lg border border-red-100">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full rounded-full py-3" size="md" isLoading={loading}>
                {!isLogin && step === 1 ? 'Próximo Passo' : isLogin ? 'Entrar' : 'Finalizar Cadastro'}
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
              onClick={() => {
                setIsLogin(!isLogin);
                setStep(1);
                setError('');
              }}
              className="w-full text-center text-sm font-bold text-slate-600 hover:text-hero-primary transition-colors"
            >
              {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça Login'}
            </button>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
