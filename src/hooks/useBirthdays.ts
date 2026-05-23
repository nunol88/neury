import { useMemo } from 'react';
import { Client } from '@/hooks/useClients';

export interface BirthdayEntry {
  client: Client;
  date: string; // yyyy-mm-dd
  daysUntil: number; // 0 = hoje, negativo = passou
  age: number | null;
}

export const useBirthdays = (clients: Client[], windowDays = 30): BirthdayEntry[] => {
  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();

    const entries: BirthdayEntry[] = [];

    clients.forEach((c) => {
      const dn = (c as any).data_nascimento as string | null;
      if (!dn) return;
      const parts = dn.split('-');
      if (parts.length !== 3) return;
      const birthYear = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

      let next = new Date(currentYear, month, day);
      next.setHours(0, 0, 0, 0);
      if (next.getTime() < today.getTime() - 24 * 60 * 60 * 1000) {
        next = new Date(currentYear + 1, month, day);
      }
      const daysUntil = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil <= windowDays) {
        const age = isNaN(birthYear) ? null : next.getFullYear() - birthYear;
        entries.push({
          client: c,
          date: `${next.getFullYear()}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          daysUntil,
          age,
        });
      }
    });

    return entries.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [clients, windowDays]);
};
