// Dynamic month configuration utility
// Generates month configuration based on current date

export interface MonthConfig {
  id: string;
  label: string;
  year: number;
  monthIndex: number;
  startDay: number;
  endDay: number;
  color: string;
}

const MONTH_COLORS = [
  'purple', 'blue', 'pink', 'green', 'yellow', 'emerald',
  'cyan', 'sky', 'orange', 'amber', 'red', 'rose'
];

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

// Get the last day of a month
function getLastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

// Generate month key - use simple names without year suffix for 2026 months (except december2026)
// This maintains compatibility with the existing useAgendamentos hook
function generateMonthKey(monthIndex: number, year: number): string {
  const baseKey = MONTH_KEYS[monthIndex];
  // Special case: December 2026 needs suffix to distinguish from December 2025
  if (monthIndex === 11 && year === 2026) {
    return 'december2026';
  }
  // December 2025 is just 'december'
  if (monthIndex === 11 && year === 2025) {
    return 'december';
  }
  // All other months in 2026 use simple names
  return baseKey;
}

// Generate configuration for months from startDate to endDate (up to 24 months)
export function generateMonthsConfig(monthsAhead: number = 12): Record<string, MonthConfig> {
  const config: Record<string, MonthConfig> = {};
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Start from current month
  for (let i = 0; i < monthsAhead; i++) {
    const date = new Date(currentYear, currentMonth + i, 1);
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const key = generateMonthKey(monthIndex, year);
    
    config[key] = {
      id: key,
      label: `${MONTH_NAMES[monthIndex]} ${year}`,
      year,
      monthIndex,
      startDay: 1,
      endDay: getLastDayOfMonth(year, monthIndex),
      color: MONTH_COLORS[monthIndex],
    };
  }
  
  return config;
}

// Generate days for a given month
export function generateDaysForMonth(config: MonthConfig) {
  const days = [];
  for (let day = config.startDay; day <= config.endDay; day++) {
    const date = new Date(config.year, config.monthIndex, day);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${d}`;

    days.push({
      dateObject: date,
      dateString: dateString,
      dayName: date.toLocaleDateString('pt-BR', { weekday: 'long' }),
      formatted: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      monthKey: config.id
    });
  }
  return days;
}

// Get month key from date string
export function getMonthKeyFromDate(dateString: string, monthsConfig: Record<string, MonthConfig>): string | null {
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;

  // Find matching month in config
  for (const [key, config] of Object.entries(monthsConfig)) {
    if (config.year === year && config.monthIndex === month) {
      return key;
    }
  }
  
  return null;
}

// Get theme gradient colors for a month
export function getThemeGradient(color: string): string {
  const gradientMap: Record<string, string> = {
    purple: 'from-purple-600 to-purple-800',
    blue: 'from-blue-600 to-blue-800',
    pink: 'from-pink-500 to-pink-700',
    green: 'from-green-500 to-green-700',
    yellow: 'from-yellow-500 to-yellow-700',
    emerald: 'from-emerald-500 to-emerald-700',
    cyan: 'from-cyan-500 to-cyan-700',
    sky: 'from-sky-500 to-sky-700',
    orange: 'from-orange-500 to-orange-700',
    amber: 'from-amber-500 to-amber-700',
    red: 'from-red-500 to-red-700',
    rose: 'from-rose-500 to-rose-700',
    violet: 'from-violet-500 to-violet-700',
  };
  return gradientMap[color] || 'from-purple-600 to-purple-800';
}

// Get background color for light mode
export function getBgColor(color: string): string {
  const bgMap: Record<string, string> = {
    purple: 'bg-purple-50',
    blue: 'bg-blue-50',
    pink: 'bg-pink-50',
    green: 'bg-green-50',
    yellow: 'bg-yellow-50',
    emerald: 'bg-emerald-50',
    cyan: 'bg-cyan-50',
    sky: 'bg-sky-50',
    orange: 'bg-orange-50',
    amber: 'bg-amber-50',
    red: 'bg-red-50',
    rose: 'bg-rose-50',
    violet: 'bg-violet-50',
  };
  return bgMap[color] || 'bg-purple-50';
}

// Calculate price based on hours and rate
export function calculatePrice(startStr: string, endStr: string, pricePerHour: string): string | null {
  if (startStr && endStr && pricePerHour) {
    const start = new Date(`1970-01-01T${startStr}`);
    const end = new Date(`1970-01-01T${endStr}`);
    let diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return null;
    const diffHours = diffMs / (1000 * 60 * 60);
    return (diffHours * parseFloat(pricePerHour)).toFixed(2);
  }
  return null;
}

// Validate time range (end must be after start)
export function validateTimeRange(startTime: string, endTime: string): { valid: boolean; message?: string } {
  if (!startTime || !endTime) {
    return { valid: false, message: 'Hora de início e fim são obrigatórias' };
  }
  
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  
  if (end.getTime() <= start.getTime()) {
    return { valid: false, message: 'Hora de fim deve ser depois da hora de início' };
  }
  
  return { valid: true };
}

// Format time helper
export function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// Parse time string to Date
export function parseTime(timeStr: string): Date {
  return new Date(`1970-01-01T${timeStr}`);
}
