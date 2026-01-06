import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CardTemplate {
  id: string;
  name: string;
  imageUrl: string;
}

export const CARD_TEMPLATES: CardTemplate[] = [
  { id: 'classic-blue', name: 'Clássico Azul', imageUrl: 'https://ik.imagekit.io/lflb43qwh/Heros/1.png' },
  { id: 'crimson-guard', name: 'Guardião', imageUrl: 'https://ik.imagekit.io/lflb43qwh/Heros/2.png' },
  { id: 'titan-gold', name: 'Titã Dourado', imageUrl: 'https://ik.imagekit.io/lflb43qwh/Heros/4.png' },
  { id: 'obsidian', name: 'Obsidiana', imageUrl: 'https://ik.imagekit.io/lflb43qwh/Heros/images.jpg' }, // Placeholder visual
  { id: 'neon-city', name: 'Neon City', imageUrl: 'https://picsum.photos/seed/neon/500/300' },
  { id: 'forest-ranger', name: 'Patrulheiro', imageUrl: 'https://picsum.photos/seed/forest/500/300' },
];

interface CardState {
  selectedTemplateId: string;
  setTemplateId: (id: string) => void;
  getSelectedTemplate: () => CardTemplate;
}

export const useCardStore = create<CardState>()(
  persist(
    (set, get) => ({
      selectedTemplateId: 'classic-blue',
      setTemplateId: (id) => set({ selectedTemplateId: id }),
      getSelectedTemplate: () => {
        const { selectedTemplateId } = get();
        return CARD_TEMPLATES.find(t => t.id === selectedTemplateId) || CARD_TEMPLATES[0];
      }
    }),
    { name: 'burger-hero-card-prefs' }
  )
);