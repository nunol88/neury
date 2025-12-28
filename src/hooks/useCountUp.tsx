import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  start?: number;
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  easing?: 'linear' | 'easeOut' | 'easeInOut';
}

export function useCountUp({
  start = 0,
  end,
  duration = 1500,
  decimals = 0,
  prefix = '',
  suffix = '',
  easing = 'easeOut',
}: UseCountUpOptions) {
  const [count, setCount] = useState(start);
  const [hasStarted, setHasStarted] = useState(false);
  const frameRef = useRef<number>();
  const startTimeRef = useRef<number>();

  // Easing functions
  const easingFunctions = {
    linear: (t: number) => t,
    easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
    easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  };

  useEffect(() => {
    // Small delay to ensure animation is visible after mount
    const startDelay = setTimeout(() => {
      setHasStarted(true);
    }, 100);

    return () => clearTimeout(startDelay);
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFunctions[easing](progress);
      
      const currentValue = start + (end - start) * easedProgress;
      setCount(currentValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [hasStarted, start, end, duration, easing]);

  // Reset animation when end value changes
  useEffect(() => {
    startTimeRef.current = undefined;
    if (hasStarted) {
      setCount(start);
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easingFunctions[easing](progress);
        
        const currentValue = start + (end - start) * easedProgress;
        setCount(currentValue);

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        }
      };

      frameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end]);

  const formattedValue = `${prefix}${count.toFixed(decimals)}${suffix}`;

  return {
    value: count,
    formattedValue,
    displayValue: formattedValue,
  };
}

// Component version for easier use
interface CountUpProps {
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function CountUp({ 
  end, 
  duration = 1500, 
  decimals = 0, 
  prefix = '', 
  suffix = '',
  className = ''
}: CountUpProps) {
  const { formattedValue } = useCountUp({
    end,
    duration,
    decimals,
    prefix,
    suffix,
  });

  return <span className={className}>{formattedValue}</span>;
}
