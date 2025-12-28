import React from 'react';
import { LineChart, Line, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface SparklineProps {
  data: { value: number }[];
  color?: string;
  height?: number;
  type?: 'line' | 'area';
  strokeWidth?: number;
}

export function Sparkline({ 
  data, 
  color = '#ffffff', 
  height = 40,
  type = 'area',
  strokeWidth = 2,
}: SparklineProps) {
  if (!data || data.length === 0) {
    return null;
  }

  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`sparklineGradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={strokeWidth}
            fill={`url(#sparklineGradient-${color.replace('#', '')})`}
            dot={false}
            isAnimationActive={true}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={strokeWidth}
          dot={false}
          isAnimationActive={true}
          animationDuration={1500}
          animationEasing="ease-out"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface TrendIndicatorProps {
  value: number;
  className?: string;
}

export function TrendIndicator({ value, className = '' }: TrendIndicatorProps) {
  const isPositive = value >= 0;
  
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${className}`}>
      {isPositive ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )}
      {Math.abs(value)}%
    </span>
  );
}
