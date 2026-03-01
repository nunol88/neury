import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Info, Sparkles, Bug, Wrench, Rocket, Star } from 'lucide-react';
import logoMayslimpo from '@/assets/logo-mayslimpo.jpg';

const APP_VERSION = '2.0.0';

type ChangeType = 'new' | 'fix' | 'improvement';

interface ChangeItem {
  text: string;
  type: ChangeType;
}

interface VersionEntry {
  version: string;
  date: string;
  highlights?: string;
  changes: ChangeItem[];
}

const changelog: VersionEntry[] = [
  {
    version: '2.0.0',
    date: '2026-03-01',
    highlights: 'Nova identidade e melhorias gerais',
    changes: [
      { text: 'Rebranding para "Agenda Mayara Godoi"', type: 'new' },
      { text: 'Uniformização do nome Mayslimpo em toda a app', type: 'improvement' },
      { text: 'Página "Sobre" com histórico de versões', type: 'new' },
      { text: 'Ordenação cronológica no seletor de períodos', type: 'improvement' },
    ],
  },
  {
    version: '1.0.0',
    date: '2025-12-01',
    highlights: 'Lançamento inicial',
    changes: [
      { text: 'Sistema de agendamentos com calendário', type: 'new' },
      { text: 'Gestão de clientes', type: 'new' },
      { text: 'Dashboard com estatísticas', type: 'new' },
      { text: 'Gestão de pagamentos', type: 'new' },
      { text: 'Gestão fiscal (recibos verdes)', type: 'new' },
      { text: 'Autenticação com perfis admin e neury', type: 'new' },
      { text: 'Suporte a tema claro e escuro', type: 'new' },
      { text: 'Exportação de dados em PDF', type: 'new' },
      { text: 'PWA com suporte offline', type: 'new' },
    ],
  },
];

const typeConfig: Record<ChangeType, { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'outline' }> = {
  new: { label: 'Novo', icon: Sparkles, variant: 'default' },
  fix: { label: 'Correção', icon: Bug, variant: 'secondary' },
  improvement: { label: 'Melhoria', icon: Wrench, variant: 'outline' },
};

const Sobre = () => {
  const { theme } = useTheme();

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <img
          src={logoMayslimpo}
          alt="Mayslimpo Logo"
          className="w-16 h-16 rounded-full object-cover shadow-md border border-border"
        />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda Mayara Godoi</h1>
          <p className="text-sm text-muted-foreground">
            Versão atual: <span className="font-semibold text-primary">{APP_VERSION}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestão de agendamentos · Mayslimpo
          </p>
        </div>
      </div>

      <Separator />

      {/* Changelog */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Histórico de Versões</h2>
        </div>

        <div className="space-y-6">
          {changelog.map((entry, i) => (
            <div
              key={entry.version}
              className="relative rounded-xl border border-border bg-card p-5 space-y-3"
            >
              {/* Version badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {i === 0 ? (
                    <Star className="h-4 w-4 text-primary" />
                  ) : (
                    <Rocket className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-bold text-foreground text-lg">v{entry.version}</span>
                  {i === 0 && (
                    <Badge variant="default" className="text-xs">Atual</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{entry.date}</span>
              </div>

              {entry.highlights && (
                <p className="text-sm text-muted-foreground italic">{entry.highlights}</p>
              )}

              <ul className="space-y-2">
                {entry.changes.map((change, j) => {
                  const config = typeConfig[change.type];
                  const Icon = config.icon;
                  return (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <Badge variant={config.variant} className="text-[10px] px-1.5 py-0 shrink-0 mt-0.5">
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                      <span className="text-foreground">{change.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4">
        Desenvolvido com ❤️ para Mayslimpo
      </div>
    </div>
  );
};

export default Sobre;
