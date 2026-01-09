import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePayments } from '@/hooks/usePayments';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Euro, 
  CheckCircle2, 
  Clock, 
  Search,
  User,
  Calendar
} from 'lucide-react';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const Pagamentos: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');

  const { 
    loading, 
    summary, 
    clientSummaries, 
    markAsPaid, 
    markAsUnpaid, 
    markMultipleAsPaid 
  } = usePayments(selectedMonth, selectedYear);

  const filteredClients = clientSummaries.filter(client => {
    const matchesSearch = client.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'paid') {
      return matchesSearch && client.totalPending === 0;
    }
    if (statusFilter === 'pending') {
      return matchesSearch && client.totalPending > 0;
    }
    return matchesSearch;
  });

  const handleTogglePayment = async (id: string, currentlyPaid: boolean) => {
    if (currentlyPaid) {
      await markAsUnpaid(id);
    } else {
      await markAsPaid(id);
    }
  };

  const handleMarkAllPaid = async (clientName: string) => {
    const client = clientSummaries.find(c => c.clientName === clientName);
    if (!client) return;

    const unpaidIds = client.services.filter(s => !s.pago).map(s => s.id);
    if (unpaidIds.length > 0) {
      await markMultipleAsPaid(unpaidIds);
    }
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}`;
  };

  const formatCurrency = (value: number) => {
    return `€${value.toFixed(2)}`;
  };

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className={`min-h-screen bg-background ${theme}`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/admin/agendamentos')}
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Euro size={24} className="text-primary" />
                Controlo de Pagamentos
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select 
            value={String(selectedMonth)} 
            onValueChange={(v) => setSelectedMonth(Number(v))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, idx) => (
                <SelectItem key={idx} value={String(idx)}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={String(selectedYear)} 
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={statusFilter} 
            onValueChange={(v) => setStatusFilter(v as 'all' | 'paid' | 'pending')}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Pesquisar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(summary.totalInvoiced)}
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Euro size={14} />
                Faturado
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summary.totalPaid)}
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <CheckCircle2 size={14} className="text-green-600" />
                Recebido
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 dark:border-orange-800">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(summary.totalPending)}
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Clock size={14} className="text-orange-600" />
                Pendente
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-32 bg-muted/50" />
              </Card>
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <CheckCircle2 size={48} className="mx-auto mb-3 text-green-500" />
              <p className="font-medium">Sem pagamentos pendentes</p>
              <p className="text-sm mt-1">Todos os serviços deste período foram pagos.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredClients.map((client) => (
              <Card key={client.clientName}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User size={18} className="text-primary" />
                      {client.clientName}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {client.totalPending > 0 ? (
                        <Badge variant="outline" className="border-orange-300 text-orange-600">
                          Falta: {formatCurrency(client.totalPending)}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-green-300 text-green-600">
                          Tudo pago
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {client.services.length} serviço(s) | 
                    Total: {formatCurrency(client.totalInvoiced)} | 
                    Pago: {formatCurrency(client.totalPaid)}
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-2">
                    {client.services.map((service) => (
                      <div 
                        key={service.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          service.pago 
                            ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                            : 'bg-muted/30 border-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={service.pago}
                            onCheckedChange={() => handleTogglePayment(service.id, service.pago)}
                          />
                          <div>
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Calendar size={14} className="text-muted-foreground" />
                              {formatDate(service.date)}
                              <span className="text-muted-foreground">
                                {service.startTime} - {service.endTime}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-semibold ${service.pago ? 'text-green-600' : 'text-foreground'}`}>
                            {formatCurrency(parseFloat(service.price) || 0)}
                          </span>
                          {service.pago && service.dataPagamento && (
                            <span className="text-xs text-green-600">
                              ✓ {formatDate(service.dataPagamento.split('T')[0])}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {client.totalPending > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => handleMarkAllPaid(client.clientName)}
                    >
                      <CheckCircle2 size={16} className="mr-2" />
                      Marcar todos como pago ({formatCurrency(client.totalPending)})
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagamentos;
