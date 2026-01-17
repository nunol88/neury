import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileJson, FileText, Brain, FileDown, ChevronDown, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";
import { Task, AllTasks } from '@/hooks/useAgendamentos';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { pt } from 'date-fns/locale';

interface ExportDropdownProps {
  onExportPDF: () => void;
  generateAiContext: () => string;
  allTasks?: Record<string, Task[]>;
  clients?: Array<{
    id: string;
    nome: string;
    telefone?: string | null;
    morada?: string | null;
    preco_hora?: string | null;
    notas?: string | null;
  }>;
}

const PROJECT_STRUCTURE = `
# Estrutura do Projeto - Agenda Neury

## Tecnologias
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase (Auth, Database, Edge Functions)
- TanStack React Query
- React Router DOM
- shadcn/ui components

## Estrutura de Ficheiros

### Páginas (src/pages/)
- Login.tsx - Página de autenticação
- AdminAgendamentos.tsx - Gestão de agendamentos (admin)
- NeuryAgendamentos.tsx - Vista de agendamentos (neury)
- ClientesAdmin.tsx - Gestão de clientes
- Dashboard.tsx - Dashboard com estatísticas
- Pagamentos.tsx - Controlo de pagamentos
- NotFound.tsx - Página 404

### Componentes Principais (src/components/)
- ProtectedRoute.tsx - Proteção de rotas por role
- ScheduleView.tsx - Vista principal de agenda
- CalendarModal.tsx - Modal de calendário
- NavLink.tsx - Links de navegação

### Hooks (src/hooks/)
- useAgendamentos.ts - CRUD de agendamentos
- useClients.ts - CRUD de clientes
- usePayments.ts - Gestão de pagamentos
- useClientStats.ts - Estatísticas de clientes
- useTheme.ts - Gestão de tema
`;

const DATABASE_SCHEMA = `
## Schema da Base de Dados (Supabase)

### Tabela: agendamentos
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NOT NULL | gen_random_uuid() |
| cliente_nome | TEXT | NOT NULL | - |
| cliente_contacto | TEXT | NULL | - |
| data_inicio | TIMESTAMP | NOT NULL | - |
| data_fim | TIMESTAMP | NOT NULL | - |
| descricao | TEXT | NULL | - (JSON com preco, preco_hora, etc) |
| status | ENUM | NOT NULL | 'agendado' |
| pago | BOOLEAN | NOT NULL | FALSE |

### Tabela: clients
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NOT NULL | gen_random_uuid() |
| nome | TEXT | NOT NULL | - |
| telefone | TEXT | NULL | - |
| morada | TEXT | NULL | - |
| preco_hora | TEXT | NULL | - |
| notas | TEXT | NULL | - |
`;

const FEATURES_DOC = `
## Funcionalidades Principais

### 1. Autenticação
- Login com email/password via Supabase Auth
- Roles: admin e neury

### 2. Gestão de Agendamentos
- Criar, editar, eliminar agendamentos
- Vista por semana/mês
- Marcar como concluído/cancelado

### 3. Gestão de Clientes
- CRUD completo de clientes
- Preço por hora por cliente

### 4. Controlo de Pagamentos
- Marcar serviços como pagos
- Resumo financeiro
`;

export function ExportDropdown({ onExportPDF, generateAiContext, allTasks = {}, clients = [] }: ExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiContextText, setAiContextText] = useState('');
  const [aiContextCopied, setAiContextCopied] = useState(false);
  const [xmlDialogOpen, setXmlDialogOpen] = useState(false);
  const [xmlContextText, setXmlContextText] = useState('');
  const [xmlContextCopied, setXmlContextCopied] = useState(false);

  // Calculate metrics for XML export
  const xmlMetrics = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    
    const allTasksFlat: Task[] = Object.values(allTasks).flat();
    const currentMonthTasks = allTasksFlat.filter(task => {
      const taskDate = parseISO(task.date);
      return isWithinInterval(taskDate, { start, end });
    });
    
    const completedTasks = currentMonthTasks.filter(t => t.completed);
    const pendingTasks = currentMonthTasks.filter(t => !t.completed);
    
    const totalRevenue = completedTasks.reduce((sum, t) => sum + parseFloat(t.price || '0'), 0);
    const pendingRevenue = pendingTasks.reduce((sum, t) => sum + parseFloat(t.price || '0'), 0);
    
    const totalHours = completedTasks.reduce((sum, task) => {
      const startTime = new Date(`1970-01-01T${task.startTime}`);
      const endTime = new Date(`1970-01-01T${task.endTime}`);
      return sum + (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    }, 0);
    
    const uniqueClients = new Set(currentMonthTasks.map(t => t.client)).size;
    const avgRevenuePerHour = totalHours > 0 ? totalRevenue / totalHours : 0;
    
    // Client performance
    const clientRevenue: Record<string, { name: string; total: number; count: number; hours: number }> = {};
    currentMonthTasks.forEach(task => {
      if (!clientRevenue[task.client]) {
        clientRevenue[task.client] = { name: task.client, total: 0, count: 0, hours: 0 };
      }
      clientRevenue[task.client].total += parseFloat(task.price || '0');
      clientRevenue[task.client].count += 1;
      
      const startTime = new Date(`1970-01-01T${task.startTime}`);
      const endTime = new Date(`1970-01-01T${task.endTime}`);
      clientRevenue[task.client].hours += (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    });
    
    const topClients = Object.values(clientRevenue)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Recent logs
    const recentLogs = allTasksFlat
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);

    // Alerts
    const alerts: string[] = [];
    if (pendingTasks.length > 0) {
      alerts.push(`PENDING_TASKS: ${pendingTasks.length} tasks awaiting completion`);
    }
    const completionRate = currentMonthTasks.length > 0 
      ? Math.round((completedTasks.length / currentMonthTasks.length) * 100) 
      : 0;
    if (completionRate < 70 && currentMonthTasks.length > 5) {
      alerts.push(`LOW_COMPLETION_RATE: ${completionRate}% completion rate detected`);
    }
    if (totalHours > 160) {
      alerts.push(`HIGH_WORKLOAD: ${totalHours.toFixed(1)} hours worked this month`);
    }
    if (pendingRevenue > totalRevenue && currentMonthTasks.length > 5) {
      alerts.push(`REVENUE_ANOMALY: Pending revenue (€${pendingRevenue.toFixed(2)}) exceeds completed (€${totalRevenue.toFixed(2)})`);
    }
    
    return {
      totalTasks: currentMonthTasks.length,
      completedCount: completedTasks.length,
      pendingCount: pendingTasks.length,
      totalRevenue,
      pendingRevenue,
      totalHours,
      uniqueClients,
      avgRevenuePerHour,
      topClients,
      completionRate,
      recentLogs,
      alerts,
    };
  }, [allTasks]);

  const generateXmlContext = () => {
    const now = new Date();
    const currentMonth = format(now, 'MMMM yyyy', { locale: pt });
    
    return `<AI_ANALYSIS_INPUT>
  <META>
    <timestamp>${now.toISOString()}</timestamp>
    <project>MaysLimpo - Cleaning Service Management</project>
    <purpose>Operational analysis and optimization recommendations</purpose>
    <period>${currentMonth}</period>
    <language>Portuguese (Portugal)</language>
  </META>

  <INSTRUCTIONS>
    <role>Business Operations Analyst specialized in service businesses</role>
    <task>Analyze the provided operational data and generate actionable insights</task>
    <constraints>
      <constraint>Use declarative, factual language</constraint>
      <constraint>Focus on efficiency and profitability metrics</constraint>
      <constraint>Identify patterns, anomalies, and optimization opportunities</constraint>
      <constraint>Provide specific, actionable recommendations</constraint>
      <constraint>Do not ask clarifying questions - work with available data</constraint>
    </constraints>
    <output_format>Structured analysis with numbered recommendations</output_format>
  </INSTRUCTIONS>

  <DATABASE_SCHEMA>
    <table name="agendamentos">
      <field name="id" type="uuid" description="Unique identifier"/>
      <field name="cliente_nome" type="text" description="Client name"/>
      <field name="cliente_contacto" type="text" description="Client contact"/>
      <field name="data_inicio" type="timestamp" description="Service start datetime"/>
      <field name="data_fim" type="timestamp" description="Service end datetime"/>
      <field name="descricao" type="text" description="Service description"/>
      <field name="status" type="enum" values="agendado,concluido,cancelado" description="Service status"/>
      <field name="pago" type="boolean" description="Payment status"/>
      <field name="data_pagamento" type="timestamp" description="Payment date"/>
    </table>
    <table name="clients">
      <field name="id" type="uuid" description="Unique identifier"/>
      <field name="nome" type="text" description="Client name"/>
      <field name="telefone" type="text" description="Phone number"/>
      <field name="morada" type="text" description="Address"/>
      <field name="preco_hora" type="text" description="Hourly rate"/>
      <field name="notas" type="text" description="Notes"/>
    </table>
  </DATABASE_SCHEMA>

  <METRICS period="${currentMonth}">
    <kpi name="total_hours" value="${xmlMetrics.totalHours.toFixed(1)}" unit="hours"/>
    <kpi name="total_revenue_completed" value="${xmlMetrics.totalRevenue.toFixed(2)}" unit="EUR"/>
    <kpi name="total_revenue_pending" value="${xmlMetrics.pendingRevenue.toFixed(2)}" unit="EUR"/>
    <kpi name="avg_revenue_per_hour" value="${xmlMetrics.avgRevenuePerHour.toFixed(2)}" unit="EUR/hour"/>
    <kpi name="total_services" value="${xmlMetrics.totalTasks}" unit="count"/>
    <kpi name="services_completed" value="${xmlMetrics.completedCount}" unit="count"/>
    <kpi name="services_pending" value="${xmlMetrics.pendingCount}" unit="count"/>
    <kpi name="completion_rate" value="${xmlMetrics.completionRate}" unit="percent"/>
    <kpi name="active_clients" value="${xmlMetrics.uniqueClients}" unit="count"/>
    <kpi name="total_registered_clients" value="${clients.length}" unit="count"/>
    <kpi name="estimated_profit" value="${(xmlMetrics.totalRevenue * 0.6).toFixed(2)}" unit="EUR" note="60% margin estimate"/>
  </METRICS>

  <WORKFORCE>
    <employee name="Neury" role="cleaner" status="active">
      <rate type="default">7.00 EUR/hour</rate>
      <hours_this_period>${xmlMetrics.totalHours.toFixed(1)}</hours_this_period>
    </employee>
    <clients_list count="${clients.length}">
${clients.map(c => `      <client name="${c.nome}" rate="${c.preco_hora || '7'}" address="${c.morada || 'N/A'}"/>`).join('\n')}
    </clients_list>
  </WORKFORCE>

  <TIME_LOGS recent_count="20">
${xmlMetrics.recentLogs.map(log => `    <log date="${log.date}" client="${log.client}" start="${log.startTime}" end="${log.endTime}" status="${log.completed ? 'completed' : 'pending'}" price="${log.price || '0'}"/>`).join('\n')}
  </TIME_LOGS>

  <ALERTS count="${xmlMetrics.alerts.length}">
${xmlMetrics.alerts.length > 0 ? xmlMetrics.alerts.map(a => `    <alert type="${a.split(':')[0]}" message="${a.split(':')[1]?.trim() || a}"/>`).join('\n') : '    <alert type="NONE" message="No critical alerts detected"/>'}
  </ALERTS>

  <CLIENT_PERFORMANCE>
${xmlMetrics.topClients.map((c, i) => `    <client rank="${i + 1}" name="${c.name}" total_revenue="${c.total.toFixed(2)}" services="${c.count}" hours="${c.hours.toFixed(1)}" efficiency="${(c.total / (c.hours || 1)).toFixed(2)}"/>`).join('\n')}
  </CLIENT_PERFORMANCE>

  <ANALYSIS_DIRECTIVES>
    <directive priority="1">Identify inefficiencies in service delivery and scheduling</directive>
    <directive priority="2">Evaluate client profitability and recommend optimization</directive>
    <directive priority="3">Detect patterns in completion rates and payment delays</directive>
    <directive priority="4">Recommend one primary focus for immediate improvement</directive>
    <directive priority="5">Suggest automation or process improvements</directive>
  </ANALYSIS_DIRECTIVES>
</AI_ANALYSIS_INPUT>`;
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenAiContext = () => {
    const context = generateAiContext();
    setAiContextText(context);
    setAiDialogOpen(true);
  };

  const handleOpenXmlContext = () => {
    const xml = generateXmlContext();
    setXmlContextText(xml);
    setXmlContextCopied(false);
    setXmlDialogOpen(true);
  };

  const copyAiContext = async () => {
    try {
      await navigator.clipboard.writeText(aiContextText);
      setAiContextCopied(true);
      toast.success('Contexto copiado!');
      setTimeout(() => setAiContextCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar');
    }
  };

  const copyXmlContext = async () => {
    try {
      await navigator.clipboard.writeText(xmlContextText);
      setXmlContextCopied(true);
      toast.success('Contexto copiado!');
      setTimeout(() => setXmlContextCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar');
    }
  };

  const exportStructure = async () => {
    setIsExporting(true);
    
    try {
      const { count: agendamentosCount } = await supabase
        .from('agendamentos')
        .select('*', { count: 'exact', head: true });
      
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      const dataStats = `
## Estatísticas Atuais

- Total de Agendamentos: ${agendamentosCount || 0}
- Total de Clientes: ${clientsCount || 0}
- Data de Exportação: ${new Date().toLocaleString('pt-PT')}
`;

      const fullExport = `${PROJECT_STRUCTURE}
${DATABASE_SCHEMA}
${FEATURES_DOC}
${dataStats}
`;

      downloadFile(
        fullExport, 
        `agenda-neury-estrutura-${new Date().toISOString().split('T')[0]}.md`,
        'text/markdown'
      );
      
      toast.success('Estrutura exportada!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar');
    } finally {
      setIsExporting(false);
    }
  };

  const exportData = async () => {
    setIsExporting(true);
    
    try {
      const [agendamentosRes, clientsRes] = await Promise.all([
        supabase.from('agendamentos').select('*').order('data_inicio', { ascending: false }),
        supabase.from('clients').select('*').order('nome')
      ]);

      if (agendamentosRes.error) throw agendamentosRes.error;
      if (clientsRes.error) throw clientsRes.error;

      const exportData = {
        exportedAt: new Date().toISOString(),
        summary: {
          totalAgendamentos: agendamentosRes.data?.length || 0,
          totalClientes: clientsRes.data?.length || 0,
        },
        agendamentos: agendamentosRes.data,
        clientes: clientsRes.data,
      };

      downloadFile(
        JSON.stringify(exportData, null, 2),
        `agenda-neury-dados-${new Date().toISOString().split('T')[0]}.json`,
        'application/json'
      );
      
      toast.success('Dados exportados!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
            className="gap-1.5"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Exportar</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-popover">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Relatórios</DropdownMenuLabel>
          <DropdownMenuItem onClick={onExportPDF} disabled={isExporting}>
            <FileDown className="h-4 w-4 mr-2 text-red-500" />
            <span>Exportar PDF</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">Para IA</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={handleOpenXmlContext} disabled={isExporting}>
            <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
            <span>🧠 Contexto XML para IA</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleOpenAiContext} disabled={isExporting}>
            <Brain className="h-4 w-4 mr-2 text-purple-500" />
            <span>Contexto IA (Genspark)</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={exportStructure} disabled={isExporting}>
            <FileText className="h-4 w-4 mr-2 text-blue-500" />
            <span>Estrutura (.md)</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={exportData} disabled={isExporting}>
            <FileJson className="h-4 w-4 mr-2 text-green-500" />
            <span>Dados (.json)</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* XML Context Dialog */}
      <Dialog open={xmlDialogOpen} onOpenChange={setXmlDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" />
              🧠 Contexto para Análise IA
            </DialogTitle>
          </DialogHeader>
          
          {/* Large Copy Button at TOP */}
          <div className="py-4">
            <Button 
              onClick={copyXmlContext}
              size="lg"
              className={`w-full text-lg font-semibold transition-all duration-300 ${
                xmlContextCopied 
                  ? 'bg-green-600 hover:bg-green-600 text-white' 
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {xmlContextCopied ? (
                <>
                  <Check size={24} className="mr-2" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy size={24} className="mr-2" />
                  COPIAR PARA IA
                </>
              )}
            </Button>
          </div>

          {/* Editable Text Area */}
          <div className="flex-1 min-h-0">
            <Textarea 
              value={xmlContextText}
              onChange={(e) => setXmlContextText(e.target.value)}
              className="h-[400px] font-mono text-xs resize-none"
              placeholder="A gerar contexto..."
            />
          </div>

          {/* Character Counter Footer */}
          <div className="pt-2 border-t border-border flex justify-between items-center text-sm text-muted-foreground">
            <span>
              Período: {format(new Date(), 'MMMM yyyy', { locale: pt })}
            </span>
            <span>
              {xmlContextText.length.toLocaleString()} caracteres
            </span>
          </div>
        </DialogContent>
      </Dialog>

      {/* Genspark Context Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain size={20} className="text-purple-500" />
              Contexto para IA (Genspark)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Reveja e edite o contexto antes de copiar.
            </p>
            <Textarea 
              value={aiContextText}
              onChange={(e) => setAiContextText(e.target.value)}
              className="min-h-[400px] font-mono text-xs"
            />
            <Button 
              onClick={copyAiContext} 
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {aiContextCopied ? (
                <>
                  <Check size={16} className="mr-2" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy size={16} className="mr-2" />
                  Copiar para clipboard
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
