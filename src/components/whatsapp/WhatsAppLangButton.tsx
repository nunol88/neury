import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  WHATSAPP_LANGUAGES,
  WhatsAppLang,
  getPreferredLang,
  setPreferredLang,
} from '@/utils/whatsappMessages';

interface WhatsAppLangButtonProps {
  /** Builds the message text for the chosen language. */
  getMessage: (lang: WhatsAppLang) => string;
  /** Called when a language is picked. Use this to open WhatsApp / copy / etc. */
  onPick: (message: string, lang: WhatsAppLang) => void;
  /** Optional storage key (e.g. client id) to remember last chosen language per contact. */
  prefKey?: string | null;
  /** The clickable element that opens the dropdown. */
  children: React.ReactNode;
  /** Optional className applied to the trigger wrapper. */
  className?: string;
  /** Tooltip text on the trigger. */
  title?: string;
  /** aria-label on the trigger. */
  ariaLabel?: string;
}

/**
 * Wraps any clickable element (button, icon) with a 6-language picker.
 * Picking a language calls `onPick(message, lang)`.
 */
const WhatsAppLangButton: React.FC<WhatsAppLangButtonProps> = ({
  getMessage,
  onPick,
  prefKey,
  children,
  className,
  title,
  ariaLabel,
}) => {
  const preferred = getPreferredLang(prefKey);

  const handlePick = (lang: WhatsAppLang) => {
    setPreferredLang(lang, prefKey);
    onPick(getMessage(lang), lang);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={className}
          title={title}
          aria-label={ariaLabel ?? 'WhatsApp'}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 z-50">
        <DropdownMenuLabel className="text-xs">Idioma da mensagem</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {WHATSAPP_LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => handlePick(l.code)}
            className="cursor-pointer gap-2"
          >
            <span className="text-base leading-none">{l.flag}</span>
            <span className="flex-1">{l.label}</span>
            {l.code === preferred && (
              <span className="text-[10px] text-muted-foreground">recente</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WhatsAppLangButton;
