import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HeroTheme } from '../types';

interface ThemeState {
  mode: 'system' | 'light' | 'dark';
  heroTheme: HeroTheme;
  setMode: (mode: 'system' | 'light' | 'dark') => void;
  setHeroTheme: (theme: HeroTheme) => void;
  applyTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      heroTheme: 'sombra-noturna',
      setMode: (mode) => {
        set({ mode });
        get().applyTheme();
      },
      setHeroTheme: (heroTheme) => {
        set({ heroTheme });
        get().applyTheme();
      },
      applyTheme: () => {
        const { mode, heroTheme } = get();
        const root = window.document.documentElement;
        
        // Remove old theme classes
        const themeClasses = [
          'theme-sombra-noturna',
          'theme-guardiao-escarlate',
          'theme-tita-dourado',
          'theme-tempestade-azul',
          'theme-sentinela-verde',
          'theme-aurora-rosa',
          'theme-vermelho-heroi',
          'theme-verde-neon',
          'theme-laranja-vulcanico',
          'theme-azul-eletrico'
        ];
        root.classList.remove(...themeClasses);
        root.classList.add(`theme-${heroTheme}`);

        if (mode === 'dark') {
          root.classList.add('dark');
        } else if (mode === 'light') {
          root.classList.remove('dark');
        } else {
          const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          root.classList.toggle('dark', systemDark);
        }
      },
    }),
    { name: 'burger-hero-theme' }
  )
);