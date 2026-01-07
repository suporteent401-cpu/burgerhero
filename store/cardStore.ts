import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CardTemplate {
  id: string;
  imageUrl: string;
  name?: string;
}

// Fallback inicial para não quebrar UI antes do fetch
export const INITIAL_TEMPLATES: CardTemplate[] = [
  { id: 'hero-1', imageUrl: 'https://ik.imagekit.io/lflb43qwh/Heros/1.png?v=2', name: 'Clássico' }
];

export const FONT_OPTIONS = [
  { name: 'Padrão', value: 'Inter, sans-serif' },
  { name: 'Épico', value: '"Cinzel", serif' },
  { name: 'Elegante', value: '"Playfair Display", serif' },
  { name: 'Técnico', value: '"Roboto Mono", monospace' },
  { name: 'Manual', value: '"Permanent Marker", cursive' },
];

export const COLOR_OPTIONS = [
  { name: 'Branco', value: '#FFFFFF', type: 'classic' },
  { name: 'Preto', value: '#000000', type: 'classic' },
  { name: 'Azul Marinho', value: '#000080', type: 'classic' },
  { name: 'Vermelho Sangue', value: '#8a0303', type: 'classic' },
  { name: 'Ouro', value: '#FFD700', type: 'metallic' }, 
  { name: 'Prata', value: '#C0C0C0', type: 'metallic' },
  { name: 'Cobre', value: '#B87333', type: 'metallic' },
  { name: 'Ciano Neon', value: '#00FFFF', type: 'vibrant' },
  { name: 'Magenta', value: '#FF00FF', type: 'vibrant' },
  { name: 'Verde Lima', value: '#39FF14', type: 'vibrant' },
  { name: 'Laranja', value: '#FF4500', type: 'vibrant' },
  { name: 'Vermelho Herói', value: '#FF0004', type: 'vibrant' },
  { name: 'Verde Neon', value: '#08FF01', type: 'vibrant' },
  { name: 'Laranja Vulcânico', value: '#FF4F02', type: 'vibrant' },
  { name: 'Azul Elétrico', value: '#0300FF', type: 'vibrant' },
];

interface CardState {
  availableTemplates: CardTemplate[];
  selectedTemplateId: string;
  selectedFont: string;
  selectedColor: string;
  selectedFontSize: number;
  
  setTemplates: (templates: CardTemplate[]) => void;
  setTemplateId: (id: string) => void;
  setFont: (font: string) => void;
  setColor: (color: string) => void;
  setFontSize: (size: number) => void;
  setAll: (data: Partial<{ templateId: string, font: string, color: string, fontSize: number }>) => void;
  getSelectedTemplate: () => CardTemplate;
}

export const useCardStore = create<CardState>()(
  persist(
    (set, get) => ({
      availableTemplates: INITIAL_TEMPLATES,
      selectedTemplateId: '', // Vazio inicia buscando o primeiro disponível
      selectedFont: 'Inter, sans-serif',
      selectedColor: '#FFFFFF',
      selectedFontSize: 22,
      
      setTemplates: (templates) => set({ availableTemplates: templates }),
      setTemplateId: (id) => set({ selectedTemplateId: id }),
      setFont: (font) => set({ selectedFont: font }),
      setColor: (color) => set({ selectedColor: color }),
      setFontSize: (size) => set({ selectedFontSize: size }),
      
      setAll: (data) => set((state) => ({
        selectedTemplateId: data.templateId ?? state.selectedTemplateId,
        selectedFont: data.font ?? state.selectedFont,
        selectedColor: data.color ?? state.selectedColor,
        selectedFontSize: data.fontSize ?? state.selectedFontSize,
      })),
      
      getSelectedTemplate: () => {
        const { availableTemplates, selectedTemplateId } = get();
        // Tenta achar pelo ID selecionado
        const found = availableTemplates.find(t => t.id === selectedTemplateId);
        // Se não achar, retorna o primeiro da lista
        return found || availableTemplates[0] || INITIAL_TEMPLATES[0];
      }
    }),
    { 
      name: 'burger-hero-card-prefs-v6',
      partialize: (state) => ({ 
        // Não persistir a lista de templates (carregar sempre atualizada)
        selectedTemplateId: state.selectedTemplateId,
        selectedFont: state.selectedFont,
        selectedColor: state.selectedColor,
        selectedFontSize: state.selectedFontSize
      })
    }
  )
);