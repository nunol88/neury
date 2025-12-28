import React from 'react';
import { Undo2, X, Loader2 } from 'lucide-react';

interface UndoBarProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  saving: boolean;
  variant?: 'default' | 'move';
}

const UndoBar: React.FC<UndoBarProps> = ({
  message,
  onUndo,
  onDismiss,
  saving,
  variant = 'default',
}) => {
  const bgColor = variant === 'move' ? 'bg-orange-600' : 'bg-gray-900';

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 print:hidden animate-fade-in">
      <div className={`${bgColor} text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4`}>
        <span className="text-sm">{message}</span>
        <button
          onClick={onUndo}
          disabled={saving}
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors text-sm font-medium"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Undo2 size={16} />
          )}
          Desfazer
        </button>
        <button
          onClick={onDismiss}
          className="hover:bg-white/20 p-1 rounded-full transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default UndoBar;
