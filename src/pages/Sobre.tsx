import React, { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Info, Sparkles, Bug, Wrench, Rocket, Star, ChevronRight } from 'lucide-react';
import logoMayslimpo from '@/assets/logo-mayslimpo.jpg';

const APP_VERSION = '2.3.0';

type ChangeType = 'new' | 'fix' | 'improvement';

interface ChangeItem {
  text: string;
  type: ChangeType;
}

interface VersionEntry {
  version: string;
  date: string;
  title: string;
  summary: string;
  changes: ChangeItem[];
}

const changelog: VersionEntry[] = [
  {
    version: '2.3.0',
    date: '2026-03-01',
    title: '🎨 Mayara no Comando + Visual Renovado',
    summary: 'A agenda agora mostra o nome real de quem está a usar a app. O nome "Neury" desapareceu da interface e foi substituído por "Funcionário/a" ou pelo nome do utilizador. O visual ficou mais moderno: o cabeçalho dos agendamentos tem agora um estilo glass elegante, os resumos mensais ficaram mais compactos e legíveis, e toda a interface está mais consistente.',
    changes: [
      { text: 'Título da agenda mostra o nome do utilizador logado', type: 'new' },
      { text: '"Neury" substituído por "Funcionário/a" em toda a interface', type: 'improvement' },
      { text: 'Cabeçalho dos agendamentos com estilo glass moderno', type: 'improvement' },
      { text: 'Resumo mensal mais compacto e legível', type: 'improvement' },
      { text: 'Texto de ajuda no login atualizado', type: 'improvement' },
      { text: 'Círculos de progresso mais elegantes', type: 'improvement' },
    ],
  },
  {
    version: '2.2.0',
    date: '2026-03-01',
    title: '🧹 Visual Mais Limpo',
    summary: 'A app ficou mais limpa e profissional. Foram removidas animações desnecessárias (confetti, brilhos, piscares) e os cartões ficaram mais simples. A sidebar agora tem botões mais compactos, as tabs dos meses deixaram de ter ícones repetidos, e o botão flutuante ficou mais discreto. A página de login também ficou mais elegante.',
    changes: [
      { text: 'Cartões de tarefas e dias mais limpos, sem efeitos excessivos', type: 'improvement' },
      { text: 'Tabs dos meses simplificadas (sem ícones e brilhos)', type: 'improvement' },
      { text: 'Sidebar com botões de ícone no rodapé', type: 'improvement' },
      { text: 'Botão flutuante mais pequeno e discreto', type: 'improvement' },
      { text: 'Login sem animações de fundo distrativas', type: 'improvement' },
      { text: 'Cores unificadas usando o tema da app', type: 'improvement' },
    ],
  },
  {
    version: '2.1.0',
    date: '2026-03-01',
    title: '👥 Gestão de Funcionários',
    summary: 'Agora a Mayara consegue adicionar e remover funcionários diretamente na app. Cada funcionário pode ser ativado ou desativado — quando está inativo, só consegue ver os agendamentos sem mexer em nada. Os funcionários veem sempre o valor de €7/hora, enquanto a Mayara vê os preços reais de cada cliente.',
    changes: [
      { text: 'Adicionar e remover funcionários na app', type: 'new' },
      { text: 'Ativar ou desativar funcionários com um botão', type: 'new' },
      { text: 'Funcionários inativos só podem ver, sem editar', type: 'new' },
      { text: 'Funcionários veem €7/hora, Mayara vê o preço real', type: 'new' },
      { text: 'Segurança reforçada para proteger os dados', type: 'improvement' },
    ],
  },
  {
    version: '2.0.0',
    date: '2026-03-01',
    title: '✨ Nova Identidade',
    summary: 'A app mudou de nome! Antes chamava-se "Agenda Neury" e agora é "Agenda Mayara Godoi". Tudo foi atualizado: o nome, os PDFs que se exportam, e foi criada esta página "Sobre" para acompanhar todas as novidades.',
    changes: [
      { text: 'Nome mudou de "Agenda Neury" para "Agenda Mayara Godoi"', type: 'new' },
      { text: 'Página "Sobre" com histórico de tudo o que foi feito', type: 'new' },
      { text: 'PDFs exportados agora têm o nome correto', type: 'improvement' },
      { text: 'Nome Mayslimpo aparece em todo o lado', type: 'improvement' },
    ],
  },
  {
    version: '1.9.0',
    date: '2026-02-15',
    title: '🪟 Visual Moderno',
    summary: 'A app ficou mais bonita! Os relatórios de clientes agora abrem numa janela com efeito de vidro (tipo iPhone). Cada cliente tem um avatar com as suas iniciais e cores únicas. Quando uma página está a carregar, aparece uma animação suave em vez de ficar em branco.',
    changes: [
      { text: 'Janela de relatório com visual de vidro transparente', type: 'new' },
      { text: 'Cada cliente tem uma bolinha colorida com as iniciais', type: 'new' },
      { text: 'Animação suave enquanto as páginas carregam', type: 'improvement' },
    ],
  },
  {
    version: '1.8.0',
    date: '2026-02-01',
    title: '📊 Comparar Períodos',
    summary: 'No Dashboard, agora dá para comparar semanas, meses ou até anos. Por exemplo: "Quanto faturei em Janeiro vs Fevereiro?" — a app mostra gráficos lado a lado com as diferenças em percentagem.',
    changes: [
      { text: 'Comparar receitas entre períodos diferentes', type: 'new' },
      { text: 'Gráficos lado a lado para ver as diferenças', type: 'new' },
      { text: 'Percentagem automática de crescimento ou queda', type: 'improvement' },
    ],
  },
  {
    version: '1.7.0',
    date: '2026-01-15',
    title: '📈 Dashboard com Números',
    summary: 'Foi criado um painel com todos os números importantes: quantos trabalhos foram feitos, quanto se faturou, qual a taxa de conclusão. Tudo com gráficos coloridos e animações. Também dá para exportar o dashboard em PDF.',
    changes: [
      { text: 'Painel com números: trabalhos feitos, receita, taxa de conclusão', type: 'new' },
      { text: 'Gráficos coloridos (barras, linhas, pizza)', type: 'new' },
      { text: 'Números animados que contam de 0 até ao valor', type: 'new' },
      { text: 'Exportar o dashboard em PDF', type: 'new' },
    ],
  },
  {
    version: '1.6.0',
    date: '2026-01-01',
    title: '🧾 Gestão Fiscal',
    summary: 'Para clientes com recibo verde, a app agora calcula automaticamente quanto se paga à Segurança Social. Mostra a receita bruta, a contribuição (24,5% sobre 70%) e o que sobra no final. Tudo isto pode ser exportado em PDF.',
    changes: [
      { text: 'Cálculo automático da Segurança Social', type: 'new' },
      { text: 'Marcar clientes com ou sem recibo verde', type: 'new' },
      { text: 'Ver receita bruta, contribuição e receita líquida', type: 'new' },
      { text: 'Exportar relatório fiscal em PDF', type: 'new' },
    ],
  },
  {
    version: '1.5.0',
    date: '2025-12-15',
    title: '💰 Controlo de Pagamentos',
    summary: 'Agora dá para controlar quem já pagou e quem ainda deve. Cada trabalho pode ser marcado como "pago" e a app regista a data. Dá para filtrar por estado e pesquisar por nome de cliente.',
    changes: [
      { text: 'Marcar trabalhos como pagos ou pendentes', type: 'new' },
      { text: 'Resumo mensal: total, pago e por receber', type: 'new' },
      { text: 'Data de pagamento registada automaticamente', type: 'new' },
      { text: 'Pesquisar e filtrar por cliente ou estado', type: 'new' },
    ],
  },
  {
    version: '1.4.0',
    date: '2025-12-01',
    title: '👤 Gestão de Clientes',
    summary: 'Foi criada uma página só para os clientes. Dá para adicionar, editar e remover clientes com os dados todos: nome, telefone, morada, preço por hora e notas. Cada cliente tem um histórico detalhado e dá para gerar um relatório em PDF.',
    changes: [
      { text: 'Página para gerir todos os clientes', type: 'new' },
      { text: 'Guardar nome, telefone, morada e preço/hora', type: 'new' },
      { text: 'Ver o histórico de trabalhos de cada cliente', type: 'new' },
      { text: 'Gerar relatório PDF por cliente', type: 'new' },
      { text: 'Aviso quando se tenta adicionar um cliente que já existe', type: 'improvement' },
    ],
  },
  {
    version: '1.3.0',
    date: '2025-11-15',
    title: '🗓️ Agendamento Avançado',
    summary: 'Muitas novidades nos agendamentos! A app agora avisa quando dois trabalhos estão no mesmo horário. Há um botão flutuante para ações rápidas, um botão "Ir para Hoje" e a possibilidade de desfazer quando se apaga algo por engano.',
    changes: [
      { text: 'Aviso automático de conflitos de horário', type: 'new' },
      { text: 'Botão flutuante para ações rápidas', type: 'new' },
      { text: 'Botão "Ir para Hoje" que salta para o dia atual', type: 'new' },
      { text: 'Desfazer ações (quando se apaga algo por engano)', type: 'new' },
      { text: 'Resumo do dia com tarefas e valor', type: 'new' },
      { text: 'Agendar em datas passadas', type: 'new' },
    ],
  },
  {
    version: '1.2.0',
    date: '2025-11-01',
    title: '📅 Calendário e PDF',
    summary: 'A agenda passou a ter uma vista de calendário organizada por dias e meses. Cada dia mostra os trabalhos marcados. Foi adicionada a exportação em PDF profissional com logo e cabeçalho da Mayslimpo.',
    changes: [
      { text: 'Vista de calendário mensal organizada por dias', type: 'new' },
      { text: 'Resumo mensal com totais e receita', type: 'new' },
      { text: 'Exportar a agenda do mês em PDF', type: 'new' },
      { text: 'Separadores por mês para navegação rápida', type: 'new' },
    ],
  },
  {
    version: '1.1.0',
    date: '2025-10-15',
    title: '🔐 Login e Segurança',
    summary: 'Foi criado o sistema de login com um visual moderno. A app saúda o utilizador conforme a hora do dia. Há dois tipos de conta: Admin (Mayara, com acesso total) e Funcionário (só pode ver). Também tem a opção de lembrar o utilizador.',
    changes: [
      { text: 'Ecrã de login com visual moderno', type: 'new' },
      { text: 'Saudação automática (bom dia/boa tarde/boa noite)', type: 'new' },
      { text: 'Opção "Lembrar-me" para não ter de escrever o email sempre', type: 'new' },
      { text: 'Dois tipos de conta: Admin e Funcionário', type: 'new' },
      { text: 'Páginas protegidas — só entra quem tem permissão', type: 'new' },
    ],
  },
  {
    version: '1.0.0',
    date: '2025-10-01',
    title: '🚀 Lançamento',
    summary: 'A primeira versão da app! Criada de raiz com tudo o que é preciso: agendamentos, temas claro e escuro, funciona no telemóvel e no computador. Inclui os feriados portugueses calculados automaticamente e funciona mesmo sem internet.',
    changes: [
      { text: 'Sistema de agendamentos (criar, editar, apagar)', type: 'new' },
      { text: 'Tema claro e escuro', type: 'new' },
      { text: 'Funciona no telemóvel e computador', type: 'new' },
      { text: 'Funciona sem internet (PWA)', type: 'new' },
      { text: 'Feriados portugueses automáticos', type: 'new' },
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
  const [selectedVersion, setSelectedVersion] = useState<VersionEntry | null>(null);

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
          <h2 className="text-lg font-semibold text-foreground">O que há de novo?</h2>
        </div>
        <p className="text-sm text-muted-foreground">Carregue em qualquer versão para ver os detalhes.</p>

        <div className="space-y-3">
          {changelog.map((entry, i) => (
            <button
              key={entry.version}
              onClick={() => setSelectedVersion(entry)}
              className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {i === 0 ? (
                    <Star className="h-5 w-5 text-primary" />
                  ) : (
                    <Rocket className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">v{entry.version}</span>
                      {i === 0 && (
                        <Badge variant="default" className="text-xs">Atual</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{entry.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:block">{entry.date}</span>
                  <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Version Detail Dialog */}
      <Dialog open={!!selectedVersion} onOpenChange={(open) => !open && setSelectedVersion(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          {selectedVersion && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  {selectedVersion.title}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 text-xs">
                  <span>Versão {selectedVersion.version}</span>
                  <span>•</span>
                  <span>{selectedVersion.date}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Simple explanation */}
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                  <p className="text-sm text-foreground leading-relaxed">
                    {selectedVersion.summary}
                  </p>
                </div>

                {/* Changes list */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    O que mudou:
                  </p>
                  <ul className="space-y-2">
                    {selectedVersion.changes.map((change, j) => {
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
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4">
        Desenvolvido com ❤️ para Mayslimpo
      </div>
    </div>
  );
};

export default Sobre;
