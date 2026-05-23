import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ExtraTipo = 'receita' | 'despesa';

export interface Extra {
  id: string;
  valor: number;
  data: string; // yyyy-MM-dd
  observacoes: string | null;
  user_id: string;
  mes_key: string;
  tipo: ExtraTipo;
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
    tipo?: ExtraTipo;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilizador não autenticado');

      const tipo: ExtraTipo = extra.tipo || 'receita';

      const { data, error } = await supabase
        .from('extras')
        .insert({
          valor: extra.valor,
          data: extra.data,
          observacoes: extra.observacoes || null,
          user_id: user.id,
          mes_key: extra.mes_key,
          tipo,
        } as any)
        .select()
        .single();

      if (error) throw error;
      
      const newExtra = data as unknown as Extra;
      setExtras(prev => [...prev, newExtra]);
      const label = tipo === 'despesa' ? 'Despesa' : 'Valor extra';
      toast({ title: `${label} adicionado`, description: `€${extra.valor.toFixed(2)} registado.` });
      return newExtra;
    } catch (error: any) {
      toast({ title: 'Erro ao adicionar registo', description: error.message, variant: 'destructive' });
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
      toast({ title: 'Registo removido' });
    } catch (error: any) {
      toast({ title: 'Erro ao remover registo', description: error.message, variant: 'destructive' });
    }
  };

  const getExtrasForMonth = (monthKey: string): Extra[] => {
    return extras.filter(e => e.mes_key === monthKey);
  };

  const getExtrasForDate = (dateString: string): Extra[] => {
    return extras.filter(e => e.data === dateString);
  };

  /**
   * Net total for a month: receitas - despesas
   */
  const getExtrasNetForMonth = (monthKey: string): number => {
    return getExtrasForMonth(monthKey).reduce((sum, e) => {
      const v = Number(e.valor) || 0;
      return e.tipo === 'despesa' ? sum - v : sum + v;
    }, 0);
  };

  return { 
    extras, 
    loading, 
    addExtra, 
    deleteExtra, 
    getExtrasForMonth, 
    getExtrasForDate,
    getExtrasNetForMonth,
  };
};
