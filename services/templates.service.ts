import { supabase } from '../lib/supabaseClient';

export interface CardTemplateDB {
  id: string;
  name: string;
  preview_url: string;
  is_active: boolean;
  created_at?: string;
}

export const templatesService = {
  // Client: Lista apenas ativos
  async getActiveTemplates(): Promise<CardTemplateDB[]> {
    const { data, error } = await supabase
      .from('hero_card_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar templates ativos:', error);
      return [];
    }
    return data || [];
  },

  // Admin: Lista todos
  async getAllTemplates(): Promise<CardTemplateDB[]> {
    const { data, error } = await supabase
      .from('hero_card_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Admin: Toggle status
  async toggleTemplateStatus(id: string, currentStatus: boolean): Promise<void> {
    const { error } = await supabase
      .from('hero_card_templates')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) throw error;
  },

  // Admin: Upload de imagem
  async uploadTemplateImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `tpl-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('card-templates')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('card-templates')
      .getPublicUrl(fileName);
      
    return data.publicUrl;
  },

  // Admin: Criar novo
  async createTemplate(name: string, preview_url: string): Promise<CardTemplateDB | null> {
    const { data, error } = await supabase
      .from('hero_card_templates')
      .insert({ name, preview_url, is_active: true })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Helper para converter formato do DB para o formato do Store (se necessário)
  mapToStoreFormat(dbTemplates: CardTemplateDB[]) {
    return dbTemplates.map(t => ({
      id: t.id,
      imageUrl: t.preview_url,
      name: t.name
    }));
  }
};