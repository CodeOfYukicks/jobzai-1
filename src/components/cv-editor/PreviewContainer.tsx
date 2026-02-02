import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { CVData, CVTemplate, CVLayoutSettings, SectionClickTarget } from '../../types/cvEditor';
import { HighlightTarget } from '../../types/cvReview';
import { A4_WIDTH_PX, A4_HEIGHT_PX } from '../../lib/cvEditorUtils';
import ModernProfessional from './templates/ModernProfessional';
import ExecutiveClassic from './templates/ExecutiveClassic';
import TechMinimalist from './templates/TechMinimalist';
import CreativeBalance from './templates/CreativeBalance';
import HarvardClassic from './templates/HarvardClassic';
import SwissPhoto from './templates/SwissPhoto';
import CorporatePhoto from './templates/CorporatePhoto';
import ElegantSimple from './templates/ElegantSimple';

interface PreviewContainerProps {
  cvData: CVData;
  template: CVTemplate;
  zoom: number;
  layoutSettings?: CVLayoutSettings;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onToggleFullscreen?: () => void;
  onSectionClick?: (target: SectionClickTarget) => void;
  highlightTarget?: HighlightTarget | null;
}

// Page margin - increased for better appearance
const PAGE_MARGIN = 56;
// Usable content height per page
const CONTENT_HEIGHT = A4_HEIGHT_PX - (PAGE_MARGIN * 2);

interface SectionMeasurement {
  id: string;
  top: number;
  height: number;
  bottom: number;
}

interface PageBreak {
  startY: number;
  endY: number;
}

export default function PreviewContainer({
  cvData,
  template,
  zoom,
  layoutSettings,
  onZoomIn,
  onZoomOut,
  onSectionClick,
  highlightTarget
}: PreviewContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [totalContentHeight, setTotalContentHeight] = useState(A4_HEIGHT_PX);
  const [pageBreaks, setPageBreaks] = useState<PageBreak[]>([{ startY: 0, endY: CONTENT_HEIGHT }]);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileZoom, setMobileZoom] = useState(50);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate fit-to-width zoom for mobile
  useEffect(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth - (isMobile ? 32 : 80);

    if (isMobile) {
      const widthZoom = Math.floor((containerWidth / A4_WIDTH_PX) * 100);
      const autoZoom = Math.min(widthZoom, 80);
      setMobileZoom(Math.max(autoZoom, 35));
    }
  }, [isMobile]);

  // Measure sections and calculate smart page breaks
  const calculatePageBreaks = useCallback(() => {
    if (!measureRef.current) return;

    // Get all sections with data-cv-section attribute
    const sectionElements = measureRef.current.querySelectorAll('[data-cv-section]');
    const measurements: SectionMeasurement[] = [];

    sectionElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      measurements.push({
        id: htmlEl.dataset.cvSection || '',
        top: htmlEl.offsetTop,
        height: htmlEl.offsetHeight,
        bottom: htmlEl.offsetTop + htmlEl.offsetHeight
      });
    });

    // Calculate total content height
    const totalHeight = measureRef.current.scrollHeight;
    setTotalContentHeight(Math.max(totalHeight, CONTENT_HEIGHT));

    // If everything fits on one page, no need for smart breaks
    if (totalHeight <= CONTENT_HEIGHT) {
      setPageBreaks([{ startY: 0, endY: totalHeight }]);
      return;
    }

    // Calculate smart page breaks with start AND end positions
    const breaks: PageBreak[] = [];
    let currentPageStart = 0;
    let currentPageEnd = CONTENT_HEIGHT;

    while (currentPageStart < totalHeight) {
      // Check if any section would be cut at currentPageEnd
      let adjustedEnd = currentPageEnd;

      for (const section of measurements) {
        const sectionStart = section.top;
        const sectionEnd = section.bottom;

        // Would this section be cut by the current page boundary?
        if (sectionStart < currentPageEnd && sectionEnd > currentPageEnd) {
          // Section would be cut!
          // If section fits on a page, end this page BEFORE the section
          if (section.height <= CONTENT_HEIGHT) {
            adjustedEnd = sectionStart;
            break;
          }
          // If section is too big, just let it break naturally
        }
      }

      // Add this page break
      breaks.push({
        startY: currentPageStart,
        endY: Math.min(adjustedEnd, totalHeight)
      });

      // Move to next page
      currentPageStart = adjustedEnd;
      currentPageEnd = currentPageStart + CONTENT_HEIGHT;
    }

    setPageBreaks(breaks);
  }, []);

  // Measure content height and calculate page breaks
  useEffect(() => {
    if (!measureRef.current) return;

    // Initial calculation
    const timeoutId = setTimeout(calculatePageBreaks, 100);

    // Set up observer for changes
    const observer = new ResizeObserver(() => {
      calculatePageBreaks();
    });

    observer.observe(measureRef.current);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [cvData, template, layoutSettings, calculatePageBreaks]);

  // Get the appropriate template component
  const getTemplateComponent = () => {
    switch (template) {
      case 'executive-classic':
        return ExecutiveClassic;
      case 'tech-minimalist':
        return TechMinimalist;
      case 'creative-balance':
        return CreativeBalance;
      case 'harvard-classic':
        return HarvardClassic;
      case 'swiss-photo':
        return SwissPhoto;
      case 'corporate-photo':
        return CorporatePhoto;
      case 'elegant-simple':
        return ElegantSimple;
      case 'modern-professional':
      default:
        return ModernProfessional;
    }
  };

  const TemplateComponent = getTemplateComponent();
  const effectiveZoom = isMobile ? mobileZoom : zoom;
  const pageCount = pageBreaks.length;

  // Layout settings with defaults
  const layoutSettingsWithDefaults = {
    fontSize: layoutSettings?.fontSize ?? 10,
    dateFormat: layoutSettings?.dateFormat ?? 'jan-24',
    lineHeight: layoutSettings?.lineHeight ?? 1.3,
    fontFamily: layoutSettings?.fontFamily ?? 'Inter',
    accentColor: layoutSettings?.accentColor,
    experienceSpacing: layoutSettings?.experienceSpacing,
    showSkillLevel: layoutSettings?.showSkillLevel ?? true
  };

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-gray-100 dark:bg-[#333234] relative">
      {/* Floating Zoom Controls */}
      <div className="absolute top-4 right-4 z-[100] flex items-center gap-0.5 bg-white/20 dark:bg-black/30 backdrop-blur-xl text-gray-700 dark:text-white rounded-xl px-1.5 py-1.5 shadow-lg border border-white/30 dark:border-white/10">
        <button
          onClick={isMobile ? () => setMobileZoom(prev => Math.max(prev - 10, 30)) : onZoomOut}
          disabled={isMobile ? mobileZoom <= 30 : zoom <= 50}
          className="p-1 hover:bg-white/10 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-3 bg-white/20 mx-0.5" />

        <button
          onClick={isMobile ? () => setMobileZoom(prev => Math.min(prev + 10, 100)) : onZoomIn}
          disabled={isMobile ? mobileZoom >= 100 : zoom >= 150}
          className="p-1 hover:bg-white/10 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hidden measurement container - renders full content to measure sections */}
      <div
        ref={measureRef}
        className="absolute opacity-0 pointer-events-none"
        style={{
          width: `${A4_WIDTH_PX - (PAGE_MARGIN * 2)}px`,
          left: '-9999px',
          top: 0
        }}
        aria-hidden="true"
      >
        <TemplateComponent
          cvData={cvData}
          layoutSettings={layoutSettingsWithDefaults}
        />
      </div>

      {/* Preview Area with Multiple Pages */}
      <div className={`flex-1 min-h-0 overflow-auto ${isMobile ? 'p-4 pb-24' : 'p-8 pb-16'} flex flex-col items-center`}>
        <motion.div
          animate={{ scale: effectiveZoom / 100 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          style={{ transformOrigin: 'top center' }}
          className="flex flex-col items-center"
        >
          {/* Render each page */}
          {pageBreaks.map((page, pageIndex) => {
            const contentHeight = page.endY - page.startY;

            return (
              <div key={pageIndex} className="relative mb-8 last:mb-0">
                {/* Page number label - only show if multiple pages */}
                {pageCount > 1 && (
                  <div className="absolute -top-6 left-0 right-0 flex justify-center">
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                      Page {pageIndex + 1} of {pageCount}
                    </span>
                  </div>
                )}

                {/* A4 Paper Container */}
                <div
                  className="bg-white shadow-xl relative"
                  style={{
                    width: `${A4_WIDTH_PX}px`,
                    height: `${A4_HEIGHT_PX}px`,
                    overflow: 'hidden',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                    borderRadius: '2px'
                  }}
                >
                  {/* Content wrapper - uses clip-path for precise clipping */}
                  <div
                    className="absolute"
                    style={{
                      top: PAGE_MARGIN - page.startY,
                      left: PAGE_MARGIN,
                      right: PAGE_MARGIN,
                      // Clip to exactly the content height for this page
                      clipPath: `inset(${page.startY}px 0 ${Math.max(0, totalContentHeight - page.endY)}px 0)`
                    }}
                  >
                    <TemplateComponent
                      cvData={cvData}
                      layoutSettings={layoutSettingsWithDefaults}
                      onSectionClick={onSectionClick}
                      highlightTarget={highlightTarget}
                    />
                  </div>

                  {/* Top margin area (white) */}
                  <div
                    className="absolute top-0 left-0 right-0 bg-white z-10"
                    style={{ height: `${PAGE_MARGIN}px` }}
                  />

                  {/* Bottom margin area (white) */}
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-white z-10"
                    style={{ height: `${PAGE_MARGIN}px` }}
                  />
                </div>
              </div>
            );
          })}

          {/* Footer info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              A4 Paper (210mm × 297mm) {pageCount > 1 && `• ${pageCount} pages`}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
