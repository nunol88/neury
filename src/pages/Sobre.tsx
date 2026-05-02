import React, { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Info, Sparkles, Bug, Wrench, Rocket, Star, ChevronRight,
  Calendar, Users, CreditCard, BarChart3, FileText, Shield,
  Heart, Clock, Layers,
} from 'lucide-react';
import logoMayslimpo from '@/assets/logo-mayslimpo.jpg';
import { APP_VERSION } from '@/utils/appVersion';

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
    version: '2.10.0',
    date: '2026-05-02',
    title: '📱 Tablet Otimizado + Produtividade Admin',
    summary: 'Pacote grande de melhorias para o dia-a-dia da Mayara. A app ficou muito melhor em tablets (especialmente iPad em horizontal): o resumo mensal e a grelha de dias deixaram de ficar apertados ou cortados. Foram adicionadas ferramentas práticas: lembretes de cobrança por WhatsApp com mensagem pronta, um cartão "Hoje" no topo da agenda com a rota do dia e link para Google Maps, badge vermelho na sidebar a contar pagamentos em atraso (>7 dias), e exportação da rota diária em PDF para enviar à funcionária de manhã.',
    changes: [
      { text: 'Botão "Lembrete WhatsApp" para cada cliente com pagamentos pendentes', type: 'new' },
      { text: 'Cartão "Hoje" no topo da Agenda com serviços do dia, total e link Google Maps', type: 'new' },
      { text: 'Badge vermelho na sidebar com nº de pagamentos vencidos há mais de 7 dias', type: 'new' },
      { text: 'Exportar rota diária em PDF (cliente, hora, morada, telefone)', type: 'new' },
      { text: 'Resumo mensal recalibrado para tablets (2 colunas até XL, sem texto cortado)', type: 'fix' },
      { text: 'Grelha de dias com 2 colunas em tablet horizontal (deixa de ficar ilegível)', type: 'fix' },
    ],
  },
  {
    version: '2.9.0',
    date: '2026-04-20',
    title: '🚌 Transportes de Lisboa em Tempo Real',
    summary: 'Foi adicionada uma nova secção "Transportes" com posições em direto dos autocarros da Carris e estado das linhas do Metro de Lisboa. Inclui mapa interativo (Leaflet), horários por paragem e funciona em modo offline com dados em cache. Disponível para a Mayara e para a funcionária — útil para planear deslocações entre serviços.',
    changes: [
      { text: 'Nova página "Transportes" com Carris e Metro de Lisboa', type: 'new' },
      { text: 'Mapa interativo com posições dos autocarros em tempo real', type: 'new' },
      { text: 'Horários por paragem da Carris', type: 'new' },
      { text: 'Estado das linhas do Metro (atrasos, fechos)', type: 'new' },
      { text: 'Funciona offline com cache local', type: 'new' },
      { text: 'Disponível para admin e funcionário/a', type: 'improvement' },
    ],
  },
  {
    version: '2.8.0',
    date: '2026-04-05',
    title: '🧾 Atualização Fiscal 2026',
    summary: 'A Gestão Fiscal foi atualizada para a nova taxa da Segurança Social em vigor em 2026: 21,4% sobre 70% da receita bruta (anteriormente 24,5%). Os relatórios PDF e os cálculos automáticos refletem a nova realidade. Nada na contabilidade do passado foi alterado — só os meses de 2026 em diante.',
    changes: [
      { text: 'Taxa Segurança Social 2026 atualizada para 21,4%', type: 'improvement' },
      { text: 'Relatórios PDF refletem a nova taxa', type: 'improvement' },
      { text: 'Cálculo automático em todos os widgets fiscais', type: 'fix' },
    ],
  },
  {
    version: '2.7.0',
    date: '2026-04-01',
    title: '📊 Dashboard com Histórico Comparativo',
    summary: 'O Dashboard ganhou um widget novo de comparação histórica que mostra a evolução por mês ou por ano com gráficos lado a lado. Foi também adicionada exportação completa em XML para a contabilidade e melhorias gerais nas estatísticas dos clientes (mostra automaticamente o total faturado por mês/ano).',
    changes: [
      { text: 'Widget de comparação histórica (mês vs mês, ano vs ano)', type: 'new' },
      { text: 'Exportação XML completa para contabilidade', type: 'new' },
      { text: 'Estatísticas mensais e anuais por cliente', type: 'new' },
      { text: 'Auto-preenchimento de morada e contacto ao agendar', type: 'improvement' },
    ],
  },
  {
    version: '2.6.0',
    date: '2026-03-31',
    title: '🎨 Login Liquid Glass + Polimentos',
    summary: 'O ecrã de login foi redesenhado com efeito "liquid glass" (vidro líquido) mais elegante. As contas de email da Mayara são automaticamente promovidas a admin. Foi reorganizada a navegação e melhorados vários detalhes visuais.',
    changes: [
      { text: 'Login com novo visual liquid glass mais polido', type: 'improvement' },
      { text: 'Promoção automática a admin para emails autorizados', type: 'new' },
      { text: 'Toggle "Novos registos" para controlar entrada de utilizadores', type: 'new' },
      { text: 'Tabs dos meses ficam fixas no topo ao fazer scroll', type: 'improvement' },
      { text: 'Scroll-to-top automático ao mudar de mês', type: 'improvement' },
    ],
  },
  {
    version: '2.5.1',
    date: '2026-03-30',
    title: '📋 Log de Atividade Melhorado',
    summary: 'O registo de atividade ficou mais completo e fácil de ler. Os logs agora guardam todos os detalhes dos agendamentos, permitindo restauros completos. A interface mostra ações com ícones coloridos, agrupadas por dia, com filtros por utilizador e tipo de ação.',
    changes: [
      { text: 'Logs guardam todos os dados do agendamento (morada, preço, notas, contacto)', type: 'new' },
      { text: 'Restauro completo de agendamentos eliminados com todos os campos', type: 'new' },
      { text: 'Ações com ícones e badges coloridos (🟢 Criação, 🔴 Eliminação, 🔵 Conclusão, 🟠 Reabertura)', type: 'improvement' },
      { text: 'Logs agrupados por dia com data por extenso em português', type: 'improvement' },
      { text: 'Filtros por utilizador e tipo de ação', type: 'new' },
      { text: 'Paginação e contagem total de registos', type: 'improvement' },
      { text: 'Detalhes do agendamento visíveis diretamente no log (hora, morada, cliente)', type: 'improvement' },
    ],
  },
  {
    version: '2.5.0',
    date: '2026-03-30',
    title: '🍎 Login com Google e Apple',
    summary: 'Agora é possível entrar na app usando a conta Google ou Apple — mais rápido e seguro, sem precisar de lembrar passwords. O login por email pode ser ativado ou desativado pela Mayara diretamente na sidebar. A foto do perfil do Google/Apple aparece na sidebar após o login.',
    changes: [
      { text: 'Login com conta Google (um clique)', type: 'new' },
      { text: 'Login com conta Apple (um clique)', type: 'new' },
      { text: 'Foto do perfil Google/Apple visível na sidebar', type: 'new' },
      { text: 'Toggle na sidebar para ativar/desativar login por email', type: 'new' },
      { text: 'Login por email desativado por defeito (mais seguro)', type: 'improvement' },
      { text: 'Atribuição automática de roles para contas OAuth', type: 'improvement' },
    ],
  },
  {
    version: '2.4.0',
    date: '2026-03-01',
    title: '🎯 Polimento Global da App',
    summary: 'Melhorias em todas as páginas: a página 404 ficou com branding Mayslimpo e em português, os selects do Dashboard passaram a usar componentes shadcn, os cards de Recibos Verdes e Clientes ganharam hover states suaves, a sidebar mostra agora o avatar com iniciais do utilizador, e a navegação faz scroll-to-top automático.',
    changes: [
      { text: 'Página 404 em português com logo Mayslimpo e animação', type: 'improvement' },
      { text: 'Selects nativos do Dashboard substituídos por shadcn Select', type: 'improvement' },
      { text: 'Hover states nos cards de Recibos Verdes e Clientes', type: 'improvement' },
      { text: 'Skeleton loading na página de Gestão Fiscal', type: 'improvement' },
      { text: 'Avatar com iniciais do utilizador na sidebar', type: 'new' },
      { text: 'Scroll-to-top automático ao navegar entre páginas', type: 'new' },
      { text: 'Ícones com fundos coloridos nos stats de Recibos Verdes', type: 'improvement' },
    ],
  },
  {
    version: '2.3.1',
    date: '2026-03-01',
    title: '✨ Melhorias Visuais — Pagamentos e Utilizadores',
    summary: 'Os cards de pagamento ficaram mais modernos: hover states suaves, badges com fundo preenchido e cores mais consistentes. O botão "Marcar todos como pago" tem agora um estilo verde subtil. Na Gestão de Utilizadores, os cards ficaram mais espaçados, os ícones mudam de cor conforme o estado (verde para ativos, destaque para admin), e os badges de role e estado ficaram mais elegantes.',
    changes: [
      { text: 'Cards de pagamento com hover suave e sombra ao passar o rato', type: 'improvement' },
      { text: 'Badges de estado com fundo preenchido (laranja/verde)', type: 'improvement' },
      { text: 'Linhas pagas com opacidade reduzida para distinguir melhor', type: 'improvement' },
      { text: 'Botão "Marcar todos como pago" com estilo verde', type: 'improvement' },
      { text: 'Cards de utilizador com layout mais respirável', type: 'improvement' },
      { text: 'Ícones e badges de utilizador com cores contextuais', type: 'improvement' },
    ],
  },
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

const features = [
  { icon: Calendar, label: 'Agenda', description: 'Agendamentos diários organizados por mês' },
  { icon: Users, label: 'Clientes', description: 'Base de dados com histórico completo' },
  { icon: CreditCard, label: 'Pagamentos', description: 'Controlo do que foi pago e pendente' },
  { icon: BarChart3, label: 'Dashboard', description: 'Números e gráficos do negócio' },
  { icon: FileText, label: 'Recibos Verdes', description: 'Gestão fiscal e cálculo automático' },
  { icon: Shield, label: 'Utilizadores', description: 'Gestão de acessos e permissões' },
];

const Sobre = () => {
  const { theme } = useTheme();
  const [selectedVersion, setSelectedVersion] = useState<VersionEntry | null>(null);

  const totalChanges = changelog.reduce((acc, entry) => acc + entry.changes.length, 0);
  const monthsSinceLaunch = (() => {
    const launch = new Date(2025, 9, 1); // Oct 2025
    const now = new Date();
    return (now.getFullYear() - launch.getFullYear()) * 12 + (now.getMonth() - launch.getMonth());
  })();

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-primary/10 p-6 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <div className="relative flex flex-col items-center text-center gap-4">
          <img
            src={logoMayslimpo}
            alt="Mayslimpo Logo"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-lg border-2 border-primary/20"
          />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Agenda Mayara Godoi</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestão completa de agendamentos de limpeza
            </p>
            <Badge variant="outline" className="mt-2 text-xs">
              v{APP_VERSION}
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-4 w-full max-w-sm">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-1.5">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-bold text-foreground">{changelog.length}</span>
              <span className="text-[11px] text-muted-foreground">Versões</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-1.5">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-bold text-foreground">{totalChanges}</span>
              <span className="text-[11px] text-muted-foreground">Melhorias</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-1.5">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-bold text-foreground">{monthsSinceLaunch}</span>
              <span className="text-[11px] text-muted-foreground">Meses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          O que faz esta app?
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {features.map((feat) => (
            <Card key={feat.label} className="border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feat.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{feat.label}</span>
                <span className="text-[11px] text-muted-foreground leading-tight">{feat.description}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Timeline Changelog */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          Histórico de Versões
        </h2>
        <p className="text-sm text-muted-foreground">Carregue em qualquer versão para ver os detalhes.</p>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-border" />

          <div className="space-y-1">
            {changelog.map((entry, i) => (
              <button
                key={entry.version}
                onClick={() => setSelectedVersion(entry)}
                className="w-full text-left relative pl-10 pr-3 py-3 rounded-xl hover:bg-accent/50 transition-all duration-200 group"
              >
                {/* Timeline dot */}
                <div className={`absolute left-[9px] top-[18px] w-[13px] h-[13px] rounded-full border-2 transition-colors ${
                  i === 0
                    ? 'border-primary bg-primary shadow-sm shadow-primary/30'
                    : 'border-muted-foreground/30 bg-card group-hover:border-primary/60'
                }`} />

                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground text-sm">v{entry.version}</span>
                      {i === 0 && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">Atual</Badge>
                      )}
                      <span className="text-[11px] text-muted-foreground">{entry.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{entry.title}</p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              </button>
            ))}
          </div>
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
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                  <p className="text-sm text-foreground leading-relaxed">
                    {selectedVersion.summary}
                  </p>
                </div>

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
      <div className="rounded-xl border border-border bg-card/50 p-6 text-center space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          Desenvolvido com <Heart className="h-4 w-4 text-red-500 fill-red-500" /> para Mayslimpo
        </div>
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <span>v{APP_VERSION}</span>
          <span>•</span>
          <span>Desde Outubro 2025</span>
          <span>•</span>
          <span>Portugal 🇵🇹</span>
        </div>
      </div>
    </div>
  );
};

export default Sobre;
