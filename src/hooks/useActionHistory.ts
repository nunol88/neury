import { useState, useCallback } from 'react';

export interface ActionRecord {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move' | 'bulk_create';
  description: string;
  timestamp: Date;
  // Data needed to undo the action
  undoData: {
    taskId?: string;
    taskIds?: string[];
    previousState?: any;
    newState?: any;
  };
}

const MAX_HISTORY = 20;

export const useActionHistory = () => {
  const [history, setHistory] = useState<ActionRecord[]>([]);
  const [undoing, setUndoing] = useState(false);

  const addAction = useCallback((action: Omit<ActionRecord, 'id' | 'timestamp'>) => {
    const newAction: ActionRecord = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    
    setHistory(prev => {
      const updated = [newAction, ...prev];
      return updated.slice(0, MAX_HISTORY);
    });
  }, []);

  const getLastAction = useCallback(() => {
    return history[0] || null;
  }, [history]);

  const removeLastAction = useCallback(() => {
    setHistory(prev => prev.slice(1));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const canUndo = history.length > 0;

  return {
    history,
    addAction,
    getLastAction,
    removeLastAction,
    clearHistory,
    canUndo,
    undoing,
    setUndoing,
  };
};
