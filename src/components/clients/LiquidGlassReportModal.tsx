import React from 'react';
import { X, FileText, CalendarDays, Euro, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClientAvatar from '@/components/ui/client-avatar';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MonthConfig {
  label: string;
  year: number;
  monthIndex: number;
}

interface LiquidGlassReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  reportStep: 'month' | 'rate';
  setReportStep: (step: 'month' | 'rate') => void;
  reportSelectedMonth: string | null;
  setReportSelectedMonth: (month: string | null) => void;
  reportHourlyRate: string;
  setReportHourlyRate: (rate: string) => void;
  onGenerateReport: () => void;
  generatingReport: boolean;
  monthsConfig: Record<string, MonthConfig>;
  sortedMonths: Array<[string, MonthConfig]>;
  getStatsForMonth: (monthKey: string) => { totals: { totalAgendamentos: number } } | undefined;
}

const LiquidGlassReportModal: React.FC<LiquidGlassReportModalProps> = ({
  isOpen,
  onClose,
  clientName,
  reportStep,
  setReportStep,
  reportSelectedMonth,
  setReportSelectedMonth,
  reportHourlyRate,
  setReportHourlyRate,
  onGenerateReport,
  generatingReport,
  monthsConfig,
  sortedMonths,
  getStatsForMonth,
}) => {
  if (!isOpen) return null;

  const handleSelectMonth = (value: string) => {
    setReportSelectedMonth(value);
    setReportStep('rate');
  };

  // Group months by year for the select
  const byYear: Record<number, Array<[string, MonthConfig]>> = {};
  sortedMonths.forEach(([key, config]) => {
    if (!byYear[config.year]) byYear[config.year] = [];
    byYear[config.year].push([key, config]);
  });
  // Sort years ascending (oldest first)
  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Animated background overlay with gradient */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/90 to-slate-800/95 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />
      
      {/* Glass card container */}
      <div className="relative w-full max-w-md z-10">
        {/* Outer glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-xl" />
        
        {/* Main card */}
        <div className="relative backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Inner gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent pointer-events-none" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 hover:text-white transition-all duration-200"
          >
            <X size={18} />
          </button>
          
          {/* Header with avatar */}
          <div className="relative pt-8 pb-6 px-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="p-1 rounded-full bg-gradient-to-br from-cyan-400/50 via-blue-500/50 to-purple-500/50">
                <div className="bg-slate-900/50 rounded-full p-1">
                  <ClientAvatar name={clientName} size="lg" className="w-16 h-16 text-lg" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                  <FileText size={20} className="text-cyan-400" />
                  Gerar Relatório
                </h2>
                <p className="text-white/70 text-sm mt-1">{clientName}</p>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="relative px-6 pb-6">
            {/* Step 1: Month Selection with Select */}
            {reportStep === 'month' && (
              <div className="space-y-4">
                <p className="text-white/70 text-sm text-center">
                  <span className="text-cyan-400 font-semibold">1/2</span> — Selecione o período
                </p>
                
                <Select onValueChange={handleSelectMonth}>
                  <SelectTrigger className="w-full h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:ring-cyan-500/50 focus:border-cyan-400/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-cyan-400" />
                      <SelectValue placeholder="Selecionar período..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-white/20 text-white max-h-72">
                    {/* All periods option */}
                    <SelectItem 
                      value="all" 
                      className="focus:bg-white/10 focus:text-white cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-cyan-400" />
                        <span className="font-medium">Todos os períodos</span>
                      </div>
                    </SelectItem>
                    
                    {/* Grouped by year */}
                    {years.map((year) => (
                      <SelectGroup key={year}>
                        <SelectLabel className="text-white/50 text-xs uppercase tracking-wider px-2 py-2">
                          {year}
                        </SelectLabel>
                        {byYear[year]
                          .sort((a, b) => a[1].monthIndex - b[1].monthIndex)
                          .map(([key, config]) => {
                            const monthStats = getStatsForMonth(key);
                            const hasData = monthStats && monthStats.totals.totalAgendamentos > 0;
                            const isCurrentMonth = config.year === currentYear && config.monthIndex === currentMonthIndex;
                            
                            return (
                              <SelectItem 
                                key={key} 
                                value={key}
                                className="focus:bg-white/10 focus:text-white cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  {hasData && (
                                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                                  )}
                                  <span className={isCurrentMonth ? 'text-green-400 font-medium' : ''}>
                                    {config.label.split(' ')[0]}
                                  </span>
                                  {isCurrentMonth && (
                                    <span className="text-xs text-green-400/70 ml-1">(atual)</span>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                
                <p className="text-white/40 text-xs text-center">
                  Meses com • têm dados de serviços
                </p>
              </div>
            )}
            
            {/* Step 2: Hourly Rate */}
            {reportStep === 'rate' && (
              <div className="space-y-4">
                <p className="text-white/70 text-sm text-center">
                  <span className="text-cyan-400 font-semibold">2/2</span> — Valor por hora
                </p>
                
                {/* Selected period badge */}
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Período selecionado</p>
                  <p className="font-medium text-white flex items-center justify-center gap-2">
                    <Calendar size={16} className="text-cyan-400" />
                    {reportSelectedMonth === 'all' 
                      ? 'Todos os períodos' 
                      : monthsConfig[reportSelectedMonth!]?.label}
                  </p>
                </div>
                
                {/* Hourly rate input */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Valor por Hora
                  </label>
                  <div className="relative">
                    <Euro size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={reportHourlyRate}
                      onChange={(e) => setReportHourlyRate(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white text-xl font-bold placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all"
                      placeholder="7.00"
                      autoFocus
                    />
                  </div>
                  <p className="text-white/40 text-xs mt-2 text-center">
                    O total será calculado automaticamente
                  </p>
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setReportStep('month')}
                    className="flex-1 h-12 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white rounded-xl"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={onGenerateReport}
                    disabled={generatingReport || !reportHourlyRate}
                    className="flex-1 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white border-0 rounded-xl shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:shadow-none"
                  >
                    {generatingReport ? (
                      <>
                        <Loader2 size={18} className="animate-spin mr-2" />
                        A gerar...
                      </>
                    ) : (
                      <>
                        <FileText size={18} className="mr-2" />
                        Gerar PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidGlassReportModal;
