import React, { useState } from 'react';
import { Plus, Calendar, CalendarRange, Repeat, X } from 'lucide-react';

interface FloatingAddButtonProps {
  themeGradient: string;
  onSelectSingle: () => void;
  onSelectFixed: () => void;
  onSelectBiWeekly: () => void;
}

const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({
  themeGradient,
  onSelectSingle,
  onSelectFixed,
  onSelectBiWeekly,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMainClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleOptionClick = (callback: () => void) => {
    setIsExpanded(false);
    callback();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-center gap-3 print:hidden">
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10 animate-fade-in"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Main FAB Button */}
      <button
        onClick={handleMainClick}
        className={`w-16 h-16 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 bg-gradient-to-r ${themeGradient} text-white ${
          isExpanded ? 'rotate-45' : ''
        }`}
        style={{
          boxShadow: isExpanded 
            ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
            : '0 4px 16px rgba(0, 0, 0, 0.2)'
        }}
      >
        {isExpanded ? <X size={28} /> : <Plus size={32} />}
      </button>

      {/* Expanded Options */}
      {isExpanded && (
        <div className="flex flex-col gap-2 animate-slide-up">
          {/* Bi-Weekly */}
          <button
            onClick={() => handleOptionClick(onSelectBiWeekly)}
            className="group flex items-center gap-3 bg-card shadow-lg rounded-full pl-4 pr-5 py-3 transition-all hover:scale-105 hover:shadow-xl animate-fade-in"
            style={{ animationDelay: '100ms' }}
          >
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <CalendarRange size={20} className="text-amber-500" />
            </div>
            <span className="text-sm font-medium text-card-foreground whitespace-nowrap">Quinzenal</span>
          </button>

          {/* Fixed */}
          <button
            onClick={() => handleOptionClick(onSelectFixed)}
            className="group flex items-center gap-3 bg-card shadow-lg rounded-full pl-4 pr-5 py-3 transition-all hover:scale-105 hover:shadow-xl animate-fade-in"
            style={{ animationDelay: '50ms' }}
          >
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Repeat size={20} className="text-purple-500" />
            </div>
            <span className="text-sm font-medium text-card-foreground whitespace-nowrap">Fixo (semanal)</span>
          </button>

          {/* Single */}
          <button
            onClick={() => handleOptionClick(onSelectSingle)}
            className="group flex items-center gap-3 bg-card shadow-lg rounded-full pl-4 pr-5 py-3 transition-all hover:scale-105 hover:shadow-xl animate-fade-in"
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Calendar size={20} className="text-primary" />
            </div>
            <span className="text-sm font-medium text-card-foreground whitespace-nowrap">Uma vez</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FloatingAddButton;
