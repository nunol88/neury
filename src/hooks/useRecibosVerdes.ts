import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Taxas Segurança Social 2026 - Prestação de Serviços
export const TAXA_SS = 0.214;           // 21,4%
export const BASE_INCIDENCIA = 0.70;    // 70% do rendimento
export const TAXA_EFETIVA = TAXA_SS * BASE_INCIDENCIA; // 14,98%

export interface RecibosVerdesClient {
  id: string;
  nome: string;
  telefone: string;
  morada: string;
  preco_hora: string;
  notas: string;
  recibo_verde: boolean;
}

export interface ClienteReciboVerde {
  id: string;
  nome: string;
  recibo_verde: boolean;
  valorFaturado: number;
  baseIncidencia: number;
  contribuicaoSS: number;
  valorLiquido: number;
  horasTrabalhadas: number;
}

export interface RecibosVerdesStats {
  totalClientes: number;
  totalFaturado: number;
  totalBaseIncidencia: number;
  totalContribuicaoSS: number;
  totalLiquido: number;
}

// Calculate SS contributions for a given amount
export const calcularContribuicaoSS = (valorFaturado: number) => {
  const baseIncidencia = valorFaturado * BASE_INCIDENCIA;
  const contribuicaoSS = baseIncidencia * TAXA_SS;
  const valorLiquido = valorFaturado - contribuicaoSS;
  return { baseIncidencia, contribuicaoSS, valorLiquido };
};

export const useRecibosVerdes = (selectedMonth: number, selectedYear: number) => {
  const [clients, setClients] = useState<RecibosVerdesClient[]>([]);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('nome', { ascending: true });

      if (clientsError) throw clientsError;

      // Fetch agendamentos for the selected period
      const startOfMonth = new Date(selectedYear, selectedMonth, 1);
      const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

      const { data: agendamentosData, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select('*')
        .gte('data_inicio', startOfMonth.toISOString())
        .lte('data_inicio', endOfMonth.toISOString())
        .eq('status', 'concluido');

      if (agendamentosError) throw agendamentosError;

      setClients((clientsData || []).map(row => ({
        id: row.id,
        nome: row.nome,
        telefone: row.telefone || '',
        morada: row.morada || '',
        preco_hora: row.preco_hora || '7',
        notas: row.notas || '',
        recibo_verde: row.recibo_verde || false
      })));

      setAgendamentos(agendamentosData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleReciboVerde = async (clientId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ recibo_verde: !currentValue })
        .eq('id', clientId);

      if (error) throw error;

      setClients(prev => prev.map(c => 
        c.id === clientId ? { ...c, recibo_verde: !currentValue } : c
      ));

      toast({
        title: !currentValue ? 'Cliente marcado como Recibo Verde' : 'Cliente removido de Recibos Verdes'
      });
    } catch (error: any) {
      console.error('Error toggling recibo verde:', error);
      toast({
        title: 'Erro ao atualizar cliente',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // Calculate amounts per client
  const clientesComValores = useMemo((): ClienteReciboVerde[] => {
    return clients.map(client => {
      // Find all completed agendamentos for this client
      const clientAgendamentos = agendamentos.filter(
        a => a.cliente_nome.toLowerCase() === client.nome.toLowerCase()
      );

      // Calculate total hours and amount
      let horasTrabalhadas = 0;
      clientAgendamentos.forEach(a => {
        const inicio = new Date(a.data_inicio);
        const fim = new Date(a.data_fim);
        const horas = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60);
        horasTrabalhadas += horas;
      });

      const precoHora = parseFloat(client.preco_hora) || 7;
      const valorFaturado = horasTrabalhadas * precoHora;
      const { baseIncidencia, contribuicaoSS, valorLiquido } = calcularContribuicaoSS(valorFaturado);

      return {
        id: client.id,
        nome: client.nome,
        recibo_verde: client.recibo_verde,
        valorFaturado,
        baseIncidencia,
        contribuicaoSS,
        valorLiquido,
        horasTrabalhadas
      };
    });
  }, [clients, agendamentos]);

  // Filter only recibo verde clients with values
  const clientesReciboVerde = useMemo(() => {
    return clientesComValores.filter(c => c.recibo_verde);
  }, [clientesComValores]);

  // Calculate totals for recibo verde clients
  const stats = useMemo((): RecibosVerdesStats => {
    const rvClients = clientesReciboVerde;
    return {
      totalClientes: rvClients.length,
      totalFaturado: rvClients.reduce((sum, c) => sum + c.valorFaturado, 0),
      totalBaseIncidencia: rvClients.reduce((sum, c) => sum + c.baseIncidencia, 0),
      totalContribuicaoSS: rvClients.reduce((sum, c) => sum + c.contribuicaoSS, 0),
      totalLiquido: rvClients.reduce((sum, c) => sum + c.valorLiquido, 0)
    };
  }, [clientesReciboVerde]);

  return {
    clients,
    clientesComValores,
    clientesReciboVerde,
    stats,
    loading,
    toggleReciboVerde,
    refetch: fetchData
  };
};
