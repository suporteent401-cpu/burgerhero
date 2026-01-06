import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ShieldCheck, Utensils, Zap, Star, Instagram, Facebook, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardBody } from '../components/ui/Card';

const Landing: React.FC = () => {
  const benefits = [
    { icon: Utensils, title: 'Burger Mensal', desc: 'Todo mês um novo hambúrguer épico disponível para você resgatar na loja.' },
    { icon: Zap, title: 'Atendimento Flash', desc: 'Fila exclusiva para heróis em todas as nossas unidades parceiras.' },
    { icon: ShieldCheck, title: 'Proteção de Preço', desc: 'Assinantes nunca sofrem com reajustes sazonais de menu.' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col justify-center items-center text-center px-4 py-20 hero-gradient text-white overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 -mt-12"
        >
          <div className="inline-flex items-center gap-2 bg-hero-primary/20 border border-hero-primary/30 px-4 py-1.5 rounded-full mb-8">
            <Star size={16} className="text-hero-primary fill-hero-primary" />
            <span className="text-xs font-bold tracking-widest uppercase">Exclusividade Heroica</span>
          </div>
          <img 
            src="https://ik.imagekit.io/lflb43qwh/Heros/images.jpg" 
            alt="BurgerHero Logo" 
            className="w-32 h-32 rounded-full mx-auto mb-8 border-4 border-white shadow-lg" 
          />
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[1.1]">
            Torne-se um <span className="text-hero-primary">Herói</span> <br /> 
            e coma burgers todo mês
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 font-medium">
            A primeira assinatura de hambúrgueres premium do Brasil. Escolha seu plano, 
            garanta seu voucher mensal e receba benefícios dignos de um titã.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/plans">
              <Button size="lg" className="w-auto">Assinar Agora</Button>
            </Link>
            <Link to="/auth">
              <Button variant="danger" size="lg" className="w-auto">Já sou assinante</Button>
            </Link>
          </div>
        </motion.div>
        
        {/* Background Decor */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-hero-primary/20 blur-[120px] rounded-full -z-0"></div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-black mb-4">Poderes de Assinante</h2>
          <p className="text-slate-500 max-w-xl mx-auto mb-16">Ser um Herói assinante vai muito além do burger mensal. Veja seus privilégios:</p>
        </div>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
        >
          {benefits.map((item, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card className="h-full text-center hover:-translate-y-2 transition-transform duration-300">
                <CardBody className="p-10">
                  <div className="w-16 h-16 bg-hero-primary/10 text-hero-primary rounded-2xl flex items-center justify-center mb-6 mx-auto">
                    <item.icon size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h2 className="text-2xl font-black">Burger<span className="text-red-500">Hero</span></h2>
            <p className="text-slate-400 mt-2 text-sm">Alimentando a força de quem faz a diferença.</p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-6">
            <div className="flex gap-8 text-sm font-bold uppercase tracking-widest text-slate-400">
              <Link to="/auth" className="hover:text-white">Login</Link>
              <Link to="/plans" className="hover:text-white">Planos</Link>
              <Link to="/terms" className="hover:text-white">Termos</Link>
            </div>
            <div className="flex gap-6 text-slate-400">
              <a href="https://www.instagram.com/heroisburgerbrasilia" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <Instagram size={24} />
              </a>
              <a href="https://www.facebook.com/heroisburgerbrasilia" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <Facebook size={24} />
              </a>
              <a href="https://www.heroisburgerbsb.com.br/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <Globe size={24} />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/5 text-center text-xs text-slate-500">
          © 2024 BurgerHero S.A. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Landing;