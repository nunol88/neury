import React from 'react';
import { AlertCircle, Phone, MessageCircle } from 'lucide-react';
import { useInactiveFavorites } from '@/hooks/useInactiveFavorites';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { useClients } from '@/hooks/useClients';
import { openWhatsApp } from '@/utils/whatsappMessages';

const InactiveFavoritesCard: React.FC = () => {
  const { allTasks } = useAgendamentos();
  const { clients } = useClients();
  const inactive = useInactiveFavorites(allTasks, clients);

  if (inactive.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 mb-6 border-l-4 border-amber-500">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-amber-500" />
        <h3 className="font-bold text-card-foreground">Favoritos parados há +30 dias</h3>
        <span className="ml-auto text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold">
          {inactive.length}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Clientes fixos sem serviços recentes. Talvez seja altura de ligar.
      </p>
      <ul className="space-y-2">
        {inactive.slice(0, 8).map(({ client, lastServiceDate, daysSince }) => (
          <li
            key={client.id}
            className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/40 border border-border"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground truncate">{client.nome}</p>
              <p className="text-[11px] text-muted-foreground">
                {lastServiceDate
                  ? `Último: há ${daysSince} dias`
                  : 'Nunca teve serviço concluído'}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {client.telefone && (
                <>
                  <a
                    href={`tel:${client.telefone}`}
                    className="p-1.5 rounded-md hover:bg-primary/10 text-primary"
                    title="Ligar"
                  >
                    <Phone size={14} />
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      openWhatsApp(
                        client.telefone,
                        `Olá ${client.nome}! Está tudo bem? Há algum tempo que não a/o vejo. Posso passar para combinar a próxima limpeza?`
                      )
                    }
                    className="p-1.5 rounded-md hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    title="WhatsApp"
                  >
                    <MessageCircle size={14} />
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InactiveFavoritesCard;
