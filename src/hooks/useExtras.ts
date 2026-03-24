import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Extra {
  id: string;
  valor: number;
  data: string; // yyyy-MM-dd
  observacoes: string | null;
  user_id: string;
  mes_key: string;
  created_at: string;
}

export const useExtras = () => {
  const [extras, setExtras] = useState<Extra[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchExtras = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('extras')
        .select('*')
        .order('data', { ascending: true });

      if (error) throw error;
      setExtras((data as unknown as Extra[]) || []);
    } catch (error: any) {
      console.error('Error fetching extras:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExtras();
  }, [fetchExtras]);

  const addExtra = async (extra: {
    valor: number;
    data: string;
    observacoes: string;
    mes_key: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilizador não autenticado');

      const { data, error } = await supabase
        .from('extras')
        .insert({
          valor: extra.valor,
          data: extra.data,
          observacoes: extra.observacoes || null,
          user_id: user.id,
          mes_key: extra.mes_key,
        } as any)
        .select()
        .single();

      if (error) throw error;
      
      const newExtra = data as unknown as Extra;
      setExtras(prev => [...prev, newExtra]);
      toast({ title: 'Valor extra adicionado', description: `€${extra.valor.toFixed(2)} adicionado com sucesso.` });
      return newExtra;
    } catch (error: any) {
      toast({ title: 'Erro ao adicionar extra', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const deleteExtra = async (id: string) => {
    try {
      const { error } = await supabase
        .from('extras')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setExtras(prev => prev.filter(e => e.id !== id));
      toast({ title: 'Valor extra removido' });
    } catch (error: any) {
      toast({ title: 'Erro ao remover extra', description: error.message, variant: 'destructive' });
    }
  };

  const getExtrasForMonth = (monthKey: string): Extra[] => {
    return extras.filter(e => e.mes_key === monthKey);
  };

  const getExtrasForDate = (dateString: string): Extra[] => {
    return extras.filter(e => e.data === dateString);
  };

  return { extras, loading, addExtra, deleteExtra, getExtrasForMonth, getExtrasForDate };
};
