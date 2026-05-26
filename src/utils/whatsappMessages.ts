/**
 * Helpers to build WhatsApp links with pre-filled messages in 6 languages.
 * Phone numbers are normalized to international format (PT default).
 */

export type WhatsAppLang = 'pt' | 'en' | 'it' | 'es' | 'fr' | 'de';

export const WHATSAPP_LANGUAGES: { code: WhatsAppLang; label: string; flag: string; locale: string }[] = [
  { code: 'pt', label: 'Português', flag: '🇵🇹', locale: 'pt-PT' },
  { code: 'en', label: 'English', flag: '🇬🇧', locale: 'en-GB' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹', locale: 'it-IT' },
  { code: 'es', label: 'Español', flag: '🇪🇸', locale: 'es-ES' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', locale: 'fr-FR' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', locale: 'de-DE' },
];

const ADMIN_MBWAY = '961 689 411';
const ADMIN_REVOLUT_USER = 'mayara1dgr';
export const ADMIN_REVOLUT_LINK = `https://revolut.me/${ADMIN_REVOLUT_USER}`;

const localeOf = (lang: WhatsAppLang): string =>
  WHATSAPP_LANGUAGES.find(l => l.code === lang)?.locale ?? 'pt-PT';

const formatDateLang = (dateStr: string, lang: WhatsAppLang): string => {
  // dateStr expected as YYYY-MM-DD
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString(localeOf(lang), { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatCurrencyLang = (value: number, lang: WhatsAppLang): string => {
  try {
    return new Intl.NumberFormat(localeOf(lang), { style: 'currency', currency: 'EUR' }).format(value);
  } catch {
    return `€${value.toFixed(2)}`;
  }
};

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
  return digits;
};

interface PendingService {
  date: string; // YYYY-MM-DD
  price: string | number;
}

// ---------- i18n strings ----------

interface PaymentStrings {
  greeting: (name: string) => string;
  singleLine: (date: string, price: string) => string;
  intro: string;
  total: (v: string) => string;
  payBy: string;
  mbway: string;
  revolut: string;
  thanks: string;
}

const PAYMENT_STRINGS: Record<WhatsAppLang, PaymentStrings> = {
  pt: {
    greeting: (n) => `Olá ${n}, tudo bem? 🌸`,
    singleLine: (d, p) => `Só a lembrar a limpeza do dia ${d} — ${p}.`,
    intro: 'Só a lembrar dos seguintes serviços por liquidar:',
    total: (v) => `Total: ${v}`,
    payBy: 'Pode pagar por:',
    mbway: 'MB Way',
    revolut: 'Revolut',
    thanks: 'Obrigada! 💛',
  },
  en: {
    greeting: (n) => `Hi ${n}, hope you're well! 🌸`,
    singleLine: (d, p) => `Just a reminder about the cleaning on ${d} — ${p}.`,
    intro: 'Just a reminder of the following pending services:',
    total: (v) => `Total: ${v}`,
    payBy: 'You can pay by:',
    mbway: 'MB Way',
    revolut: 'Revolut',
    thanks: 'Thank you! 💛',
  },
  it: {
    greeting: (n) => `Ciao ${n}, tutto bene? 🌸`,
    singleLine: (d, p) => `Solo un promemoria per la pulizia del ${d} — ${p}.`,
    intro: 'Solo un promemoria dei seguenti servizi da saldare:',
    total: (v) => `Totale: ${v}`,
    payBy: 'Puoi pagare con:',
    mbway: 'MB Way',
    revolut: 'Revolut',
    thanks: 'Grazie! 💛',
  },
  es: {
    greeting: (n) => `¡Hola ${n}! ¿Todo bien? 🌸`,
    singleLine: (d, p) => `Solo para recordar la limpieza del ${d} — ${p}.`,
    intro: 'Solo para recordar los siguientes servicios pendientes:',
    total: (v) => `Total: ${v}`,
    payBy: 'Puedes pagar por:',
    mbway: 'MB Way',
    revolut: 'Revolut',
    thanks: '¡Gracias! 💛',
  },
  fr: {
    greeting: (n) => `Bonjour ${n}, tout va bien ? 🌸`,
    singleLine: (d, p) => `Petit rappel pour le ménage du ${d} — ${p}.`,
    intro: 'Petit rappel des services suivants en attente de règlement :',
    total: (v) => `Total : ${v}`,
    payBy: 'Vous pouvez payer par :',
    mbway: 'MB Way',
    revolut: 'Revolut',
    thanks: 'Merci ! 💛',
  },
  de: {
    greeting: (n) => `Hallo ${n}, alles gut? 🌸`,
    singleLine: (d, p) => `Nur eine Erinnerung an die Reinigung am ${d} — ${p}.`,
    intro: 'Nur eine Erinnerung an die folgenden offenen Posten:',
    total: (v) => `Gesamt: ${v}`,
    payBy: 'Sie können bezahlen mit:',
    mbway: 'MB Way',
    revolut: 'Revolut',
    thanks: 'Danke! 💛',
  },
};

/**
 * Build a friendly payment-reminder message.
 */
export const buildPaymentReminderMessage = (
  clientName: string,
  services: PendingService[],
  totalPending: number,
  lang: WhatsAppLang = 'pt'
): string => {
  const s = PAYMENT_STRINGS[lang];
  const firstName = clientName.split(' ')[0] || clientName;
  const lines: string[] = [];
  lines.push(s.greeting(firstName));
  lines.push('');

  if (services.length === 1) {
    const sv = services[0];
    const price = typeof sv.price === 'string' ? parseFloat(sv.price) || 0 : sv.price;
    lines.push(s.singleLine(formatDateLang(sv.date, lang), formatCurrencyLang(price, lang)));
  } else {
    lines.push(s.intro);
    services.forEach(sv => {
      const price = typeof sv.price === 'string' ? parseFloat(sv.price) || 0 : sv.price;
      lines.push(`• ${formatDateLang(sv.date, lang)} — ${formatCurrencyLang(price, lang)}`);
    });
    lines.push('');
    lines.push(s.total(formatCurrencyLang(totalPending, lang)));
  }

  lines.push('');
  lines.push(s.payBy);
  lines.push(`• ${s.mbway}: ${ADMIN_MBWAY}`);
  lines.push(`• ${s.revolut}: ${ADMIN_REVOLUT_LINK}`);
  lines.push('');
  lines.push(s.thanks);

  return lines.join('\n');
};

// ---------- Service confirmation ----------

const CONFIRM_STRINGS: Record<WhatsAppLang, (name: string, date: string, start: string, end: string) => string> = {
  pt: (n, d, s, e) => `Olá ${n}! 🌸\n\nConfirmo a limpeza no dia ${d}, das ${s} às ${e}.\n\nAté lá! 💛`,
  en: (n, d, s, e) => `Hi ${n}! 🌸\n\nConfirming the cleaning on ${d}, from ${s} to ${e}.\n\nSee you then! 💛`,
  it: (n, d, s, e) => `Ciao ${n}! 🌸\n\nConfermo la pulizia il ${d}, dalle ${s} alle ${e}.\n\nA presto! 💛`,
  es: (n, d, s, e) => `¡Hola ${n}! 🌸\n\nConfirmo la limpieza el ${d}, de ${s} a ${e}.\n\n¡Hasta luego! 💛`,
  fr: (n, d, s, e) => `Bonjour ${n} ! 🌸\n\nJe confirme le ménage le ${d}, de ${s} à ${e}.\n\nÀ bientôt ! 💛`,
  de: (n, d, s, e) => `Hallo ${n}! 🌸\n\nIch bestätige die Reinigung am ${d}, von ${s} bis ${e}.\n\nBis dann! 💛`,
};

export const buildServiceConfirmationMessage = (
  clientName: string,
  date: string,
  startTime: string,
  endTime: string,
  lang: WhatsAppLang = 'pt'
): string => {
  const firstName = clientName.split(' ')[0] || clientName;
  return CONFIRM_STRINGS[lang](firstName, formatDateLang(date, lang), startTime, endTime);
};

// ---------- Birthday ----------

export const buildBirthdayMessage = (
  clientName: string,
  date: string,
  daysUntil: number,
  lang: WhatsAppLang = 'pt'
): string => {
  const firstName = clientName.split(' ')[0] || clientName;
  const dateStr = formatDateLang(date, lang);
  if (daysUntil === 0) {
    switch (lang) {
      case 'en': return `Happy birthday, ${firstName}! 🎂 Wishing you a wonderful day! 💐`;
      case 'it': return `Buon compleanno, ${firstName}! 🎂 Ti auguro una splendida giornata! 💐`;
      case 'es': return `¡Feliz cumpleaños, ${firstName}! 🎂 ¡Que tengas un día maravilloso! 💐`;
      case 'fr': return `Joyeux anniversaire, ${firstName} ! 🎂 Je te souhaite une merveilleuse journée ! 💐`;
      case 'de': return `Alles Gute zum Geburtstag, ${firstName}! 🎂 Ich wünsche dir einen wunderschönen Tag! 💐`;
      default:  return `Parabéns, ${firstName}! 🎂 Muitas felicidades e um dia maravilhoso! 💐`;
    }
  }
  switch (lang) {
    case 'en': return `Hi ${firstName}! Just dropping by to wish you a great day on ${dateStr} 🎂`;
    case 'it': return `Ciao ${firstName}! Passo solo per augurarti una splendida giornata il ${dateStr} 🎂`;
    case 'es': return `¡Hola ${firstName}! Paso por aquí para desearte un excelente día el ${dateStr} 🎂`;
    case 'fr': return `Bonjour ${firstName} ! Je passe simplement pour te souhaiter une excellente journée le ${dateStr} 🎂`;
    case 'de': return `Hallo ${firstName}! Ich wollte dir nur einen schönen Tag am ${dateStr} wünschen 🎂`;
    default:  return `Olá ${firstName}! Só passar por aqui a desejar um excelente dia ${dateStr} 🎂`;
  }
};

// ---------- Simple greeting ----------

export const buildSimpleGreeting = (clientName: string, lang: WhatsAppLang = 'pt'): string => {
  const firstName = clientName.split(' ')[0] || clientName;
  switch (lang) {
    case 'en': return `Hi ${firstName}! 🌸`;
    case 'it': return `Ciao ${firstName}! 🌸`;
    case 'es': return `¡Hola ${firstName}! 🌸`;
    case 'fr': return `Bonjour ${firstName} ! 🌸`;
    case 'de': return `Hallo ${firstName}! 🌸`;
    default:  return `Olá ${firstName}! 🌸`;
  }
};

// ---------- Inactive favorite ----------

export const buildInactiveFavoriteMessage = (clientName: string, lang: WhatsAppLang = 'pt'): string => {
  const firstName = clientName.split(' ')[0] || clientName;
  switch (lang) {
    case 'en': return `Hi ${firstName}! Hope you're well. It's been a while — shall we schedule the next cleaning?`;
    case 'it': return `Ciao ${firstName}! Spero tu stia bene. È passato un po' di tempo — fissiamo la prossima pulizia?`;
    case 'es': return `¡Hola ${firstName}! Espero que estés bien. Ha pasado un tiempo — ¿programamos la próxima limpieza?`;
    case 'fr': return `Bonjour ${firstName} ! J'espère que tout va bien. Cela fait un moment — on planifie le prochain ménage ?`;
    case 'de': return `Hallo ${firstName}! Ich hoffe, es geht dir gut. Es ist eine Weile her — sollen wir die nächste Reinigung vereinbaren?`;
    default:  return `Olá ${firstName}! Está tudo bem? Há algum tempo que não a/o vejo. Posso passar para combinar a próxima limpeza?`;
  }
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

// ---------- Language preference helpers ----------

const LANG_STORAGE_PREFIX = 'whatsapp_lang:';

export const getPreferredLang = (key?: string | null): WhatsAppLang => {
  try {
    const storageKey = key ? `${LANG_STORAGE_PREFIX}${key}` : `${LANG_STORAGE_PREFIX}_default`;
    const v = localStorage.getItem(storageKey) as WhatsAppLang | null;
    if (v && WHATSAPP_LANGUAGES.some(l => l.code === v)) return v;
  } catch {
    /* ignore */
  }
  return 'pt';
};

export const setPreferredLang = (lang: WhatsAppLang, key?: string | null): void => {
  try {
    const storageKey = key ? `${LANG_STORAGE_PREFIX}${key}` : `${LANG_STORAGE_PREFIX}_default`;
    localStorage.setItem(storageKey, lang);
  } catch {
    /* ignore */
  }
};
