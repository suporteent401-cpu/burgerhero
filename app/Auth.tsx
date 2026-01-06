import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import { Mail, Lock, User as UserIcon, Calendar, Phone, CreditCard } from 'lucide-react';
import { fakeApi } from '../lib/fakeApi';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const user = await fakeApi.authLogin(data.email, data.password);
        login(user);
        redirectByRole(user.role);
      } else {
        if (step === 1) {
          setStep(2);
          setLoading(false);
          return;
        }
        const user = await fakeApi.authRegister(data);
        login(user);
        navigate('/plans');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro.');
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
                  <Input 
                    label="E-mail" 
                    placeholder="heroi@email.com" 
                    icon={<Mail size={18}/>}
                    {...register('email', { required: true })}
                  />
                  <Input 
                    label="Senha" 
                    type="password" 
                    placeholder="••••••••" 
                    icon={<Lock size={18}/>}
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
                        icon={<UserIcon size={18}/>}
                        {...register('name', { required: true })}
                      />
                      <Input 
                        label="CPF" 
                        placeholder="000.000.000-00" 
                        icon={<CreditCard size={18}/>}
                        {...register('cpf', { required: true })}
                      />
                    </>
                  ) : (
                    <>
                      <Input 
                        label="WhatsApp" 
                        placeholder="(11) 99999-9999" 
                        icon={<Phone size={18}/>}
                        {...register('whatsapp', { required: true })}
                      />
                      <Input 
                        label="E-mail" 
                        type="email"
                        placeholder="heroi@email.com" 
                        icon={<Mail size={18}/>}
                        {...register('email', { required: true })}
                      />
                      <Input 
                        label="Nascimento" 
                        type="date"
                        icon={<Calendar size={18}/>}
                        {...register('birthDate', { required: true })}
                      />
                      <div className="flex items-start gap-2 pt-2">
                        <input type="checkbox" className="mt-1" {...register('terms', { required: true })} />
                        <label className="text-xs text-slate-500">Aceito os termos e condições de uso da BurgerHero.</label>
                      </div>
                    </>
                  )}
                </>
              )}

              {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}

              <Button 
                type="submit" 
                className="w-full rounded-full py-3" 
                size="md"
                isLoading={loading}
              >
                {!isLogin && step === 1 ? 'Próximo Passo' : (isLogin ? 'Entrar' : 'Finalizar Cadastro')}
              </Button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Ou</span></div>
            </div>

            <button 
              onClick={() => { setIsLogin(!isLogin); setStep(1); setError(''); }}
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