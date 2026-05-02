import React from 'react';
import { MoreVertical, Copy, Trash2, Loader2, Smartphone, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ScheduleActionsMenuProps {
  canCopyFromPrevious: boolean;
  copyingFromPrevious: boolean;
  previousMonthLabel: string | null;
  currentMonthLabel: string;
  hasTasksInMonth: boolean;
  hasFavorites?: boolean;
  onCopyFromPrevious: () => void;
  onCopyFavorites?: () => void;
  onDeleteMonth: () => void;
  onExportCalendar?: () => void;
}

const ScheduleActionsMenu: React.FC<ScheduleActionsMenuProps> = ({
  canCopyFromPrevious,
  copyingFromPrevious,
  previousMonthLabel,
  currentMonthLabel,
  hasTasksInMonth,
  hasFavorites,
  onCopyFromPrevious,
  onCopyFavorites,
  onDeleteMonth,
  onExportCalendar,
}) => {
  const monthName = currentMonthLabel?.split(' ')[0] || 'Mês';
  const prevMonthName = previousMonthLabel?.split(' ')[0] || 'Anterior';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Copy from previous month */}
        {canCopyFromPrevious && (
          <DropdownMenuItem
            onClick={onCopyFromPrevious}
            disabled={copyingFromPrevious}
            className="gap-2"
          >
            {copyingFromPrevious ? (
              <Loader2 size={16} className="animate-spin text-success" />
            ) : (
              <Copy size={16} className="text-success" />
            )}
            <span>
              {copyingFromPrevious ? 'A copiar...' : `Copiar de ${prevMonthName}`}
            </span>
          </DropdownMenuItem>
        )}

        {/* Copy favorite (fixed) clients */}
        {hasFavorites && onCopyFavorites && (
          <DropdownMenuItem onClick={onCopyFavorites} className="gap-2">
            <Star size={16} className="text-amber-500 fill-current" />
            <span>Copiar clientes fixos</span>
          </DropdownMenuItem>
        )}

        {/* Export to calendar */}
        {hasTasksInMonth && onExportCalendar && (
          <>
            {canCopyFromPrevious && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={onExportCalendar} className="gap-2">
              <Smartphone size={16} className="text-primary" />
              <span>Exportar Calendário</span>
            </DropdownMenuItem>
          </>
        )}
        
        {(canCopyFromPrevious || (hasTasksInMonth && onExportCalendar)) && hasTasksInMonth && <DropdownMenuSeparator />}
        
        {/* Delete month */}
        <DropdownMenuItem
          onClick={onDeleteMonth}
          disabled={!hasTasksInMonth}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <Trash2 size={16} />
          <span>Apagar {monthName}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ScheduleActionsMenu;
