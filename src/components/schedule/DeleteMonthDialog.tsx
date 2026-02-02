import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteMonthDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  monthLabel: string;
  taskCount: number;
}

const DeleteMonthDialog: React.FC<DeleteMonthDialogProps> = ({
  open,
  onClose,
  onConfirm,
  monthLabel,
  taskCount,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">
              Apagar {monthLabel}?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            <span className="block mb-3">
              Vai eliminar <strong className="text-foreground">{taskCount} agendamento{taskCount !== 1 ? 's' : ''}</strong> deste mês.
            </span>
            <span className="block text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              💡 Não te preocupes! Podes usar o botão <strong>Desfazer</strong> para recuperar tudo.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel className="flex-1 sm:flex-none">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="flex-1 sm:flex-none bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
          >
            <Trash2 size={16} />
            Sim, apagar tudo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteMonthDialog;
