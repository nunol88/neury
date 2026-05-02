import type { Client, FrequenciaPreferida, PeriodoPreferido } from '@/hooks/useClients';

export const DEFAULT_PREFERENCES = {
  dias_preferidos: [] as number[],
  frequencia_preferida: 'semanal' as FrequenciaPreferida,
  periodo_preferido: null as PeriodoPreferido,
  hora_preferida: null as string | null,
  duracao_preferida_horas: 3,
  auto_agendamento: false as boolean,
};

export const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const PERIODO_LABEL: Record<NonNullable<PeriodoPreferido>, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
};

// Default start hour (HH:mm) for each period when client has no explicit hora_preferida
export const PERIODO_DEFAULT_HOUR: Record<NonNullable<PeriodoPreferido>, string> = {
  manha: '09:00',
  tarde: '14:00',
  noite: '18:00',
};

/**
 * Returns the preferred start time for a client.
 * Priority: hora_preferida > periodo_preferido default > 09:00.
 */
export const getPreferredStartTime = (client: Pick<Client, 'hora_preferida' | 'periodo_preferido'>): string => {
  if (client.hora_preferida && /^\d{2}:\d{2}$/.test(client.hora_preferida)) return client.hora_preferida;
  if (client.periodo_preferido) return PERIODO_DEFAULT_HOUR[client.periodo_preferido];
  return '09:00';
};

/**
 * Adds `hours` (decimal) to an HH:mm string and returns HH:mm.
 */
export const addHoursToTime = (time: string, hours: number): string => {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + Math.round(hours * 60);
  const endH = Math.min(23, Math.floor(totalMinutes / 60));
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
};

export const formatPreferredDays = (days: number[]): string => {
  if (!days || days.length === 0) return '';
  const sorted = [...days].sort((a, b) => a - b);
  return sorted.map(d => DAY_LABELS[d]).join(', ');
};

export interface PreferredSlot {
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
}

/**
 * Computes preferred dates within a month for a client based on dias_preferidos
 * and frequencia_preferida. Returns sorted slots (date + start/end time).
 */
export const computePreferredSlotsForMonth = (
  client: Pick<Client, 'dias_preferidos' | 'frequencia_preferida' | 'hora_preferida' | 'periodo_preferido' | 'duracao_preferida_horas'>,
  monthDays: { dateObject: Date; dateString: string }[]
): PreferredSlot[] => {
  if (!client.dias_preferidos || client.dias_preferidos.length === 0) return [];
  const startTime = getPreferredStartTime(client);
  const duration = client.duracao_preferida_horas || 3;
  const endTime = addHoursToTime(startTime, duration);

  // Filter days that match preferred weekdays
  const matchingDays = monthDays.filter(d => client.dias_preferidos.includes(d.dateObject.getDay()));

  if (client.frequencia_preferida === 'quinzenal') {
    // Group by weekday and keep every other occurrence (1st, 3rd, ...)
    const byDow = new Map<number, typeof matchingDays>();
    matchingDays.forEach(d => {
      const dow = d.dateObject.getDay();
      if (!byDow.has(dow)) byDow.set(dow, []);
      byDow.get(dow)!.push(d);
    });
    const filtered: typeof matchingDays = [];
    byDow.forEach(list => list.forEach((d, i) => { if (i % 2 === 0) filtered.push(d); }));
    return filtered
      .sort((a, b) => a.dateString.localeCompare(b.dateString))
      .map(d => ({ date: d.dateString, startTime, endTime }));
  }

  return matchingDays.map(d => ({ date: d.dateString, startTime, endTime }));
};
