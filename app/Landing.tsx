import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ShieldCheck, Zap, Star, Instagram, Facebook, Globe, Utensils } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardBody } from '../components/ui/Card';

const Landing: React.FC = () => {
  const benefits = [
    { icon: Utensils, title: 'Burger Mensal', desc: 'Todo mês um novo hambúrguer épico disponível para resgate.' },
    { icon: Zap, title: 'Atendimento Flash', desc: 'Fila exclusiva para heróis em todas as nossas unidades.' },
    { icon: ShieldCheck, title: 'Proteção de Preço', desc: 'Sem sustos. O valor da sua assinatura não muda com o cardápio.' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
      },
    },
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Simple Navbar */}
      <nav className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center max-w-6xl mx-auto w-full text-white">
        <div className="font-black text-xl tracking-tight">
          Burger<span className="text-hero-primary">Hero</span>
        </div>
        <div className="flex gap-4">
          <Link to="/auth" className="text-sm font-bold hover:text-hero-primary transition-colors">Login</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex flex-col justify-center items-center text-center px-4 pt-20 pb-12 hero-gradient text-white overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-hero-primary/20 border border-hero-primary/30 px-3 py-1 rounded-full mb-6 backdrop-blur-sm">
            <Star size={12} className="text-hero-primary fill-hero-primary" />
            <span className="text-[10px] font-bold tracking-widest uppercase">Clube de Assinatura</span>
          </div>
          
          <img 
            src="https://ik.imagekit.io/lflb43qwh/Heros/images.jpg" 
            alt="BurgerHero Logo" 
            className="w-24 h-24 rounded-full mx-auto mb-6 border-4 border-white/20 shadow-2xl" 
          />
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 leading-tight">
            Seja um <span className="text-hero-primary">Herói</span>. <br /> 
            Coma como um.
          </h1>
          
          <p className="text-base md:text-lg text-slate-300 max-w-xl mx-auto mb-8 font-medium leading-relaxed">
            Garanta seu burger mensal, descontos exclusivos e tratamento VIP em toda a rede BurgerHero.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link to="/plans" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-8 rounded-full">Ver Planos</Button>
            </Link>
            <Link to="/auth" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 rounded-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white hover:text-white">
                Área do Cliente
              </Button>
            </Link>
          </div>
        </motion.div>
        
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-hero-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
      </section>

      {/* Benefits - Compact Layout */}
      <section className="py-16 px-4 bg-white -mt-10 relative z-20">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {benefits.map((item, i) => (
              <motion.div key={i} variants={itemVariants}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 border border-slate-100">
                  <CardBody className="p-5 flex flex-col items-center text-center h-full">
                    <div className="w-10 h-10 bg-hero-primary/10 text-hero-primary rounded-xl flex items-center justify-center mb-3">
                      <item.icon size={20} />
                    </div>
                    <h3 className="text-base font-bold mb-2 text-slate-800">{item.title}</h3>
                    <p className="text-sm text-slate-500 leading-snug">{item.desc}</p>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 text-slate-600 py-10 px-6 border-t border-slate-100 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-lg font-black text-slate-800">Burger<span className="text-hero-primary">Hero</span></h2>
            <p className="text-xs text-slate-400 mt-1">© 2024 BurgerHero S.A.</p>
          </div>
          
          <div className="flex gap-6 text-slate-400">
            <a href="https://www.instagram.com/heroisburgerbrasilia" target="_blank" rel="noopener noreferrer" className="hover:text-hero-primary transition-colors">
              <Instagram size={20} />
            </a>
            <a href="https://www.facebook.com/heroisburgerbrasilia" target="_blank" rel="noopener noreferrer" className="hover:text-hero-primary transition-colors">
              <Facebook size={20} />
            </a>
            <a href="https://www.heroisburgerbsb.com.br/" target="_blank" rel="noopener noreferrer" className="hover:text-hero-primary transition-colors">
              <Globe size={20} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;