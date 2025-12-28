import React, { useState, useEffect } from 'react';
import { ArrowUp, Euro } from 'lucide-react';

interface FloatingTotalProps {
  totalValue: number;
  completedValue: number;
}

const FloatingTotal: React.FC<FloatingTotalProps> = ({
  totalValue,
  completedValue,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling 400px
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 print:hidden group animate-scale-in"
    >
      <div className="glass-strong rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-3 border border-primary/20">
        {/* Total value display */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-success font-bold text-lg">
            <Euro size={16} />
            <span>{totalValue.toFixed(2)}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            €{completedValue.toFixed(2)} faturado
          </span>
        </div>
        
        {/* Divider */}
        <div className="h-10 w-px bg-border" />
        
        {/* Arrow up */}
        <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <ArrowUp 
            size={20} 
            className="text-primary group-hover:-translate-y-0.5 transition-transform" 
          />
        </div>
      </div>
    </button>
  );
};

export default FloatingTotal;
