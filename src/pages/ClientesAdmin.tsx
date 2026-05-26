import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useClients, Client } from '@/hooks/useClients';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { useClientStats, ClientHistory } from '@/hooks/useClientStats';
import { useClientDebts } from '@/hooks/useClientDebts';
import { useNextServices } from '@/hooks/useNextServices';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { generateMonthsConfig } from '@/utils/monthConfig';
import {
  Users, Pencil, Trash2, Save, X, Plus, ArrowLeft,
  Phone, MapPin, Loader2, LogOut, History, Euro, Clock,
  CheckCircle, Calendar, TrendingUp, ChevronDown, ChevronUp, Sun, Moon,
  Navigation, Search, CalendarDays, Sparkles, FileText, Star,
  MessageCircle, Copy, Upload, Tag, Cake, AlertTriangle, CalendarPlus,
} from 'lucide-react';
import { generateClientReportPdf } from '@/utils/clientReportPdf';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import logoMayslimpo from '@/assets/logo-mayslimpo.jpg';
import { ClientsViewSkeleton } from '@/components/ui/skeleton-loader';
import ClientAvatar from '@/components/ui/client-avatar';
import EmptyState from '@/components/ui/empty-state';
import LiquidGlassReportModal from '@/components/clients/LiquidGlassReportModal';
import ImportClientsModal from '@/components/clients/ImportClientsModal';
import { openWhatsApp, buildServiceConfirmationMessage, buildSimpleGreeting, normalizePhoneForWhatsApp } from '@/utils/whatsappMessages';
import WhatsAppLangButton from '@/components/whatsapp/WhatsAppLangButton';
import { format, parseISO, differenceInDays } from 'date-fns';
import { pt } from 'date-fns/locale';


const ClientesAdmin = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { clients, loading, addClient, clientExists, toggleFavorite, refetch } = useClients();
  const { allTasks, loading: loadingAgendamentos } = useAgendamentos();
  
  // Generate months config
  const monthsConfig = useMemo(() => generateMonthsConfig(), []);
  
  const { clientStats, getClientHistory, getStatsForMonth, getMonthsWithData } = useClientStats(allTasks, clients, monthsConfig);
  const debtsByClient = useClientDebts(allTasks);
  const nextServices = useNextServices(allTasks);

  
  // Get current month key
  const getCurrentMonthKey = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    for (const [key, config] of Object.entries(monthsConfig)) {
      if (config.year === year && config.monthIndex === month) {
        return key;
      }
    }
    return 'all';
  };
  
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedClientHistory, setSelectedClientHistory] = useState<{
    name: string;
    history: ClientHistory[];
  } | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportClientName, setReportClientName] = useState<string | null>(null);
  const [reportStep, setReportStep] = useState<'month' | 'rate'>('month');
  const [reportSelectedMonth, setReportSelectedMonth] = useState<string | null>(null);
  const [reportHourlyRate, setReportHourlyRate] = useState<string>('7');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    morada: '',
    preco_hora: '7',
    notas: '',
    dias_preferidos: [] as number[],
    frequencia_preferida: 'semanal' as 'semanal' | 'quinzenal',
    periodo_preferido: null as 'manha' | 'tarde' | 'noite' | null,
    duracao_preferida_horas: 3,
    data_nascimento: '' as string,
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // New: filters, sorting, bulk selection, import
  const [sortBy, setSortBy] = useState<'name' | 'favorites' | 'debt' | 'recent' | 'rate' | 'frequent'>('favorites');
  const [filterChip, setFilterChip] = useState<'all' | 'favoritos' | 'devedores' | 'inativos' | 'aniversario' | 'recibo'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showImport, setShowImport] = useState(false);

  // Get stats for selected month
  const monthlyStats = useMemo(() => {
    if (selectedMonth === 'all') return null;
    return getStatsForMonth(selectedMonth);
  }, [selectedMonth, getStatsForMonth]);

  // Get active stats based on selection
  const activeClientStats = useMemo(() => {
    if (selectedMonth === 'all' || !monthlyStats) {
      return clientStats;
    }
    return monthlyStats.clients;
  }, [selectedMonth, monthlyStats, clientStats]);

  // Helper: birthday this month / days until birthday
  const birthdayInfo = (client: Client): { isBirthdayMonth: boolean; daysUntil: number | null } => {
    if (!client.data_nascimento) return { isBirthdayMonth: false, daysUntil: null };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [, m, d] = client.data_nascimento.split('-').map(Number);
    if (!m || !d) return { isBirthdayMonth: false, daysUntil: null };
    const isBirthdayMonth = (today.getMonth() + 1) === m;
    let next = new Date(today.getFullYear(), m - 1, d);
    if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d);
    const daysUntil = Math.floor((next.getTime() - today.getTime()) / 86_400_000);
    return { isBirthdayMonth, daysUntil };
  };

  // Filter + sort clients
  const filteredClients = useMemo(() => {
    const today = new Date();
    let list = [...clients];

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(c =>
        c.nome.toLowerCase().includes(term) ||
        c.telefone.toLowerCase().includes(term) ||
        c.morada.toLowerCase().includes(term) ||
        c.notas.toLowerCase().includes(term) ||
        (c.tags || []).some(t => t.toLowerCase().includes(term)),
      );
    }

    // Filter chips
    if (filterChip === 'favoritos') list = list.filter(c => c.favorito);
    if (filterChip === 'devedores') list = list.filter(c => debtsByClient[c.nome]?.totalDue > 0);
    if (filterChip === 'recibo') list = list.filter(c => c.recibo_verde);
    if (filterChip === 'inativos') {
      list = list.filter(c => {
        const s = clientStats[c.nome];
        if (!s?.lastService) return true;
        return differenceInDays(today, parseISO(s.lastService)) > 30;
      });
    }
    if (filterChip === 'aniversario') {
      list = list.filter(c => birthdayInfo(c).isBirthdayMonth);
    }

    // Sort
    list.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.nome.localeCompare(b.nome);
        case 'favorites':
          if (a.favorito !== b.favorito) return a.favorito ? -1 : 1;
          return a.nome.localeCompare(b.nome);
        case 'debt': {
          const da = debtsByClient[a.nome]?.totalDue || 0;
          const db = debtsByClient[b.nome]?.totalDue || 0;
          return db - da;
        }
        case 'recent': {
          const la = clientStats[a.nome]?.lastService || '0';
          const lb = clientStats[b.nome]?.lastService || '0';
          return lb.localeCompare(la);
        }
        case 'rate': {
          const ra = parseFloat(a.preco_hora) || 0;
          const rb = parseFloat(b.preco_hora) || 0;
          return rb - ra;
        }
        case 'frequent': {
          const ca = clientStats[a.nome]?.totalAgendamentos || 0;
          const cb = clientStats[b.nome]?.totalAgendamentos || 0;
          return cb - ca;
        }
      }
    });

    return list;
  }, [clients, searchTerm, filterChip, sortBy, debtsByClient, clientStats]);

  // Aggregate insights (top of page)
  const insights = useMemo(() => {
    const today = new Date();
    let inactiveCount = 0;
    let totalDebt = 0;
    let totalUnpaidServices = 0;
    let birthdayCount = 0;
    const ytdStart = new Date(today.getFullYear(), 0, 1);
    const ytdByClient: Record<string, number> = {};

    clients.forEach(c => {
      const s = clientStats[c.nome];
      if (s?.lastService && differenceInDays(today, parseISO(s.lastService)) > 30) inactiveCount++;
      const d = debtsByClient[c.nome];
      if (d) { totalDebt += d.totalDue; totalUnpaidServices += d.unpaidCount; }
      if (birthdayInfo(c).isBirthdayMonth) birthdayCount++;
    });

    Object.values(allTasks).flat().forEach(t => {
      if (!t.completed) return;
      if (parseISO(t.date) < ytdStart) return;
      ytdByClient[t.client] = (ytdByClient[t.client] || 0) + (parseFloat(t.price || '0') || 0);
    });

    const top3 = Object.entries(ytdByClient)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, total]) => ({ name, total }));

    return { inactiveCount, totalDebt, totalUnpaidServices, birthdayCount, top3 };
  }, [clients, clientStats, debtsByClient, allTasks]);

  // Tag helpers
  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (!t) return;
    if (formData.tags.includes(t)) { setTagInput(''); return; }
    setFormData(prev => ({ ...prev, tags: [...prev.tags, t] }));
    setTagInput('');
  };
  const removeTag = (t: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(x => x !== t) }));
  };

  // Bulk selection helpers
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  const handleBulkFavorite = async (favorito: boolean) => {
    for (const id of selected) {
      const c = clients.find(x => x.id === id);
      if (c && c.favorito !== favorito) await toggleFavorite(id);
    }
    toast({ title: favorito ? 'Marcados como favoritos' : 'Removidos dos favoritos' });
    clearSelection();
  };
  const handleBulkExportCsv = () => {
    const rows = clients.filter(c => selected.has(c.id));
    const csv = ['Nome,Telefone,Morada,€/h,Tags']
      .concat(rows.map(c => [
        `"${c.nome.replace(/"/g, '""')}"`,
        `"${c.telefone}"`,
        `"${(c.morada || '').replace(/"/g, '""')}"`,
        c.preco_hora,
        `"${(c.tags || []).join('; ')}"`,
      ].join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${rows.length} clientes exportados` });
  };
  const handleBulkWhatsApp = () => {
    const rows = clients.filter(c => selected.has(c.id) && c.telefone);
    if (rows.length === 0) { toast({ title: 'Nenhum tem telefone', variant: 'destructive' }); return; }
    rows.forEach((c, idx) => {
      // Stagger to avoid popup blocker
      setTimeout(() => {
        openWhatsApp(c.telefone, buildSimpleGreeting(c.nome, 'pt'));
      }, idx * 150);
    });
  };

  // Import handler
  const handleImportClients = async (rows: { nome: string; telefone: string; morada: string }[]) => {
    let added = 0;
    let skipped = 0;
    for (const r of rows) {
      if (clientExists(r.nome)) { skipped++; continue; }
      const result = await addClient({
        nome: r.nome,
        telefone: r.telefone || '',
        morada: r.morada || '',
        preco_hora: '7',
        notas: '',
        recibo_verde: false,
        favorito: false,
        dias_preferidos: [],
        frequencia_preferida: 'semanal',
        periodo_preferido: null,
        hora_preferida: null,
        duracao_preferida_horas: 3,
        data_nascimento: null,
        tags: [],
      });
      if (result) added++;
    }
    toast({ title: `${added} criados, ${skipped} ignorados (duplicados)` });
    setShowImport(false);
  };


  // Get months for selector (sorted newest first) - must be before any early return
  const sortedMonths = useMemo(() => {
    const entries = Object.entries(monthsConfig);
    return entries.sort((a, b) => {
      if (a[1].year !== b[1].year) return b[1].year - a[1].year;
      return b[1].monthIndex - a[1].monthIndex;
    });
  }, [monthsConfig]);

  const resetForm = () => {
    setFormData({
      nome: '', telefone: '', morada: '', preco_hora: '7', notas: '',
      dias_preferidos: [], frequencia_preferida: 'semanal', periodo_preferido: null,
      duracao_preferida_horas: 3, data_nascimento: '', tags: [],
    });
    setTagInput('');
    setEditingClient(null);
    setShowForm(false);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      nome: client.nome,
      telefone: client.telefone,
      morada: client.morada,
      preco_hora: client.preco_hora,
      notas: client.notas,
      dias_preferidos: client.dias_preferidos || [],
      frequencia_preferida: client.frequencia_preferida || 'semanal',
      periodo_preferido: client.periodo_preferido,
      duracao_preferida_horas: client.duracao_preferida_horas || 3,
      data_nascimento: client.data_nascimento || '',
      tags: client.tags || [],
    });
    setShowForm(true);
  };

  const handleDuplicate = (client: Client) => {
    setEditingClient(null);
    setFormData({
      nome: `${client.nome} (cópia)`,
      telefone: client.telefone,
      morada: client.morada,
      preco_hora: client.preco_hora,
      notas: client.notas,
      dias_preferidos: client.dias_preferidos || [],
      frequencia_preferida: client.frequencia_preferida || 'semanal',
      periodo_preferido: client.periodo_preferido,
      duracao_preferida_horas: client.duracao_preferida_horas || 3,
      data_nascimento: client.data_nascimento || '',
      tags: client.tags || [],
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    // Check for duplicate name (exclude current client when editing)
    const excludeId = editingClient?.id;
    if (clientExists(formData.nome, excludeId)) {
      toast({
        title: 'Cliente já existe',
        description: `Já existe um cliente com o nome "${formData.nome.trim()}"`,
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update({
            nome: formData.nome.trim(),
            telefone: formData.telefone || null,
            morada: formData.morada || null,
            preco_hora: formData.preco_hora,
            notas: formData.notas || null,
            dias_preferidos: formData.dias_preferidos,
            frequencia_preferida: formData.frequencia_preferida,
            periodo_preferido: formData.periodo_preferido,
            duracao_preferida_horas: formData.duracao_preferida_horas,
            data_nascimento: formData.data_nascimento || null,
            tags: formData.tags,
          } as any)
          .eq('id', editingClient.id);

        if (error) throw error;
        toast({ title: 'Cliente atualizado' });
      } else {
        await addClient({
          ...formData,
          recibo_verde: false,
          favorito: false,
          dias_preferidos: formData.dias_preferidos,
          frequencia_preferida: formData.frequencia_preferida,
          periodo_preferido: formData.periodo_preferido,
          hora_preferida: null,
          duracao_preferida_horas: formData.duracao_preferida_horas,
          data_nascimento: formData.data_nascimento || null,
          tags: formData.tags,
        });
      }
      await refetch();
      resetForm();
    } catch (error: any) {
      toast({ 
        title: 'Erro ao guardar cliente', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja eliminar este cliente?')) return;

    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Cliente eliminado' });
      await refetch();
    } catch (error: any) {
      toast({ 
        title: 'Erro ao eliminar cliente', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  };

  const handleShowHistory = (clientName: string) => {
    const history = getClientHistory(clientName, selectedMonth === 'all' ? null : selectedMonth);
    setSelectedClientHistory({ name: clientName, history });
    setShowHistoryModal(true);
  };

  const handleOpenReportModal = (clientName: string) => {
    // Get client's default hourly rate
    const client = clients.find(c => c.nome === clientName);
    setReportHourlyRate(client?.preco_hora || '7');
    setReportClientName(clientName);
    setReportStep('month');
    setReportSelectedMonth(null);
    setShowReportModal(true);
  };

  const handleSelectReportMonth = (monthKey: string) => {
    setReportSelectedMonth(monthKey);
    setReportStep('rate');
  };

  const handleGenerateReport = async () => {
    if (!reportClientName || !reportSelectedMonth) return;
    
    setGeneratingReport(true);
    const history = getClientHistory(reportClientName, reportSelectedMonth === 'all' ? null : reportSelectedMonth);
    const monthLabel = reportSelectedMonth !== 'all' && monthsConfig[reportSelectedMonth] 
      ? monthsConfig[reportSelectedMonth].label 
      : null;
    
    const hourlyRate = parseFloat(reportHourlyRate) || 0;
    
    try {
      await generateClientReportPdf(reportClientName, history, monthLabel, hourlyRate);
      toast({ title: 'Relatório gerado', description: `PDF de ${reportClientName} criado com sucesso.` });
      setShowReportModal(false);
      setReportClientName(null);
      setReportStep('month');
    } catch (error: any) {
      toast({ 
        title: 'Erro ao gerar relatório', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setReportClientName(null);
    setReportStep('month');
    setReportSelectedMonth(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const username = user?.user_metadata?.name || user?.email?.replace('@local.app', '') || '';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
    const formatted = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    return `${formatted} (${dayName})`;
  };

  const openGoogleMaps = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading || loadingAgendamentos) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header skeleton */}
        <div className="bg-card border-b border-border px-4 py-2">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-muted rounded animate-pulse" />
              <div className="h-8 w-16 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto">
          <ClientsViewSkeleton />
        </div>
      </div>
    );
  }

  // Calculate summary stats based on selected month
  const totalClients = clients.length;
  const activeClients = Object.values(activeClientStats).filter(s => s.totalAgendamentos > 0).length;
  const totalRevenue = monthlyStats?.totals.totalRevenue ?? Object.values(clientStats).reduce((sum, s) => sum + s.totalRevenue, 0);
  const paidRevenue = monthlyStats?.totals.paidRevenue ?? Object.values(clientStats).reduce((sum, s) => sum + s.paidRevenue, 0);
  const totalHours = monthlyStats?.totals.totalHours ?? Object.values(clientStats).reduce((sum, s) => sum + s.totalHours, 0);


  return (
    <div className="bg-background">
      <div className="max-w-4xl mx-auto p-4">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users size={24} className="text-primary" />
            Gestão de Clientes
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowImport(true)}>
              <Upload size={16} className="mr-1" />
              Importar
            </Button>
            <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90">
              <Plus size={16} className="mr-1" />
              Novo Cliente
            </Button>
          </div>
        </div>

        {/* Insights row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => setFilterChip(filterChip === 'inativos' ? 'all' : 'inativos')}
            className={`text-left p-3 rounded-xl border transition ${
              filterChip === 'inativos' ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'
            }`}
          >
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Sem serviço 30d+</p>
            <p className="text-lg font-bold text-foreground">{insights.inactiveCount}</p>
          </button>
          <button
            onClick={() => setFilterChip(filterChip === 'devedores' ? 'all' : 'devedores')}
            className={`text-left p-3 rounded-xl border transition ${
              filterChip === 'devedores' ? 'border-destructive bg-destructive/10' : 'border-border bg-card hover:border-destructive/40'
            }`}
          >
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Em dívida</p>
            <p className="text-lg font-bold text-destructive">€{insights.totalDebt.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">{insights.totalUnpaidServices} serviços</p>
          </button>
          <button
            onClick={() => setFilterChip(filterChip === 'aniversario' ? 'all' : 'aniversario')}
            className={`text-left p-3 rounded-xl border transition ${
              filterChip === 'aniversario' ? 'border-pink-500 bg-pink-500/10' : 'border-border bg-card hover:border-pink-500/40'
            }`}
          >
            <p className="text-[10px] uppercase font-bold text-muted-foreground">🎂 Este mês</p>
            <p className="text-lg font-bold text-pink-500">{insights.birthdayCount}</p>
          </button>
          <div className="p-3 rounded-xl border border-border bg-card">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Top YTD</p>
            {insights.top3.length === 0 ? (
              <p className="text-xs text-muted-foreground">—</p>
            ) : (
              insights.top3.map((t, i) => (
                <p key={t.name} className="text-[11px] text-foreground truncate">
                  {i + 1}. {t.name} <span className="text-success font-semibold">€{t.total.toFixed(0)}</span>
                </p>
              ))
            )}
          </div>
        </div>


        {/* Month Selector - Compact horizontal scroll */}
        <div className="mb-6">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex items-center overflow-x-auto scrollbar-hide">
              {/* All option */}
              <button
                onClick={() => setSelectedMonth('all')}
                className={`flex-shrink-0 px-5 py-3 text-sm font-medium transition-all border-b-2 ${
                  selectedMonth === 'all'
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                Geral
              </button>
              
              <div className="w-px h-8 bg-border flex-shrink-0" />
              
              {/* Months grouped inline */}
              {(() => {
                const byYear: Record<number, Array<[string, typeof monthsConfig[string]]>> = {};
                sortedMonths.forEach(([key, config]) => {
                  if (!byYear[config.year]) byYear[config.year] = [];
                  byYear[config.year].push([key, config]);
                });
                
                const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);
                
                return years.map((year, yearIdx) => (
                  <div key={year} className="flex items-center flex-shrink-0">
                    {yearIdx > 0 && <div className="w-px h-8 bg-border" />}
                    <span className="px-3 py-3 text-xs font-bold text-muted-foreground/60 flex-shrink-0">
                      {year}
                    </span>
                    {byYear[year]
                      .sort((a, b) => a[1].monthIndex - b[1].monthIndex)
                      .map(([key, config]) => {
                        const isSelected = selectedMonth === key;
                        const monthStats = getStatsForMonth(key);
                        const hasData = monthStats && monthStats.totals.totalAgendamentos > 0;
                        const monthAbbr = config.label.split(' ')[0].slice(0, 3);
                        
                        // Check if current month
                        const now = new Date();
                        const isCurrentMonth = config.year === now.getFullYear() && config.monthIndex === now.getMonth();
                        
                        return (
                          <button
                            key={key}
                            onClick={() => setSelectedMonth(key)}
                            className={`relative flex-shrink-0 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                              isSelected
                                ? 'border-primary text-primary bg-primary/5'
                                : isCurrentMonth
                                  ? 'border-transparent text-success hover:bg-secondary/50'
                                  : hasData
                                    ? 'border-transparent text-foreground hover:bg-secondary/50'
                                    : 'border-transparent text-muted-foreground/40 hover:text-muted-foreground hover:bg-secondary/30'
                            }`}
                          >
                            {monthAbbr}
                            {isCurrentMonth && !isSelected && (
                              <span className="absolute top-2 right-1 w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                            )}
                            {hasData && !isCurrentMonth && !isSelected && (
                              <span className="absolute top-2 right-1 w-1 h-1 bg-primary/50 rounded-full" />
                            )}
                          </button>
                        );
                      })}
                  </div>
                ));
              })()}
            </div>
          </div>
          
          {/* Selected month indicator */}
          {selectedMonth !== 'all' && monthlyStats && (
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                A mostrar: <strong className="text-foreground">{monthlyStats.monthLabel}</strong>
              </span>
              <button onClick={() => setSelectedMonth('all')} className="text-primary hover:underline">
                Limpar filtro
              </button>
            </div>
          )}
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-card rounded-xl shadow-sm p-4 border border-border transition-all duration-200 hover:shadow-md">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {selectedMonth === 'all' ? 'Total Clientes' : 'Clientes Ativos'}
                </p>
                <p className="text-xl font-bold text-primary">
                  {selectedMonth === 'all' ? totalClients : activeClients}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl shadow-sm p-4 border border-border transition-all duration-200 hover:shadow-md">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {selectedMonth === 'all' ? 'Clientes Ativos' : 'Agendamentos'}
                </p>
                <p className="text-xl font-bold text-primary">
                  {selectedMonth === 'all' ? activeClients : (monthlyStats?.totals.totalAgendamentos || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl shadow-sm p-4 border border-border transition-all duration-200 hover:shadow-md">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-success/10 rounded-lg">
                <Euro size={18} className="text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {paidRevenue >= totalRevenue ? 'Faturado' : 'Faturado / Pago'}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-success">€{totalRevenue.toFixed(0)}</span>
                  {paidRevenue < totalRevenue && (
                    <span className="text-sm text-violet-500 font-medium">/ €{paidRevenue.toFixed(0)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl shadow-sm p-4 border border-border transition-all duration-200 hover:shadow-md">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock size={18} className="text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Horas Trabalhadas</p>
                <p className="text-xl font-bold text-warning">{totalHours.toFixed(0)}h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Month Indicator */}
        {selectedMonth !== 'all' && monthlyStats && (
          <div className="mb-4 p-3 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground">
                A mostrar estatísticas de <strong>{monthlyStats.monthLabel}</strong>
              </span>
            </div>
            <button
              onClick={() => setSelectedMonth('all')}
              className="text-xs text-primary hover:underline"
            >
              Ver todos
            </button>
          </div>
        )}

        {/* Search + Filter + Sort Bar */}
        <div className="mb-4 space-y-2">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Pesquisar por nome, telefone, morada, tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-border rounded-xl bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap items-center gap-2">
            {([
              { v: 'all', label: 'Todos' },
              { v: 'favoritos', label: '⭐ Favoritos' },
              { v: 'devedores', label: '💸 Devedores' },
              { v: 'inativos', label: '⏳ Inativos 30d+' },
              { v: 'aniversario', label: '🎂 Aniv. este mês' },
              { v: 'recibo', label: '🧾 Recibo verde' },
            ] as const).map(c => (
              <button
                key={c.v}
                onClick={() => setFilterChip(c.v)}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium transition ${
                  filterChip === c.v
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                }`}
              >
                {c.label}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-card border border-border rounded-md px-2 py-1 text-foreground"
              >
                <option value="favorites">Favoritos primeiro</option>
                <option value="name">Nome (A-Z)</option>
                <option value="debt">Maior dívida</option>
                <option value="recent">Mais recente</option>
                <option value="rate">€/h mais alto</option>
                <option value="frequent">Mais frequente</option>
              </select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {filteredClients.length} de {clients.length} cliente{clients.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="sticky top-2 z-30 mb-4 p-3 rounded-xl bg-primary text-primary-foreground shadow-lg flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">{selected.size} selecionado{selected.size !== 1 ? 's' : ''}</span>
            <Button size="sm" variant="secondary" onClick={handleBulkWhatsApp}>
              <MessageCircle size={14} className="mr-1" /> WhatsApp
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleBulkFavorite(true)}>
              <Star size={14} className="mr-1" /> Favoritar
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleBulkFavorite(false)}>
              Remover favorito
            </Button>
            <Button size="sm" variant="secondary" onClick={handleBulkExportCsv}>
              <FileText size={14} className="mr-1" /> Exportar CSV
            </Button>
            <Button size="sm" variant="ghost" className="ml-auto text-primary-foreground" onClick={clearSelection}>
              <X size={14} className="mr-1" /> Limpar
            </Button>
          </div>
        )}

        {/* Import modal */}
        {showImport && (
          <ImportClientsModal
            onImport={handleImportClients}
            onClose={() => setShowImport(false)}
          />
        )}


        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={resetForm} />
            <div className="bg-card rounded-xl shadow-xl w-full max-w-md relative z-10 max-h-[90vh] flex flex-col overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 rounded-t-xl flex justify-between items-center shrink-0">
                <h2 className="text-lg font-bold">
                  {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                </h2>
                <button onClick={resetForm} className="hover:bg-white/20 p-1 rounded">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Nome <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full p-2 border border-border rounded-lg bg-input text-foreground"
                    placeholder="Nome do cliente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full p-2 border border-border rounded-lg bg-input text-foreground"
                    placeholder="Ex: 912 345 678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">Morada</label>
                  <input
                    type="text"
                    value={formData.morada}
                    onChange={(e) => setFormData({ ...formData, morada: e.target.value })}
                    className="w-full p-2 border border-border rounded-lg bg-input text-foreground"
                    placeholder="Rua..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">€/hora</label>
                  <input
                    type="number"
                    value={formData.preco_hora}
                    onChange={(e) => setFormData({ ...formData, preco_hora: e.target.value })}
                    className="w-full p-2 border border-border rounded-lg bg-input text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">Notas</label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    className="w-full p-2 border border-border rounded-lg bg-input text-foreground"
                    rows={2}
                    placeholder="Observações..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Data de nascimento
                  </label>
                  <input
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                    className="w-full p-2 border border-border rounded-lg bg-input text-foreground"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Opcional — usada para lembrar aniversários no Dashboard.
                  </p>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Tags / Etiquetas
                  </label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {formData.tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {t}
                        <button type="button" onClick={() => removeTag(t)} className="hover:text-destructive">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      className="flex-1 p-2 border border-border rounded-lg bg-input text-foreground text-sm"
                      placeholder="ex: vivenda, tem cão, porteiro..."
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addTag}>+</Button>
                  </div>
                </div>




                {/* === Preferências de agendamento === */}
                <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Star size={14} className="text-amber-500" />
                    <h3 className="text-sm font-semibold text-card-foreground">
                      Preferências de agendamento
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground -mt-1">
                    Usadas para auto-agendar clientes fixos/favoritos primeiro.
                  </p>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Dias da semana preferidos
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((label, idx) => {
                        const active = formData.dias_preferidos.includes(idx);
                        return (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                dias_preferidos: active
                                  ? prev.dias_preferidos.filter(d => d !== idx)
                                  : [...prev.dias_preferidos, idx],
                              }));
                            }}
                            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition ${
                              active
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Frequência
                    </label>
                    <div className="flex gap-1.5">
                      {[
                        { v: 'semanal' as const, label: 'Todas as semanas' },
                        { v: 'quinzenal' as const, label: 'De 2 em 2 semanas' },
                      ].map(opt => (
                        <button
                          type="button"
                          key={opt.v}
                          onClick={() => setFormData(prev => ({ ...prev, frequencia_preferida: opt.v }))}
                          className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md border transition ${
                            formData.frequencia_preferida === opt.v
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Período preferido
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { v: null as null, label: 'Sem pref.' },
                        { v: 'manha' as const, label: 'Manhã' },
                        { v: 'tarde' as const, label: 'Tarde' },
                        { v: 'noite' as const, label: 'Noite' },
                      ].map(opt => (
                        <button
                          type="button"
                          key={String(opt.v)}
                          onClick={() => setFormData(prev => ({ ...prev, periodo_preferido: opt.v }))}
                          className={`px-2 py-1.5 text-xs font-medium rounded-md border transition ${
                            formData.periodo_preferido === opt.v
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Duração típica
                    </label>
                    {(() => {
                      const total = formData.duracao_preferida_horas || 0;
                      const horas = Math.floor(total);
                      const minutos = Math.round((total - horas) * 60);
                      const setDuration = (h: number, m: number) =>
                        setFormData({ ...formData, duracao_preferida_horas: h + m / 60 });
                      return (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] uppercase tracking-wide text-muted-foreground/70 mb-1">
                                Horas
                              </label>
                              <select
                                value={horas}
                                onChange={(e) => setDuration(Number(e.target.value), minutos)}
                                className="w-full p-2 border border-border rounded-lg bg-card text-foreground text-sm"
                              >
                                {Array.from({ length: 13 }, (_, i) => i).map(h => (
                                  <option key={h} value={h}>{h}h</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase tracking-wide text-muted-foreground/70 mb-1">
                                Minutos
                              </label>
                              <select
                                value={minutos}
                                onChange={(e) => setDuration(horas, Number(e.target.value))}
                                className="w-full p-2 border border-border rounded-lg bg-card text-foreground text-sm"
                              >
                                {[0, 15, 30, 45].map(m => (
                                  <option key={m} value={m}>{m} min</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {[
                              { label: '2h', v: 2 },
                              { label: '2h30', v: 2.5 },
                              { label: '3h', v: 3 },
                              { label: '3h30', v: 3.5 },
                              { label: '4h', v: 4 },
                            ].map(p => (
                              <button
                                type="button"
                                key={p.label}
                                onClick={() => setFormData({ ...formData, duracao_preferida_horas: p.v })}
                                className={`px-2 py-0.5 text-[11px] rounded-md border transition ${
                                  total === p.v
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-primary to-primary/80"
                >
                  {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                  {editingClient ? 'Guardar Alterações' : 'Criar Cliente'}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && selectedClientHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowHistoryModal(false)} />
            <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl relative z-10 max-h-[80vh] flex flex-col">
              <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 rounded-t-xl flex justify-between items-center">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <History size={20} />
                  Histórico: {selectedClientHistory.name}
                </h2>
                <button onClick={() => setShowHistoryModal(false)} className="hover:bg-white/20 p-1 rounded">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                {selectedClientHistory.history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Sem histórico de agendamentos</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedClientHistory.history.map((item) => (
                      <div 
                        key={item.id} 
                        className={`p-3 rounded-lg border ${
                          item.completed 
                            ? 'bg-success/10 border-success/30' 
                            : 'bg-warning/10 border-warning/30'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {formatDate(item.date)}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                item.completed 
                                  ? 'bg-success/20 text-success' 
                                  : 'bg-warning/20 text-warning'
                              }`}>
                                {item.completed ? 'Concluído' : 'Pendente'}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {item.startTime} - {item.endTime}
                              {item.address && (
                                <span className="ml-2 text-muted-foreground/60">• {item.address}</span>
                              )}
                            </div>
                            {item.notes && (
                              <p className="text-xs text-muted-foreground/60 mt-1 italic">{item.notes}</p>
                            )}
                          </div>
                          <span className="font-bold text-success">€{item.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-border bg-secondary rounded-b-xl">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total de agendamentos: <strong>{selectedClientHistory.history.length}</strong>
                  </span>
                  <span className="text-success font-bold">
                    Total: €{selectedClientHistory.history
                      .filter(h => h.completed)
                      .reduce((sum, h) => sum + parseFloat(h.price), 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Liquid Glass Report Modal */}
        <LiquidGlassReportModal
          isOpen={showReportModal && !!reportClientName}
          onClose={handleCloseReportModal}
          clientName={reportClientName || ''}
          reportStep={reportStep}
          setReportStep={setReportStep}
          reportSelectedMonth={reportSelectedMonth}
          setReportSelectedMonth={setReportSelectedMonth}
          reportHourlyRate={reportHourlyRate}
          setReportHourlyRate={setReportHourlyRate}
          onGenerateReport={handleGenerateReport}
          generatingReport={generatingReport}
          monthsConfig={monthsConfig}
          sortedMonths={sortedMonths}
          getStatsForMonth={getStatsForMonth}
        />

        {/* Clients List */}
        {clients.length === 0 ? (
          <EmptyState 
            type="clients"
            action={
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus size={16} />
                Adicionar primeiro cliente
              </Button>
            }
          />
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <Search size={48} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhum cliente encontrado para "{searchTerm}"</p>
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-2 text-primary hover:underline text-sm"
            >
              Limpar pesquisa
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredClients.map((client) => {
              const stats = activeClientStats[client.nome];
              const lifetimeStats = clientStats[client.nome];
              const isExpanded = expandedClient === client.id;
              const next = nextServices[client.nome];
              const bday = birthdayInfo(client);
              const isSelected = selected.has(client.id);

              return (
                <div
                  key={client.id}
                  className={`bg-card rounded-xl shadow-sm border transition overflow-hidden ${
                    isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:shadow-md'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 flex gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(client.id)}
                          className="mt-2 h-4 w-4 accent-primary cursor-pointer"
                          aria-label="Selecionar cliente"
                        />
                        <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <ClientAvatar name={client.nome} size="lg" />
                          <div className="min-w-0">

                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-card-foreground text-lg">{client.nome}</h3>
                              <button
                                onClick={() => toggleFavorite(client.id)}
                                className={`p-1 rounded-full transition-all ${
                                  client.favorito
                                    ? 'text-amber-400 hover:text-amber-500'
                                    : 'text-muted-foreground/30 hover:text-amber-400'
                                }`}
                                title={client.favorito ? 'Remover dos favoritos' : 'Marcar como favorito'}
                                aria-label={client.favorito ? 'Remover dos favoritos' : 'Marcar como favorito'}
                              >
                                <Star size={18} className={client.favorito ? 'fill-current' : ''} />
                              </button>
                              {client.favorito && (
                                <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-500">
                                  Fixo
                                </span>
                              )}
                              {(() => {
                                const debt = debtsByClient[client.nome];
                                if (!debt || debt.daysOld < 7) return null;
                                const tone = debt.daysOld >= 30
                                  ? 'bg-destructive/15 text-destructive border-destructive/30'
                                  : 'bg-warning/15 text-warning border-warning/30';
                                return (
                                  <span
                                    title={`€${debt.totalDue.toFixed(2)} em ${debt.unpaidCount} serviço(s) por pagar há ${debt.daysOld} dia(s)`}
                                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${tone}`}
                                  >
                                    <Euro size={10} />
                                    {debt.daysOld}d · €{debt.totalDue.toFixed(0)}
                                  </span>
                                );
                              })()}
                            </div>
                            {stats && stats.totalAgendamentos > 0 && (
                              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full inline-block mt-1">
                                {stats.totalAgendamentos} agendamento{stats.totalAgendamentos !== 1 ? 's' : ''}
                                {selectedMonth !== 'all' && monthlyStats && (
                                  <span className="ml-1 opacity-70">em {monthlyStats.monthLabel.split(' ')[0]}</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          {client.telefone && (
                            <a 
                              href={`tel:${client.telefone}`}
                              className="flex items-center gap-2 hover:text-primary transition-colors"
                            >
                              <Phone size={14} className="text-primary" />
                              {client.telefone}
                            </a>
                          )}
                          {client.morada && (
                            <button
                              onClick={() => openGoogleMaps(client.morada)}
                              className="flex items-center gap-2 hover:text-primary transition-colors text-left group"
                            >
                              <MapPin size={14} className="text-muted-foreground group-hover:text-primary" />
                              <span className="group-hover:underline">{client.morada}</span>
                              <Navigation size={12} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          )}
                          <div className="text-success font-medium">
                            €{client.preco_hora}/hora
                          </div>
                          {(client.dias_preferidos?.length > 0 || client.periodo_preferido) && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {client.dias_preferidos?.length > 0 && (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                  <CalendarDays size={11} />
                                  {client.dias_preferidos
                                    .slice()
                                    .sort((a, b) => a - b)
                                    .map(d => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d])
                                    .join(', ')}
                                  {client.frequencia_preferida === 'quinzenal' && ' · 2/2 sem'}
                                </span>
                              )}
                              {client.periodo_preferido && (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-600 dark:text-amber-400">
                                  <Clock size={11} />
                                  {{ manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' }[client.periodo_preferido]}
                                  {' · '}{(() => {
                                    const t = client.duracao_preferida_horas || 0;
                                    const h = Math.floor(t);
                                    const m = Math.round((t - h) * 60);
                                    return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
                                  })()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {client.notas && (
                          <p className="mt-2 text-xs text-muted-foreground italic">{client.notas}</p>
                        )}
                        {/* Tags */}
                        {(client.tags || []).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {client.tags.map(t => (
                              <span key={t} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                <Tag size={9} />{t}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Mini stats + next service + birthday */}
                        {(lifetimeStats?.totalAgendamentos > 0 || next || bday.isBirthdayMonth) && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {lifetimeStats?.totalAgendamentos > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {lifetimeStats.concluidos} ✓ · {lifetimeStats.totalHours.toFixed(0)}h · €{lifetimeStats.totalRevenue.toFixed(0)}
                                {lifetimeStats.lastService && ` · há ${differenceInDays(new Date(), parseISO(lifetimeStats.lastService))}d`}
                              </span>
                            )}
                            {next && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success font-medium">
                                <CalendarPlus size={10} className="inline mr-0.5" />
                                Próximo: {format(parseISO(next.date), "d MMM", { locale: pt })} {next.startTime}
                                {next.daysAhead === 0 ? ' (hoje)' : next.daysAhead === 1 ? ' (amanhã)' : ` (em ${next.daysAhead}d)`}
                              </span>
                            )}
                            {!next && client.favorito && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/15 text-warning font-medium">
                                <AlertTriangle size={10} className="inline mr-0.5" />
                                Sem próximo serviço
                              </span>
                            )}
                            {bday.daysUntil !== null && bday.daysUntil <= 14 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-600 dark:text-pink-400 font-medium">
                                <Cake size={10} className="inline mr-0.5" />
                                {bday.daysUntil === 0 ? 'Aniversário hoje!' : `Aniv. em ${bday.daysUntil}d`}
                              </span>
                            )}
                          </div>
                        )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {client.telefone && (
                          <WhatsAppLangButton
                            prefKey={client.id}
                            getMessage={(lang) => next
                              ? buildServiceConfirmationMessage(client.nome, next.date, next.startTime, next.endTime, lang)
                              : buildSimpleGreeting(client.nome, lang)}
                            onPick={(msg) => openWhatsApp(client.telefone, msg)}
                            className="inline-flex items-center justify-center h-8 px-3 rounded-md border border-input bg-background hover:bg-accent text-green-600 hover:bg-green-500/10 text-sm font-medium"
                            title="Enviar WhatsApp"
                            ariaLabel="WhatsApp"
                          >
                            <MessageCircle size={14} />
                          </WhatsAppLangButton>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicate(client)}
                          title="Duplicar cliente"
                        >
                          <Copy size={14} />
                        </Button>

                        {client.morada && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openGoogleMaps(client.morada)}
                            className="text-primary hover:text-primary hover:bg-primary/10"
                            title="Navegar no Google Maps"
                          >
                            <Navigation size={14} />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShowHistory(client.nome)}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          title="Ver histórico"
                        >
                          <History size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenReportModal(client.nome)}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          title="Gerar relatório de serviços (PDF)"
                        >
                          <FileText size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(client)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(client.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>

                    {/* Stats toggle */}
                    {stats && stats.totalAgendamentos > 0 && (
                      <button
                        onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                        className="mt-3 text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isExpanded ? 'Ocultar estatísticas' : 'Ver estatísticas'}
                      </button>
                    )}
                  </div>

                  {/* Expanded Stats */}
                  {isExpanded && stats && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="bg-secondary rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-success" />
                          <div>
                            <p className="text-xs text-muted-foreground">Concluídos</p>
                            <p className="font-bold text-card-foreground">{stats.concluidos}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-warning" />
                          <div>
                            <p className="text-xs text-muted-foreground">Pendentes</p>
                            <p className="font-bold text-card-foreground">{stats.pendentes}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Euro size={16} className="text-success" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {stats.paidRevenue >= stats.totalRevenue ? 'Faturado' : 'Faturado / Pago'}
                            </p>
                            <div className="flex items-baseline gap-1">
                              <span className="font-bold text-success">€{stats.totalRevenue.toFixed(2)}</span>
                              {stats.paidRevenue < stats.totalRevenue && (
                                <span className="text-xs text-violet-500">/ €{stats.paidRevenue.toFixed(2)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp size={16} className="text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Horas Trabalhadas</p>
                            <p className="font-bold text-card-foreground">{stats.totalHours.toFixed(1)}h</p>
                          </div>
                        </div>
                      </div>
                      {stats.firstService && stats.lastService && (
                        <div className="mt-2 text-xs text-muted-foreground flex gap-4 flex-wrap">
                          <span>Primeiro serviço: {formatDate(stats.firstService)}</span>
                          <span>Último serviço: {formatDate(stats.lastService)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          {clients.length} cliente{clients.length !== 1 ? 's' : ''} guardado{clients.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};

export default ClientesAdmin;
