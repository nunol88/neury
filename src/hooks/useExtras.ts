import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { generateMonthsConfig, getMonthKeyFromDate } from '@/utils/monthConfig';

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

const MONTHS_CONFIG = generateMonthsConfig();

/** Validates value/date and derives mes_key from the date (never from the active tab). */
export function validateExtraInput(valor: number, data: string): { valor: number; mesKey: string } {
  const v = Number(valor);
  if (!Number.isFinite(v) || v <= 0) throw new Error('Valor inválido: tem de ser um número positivo');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) throw new Error('Data inválida');
  const d = new Date(data + 'T00:00:00');
  if (isNaN(d.getTime()) || format(d, 'yyyy-MM-dd') !== data) throw new Error('Data inválida');
  const mesKey = getMonthKeyFromDate(data, MONTHS_CONFIG);
  if (!mesKey) throw new Error('A data escolhida não pertence a nenhum mês suportado pela agenda');
  return { valor: Math.round(v * 100) / 100, mesKey };
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
    /** @deprecated ignored — mes_key is always derived from `data` */
    mes_key?: string;
    tipo?: ExtraTipo;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilizador não autenticado');

      const tipo: ExtraTipo = extra.tipo || 'receita';
      const { valor, mesKey } = validateExtraInput(extra.valor, extra.data);

      const { data, error } = await supabase
        .from('extras')
        .insert({
          valor,
          data: extra.data,
          observacoes: extra.observacoes || null,
          user_id: user.id,
          mes_key: mesKey,
          tipo,
        } as any)
        .select()
        .single();

      if (error) throw error;
      
      const newExtra = data as unknown as Extra;
      setExtras(prev => [...prev, newExtra]);
      const label = tipo === 'despesa' ? 'Despesa' : 'Valor extra';
      toast({ title: `${label} adicionado`, description: `€${valor.toFixed(2)} registado.` });
      return newExtra;
    } catch (error: any) {
      toast({ title: 'Erro ao adicionar registo', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  /** Updates an existing extra in place (same id). Never touches user_id/created_at. */
  const updateExtra = async (id: string, changes: {
    valor: number;
    data: string;
    observacoes: string;
    tipo: ExtraTipo;
  }) => {
    try {
      const { valor, mesKey } = validateExtraInput(changes.valor, changes.data);
      const { data, error } = await supabase
        .from('extras')
        .update({
          valor,
          data: changes.data,
          observacoes: changes.observacoes || null,
          mes_key: mesKey,
          tipo: changes.tipo,
        } as any)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Registo não encontrado ou sem permissão para editar');

      const updated = data as unknown as Extra;
      setExtras(prev => prev.map(e => (e.id === id ? updated : e)));
      toast({ title: 'Registo atualizado', description: `€${valor.toFixed(2)} guardado.` });
      return updated;
    } catch (error: any) {
      toast({ title: 'Erro ao guardar alterações', description: error.message, variant: 'destructive' });
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
    updateExtra,
    deleteExtra, 
    getExtrasForMonth, 
    getExtrasForDate,
    getExtrasNetForMonth,
  };
};
