import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { Brain, Copy, Check } from 'lucide-react';
import { Task, AllTasks } from '@/hooks/useAgendamentos';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { pt } from 'date-fns/locale';

interface ExportAiContextButtonProps {
  allTasks: AllTasks;
  clients: Array<{
    id: string;
    nome: string;
    telefone?: string | null;
    morada?: string | null;
    preco_hora?: string | null;
    notas?: string | null;
  }>;
}

export const ExportAiContextButton: React.FC<ExportAiContextButtonProps> = ({ allTasks, clients }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiContextText, setAiContextText] = useState('');
  const { toast } = useToast();

  // Get current month's tasks
  const currentMonthTasks = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    
    const allTasksFlat: Task[] = Object.values(allTasks).flat();
    return allTasksFlat.filter(task => {
      const taskDate = parseISO(task.date);
      return isWithinInterval(taskDate, { start, end });
    });
  }, [allTasks]);

  // Calculate metrics for current month
  const metrics = useMemo(() => {
    const completedTasks = currentMonthTasks.filter(t => t.completed);
    const pendingTasks = currentMonthTasks.filter(t => !t.completed);
    
    const totalRevenue = completedTasks.reduce((sum, t) => sum + parseFloat(t.price || '0'), 0);
    const pendingRevenue = pendingTasks.reduce((sum, t) => sum + parseFloat(t.price || '0'), 0);
    
    const totalHours = completedTasks.reduce((sum, task) => {
      const start = new Date(`1970-01-01T${task.startTime}`);
      const end = new Date(`1970-01-01T${task.endTime}`);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
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
      
      const start = new Date(`1970-01-01T${task.startTime}`);
      const end = new Date(`1970-01-01T${task.endTime}`);
      clientRevenue[task.client].hours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    });
    
    const topClients = Object.values(clientRevenue)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    
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
      completionRate: currentMonthTasks.length > 0 
        ? Math.round((completedTasks.length / currentMonthTasks.length) * 100) 
        : 0,
    };
  }, [currentMonthTasks]);

  // Generate last 20 time logs
  const recentLogs = useMemo(() => {
    const allTasksFlat: Task[] = Object.values(allTasks).flat();
    return allTasksFlat
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);
  }, [allTasks]);

  // Detect alerts
  const alerts = useMemo(() => {
    const alertsList: string[] = [];
    
    // Open logs (pending tasks)
    if (metrics.pendingCount > 0) {
      alertsList.push(`PENDING_TASKS: ${metrics.pendingCount} tasks awaiting completion`);
    }
    
    // Low completion rate
    if (metrics.completionRate < 70 && metrics.totalTasks > 5) {
      alertsList.push(`LOW_COMPLETION_RATE: ${metrics.completionRate}% completion rate detected`);
    }
    
    // High workload
    if (metrics.totalHours > 160) {
      alertsList.push(`HIGH_WORKLOAD: ${metrics.totalHours.toFixed(1)} hours worked this month`);
    }
    
    // Revenue anomalies (pending > completed)
    if (metrics.pendingRevenue > metrics.totalRevenue && metrics.totalTasks > 5) {
      alertsList.push(`REVENUE_ANOMALY: Pending revenue (€${metrics.pendingRevenue.toFixed(2)}) exceeds completed (€${metrics.totalRevenue.toFixed(2)})`);
    }
    
    return alertsList;
  }, [metrics]);

  const generateXmlContext = () => {
    const now = new Date();
    const currentMonth = format(now, 'MMMM yyyy', { locale: pt });
    
    const xml = `<AI_ANALYSIS_INPUT>
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
    <table name="user_roles">
      <field name="user_id" type="uuid" description="User identifier"/>
      <field name="role" type="enum" values="admin,neury" description="User role"/>
    </table>
  </DATABASE_SCHEMA>

  <METRICS period="${currentMonth}">
    <kpi name="total_hours" value="${metrics.totalHours.toFixed(1)}" unit="hours"/>
    <kpi name="total_revenue_completed" value="${metrics.totalRevenue.toFixed(2)}" unit="EUR"/>
    <kpi name="total_revenue_pending" value="${metrics.pendingRevenue.toFixed(2)}" unit="EUR"/>
    <kpi name="avg_revenue_per_hour" value="${metrics.avgRevenuePerHour.toFixed(2)}" unit="EUR/hour"/>
    <kpi name="total_services" value="${metrics.totalTasks}" unit="count"/>
    <kpi name="services_completed" value="${metrics.completedCount}" unit="count"/>
    <kpi name="services_pending" value="${metrics.pendingCount}" unit="count"/>
    <kpi name="completion_rate" value="${metrics.completionRate}" unit="percent"/>
    <kpi name="active_clients" value="${metrics.uniqueClients}" unit="count"/>
    <kpi name="total_registered_clients" value="${clients.length}" unit="count"/>
    <kpi name="estimated_profit" value="${(metrics.totalRevenue * 0.6).toFixed(2)}" unit="EUR" note="60% margin estimate"/>
  </METRICS>

  <WORKFORCE>
    <employee name="Neury" role="cleaner" status="active">
      <rate type="default">7.00 EUR/hour</rate>
      <hours_this_period>${metrics.totalHours.toFixed(1)}</hours_this_period>
    </employee>
    <clients_list count="${clients.length}">
${clients.map(c => `      <client name="${c.nome}" rate="${c.preco_hora || '7'}" address="${c.morada || 'N/A'}"/>`).join('\n')}
    </clients_list>
  </WORKFORCE>

  <TIME_LOGS recent_count="20">
${recentLogs.map(log => `    <log date="${log.date}" client="${log.client}" start="${log.startTime}" end="${log.endTime}" status="${log.completed ? 'completed' : 'pending'}" price="${log.price || '0'}"/>`).join('\n')}
  </TIME_LOGS>

  <ALERTS count="${alerts.length}">
${alerts.length > 0 ? alerts.map(a => `    <alert type="${a.split(':')[0]}" message="${a.split(':')[1]?.trim() || a}"/>`).join('\n') : '    <alert type="NONE" message="No critical alerts detected"/>'}
  </ALERTS>

  <CLIENT_PERFORMANCE>
${metrics.topClients.map((c, i) => `    <client rank="${i + 1}" name="${c.name}" total_revenue="${c.total.toFixed(2)}" services="${c.count}" hours="${c.hours.toFixed(1)}" efficiency="${(c.total / (c.hours || 1)).toFixed(2)}"/>`).join('\n')}
  </CLIENT_PERFORMANCE>

  <ANALYSIS_DIRECTIVES>
    <directive priority="1">Identify inefficiencies in service delivery and scheduling</directive>
    <directive priority="2">Evaluate client profitability and recommend optimization</directive>
    <directive priority="3">Detect patterns in completion rates and payment delays</directive>
    <directive priority="4">Recommend one primary focus for immediate improvement</directive>
    <directive priority="5">Suggest automation or process improvements</directive>
  </ANALYSIS_DIRECTIVES>
</AI_ANALYSIS_INPUT>`;

    return xml;
  };

  const handleOpenDialog = () => {
    const xml = generateXmlContext();
    setAiContextText(xml);
    setCopied(false);
    setIsOpen(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(aiContextText);
      setCopied(true);
      toast({
        title: "Contexto copiado!",
        description: "Pronto para colar na sua ferramenta de IA",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Tente selecionar e copiar manualmente",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleOpenDialog}
          className="flex items-center gap-2"
        >
          <Brain size={16} />
          🧠 Exportar contexto para IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain size={20} />
            Contexto para Análise IA
          </DialogTitle>
        </DialogHeader>
        
        {/* Large Copy Button at TOP */}
        <div className="py-4">
          <Button 
            onClick={handleCopy}
            size="lg"
            className={`w-full text-lg font-semibold transition-all duration-300 ${
              copied 
                ? 'bg-green-600 hover:bg-green-600 text-white' 
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {copied ? (
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
            value={aiContextText}
            onChange={(e) => setAiContextText(e.target.value)}
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
            {aiContextText.length.toLocaleString()} caracteres
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
