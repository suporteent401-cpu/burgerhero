import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CardTemplate {
  id: string;
  imageUrl: string;
}

export const CARD_TEMPLATES: CardTemplate[] = [
  { id: 'hero-1', imageUrl: 'https://ik.imagekit.io/lflb43qwh/Heros/1.png?v=2' },
  { id: 'hero-2', imageUrl: 'https://ik.imagekit.io/lflb43qwh/Heros/2.png?v=2' },
  { id: 'hero-3', imageUrl: 'https://ik.imagekit.io/lflb43qwh/Heros/3.png?v=2' },
  { id: 'hero-4', imageUrl: 'https://ik.imagekit.io/lflb43qwh/Heros/4.png?v=2' },
  { id: 'hero-5', imageUrl: 'https://ik.imagekit.io/lflb43qwh/Heros/5.png?v=2' },
  { id: 'hero-6', imageUrl: 'https://ik.imagekit.io/lflb43qwh/Heros/6.png?v=2' },
  { id: 'hero-7', imageUrl: 'https://ik.imagekit.io/lflb43qwh/Heros/7.png?v=2' },
];

export const FONT_OPTIONS = [
  { name: 'Padrão', value: 'Inter, sans-serif' },
  { name: 'Épico', value: '"Cinzel", serif' },
  { name: 'Elegante', value: '"Playfair Display", serif' },
  { name: 'Técnico', value: '"Roboto Mono", monospace' },
  { name: 'Manual', value: '"Permanent Marker", cursive' },
];

export const COLOR_OPTIONS = [
  // Clássicos
  { name: 'Branco', value: '#FFFFFF', type: 'classic' },
  { name: 'Preto', value: '#000000', type: 'classic' },
  { name: 'Azul Marinho', value: '#000080', type: 'classic' },
  { name: 'Vermelho Sangue', value: '#8a0303', type: 'classic' },
  // Metálicos
  { name: 'Ouro', value: '#FFD700', type: 'metallic' }, 
  { name: 'Prata', value: '#C0C0C0', type: 'metallic' },
  { name: 'Cobre', value: '#B87333', type: 'metallic' },
  // Vibrantes
  { name: 'Ciano Neon', value: '#00FFFF', type: 'vibrant' },
  { name: 'Magenta', value: '#FF00FF', type: 'vibrant' },
  { name: 'Verde Lima', value: '#39FF14', type: 'vibrant' },
  { name: 'Laranja', value: '#FF4500', type: 'vibrant' },
];

interface CardState {
  selectedTemplateId: string;
  selectedFont: string;
  selectedColor: string;
  setTemplateId: (id: string) => void;
  setFont: (font: string) => void;
  setColor: (color: string) => void;
  getSelectedTemplate: () => CardTemplate;
}

export const useCardStore = create<CardState>()(
  persist(
    (set, get) => ({
      selectedTemplateId: 'hero-1',
      selectedFont: 'Inter, sans-serif',
      selectedColor: '#FFFFFF',
      setTemplateId: (id) => set({ selectedTemplateId: id }),
      setFont: (font) => set({ selectedFont: font }),
      setColor: (color) => set({ selectedColor: color }),
      getSelectedTemplate: () => {
        const { selectedTemplateId } = get();
        return CARD_TEMPLATES.find(t => t.id === selectedTemplateId) || CARD_TEMPLATES[0];
      }
    }),
    { name: 'burger-hero-card-prefs-v4' }
  )
);