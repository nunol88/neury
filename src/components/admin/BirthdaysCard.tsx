import React from 'react';
import { Cake } from 'lucide-react';
import { useBirthdays } from '@/hooks/useBirthdays';
import { useClients } from '@/hooks/useClients';
import { openWhatsApp, buildBirthdayMessage } from '@/utils/whatsappMessages';
import WhatsAppLangButton from '@/components/whatsapp/WhatsAppLangButton';
import { MessageCircle } from 'lucide-react';

const BirthdaysCard: React.FC = () => {
  const { clients } = useClients();
  const entries = useBirthdays(clients, 30);

  if (entries.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 mb-6 border-l-4 border-pink-500">
      <div className="flex items-center gap-2 mb-3">
        <Cake className="w-5 h-5 text-pink-500" />
        <h3 className="font-bold text-card-foreground">Aniversários próximos</h3>
        <span className="ml-auto text-xs bg-pink-500/20 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full font-semibold">
          {entries.length}
        </span>
      </div>
      <ul className="space-y-2">
        {entries.map(({ client, date, daysUntil, age }) => {
          const label =
            daysUntil === 0
              ? 'Hoje! 🎉'
              : daysUntil === 1
              ? 'Amanhã'
              : `Em ${daysUntil} dias`;
          const d = new Date(date + 'T00:00:00');
          const dateStr = d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' });
          return (
            <li
              key={client.id}
              className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                daysUntil === 0
                  ? 'bg-pink-500/10 border-pink-500/30'
                  : 'bg-secondary/40 border-border'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate">
                  {client.nome}
                  {age !== null && age > 0 && (
                    <span className="ml-2 text-[11px] text-muted-foreground">
                      ({age} anos)
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {dateStr} · <span className="font-semibold">{label}</span>
                </p>
              </div>
              {client.telefone && (
                <WhatsAppLangButton
                  prefKey={client.id}
                  getMessage={(lang) => buildBirthdayMessage(client.nome, date, daysUntil, lang)}
                  onPick={(msg) => openWhatsApp(client.telefone, msg)}
                  className="p-2 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0"
                  title="Enviar parabéns por WhatsApp"
                  ariaLabel="WhatsApp"
                >
                  <MessageCircle size={16} />
                </WhatsAppLangButton>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default BirthdaysCard;
