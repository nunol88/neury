import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileDown, Search, Receipt, Users, Euro, Percent, Wallet } from 'lucide-react';
import { useRecibosVerdes, TAXA_SS, BASE_INCIDENCIA, TAXA_EFETIVA } from '@/hooks/useRecibosVerdes';
import { generateRecibosVerdesPdf } from '@/utils/recibosVerdesPdf';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

const RecibosVerdes: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'rv' | 'normal'>('all');

  const { 
    clientesComValores, 
    stats, 
    loading, 
    toggleReciboVerde,
    clientesReciboVerde 
  } = useRecibosVerdes(selectedMonth, selectedYear);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);

  // Filter clients based on search and filter mode
  const filteredClients = clientesComValores.filter(client => {
    const matchesSearch = client.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterMode === 'all' || 
      (filterMode === 'rv' && client.recibo_verde) || 
      (filterMode === 'normal' && !client.recibo_verde);
    return matchesSearch && matchesFilter;
  });

  const handleGeneratePdf = async () => {
    await generateRecibosVerdesPdf(clientesReciboVerde, stats, selectedMonth, selectedYear);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="pt-4"><div className="h-12 bg-muted rounded animate-pulse" /></CardContent></Card>
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="py-4"><div className="h-10 bg-muted rounded animate-pulse" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Receipt className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão Fiscal</h1>
            <p className="text-sm text-muted-foreground">
              Contribuições para a Segurança Social - Trabalhadores Independentes
            </p>
          </div>
        </div>
        <Button onClick={handleGeneratePdf} disabled={clientesReciboVerde.length === 0}>
          <FileDown className="h-4 w-4 mr-2" />
          Gerar PDF
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select 
              value={selectedMonth.toString()} 
              onValueChange={(v) => setSelectedMonth(parseInt(v))}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, i) => (
                  <SelectItem key={i} value={i.toString()}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={selectedYear.toString()} 
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-full sm:w-28">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterMode} onValueChange={(v: 'all' | 'rv' | 'normal') => setFilterMode(v)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                <SelectItem value="rv">Apenas Recibos Verdes</SelectItem>
                <SelectItem value="normal">Sem Recibos Verdes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Clientes RV</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalClientes}</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Euro className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Faturado</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(stats.totalFaturado)}
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-destructive/10 rounded-lg">
                <Percent className="h-4 w-4 text-destructive" />
              </div>
              <span className="text-xs text-muted-foreground">Contrib. SS</span>
            </div>
            <p className="text-2xl font-bold text-destructive">
              {formatCurrency(stats.totalContribuicaoSS)}
            </p>
            <p className="text-xs text-muted-foreground">
              ({(TAXA_EFETIVA * 100).toFixed(2)}% efetiva)
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-accent rounded-lg">
                <Wallet className="h-4 w-4 text-accent-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">Líquido</span>
            </div>
            <p className="text-2xl font-bold text-accent-foreground">
              {formatCurrency(stats.totalLiquido)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tax Info */}
      <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
        <strong>Taxas SS 2026:</strong> {(TAXA_SS * 100).toFixed(1)}% sobre {(BASE_INCIDENCIA * 100).toFixed(0)}% do rendimento 
        = <strong>{(TAXA_EFETIVA * 100).toFixed(2)}%</strong> taxa efetiva
      </div>

      {/* Clients List */}
      <div className="space-y-3">
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum cliente encontrado
            </CardContent>
          </Card>
        ) : (
          filteredClients.map(client => (
            <Card 
              key={client.id} 
              className={`transition-all duration-200 hover:shadow-md ${client.recibo_verde ? 'border-primary/50 bg-primary/5 hover:border-primary/70' : 'hover:border-primary/20'}`}
            >
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`rv-${client.id}`}
                      checked={client.recibo_verde}
                      onCheckedChange={() => toggleReciboVerde(client.id, client.recibo_verde)}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <label 
                          htmlFor={`rv-${client.id}`}
                          className="font-medium cursor-pointer"
                        >
                          {client.nome}
                        </label>
                        {client.recibo_verde && (
                          <Badge variant="default" className="text-xs">
                            Recibo Verde
                          </Badge>
                        )}
                      </div>
                      {!client.recibo_verde && (
                        <p className="text-xs text-muted-foreground">
                          Clique para marcar como recibo verde
                        </p>
                      )}
                    </div>
                  </div>

                  {client.valorFaturado > 0 && (
                    <div className="flex flex-wrap gap-4 text-sm pl-7 sm:pl-0">
                      <div>
                        <span className="text-muted-foreground">Faturado: </span>
                        <span className="font-medium">{formatCurrency(client.valorFaturado)}</span>
                      </div>
                      {client.recibo_verde && (
                        <>
                          <div>
                            <span className="text-muted-foreground">Base (70%): </span>
                            <span className="font-medium">{formatCurrency(client.baseIncidencia)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">SS: </span>
                            <span className="font-medium text-destructive">
                              {formatCurrency(client.contribuicaoSS)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Líq: </span>
                            <span className="font-medium text-primary">
                              {formatCurrency(client.valorLiquido)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default RecibosVerdes;
