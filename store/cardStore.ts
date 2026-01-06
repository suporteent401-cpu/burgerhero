import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CardTemplate {
  id: string;
  imageUrl: string;
}

export const CARD_TEMPLATES: CardTemplate[] = [
  { id: 'hero-1', imageUrl: 'https://ik.imagekit.io/lflb43qwh/Heros/1.png' },
  { id: 'hero-2', imageUrl: 'https://ik.imagekit.io/lflb43qwh/Heros/2.png' },
  { id: 'hero-3', imageUrl: 'https://ik.imagekit.io/lflb43qwh/Heros/3.png' },
  { id: 'hero-4', imageUrl: 'https://ik.imagekit.io/lflb43qwh/Heros/4.png' },
  { id: 'hero-5', imageUrl: 'https://ik.imagekit.io/lflb43qwh/Heros/5.png' },
  { id: 'hero-6', imageUrl: 'https://ik.imagekit.io/lflb43qwh/Heros/6.png' },
  { id: 'hero-7', imageUrl: 'https://ik.imagekit.io/lflb43qwh/Heros/7.png' },
];

interface CardState {
  selectedTemplateId: string;
  setTemplateId: (id: string) => void;
  getSelectedTemplate: () => CardTemplate;
}

export const useCardStore = create<CardState>()(
  persist(
    (set, get) => ({
      selectedTemplateId: 'hero-1',
      setTemplateId: (id) => set({ selectedTemplateId: id }),
      getSelectedTemplate: () => {
        const { selectedTemplateId } = get();
        return CARD_TEMPLATES.find(t => t.id === selectedTemplateId) || CARD_TEMPLATES[0];
      }
    }),
    { name: 'burger-hero-card-prefs-v2' }
  )
);