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
import { getFullUserProfile, checkCpfExists } from '../services/users.service';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async (data: any) => {
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // --- FLUXO DE LOGIN ---
        const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (authError) throw new Error(authError.message === 'Invalid login credentials' ? 'Credenciais inválidas.' : authError.message);
        
        if (!signInData.session) {
            throw new Error("Não foi possível iniciar a sessão.");
        }

        // O SupabaseAuthProvider vai detectar a mudança de sessão e carregar o perfil.
        // Mas podemos forçar uma verificação aqui para feedback visual mais rápido se necessário,
        // ou apenas deixar o Provider lidar com isso. Vamos deixar o Provider lidar, 
        // mas carregar o perfil aqui garante que temos os dados antes de redirecionar manualmente.
        
        const fullProfile = await getFullUserProfile(signInData.session.user);
        if (fullProfile) {
          login(fullProfile);
          redirectByRole(fullProfile.role);
        } else {
          // Se falhar aqui, o AuthProvider tenta o fallback
          navigate('/app');
        }

      } else {
        // --- FLUXO DE CADASTRO ---
        
        // Passo 1: Validação Inicial (CPF)
        if (step === 1) {
          // Normaliza e verifica CPF no banco
          const cpfExists = await checkCpfExists(data.cpf);
          if (cpfExists) {
            throw new Error('Este CPF já está cadastrado em nossa base.');
          }
          setStep1Data(data);
          setStep(2);
          setLoading(false);
          return;
        }
        
        // Passo 2: Finalização
        const fullUserData = { ...step1Data, ...data };
        
        // 1. Criar usuário no Auth com Metadados
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: fullUserData.email,
            password: fullUserData.password,
            options: {
              data: {
                full_name: fullUserData.name,
                // Podemos passar outros dados se tivermos triggers configurados para ler raw_user_meta_data
              }
            }
        });

        if (signUpError) throw signUpError;
        
        // Verifica se o login foi automático (email confirmation OFF) ou pendente (ON)
        if (signUpData.user && !signUpData.session) {
            setLoading(false);
            alert("Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta antes de entrar.");
            setIsLogin(true);
            return;
        }

        if (!signUpData.session) {
             throw new Error('Erro ao estabelecer sessão após cadastro.');
        }

        // 2. Chamar RPC para garantir a criação das tabelas relacionais (app_users, client_profiles)
        // Isso é crucial para salvar o CPF e Nascimento que coletamos no formulário
        const { data: rpcData, error: rpcError } = await supabase.rpc('ensure_user_profile', {
            p_display_name: fullUserData.name,
            p_email: fullUserData.email,
            p_cpf: fullUserData.cpf,
            p_birthdate: fullUserData.birthDate || null
        });

        if (rpcError) {
            console.error("Erro na RPC ensure_user_profile:", rpcError);
            // Não bloqueamos totalmente se a RPC falhar, pois o usuário já está criado no Auth,
            // mas mostramos erro. O AuthProvider tentará corrigir depois.
        } else {
             // Se RPC retornou erro de lógica (ex: CPF duplicado que passou na validação inicial)
             const result = Array.isArray(rpcData) ? rpcData[0] : rpcData;
             if (result && !result.ok) {
                console.warn("Aviso do Banco de Dados:", result.message);
             }
        }

        // 3. Carregar perfil completo e redirecionar
        const fullProfile = await getFullUserProfile(signUpData.session.user);
        
        if (fullProfile) {
            login(fullProfile);
            // Atualiza whatsapp se necessário (não estava na RPC original)
            // Se tivermos uma tabela para isso ou coluna no profile
        }

        navigate('/plans');
      }
    } catch (err: any) {
      console.error("AUTH_ERROR", err);
      setError(`Erro: ${err.message || 'Ocorreu um erro inesperado.'}`);
    } finally {
      setLoading(false);
    }
  };

  const redirectByRole = (role: string) => {
    if (role === 'ADMIN') navigate('/admin');
    else if (role === 'STAFF') navigate('/staff/validate');
    else navigate('/app');
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
            Burger<span className="text-hero-primary">Hero</span>
          </h1>
          <p className="text-slate-400 font-medium">
            {isLogin ? 'Bem-vindo de volta, Herói!' : 'Crie sua identidade secreta'}
          </p>
        </div>

        <Card>
          <CardBody className="p-8 space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {isLogin ? (
                <>
                  <Input label="E-mail" placeholder="heroi@email.com" icon={<Mail size={18}/>} {...register('email', { required: true })} />
                  <Input label="Senha" type="password" placeholder="••••••••" icon={<Lock size={18}/>} {...register('password', { required: true })} />
                </>
              ) : (
                <>
                  {step === 1 ? (
                    <>
                      <Input label="Nome Completo" placeholder="Bruce Wayne" icon={<UserIcon size={18}/>} {...register('name', { required: true })} />
                      <Input label="CPF" placeholder="000.000.000-00" icon={<CreditCard size={18}/>} {...register('cpf', { required: true, minLength: 11 })} />
                      {errors.cpf && <p className="text-red-500 text-xs">CPF é obrigatório.</p>}
                    </>
                  ) : (
                    <>
                      <Input label="WhatsApp" placeholder="(11) 99999-9999" icon={<Phone size={18}/>} {...register('whatsapp', { required: true })} />
                      <Input label="E-mail" type="email" placeholder="heroi@email.com" icon={<Mail size={18}/>} {...register('email', { required: true })} />
                      <Input label="Nascimento" type="date" icon={<Calendar size={18}/>} {...register('birthDate', { required: true })} />
                      <Input label="Senha" type="password" placeholder="Mínimo 6 caracteres" icon={<Lock size={18}/>} {...register('password', { required: true, minLength: 6 })} />
                      {errors.password && <p className="text-red-500 text-xs -mt-2 ml-1">A senha deve ter no mínimo 6 caracteres.</p>}
                      <Input label="Confirmar Senha" type="password" placeholder="Repita a senha" icon={<Lock size={18}/>} {...register('confirmPassword', { required: true, validate: value => value === password || "As senhas não coincidem" })} />
                      {errors.confirmPassword && <p className="text-red-500 text-xs -mt-2 ml-1">{(errors.confirmPassword as any).message}</p>}
                      <div className="flex items-start gap-2 pt-2">
                        <input type="checkbox" className="mt-1" {...register('terms', { required: true })} />
                        <label className="text-xs text-slate-500">Aceito os termos e condições de uso da BurgerHero.</label>
                      </div>
                    </>
                  )}
                </>
              )}

              {error && <p className="text-red-500 text-sm font-semibold text-center bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>}

              <Button type="submit" className="w-full rounded-full py-3" size="md" isLoading={loading}>
                {!isLogin && step === 1 ? 'Próximo Passo' : (isLogin ? 'Entrar' : 'Finalizar Cadastro')}
              </Button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Ou</span></div>
            </div>

            <button onClick={() => { setIsLogin(!isLogin); setStep(1); setError(''); }} className="w-full text-center text-sm font-bold text-slate-600 hover:text-hero-primary transition-colors">
              {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça Login'}
            </button>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;