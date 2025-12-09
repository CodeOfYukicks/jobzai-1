import { useEffect, useRef, useCallback, useState } from 'react';
import { notify } from '@/lib/notify';
import { createElement } from 'react';
import { Info } from 'lucide-react';

const A4_HEIGHT_PX = 1122.52; // Height of A4 page in pixels at 96 DPI

interface UseA4ContentFitterOptions {
  enabled?: boolean;
  targetFill?: number; // Target fill percentage (0-1)
  minFill?: number; // Minimum acceptable fill (0-1)
  maxFill?: number; // Maximum before overflow (0-1)
  tolerance?: number; // Tolerance for adjustments (0-1)
  debounceMs?: number; // Debounce delay in milliseconds
}

/**
 * Custom hook for automatically adjusting font size to fit content on A4 page
 * Uses ResizeObserver for reliable DOM measurements and a queue system to prevent conflicts
 */
export function useA4ContentFitter(options: UseA4ContentFitterOptions = {}) {
  const {
    enabled = true,
    targetFill = 0.955, // 95.5% fill
    minFill = 0.90, // 90% minimum
    maxFill = 0.98, // 98% maximum
    tolerance = 0.20, // 20% tolerance
    debounceMs = 300,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [adjustedFontSize, setAdjustedFontSize] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  
  // Refs to prevent conflicts and track state
  const isAdjustingRef = useRef(false);
  const lastAdjustmentTimeRef = useRef(0);
  const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const baseFontSizeRef = useRef<number>(11);
  const currentTemplateRef = useRef<string>('');
  const currentFontRef = useRef<string>('');

  /**
   * Calculate optimal font size based on content height
   */
  const calculateOptimalFontSize = useCallback((
    actualHeight: number,
    currentFontSize: number,
    baseFontSize: number
  ): { newSize: number; shouldAdjust: boolean; shouldWarn: boolean } => {
    const maxHeight = A4_HEIGHT_PX;
    const targetHeight = maxHeight * targetFill;
    const minTargetHeight = maxHeight * minFill;
    const maxTargetHeight = maxHeight * maxFill;

    let newSize = currentFontSize;
    let shouldAdjust = false;
    let shouldWarn = false;

    if (actualHeight > maxHeight) {
      // Content exceeds - MUST reduce
      const scaleFactor = targetHeight / actualHeight;
      newSize = Math.max(8, currentFontSize * scaleFactor);
      const sizeDiff = Math.abs(newSize - currentFontSize) / currentFontSize;
      shouldAdjust = sizeDiff > tolerance;
      shouldWarn = true;
    } else if (actualHeight < minTargetHeight) {
      // Content too short - increase to fill
      const maxAllowedFontSize = baseFontSize * 1.25;
      const scaleFactor = targetHeight / actualHeight;
      newSize = Math.min(maxAllowedFontSize, currentFontSize * scaleFactor);
      const sizeDiff = Math.abs(newSize - currentFontSize) / currentFontSize;
      shouldAdjust = sizeDiff > tolerance;
    } else if (actualHeight < targetHeight * 0.97) {
      // Slightly short - increase to fill better
      const scaleFactor = targetHeight / actualHeight;
      const maxAllowedFontSize = baseFontSize * 1.20;
      newSize = Math.min(maxAllowedFontSize, currentFontSize * scaleFactor);
      const sizeDiff = Math.abs(newSize - currentFontSize) / currentFontSize;
      shouldAdjust = sizeDiff > tolerance;
    } else if (actualHeight > maxTargetHeight && actualHeight <= maxHeight) {
      // Slightly too tall but fits - small reduction for safety
      const scaleFactor = targetHeight / actualHeight;
      newSize = Math.max(baseFontSize * 0.85, currentFontSize * scaleFactor);
      const sizeDiff = Math.abs(newSize - currentFontSize) / currentFontSize;
      shouldAdjust = sizeDiff > tolerance;
    }

    return { newSize, shouldAdjust, shouldWarn };
  }, [targetFill, minFill, maxFill, tolerance]);

  // Store current adjusted font size in ref to avoid dependency issues
  const adjustedFontSizeRef = useRef<number | null>(null);
  const showWarningRef = useRef(false);

  // Sync refs with state
  useEffect(() => {
    adjustedFontSizeRef.current = adjustedFontSize;
  }, [adjustedFontSize]);

  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  /**
   * Measure and adjust font size
   */
  const measureAndAdjust = useCallback((
    baseFontSize: number,
    template: string,
    font: string,
    forceReset: boolean = false
  ) => {
    if (!enabled || !containerRef.current) return;

    // Prevent multiple simultaneous adjustments
    if (isAdjustingRef.current && !forceReset) return;

    // Debounce: don't adjust if we just adjusted recently
    const now = Date.now();
    if (!forceReset && now - lastAdjustmentTimeRef.current < debounceMs) {
      return;
    }

    // Clear any pending timeout
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }

    // Wait for DOM to stabilize
    // Longer delay for templates that render sections dynamically
    const delay = (template === 'harvard' || template === 'notion') ? 400 : 250;

    pendingTimeoutRef.current = setTimeout(() => {
      if (!containerRef.current || (isAdjustingRef.current && !forceReset)) {
        return;
      }

      // Force reflow to ensure accurate measurement
      const element = containerRef.current;
      const height = element.offsetHeight; // Force layout calculation
      const actualHeight = element.scrollHeight;

      const currentEffectiveFontSize = adjustedFontSizeRef.current ?? baseFontSize;
      const { newSize, shouldAdjust, shouldWarn } = calculateOptimalFontSize(
        actualHeight,
        currentEffectiveFontSize,
        baseFontSize
      );

      if (forceReset || shouldAdjust) {
        isAdjustingRef.current = true;
        lastAdjustmentTimeRef.current = Date.now();

        // Use requestAnimationFrame for smooth update
        requestAnimationFrame(() => {
          setAdjustedFontSize(shouldAdjust ? newSize : null);

          if (shouldWarn && !showWarningRef.current) {
            setShowWarning(true);
            notify.info('Le contenu a été ajusté automatiquement pour tenir sur une page A4', {
              icon: createElement(Info, { className: 'w-4 h-4' }),
              duration: 4000,
              style: {
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              },
            });
            setTimeout(() => setShowWarning(false), 5000);
          }

          // Release lock after delay
          setTimeout(() => {
            isAdjustingRef.current = false;
          }, 600);
        });
      } else {
        // Content fits well - reset if close to base
        if (adjustedFontSizeRef.current !== null) {
          const sizeDiff = Math.abs(currentEffectiveFontSize - baseFontSize) / baseFontSize;
          if (sizeDiff < 0.08) {
            setTimeout(() => {
              if (!isAdjustingRef.current) {
                setAdjustedFontSize(null);
                setShowWarning(false);
              }
            }, 500);
          }
        }
      }
    }, delay);
  }, [enabled, debounceMs, calculateOptimalFontSize]);

  /**
   * Setup ResizeObserver to watch for content changes
   */
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    // Create ResizeObserver to detect content size changes
    resizeObserverRef.current = new ResizeObserver(() => {
      // Debounce resize observations
      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current);
      }

      pendingTimeoutRef.current = setTimeout(() => {
        if (containerRef.current && !isAdjustingRef.current) {
          measureAndAdjust(
            baseFontSizeRef.current,
            currentTemplateRef.current,
            currentFontRef.current
          );
        }
      }, debounceMs);
    });

    resizeObserverRef.current.observe(containerRef.current);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current);
      }
    };
  }, [enabled, debounceMs, measureAndAdjust]);

  /**
   * Reset adjustment state when template/font/baseFontSize changes
   */
  const reset = useCallback((baseFontSize: number, template: string, font: string) => {
    baseFontSizeRef.current = baseFontSize;
    currentTemplateRef.current = template;
    currentFontRef.current = font;
    
    isAdjustingRef.current = false;
    setAdjustedFontSize(null);
    setShowWarning(false);
    lastAdjustmentTimeRef.current = 0;

    // Force remeasure after reset
    setTimeout(() => {
      measureAndAdjust(baseFontSize, template, font, true);
    }, 100);
  }, [measureAndAdjust]);

  /**
   * Trigger manual adjustment (e.g., when data changes)
   */
  const triggerAdjustment = useCallback((
    baseFontSize: number,
    template: string,
    font: string
  ) => {
    baseFontSizeRef.current = baseFontSize;
    currentTemplateRef.current = template;
    currentFontRef.current = font;
    
    measureAndAdjust(baseFontSize, template, font, false);
  }, [measureAndAdjust]);

  return {
    containerRef,
    adjustedFontSize,
    showWarning,
    reset,
    triggerAdjustment,
  };
}

