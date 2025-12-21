import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTour, TourStep } from '../../contexts/TourContext';
import { X, ChevronRight, ChevronLeft, SkipForward, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// ============================================
// TYPES
// ============================================
interface ElementPosition {
  top: number;
  left: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

interface TooltipPosition {
  top: number;
  left: number;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

// ============================================
// SPOTLIGHT OVERLAY (Visual only)
// ============================================
function SpotlightOverlay({ targetRect, padding = 8 }: { targetRect: ElementPosition | null; padding?: number }) {
  if (!targetRect) {
    return (
      <div className="fixed inset-0 bg-black/70 z-[9998]" />
    );
  }

  const { top, left, width, height } = targetRect;
  const spotlightTop = top - padding;
  const spotlightLeft = left - padding;
  const spotlightWidth = width + padding * 2;
  const spotlightHeight = height + padding * 2;

  return (
    <svg
      className="fixed inset-0 z-[9998]"
      width="100%"
      height="100%"
    >
      <defs>
        <mask id="spotlight-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <rect
            x={spotlightLeft}
            y={spotlightTop}
            width={spotlightWidth}
            height={spotlightHeight}
            rx="12"
            ry="12"
            fill="black"
          />
        </mask>
      </defs>

      {/* Dark overlay with cutout */}
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="rgba(0, 0, 0, 0.75)"
        mask="url(#spotlight-mask)"
      />

      {/* Glowing border around spotlight */}
      <rect
        x={spotlightLeft}
        y={spotlightTop}
        width={spotlightWidth}
        height={spotlightHeight}
        rx="12"
        ry="12"
        fill="none"
        stroke="rgba(99, 91, 255, 0.9)"
        strokeWidth="3"
      />
    </svg>
  );
}

// ============================================
// TOOLTIP COMPONENT
// ============================================
function TourTooltip({
  step,
  position,
  stepIndex,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
}: {
  step: TourStep;
  position: TooltipPosition;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}) {
  const isLastStep = stepIndex === totalSteps - 1;
  const isFirstStep = stepIndex === 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed z-[10005] w-[300px]"
      style={{
        top: position.top,
        left: position.left,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Tooltip Card */}
      <div className="bg-[#1a1a1b] rounded-xl shadow-2xl border border-[#3d3c3e] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#3d3c3e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#635BFF] to-[#8B5CF6] flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-[#635BFF]">{step.title}</span>
          </div>
          <button
            onClick={onSkip}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#3d3c3e] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <div className="text-gray-200 text-sm leading-relaxed">
            <ReactMarkdown
              components={{
                strong: ({ children }) => (
                  <span className="text-[#635BFF] font-semibold">{children}</span>
                ),
                p: ({ children }) => <p className="m-0">{children}</p>,
              }}
            >
              {step.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-2">
          <div className="h-1 bg-[#3d3c3e] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#635BFF] to-[#8B5CF6] transition-all duration-300"
              style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={onSkip}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <SkipForward className="h-3 w-3" />
            Skip
          </button>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                onClick={onPrevious}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 bg-[#3d3c3e] hover:bg-[#4a494b] transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </button>
            )}
            <button
              onClick={onNext}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-[#635BFF] to-[#8B5CF6] hover:opacity-90 transition-opacity flex items-center gap-1"
            >
              {isLastStep ? 'Finish' : 'Next'}
              {!isLastStep && <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN TOUR OVERLAY
// ============================================
export default function TourOverlay() {
  const { isActive, currentStep, currentStepIndex, totalSteps, nextStep, previousStep, skipTour } = useTour();
  const [targetRect, setTargetRect] = useState<ElementPosition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ top: 0, left: 0, placement: 'bottom' });
  const isClickingRef = useRef(false);
  const measureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Find and measure target element (debounced)
  const measureTarget = useCallback(() => {
    // Clear any pending measurement
    if (measureTimeoutRef.current) {
      clearTimeout(measureTimeoutRef.current);
    }

    measureTimeoutRef.current = setTimeout(() => {
      if (!currentStep?.target) {
        setTargetRect(null);
        return;
      }

      // Try each selector in the comma-separated list
      const selectors = currentStep.target.split(',').map(s => s.trim());
      let element: Element | null = null;

      for (const selector of selectors) {
        element = document.querySelector(selector);
        if (element) break;
      }

      if (!element) {
        console.warn(`Tour target not found: ${currentStep.target}`);
        setTargetRect(null);
        return;
      }

      const rect = element.getBoundingClientRect();
      const position: ElementPosition = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
      };

      setTargetRect(position);

      // Calculate tooltip position
      const padding = 16;
      const tooltipWidth = 300;
      const tooltipHeight = 180;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let placement: 'top' | 'bottom' | 'left' | 'right' = currentStep.position || 'auto' as any;

      // Auto-detect best placement
      if (placement === 'auto' || !['top', 'bottom', 'left', 'right'].includes(placement)) {
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        const spaceLeft = rect.left;
        const spaceRight = viewportWidth - rect.right;

        if (spaceBelow >= tooltipHeight + padding) {
          placement = 'bottom';
        } else if (spaceAbove >= tooltipHeight + padding) {
          placement = 'top';
        } else if (spaceLeft >= tooltipWidth + padding) {
          placement = 'left';
        } else if (spaceRight >= tooltipWidth + padding) {
          placement = 'right';
        } else {
          placement = 'bottom';
        }
      }

      let tooltipTop = 0;
      let tooltipLeft = 0;

      switch (placement) {
        case 'bottom':
          tooltipTop = rect.bottom + padding;
          tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'top':
          tooltipTop = rect.top - tooltipHeight - padding;
          tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'right':
          tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2;
          tooltipLeft = rect.right + padding;
          break;
        case 'left':
          tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2;
          tooltipLeft = rect.left - tooltipWidth - padding;
          break;
      }

      // Keep tooltip in viewport
      tooltipLeft = Math.max(padding, Math.min(viewportWidth - tooltipWidth - padding, tooltipLeft));
      tooltipTop = Math.max(padding, Math.min(viewportHeight - tooltipHeight - padding, tooltipTop));

      setTooltipPosition({ top: tooltipTop, left: tooltipLeft, placement });
    }, 50); // 50ms debounce
  }, [currentStep]);

  // Initial measurement and resize listener
  useEffect(() => {
    if (!isActive) return;

    // Initial measurement after a small delay
    const initialTimeout = setTimeout(measureTarget, 150);

    // Listen for resize
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);

    return () => {
      clearTimeout(initialTimeout);
      if (measureTimeoutRef.current) {
        clearTimeout(measureTimeoutRef.current);
      }
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [isActive, currentStep, measureTarget]);

  // Re-measure when step changes
  useEffect(() => {
    if (isActive && currentStep) {
      measureTarget();
    }
  }, [isActive, currentStep, measureTarget]);

  // Click the target element
  const clickTargetElement = useCallback(() => {
    if (!currentStep?.target) return false;

    // Find the target element
    const selectors = currentStep.target.split(',').map(s => s.trim());
    let targetElement: HTMLElement | null = null;

    for (const selector of selectors) {
      targetElement = document.querySelector(selector) as HTMLElement;
      if (targetElement) break;
    }

    if (targetElement) {
      console.log('🎯 Tour: Clicking target', targetElement);
      targetElement.click();
      return true;
    }
    return false;
  }, [currentStep]);

  // Handle click on spotlight area
  const handleSpotlightClick = useCallback(() => {
    if (isClickingRef.current) return;
    isClickingRef.current = true;

    const clicked = clickTargetElement();

    // Auto-advance for click actions after a delay
    if (clicked && currentStep?.action === 'click') {
      setTimeout(() => {
        nextStep();
        isClickingRef.current = false;
      }, 500);
    } else {
      isClickingRef.current = false;
    }
  }, [currentStep, nextStep, clickTargetElement]);

  // Handle "Next" button click - also triggers target click for 'click' actions
  // IMPORTANT: Next button should ALWAYS advance the tour, even if target doesn't exist
  const handleNextClick = useCallback(() => {
    if (isClickingRef.current) return;

    // If this step requires clicking a target, try to click it
    if (currentStep?.action === 'click') {
      isClickingRef.current = true;
      clickTargetElement(); // Click if element exists (non-blocking)

      // Always advance after a short delay, regardless of click success
      setTimeout(() => {
        nextStep();
        isClickingRef.current = false;
      }, 300);
    } else {
      // For 'wait' or other actions, just advance immediately
      nextStep();
    }
  }, [currentStep, nextStep, clickTargetElement]);

  if (!isActive || !currentStep) return null;

  const spotlightPadding = currentStep.highlightPadding || 8;

  return (
    <>
      {/* Dark overlay - for 'wait' actions, allow clicks through to modal */}
      <div
        className={`fixed inset-0 z-[9997] ${currentStep?.action === 'wait' ? 'pointer-events-none' : ''}`}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Visual spotlight overlay */}
      <div className="fixed inset-0 z-[9998] pointer-events-none">
        <SpotlightOverlay
          targetRect={targetRect}
          padding={spotlightPadding}
        />
      </div>

      {/* Clickable spotlight area - for 'wait' actions, allow clicks through to element */}
      {targetRect && (
        <div
          onClick={currentStep?.action === 'wait' ? undefined : handleSpotlightClick}
          className={`fixed z-[10000] rounded-xl ${currentStep?.action === 'wait' ? 'pointer-events-none' : 'cursor-pointer'}`}
          style={{
            top: targetRect.top - spotlightPadding,
            left: targetRect.left - spotlightPadding,
            width: targetRect.width + spotlightPadding * 2,
            height: targetRect.height + spotlightPadding * 2,
          }}
        />
      )}

      {/* Tooltip */}
      <TourTooltip
        step={currentStep}
        position={tooltipPosition}
        stepIndex={currentStepIndex}
        totalSteps={totalSteps}
        onNext={handleNextClick}
        onPrevious={previousStep}
        onSkip={skipTour}
      />
    </>
  );
}
