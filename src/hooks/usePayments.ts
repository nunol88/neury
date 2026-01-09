import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentRecord {
  id: string;
  date: string;
  client: string;
  startTime: string;
  endTime: string;
  price: string;
  pago: boolean;
  dataPagamento: string | null;
}

interface ClientPaymentSummary {
  clientName: string;
  services: PaymentRecord[];
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
}

interface PaymentSummary {
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
}

export const usePayments = (month?: number, year?: number) => {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('agendamentos')
        .select('*')
        .eq('status', 'concluido')
        .order('data_inicio', { ascending: false });

      // Filter by month/year if provided
      if (month !== undefined && year !== undefined) {
        const startDate = new Date(Date.UTC(year, month, 1));
        const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));
        query = query
          .gte('data_inicio', startDate.toISOString())
          .lte('data_inicio', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const mapped: PaymentRecord[] = (data || []).map(row => {
        const startDate = new Date(row.data_inicio);
        const endDate = new Date(row.data_fim);
        
        const dateStr = `${startDate.getUTCFullYear()}-${String(startDate.getUTCMonth() + 1).padStart(2, '0')}-${String(startDate.getUTCDate()).padStart(2, '0')}`;
        const startTime = `${String(startDate.getUTCHours()).padStart(2, '0')}:${String(startDate.getUTCMinutes()).padStart(2, '0')}`;
        const endTime = `${String(endDate.getUTCHours()).padStart(2, '0')}:${String(endDate.getUTCMinutes()).padStart(2, '0')}`;

        // Parse price from descricao
        let price = '0';
        if (row.descricao) {
          try {
            const parsed = JSON.parse(row.descricao);
            price = parsed.price || '0';
          } catch {
            price = '0';
          }
        }

        return {
          id: row.id,
          date: dateStr,
          client: row.cliente_nome,
          startTime,
          endTime,
          price,
          pago: row.pago ?? false,
          dataPagamento: row.data_pagamento || null
        };
      });

      setRecords(mapped);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Erro ao carregar pagamentos',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [month, year, toast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const markAsPaid = async (id: string): Promise<boolean> => {
    // Optimistic update
    setRecords(prev => prev.map(r => 
      r.id === id ? { ...r, pago: true, dataPagamento: new Date().toISOString() } : r
    ));

    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ 
          pago: true, 
          data_pagamento: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Pagamento registado',
        description: 'Serviço marcado como pago'
      });

      return true;
    } catch (error: any) {
      // Revert
      await fetchPayments();
      toast({
        title: 'Erro ao marcar pagamento',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  const markAsUnpaid = async (id: string): Promise<boolean> => {
    // Optimistic update
    setRecords(prev => prev.map(r => 
      r.id === id ? { ...r, pago: false, dataPagamento: null } : r
    ));

    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ 
          pago: false, 
          data_pagamento: null 
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Pagamento revertido',
        description: 'Serviço marcado como não pago'
      });

      return true;
    } catch (error: any) {
      await fetchPayments();
      toast({
        title: 'Erro ao reverter pagamento',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  const markMultipleAsPaid = async (ids: string[]): Promise<boolean> => {
    // Optimistic update
    const now = new Date().toISOString();
    setRecords(prev => prev.map(r => 
      ids.includes(r.id) ? { ...r, pago: true, dataPagamento: now } : r
    ));

    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ 
          pago: true, 
          data_pagamento: now 
        })
        .in('id', ids);

      if (error) throw error;

      toast({
        title: 'Pagamentos registados',
        description: `${ids.length} serviços marcados como pagos`
      });

      return true;
    } catch (error: any) {
      await fetchPayments();
      toast({
        title: 'Erro ao marcar pagamentos',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  const summary: PaymentSummary = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;

    records.forEach(r => {
      const price = parseFloat(r.price) || 0;
      totalInvoiced += price;
      if (r.pago) {
        totalPaid += price;
      }
    });

    return {
      totalInvoiced,
      totalPaid,
      totalPending: totalInvoiced - totalPaid
    };
  }, [records]);

  const clientSummaries: ClientPaymentSummary[] = useMemo(() => {
    const grouped: Record<string, PaymentRecord[]> = {};

    records.forEach(r => {
      if (!grouped[r.client]) {
        grouped[r.client] = [];
      }
      grouped[r.client].push(r);
    });

    return Object.entries(grouped)
      .map(([clientName, services]) => {
        let totalInvoiced = 0;
        let totalPaid = 0;

        services.forEach(s => {
          const price = parseFloat(s.price) || 0;
          totalInvoiced += price;
          if (s.pago) {
            totalPaid += price;
          }
        });

        return {
          clientName,
          services: services.sort((a, b) => a.date.localeCompare(b.date)),
          totalInvoiced,
          totalPaid,
          totalPending: totalInvoiced - totalPaid
        };
      })
      .filter(c => c.totalPending > 0 || c.services.some(s => !s.pago))
      .sort((a, b) => b.totalPending - a.totalPending);
  }, [records]);

  return {
    records,
    loading,
    summary,
    clientSummaries,
    markAsPaid,
    markAsUnpaid,
    markMultipleAsPaid,
    refetch: fetchPayments
  };
};
