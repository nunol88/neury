// Feriados Nacionais de Portugal

interface Holiday {
  name: string;
  emoji: string;
}

// Calcular a data da Páscoa usando o algoritmo de Computus
function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
}

// Adicionar dias a uma data
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Formatar data para string YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Gerar feriados para um ano específico
function getHolidaysForYear(year: number): Record<string, Holiday> {
  const easter = calculateEaster(year);
  
  // Feriados móveis (baseados na Páscoa)
  const goodFriday = addDays(easter, -2); // Sexta-feira Santa
  const corpusChristi = addDays(easter, 60); // Corpo de Deus
  
  const holidays: Record<string, Holiday> = {
    // Feriados fixos
    [`${year}-01-01`]: { name: 'Ano Novo', emoji: '🎉' },
    [`${year}-04-25`]: { name: 'Dia da Liberdade', emoji: '🇵🇹' },
    [`${year}-05-01`]: { name: 'Dia do Trabalhador', emoji: '💪' },
    [`${year}-06-10`]: { name: 'Dia de Portugal', emoji: '🇵🇹' },
    [`${year}-08-15`]: { name: 'Assunção de Maria', emoji: '⛪' },
    [`${year}-10-05`]: { name: 'Implantação da República', emoji: '🇵🇹' },
    [`${year}-11-01`]: { name: 'Todos os Santos', emoji: '🕯️' },
    [`${year}-12-01`]: { name: 'Restauração da Independência', emoji: '🇵🇹' },
    [`${year}-12-08`]: { name: 'Imaculada Conceição', emoji: '⛪' },
    [`${year}-12-25`]: { name: 'Natal', emoji: '🎄' },
    
    // Feriados móveis
    [formatDate(goodFriday)]: { name: 'Sexta-feira Santa', emoji: '✝️' },
    [formatDate(easter)]: { name: 'Páscoa', emoji: '🐣' },
    [formatDate(corpusChristi)]: { name: 'Corpo de Deus', emoji: '⛪' },
  };
  
  return holidays;
}

// Cache de feriados por ano
const holidaysCache: Record<number, Record<string, Holiday>> = {};

// Obter feriado para uma data específica
export function getHoliday(dateString: string): Holiday | null {
  const year = parseInt(dateString.substring(0, 4), 10);
  
  // Verificar cache
  if (!holidaysCache[year]) {
    holidaysCache[year] = getHolidaysForYear(year);
  }
  
  return holidaysCache[year][dateString] || null;
}

// Verificar se uma data é feriado
export function isHoliday(dateString: string): boolean {
  return getHoliday(dateString) !== null;
}
