import React, { useState } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Calendar, Clipboard, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PasteDatePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  clientName: string;
  themeGradient?: string;
}

const PasteDatePickerDialog: React.FC<PasteDatePickerDialogProps> = ({
  open,
  onClose,
  onSelectDate,
  clientName,
  themeGradient = 'from-primary to-primary/80',
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const handleConfirm = () => {
    if (selectedDate) {
      onSelectDate(selectedDate);
      setSelectedDate(undefined);
    }
  };

  const handleClose = () => {
    setSelectedDate(undefined);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clipboard size={20} className="text-primary" />
            Colar Agendamento
          </DialogTitle>
          <DialogDescription>
            Escolha o dia para colar o agendamento de <strong>{clientName}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={pt}
            className={cn("p-3 pointer-events-auto rounded-xl border")}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedDate}
            className={`bg-gradient-to-r ${themeGradient}`}
          >
            <Calendar size={16} className="mr-2" />
            {selectedDate 
              ? `Colar em ${format(selectedDate, 'd MMM', { locale: pt })}`
              : 'Selecione uma data'
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasteDatePickerDialog;
