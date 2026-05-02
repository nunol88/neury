/**
 * Helpers to build WhatsApp links with pre-filled messages.
 * Phone numbers are normalized to international format (PT default).
 */

const ADMIN_MBWAY = '933 474 736';

const formatDatePT = (dateStr: string): string => {
  // dateStr expected as YYYY-MM-DD
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const formatCurrency = (value: number): string => `€${value.toFixed(2)}`;

/**
 * Normalize a Portuguese phone number to international (351) format
 * suitable for wa.me links. Returns null if it doesn't look valid.
 */
export const normalizePhoneForWhatsApp = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('351')) return digits;
  if (digits.length === 9) return `351${digits}`;
  // Assume already international
  return digits;
};

interface PendingService {
  date: string; // YYYY-MM-DD
  price: string | number;
}

/**
 * Build a friendly payment-reminder message in PT-PT.
 */
export const buildPaymentReminderMessage = (
  clientName: string,
  services: PendingService[],
  totalPending: number
): string => {
  const firstName = clientName.split(' ')[0] || clientName;
  const lines: string[] = [];
  lines.push(`Olá ${firstName}, tudo bem? 🌸`);
  lines.push('');

  if (services.length === 1) {
    const s = services[0];
    const price = typeof s.price === 'string' ? parseFloat(s.price) || 0 : s.price;
    lines.push(`Só a lembrar a limpeza do dia ${formatDatePT(s.date)} — ${formatCurrency(price)}.`);
  } else {
    lines.push(`Só a lembrar dos seguintes serviços por liquidar:`);
    services.forEach(s => {
      const price = typeof s.price === 'string' ? parseFloat(s.price) || 0 : s.price;
      lines.push(`• ${formatDatePT(s.date)} — ${formatCurrency(price)}`);
    });
    lines.push('');
    lines.push(`Total: ${formatCurrency(totalPending)}`);
  }

  lines.push('');
  lines.push(`Pode pagar por MB Way: ${ADMIN_MBWAY}.`);
  lines.push('Obrigada! 💛');

  return lines.join('\n');
};

/**
 * Build a service-confirmation message for a scheduled visit.
 */
export const buildServiceConfirmationMessage = (
  clientName: string,
  date: string,
  startTime: string,
  endTime: string
): string => {
  const firstName = clientName.split(' ')[0] || clientName;
  return [
    `Olá ${firstName}! 🌸`,
    '',
    `Confirmo a limpeza no dia ${formatDatePT(date)}, das ${startTime} às ${endTime}.`,
    '',
    'Até lá! 💛',
  ].join('\n');
};

/**
 * Open WhatsApp with a pre-filled message. Falls back to copy if no phone.
 */
export const openWhatsApp = (phone: string | null | undefined, message: string): boolean => {
  const normalized = normalizePhoneForWhatsApp(phone);
  const encoded = encodeURIComponent(message);
  const url = normalized
    ? `https://wa.me/${normalized}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  return !!normalized;
};

/**
 * Copy a string to the clipboard (best-effort).
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  // Fallback using a hidden textarea
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  } catch {
    return false;
  }
};
