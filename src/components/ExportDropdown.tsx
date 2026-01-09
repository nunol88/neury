import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileJson, FileText, Brain, FileDown, ChevronDown } from "lucide-react";
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

interface ExportDropdownProps {
  onExportPDF: () => void;
  generateAiContext: () => string;
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
- AiAssistant.tsx - Assistente IA integrado
- CalendarModal.tsx - Modal de calendário
- NavLink.tsx - Links de navegação

### Hooks (src/hooks/)
- useAgendamentos.ts - CRUD de agendamentos
- useClients.ts - CRUD de clientes
- usePayments.ts - Gestão de pagamentos
- useClientStats.ts - Estatísticas de clientes
- useAiAssistant.ts - Integração com IA
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

export function ExportDropdown({ onExportPDF, generateAiContext }: ExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiContextText, setAiContextText] = useState('');
  const [aiContextCopied, setAiContextCopied] = useState(false);

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
