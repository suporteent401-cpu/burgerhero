import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HeroTheme } from '../types';

export type FontSize = 'small' | 'medium' | 'large';

interface ThemeState {
  mode: 'system' | 'light' | 'dark';
  heroTheme: HeroTheme;
  appFontSize: FontSize;
  setMode: (mode: 'system' | 'light' | 'dark') => void;
  setHeroTheme: (theme: HeroTheme) => void;
  setAppFontSize: (size: FontSize) => void;
  applyTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      heroTheme: 'sombra-noturna',
      appFontSize: 'medium',
      setMode: (mode) => {
        set({ mode });
        get().applyTheme();
      },
      setHeroTheme: (heroTheme) => {
        set({ heroTheme });
        get().applyTheme();
      },
      setAppFontSize: (appFontSize) => {
        set({ appFontSize });
        get().applyTheme();
      },
      applyTheme: () => {
        const { mode, heroTheme, appFontSize } = get();
        const root = window.document.documentElement;
        
        // Aplicação do Tema de Cor
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
          'theme-azul-eletrico',
          'theme-preto-absoluto'
        ];
        root.classList.remove(...themeClasses);
        root.classList.add(`theme-${heroTheme}`);

        // Aplicação do Modo (Claro/Escuro)
        if (mode === 'dark') {
          root.classList.add('dark');
        } else if (mode === 'light') {
          root.classList.remove('dark');
        } else {
          const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          root.classList.toggle('dark', systemDark);
        }

        // Aplicação do Tamanho da Fonte
        const sizeMap = {
          small: '0.9rem',
          medium: '1rem',
          large: '1.1rem'
        };
        root.style.setProperty('--app-font-size', sizeMap[appFontSize] || '1rem');
      },
    }),
    { name: 'burger-hero-theme' }
  )
);