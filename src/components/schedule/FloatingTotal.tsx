import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUp, Euro, GripVertical } from 'lucide-react';

interface FloatingTotalProps {
  totalValue: number;
  completedValue: number;
}

interface Position {
  x: number;
  y: number;
}

interface SafeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const POSITION_STORAGE_KEY = 'mayslimpo:floating-total-position';
const VIEWPORT_MARGIN = 12;
const INITIAL_OFFSET = 24;
const VISUAL_OVERFLOW_ALLOWANCE = 8;
const DRAG_THRESHOLD = 6;

const getSafeInsets = (): SafeInsets => {
  const probe = document.createElement('div');
  probe.style.cssText = [
    'position:fixed',
    'visibility:hidden',
    'pointer-events:none',
    'padding-top:env(safe-area-inset-top, 0px)',
    'padding-right:env(safe-area-inset-right, 0px)',
    'padding-bottom:env(safe-area-inset-bottom, 0px)',
    'padding-left:env(safe-area-inset-left, 0px)',
  ].join(';');
  document.body.appendChild(probe);
  const styles = window.getComputedStyle(probe);
  const insets = {
    top: Number.parseFloat(styles.paddingTop) || 0,
    right: Number.parseFloat(styles.paddingRight) || 0,
    // Includes the mobile bottom navigation height so the card never sits under it.
    bottom: (Number.parseFloat(styles.paddingBottom) || 0) + (Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bottom-nav-offset')) || 0),
    left: Number.parseFloat(styles.paddingLeft) || 0,
  };
  probe.remove();
  return insets;
};

const readStoredPosition = (): Position | null => {
  try {
    const raw = window.localStorage.getItem(POSITION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('x' in parsed) ||
      !('y' in parsed) ||
      typeof parsed.x !== 'number' ||
      typeof parsed.y !== 'number' ||
      !Number.isFinite(parsed.x) ||
      !Number.isFinite(parsed.y)
    ) {
      return null;
    }
    return { x: parsed.x, y: parsed.y };
  } catch {
    return null;
  }
};

const FloatingTotal: React.FC<FloatingTotalProps> = ({
  totalValue,
  completedValue,
}) => {
  const [isVisible, setIsVisible] = useState(() =>
    typeof window !== 'undefined' ? window.scrollY > 400 : false,
  );
  const [position, setPosition] = useState<Position | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pointerRef = useRef<{
    id: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const draggedRef = useRef(false);
  const suppressClickRef = useRef(false);

  const clampPosition = useCallback((candidate: Position): Position => {
    const element = buttonRef.current;
    if (!element) return candidate;

    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const safe = getSafeInsets();
    const minX = VIEWPORT_MARGIN + safe.left + VISUAL_OVERFLOW_ALLOWANCE;
    const minY = VIEWPORT_MARGIN + safe.top + VISUAL_OVERFLOW_ALLOWANCE;
    const maxX = Math.max(minX, window.innerWidth - width - VIEWPORT_MARGIN - safe.right - VISUAL_OVERFLOW_ALLOWANCE);
    const maxY = Math.max(minY, window.innerHeight - height - VIEWPORT_MARGIN - safe.bottom - VISUAL_OVERFLOW_ALLOWANCE);

    return {
      x: Math.min(Math.max(candidate.x, minX), maxX),
      y: Math.min(Math.max(candidate.y, minY), maxY),
    };
  }, []);

  const defaultPosition = useCallback((): Position => {
    const element = buttonRef.current;
    const safe = getSafeInsets();
    const width = element?.offsetWidth ?? 0;
    const height = element?.offsetHeight ?? 0;
    return clampPosition({
      x: window.innerWidth - width - INITIAL_OFFSET - safe.right,
      y: window.innerHeight - height - INITIAL_OFFSET - safe.bottom,
    });
  }, [clampPosition]);

  const persistPosition = useCallback((nextPosition: Position) => {
    try {
      window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(nextPosition));
    } catch {
      // Position persistence is optional (for example, private browsing can block storage).
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling 400px
      setIsVisible(window.scrollY > 400);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useLayoutEffect(() => {
    if (!isVisible || !buttonRef.current) return;

    const stored = readStoredPosition();
    setPosition(clampPosition(stored ?? defaultPosition()));
  }, [isVisible, clampPosition, defaultPosition]);

  useEffect(() => {
    if (!isVisible) return;

    const keepInsideViewport = () => {
      setPosition(current => {
        const next = clampPosition(current ?? defaultPosition());
        persistPosition(next);
        return next;
      });
    };

    window.addEventListener('resize', keepInsideViewport);
    window.addEventListener('orientationchange', keepInsideViewport);
    return () => {
      window.removeEventListener('resize', keepInsideViewport);
      window.removeEventListener('orientationchange', keepInsideViewport);
    };
  }, [isVisible, clampPosition, defaultPosition, persistPosition]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left,
      originY: rect.top,
    };
    draggedRef.current = false;
    suppressClickRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;

    const deltaX = event.clientX - pointer.startX;
    const deltaY = event.clientY - pointer.startY;
    if (!draggedRef.current && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) return;

    draggedRef.current = true;
    event.preventDefault();
    setPosition(clampPosition({
      x: pointer.originX + deltaX,
      y: pointer.originY + deltaY,
    }));
  };

  const finishPointer = (event: React.PointerEvent<HTMLButtonElement>, cancelled = false) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    pointerRef.current = null;
    suppressClickRef.current = draggedRef.current || cancelled;

    if (draggedRef.current) {
      setPosition(current => {
        const next = clampPosition(current ?? defaultPosition());
        persistPosition(next);
        return next;
      });
    }
  };

  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    scrollToTop();
  };

  if (!isVisible) return null;

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={event => finishPointer(event)}
      onPointerCancel={event => finishPointer(event, true)}
      aria-label="Totais da agenda. Arraste para mover; prima Enter ou Espaço para voltar ao topo."
      title="Arrastar para mover · clicar para voltar ao topo"
      className="fixed z-50 print:hidden group animate-scale-in transition-shadow duration-300 touch-none cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      style={position
        ? { left: position.x, top: position.y }
        : {
            right: 'max(24px, env(safe-area-inset-right))',
            bottom: 'calc(var(--bottom-nav-offset, 0px) + max(24px, env(safe-area-inset-bottom)))',
          }}
    >
      <div className="glass-strong rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-3 border border-primary/20">
        <GripVertical size={16} className="shrink-0 text-muted-foreground/70" aria-hidden="true" />
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
