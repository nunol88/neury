import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OverdueSummary {
  count: number;
  totalAmount: number;
  loading: boolean;
}

/**
 * Returns the number of completed services that haven't been paid yet,
 * with a small grace period (default: 7 days after the service date).
 */
export const useOverduePayments = (graceDays = 7): OverdueSummary => {
  const [count, setCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchOverdue = async () => {
      try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - graceDays);

        const { data, error } = await supabase
          .from('agendamentos')
          .select('id, descricao, data_fim')
          .eq('status', 'concluido')
          .eq('pago', false)
          .lt('data_fim', cutoff.toISOString());

        if (error) throw error;
        if (cancelled) return;

        let amount = 0;
        (data || []).forEach((row: any) => {
          if (row.descricao) {
            try {
              const parsed = JSON.parse(row.descricao);
              amount += parseFloat(parsed.price) || 0;
            } catch { /* ignore */ }
          }
        });

        setCount((data || []).length);
        setTotalAmount(amount);
      } catch {
        if (!cancelled) {
          setCount(0);
          setTotalAmount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOverdue();

    // Refresh every 5 min and on focus
    const interval = setInterval(fetchOverdue, 5 * 60 * 1000);
    const onFocus = () => fetchOverdue();
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [graceDays]);

  return { count, totalAmount, loading };
};
