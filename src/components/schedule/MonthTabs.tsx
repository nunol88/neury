import React, { useRef, useEffect, useState } from 'react';
import { Calendar, Sparkles, Clock } from 'lucide-react';
import { MonthConfig, getThemeGradient } from '@/utils/monthConfig';

interface MonthTabsProps {
  monthsConfig: Record<string, MonthConfig>;
  activeMonth: string;
  onMonthChange: (monthKey: string) => void;
}

const MonthTabs: React.FC<MonthTabsProps> = ({
  monthsConfig,
  activeMonth,
  onMonthChange,
}) => {
  const tabsRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Get current month key
  const getCurrentMonthKey = (): string | null => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    for (const [key, config] of Object.entries(monthsConfig)) {
      if (config.year === year && config.monthIndex === month) {
        return key;
      }
    }
    return null;
  };

  const currentMonthKey = getCurrentMonthKey();

  // Group months by year
  const monthsByYear: Record<number, Array<{ key: string; config: MonthConfig }>> = {};
  
  Object.entries(monthsConfig).forEach(([key, config]) => {
    if (!monthsByYear[config.year]) {
      monthsByYear[config.year] = [];
    }
    monthsByYear[config.year].push({ key, config });
  });

  // Sort months within each year
  Object.keys(monthsByYear).forEach(year => {
    monthsByYear[Number(year)].sort((a, b) => a.config.monthIndex - b.config.monthIndex);
  });

  const sortedYears = Object.keys(monthsByYear).map(Number).sort((a, b) => a - b);
  const activeConfig = monthsConfig[activeMonth];
  const themeGradient = activeConfig ? getThemeGradient(activeConfig.color) : 'from-purple-600 to-purple-800';

  // Update sliding indicator position
  useEffect(() => {
    if (activeTabRef.current && tabsRef.current) {
      const tabRect = activeTabRef.current.getBoundingClientRect();
      const containerRect = tabsRef.current.getBoundingClientRect();
      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    }
  }, [activeMonth]);

  return (
    <div className="glass-strong shadow-lg pt-3 px-3 sticky top-[52px] z-20 print:hidden overflow-x-auto border-b border-border/50">
      <div ref={tabsRef} className="max-w-7xl mx-auto flex gap-2 items-end relative pb-1">
        {/* Sliding indicator */}
        <div 
          className={`absolute bottom-0 h-[3px] bg-gradient-to-r ${themeGradient} rounded-full transition-all duration-300 ease-out`}
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />
        
        {sortedYears.map((year, yearIndex) => (
          <React.Fragment key={year}>
            {yearIndex > 0 && (
              <div className="h-8 w-px bg-gradient-to-b from-transparent via-border to-transparent mx-2" />
            )}
            <div className="flex items-end gap-1">
              <span className="text-xs font-bold text-muted-foreground/70 px-2 pb-3 tracking-wider uppercase">
                {year}
              </span>
              {monthsByYear[year].map(({ key, config }) => {
                const isActive = activeMonth === key;
                const isCurrentMonth = key === currentMonthKey;
                
                return (
                  <button
                    key={key}
                    ref={isActive ? activeTabRef : null}
                    onClick={() => onMonthChange(key)}
                    className={`group relative px-4 py-2.5 rounded-t-xl font-semibold text-xs transition-all duration-300 flex items-center gap-1.5
                      ${isActive
                        ? 'text-primary transform -translate-y-0.5'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                      }
                      ${isCurrentMonth && !isActive ? 'text-success' : ''}
                    `}
                  >
                    {/* Current month indicator dot */}
                    {isCurrentMonth && (
                      <span className="absolute -top-1 left-1/2 -translate-x-1/2 flex items-center gap-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                        </span>
                      </span>
                    )}
                    
                    <Calendar 
                      size={14} 
                      className={`transition-all duration-300 ${
                        isActive ? 'text-primary animate-pulse' : ''
                      } ${
                        isCurrentMonth && !isActive ? 'text-success' : ''
                      } group-hover:scale-110`}
                    />
                    <span className="relative">
                      {config.label.split(' ')[0]}
                      {isActive && (
                        <Sparkles 
                          size={10} 
                          className="absolute -top-1.5 -right-3 text-primary animate-pulse" 
                        />
                      )}
                    </span>
                    
                    {/* Current month badge */}
                    {isCurrentMonth && !isActive && (
                      <span className="ml-1 flex items-center gap-0.5 text-[9px] bg-success/20 text-success px-1.5 py-0.5 rounded-full border border-success/30">
                        <Clock size={8} />
                        Atual
                      </span>
                    )}
                    
                    {/* Hover glow effect */}
                    {!isActive && (
                      <div className={`absolute inset-0 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                        isCurrentMonth 
                          ? 'bg-gradient-to-t from-success/0 to-success/10' 
                          : 'bg-gradient-to-t from-primary/0 to-primary/5'
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default MonthTabs;
