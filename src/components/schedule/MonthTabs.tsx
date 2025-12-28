import React from 'react';
import { Calendar } from 'lucide-react';
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

  return (
    <div className="bg-card shadow-sm pt-2 px-2 sticky top-0 z-20 print:hidden overflow-x-auto">
      <div className="max-w-7xl mx-auto flex gap-2 items-end">
        {sortedYears.map((year, yearIndex) => (
          <React.Fragment key={year}>
            {yearIndex > 0 && <div className="h-8 w-px bg-border mx-1"></div>}
            <div className="flex items-end gap-1">
              <span className="text-xs font-bold text-muted-foreground px-2 pb-3">{year}</span>
              {monthsByYear[year].map(({ key, config }) => (
                <button
                  key={key}
                  onClick={() => onMonthChange(key)}
                  className={`px-4 py-2 rounded-t-lg font-bold text-xs transition-all flex items-center gap-1
                    ${activeMonth === key
                      ? `bg-gradient-to-r ${themeGradient} text-white shadow-lg transform -translate-y-1`
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                >
                  <Calendar size={14} />
                  {config.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default MonthTabs;
