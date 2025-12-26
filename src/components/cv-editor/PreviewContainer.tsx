import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, Download, RefreshCw, AlertTriangle } from 'lucide-react';
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
import ZoomControls from './ZoomControls';

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

const ZOOM_PRESETS = [50, 70, 100, 120, 150];

export default function PreviewContainer({
  cvData,
  template,
  zoom,
  layoutSettings,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onToggleFullscreen,
  onSectionClick,
  highlightTarget
}: PreviewContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [fitToWidthZoom, setFitToWidthZoom] = useState(100);
  const [fitToPageZoom, setFitToPageZoom] = useState(100);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [overflowAmount, setOverflowAmount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileZoom, setMobileZoom] = useState(50);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate fit-to-width zoom for mobile
  useEffect(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth - (isMobile ? 32 : 80); // Less padding on mobile
    const containerHeight = containerRef.current.clientHeight - (isMobile ? 32 : 80);

    // Fit to width - calculate zoom to fit A4 width in container
    const widthZoom = Math.floor((containerWidth / A4_WIDTH_PX) * 100);
    setFitToWidthZoom(Math.min(widthZoom, 150));

    // For mobile, auto-set zoom to fit width
    if (isMobile) {
      const autoZoom = Math.min(widthZoom, 80); // Cap at 80% for readability
      setMobileZoom(Math.max(autoZoom, 35)); // Minimum 35%
    }

    // Fit to page
    const heightZoom = Math.floor((containerHeight / A4_HEIGHT_PX) * 100);
    const pageZoom = Math.min(widthZoom, heightZoom);
    setFitToPageZoom(Math.min(pageZoom, 150));
  }, [isMobile]);

  // Detect A4 overflow with ResizeObserver
  useEffect(() => {
    if (!contentRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const contentHeight = entry.target.scrollHeight;
        const overflow = contentHeight > A4_HEIGHT_PX;

        setIsOverflowing(overflow);
        setOverflowAmount(overflow ? contentHeight - A4_HEIGHT_PX : 0);
      }
    });

    observer.observe(contentRef.current);

    return () => observer.disconnect();
  }, [cvData, template, layoutSettings]);

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

  // Handle zoom preset clicks
  const handleZoomPreset = (preset: number) => {
    // This will be handled by the parent component
    // For now, we'll use the existing zoom controls
    const currentZoom = zoom;
    const steps = Math.abs(preset - currentZoom) / 10;

    if (preset > currentZoom) {
      for (let i = 0; i < steps; i++) {
        setTimeout(() => onZoomIn(), i * 50);
      }
    } else if (preset < currentZoom) {
      for (let i = 0; i < steps; i++) {
        setTimeout(() => onZoomOut(), i * 50);
      }
    }
  };

  // Effective zoom - use mobile auto-zoom on mobile devices
  const effectiveZoom = isMobile ? mobileZoom : zoom;

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-gray-100 dark:bg-[#333234]">
      {/* Zoom Controls Bar - Hidden on mobile */}
      {!isMobile && (
        <div className="flex-shrink-0 bg-white dark:bg-[#242325] border-b border-gray-200 dark:border-[#3d3c3e]">
          <div className="px-4 py-3 flex items-center justify-between">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              {/* Zoom Out */}
              <button
                onClick={onZoomOut}
                disabled={zoom <= 50}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Zoom out (Ctrl -)"
              >
                <ZoomOut className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Zoom Percentage */}
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[50px] text-center">
                  {zoom}%
                </span>
              </div>

              {/* Zoom In */}
              <button
                onClick={onZoomIn}
                disabled={zoom >= 150}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Zoom in (Ctrl +)"
              >
                <ZoomIn className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Divider */}
              <div className="w-px h-6 bg-gray-200 dark:bg-[#3d3c3e] mx-2" />

              {/* Zoom Presets */}
              <div className="flex items-center gap-1">
                {ZOOM_PRESETS.map(preset => (
                  <button
                    key={preset}
                    onClick={() => handleZoomPreset(preset)}
                    className={`
                    px-3 py-1 text-xs font-medium rounded-md transition-colors
                    ${zoom === preset
                        ? 'bg-[#635BFF]/10 dark:bg-[#5249e6]/30 text-[#635BFF] dark:text-[#a5a0ff]'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                  `}
                  >
                    {preset}%
                  </button>
                ))}
              </div>

              {/* Reset */}
              <button
                onClick={onZoomReset}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Reset zoom"
              >
                <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {onToggleFullscreen && (
                <button
                  onClick={onToggleFullscreen}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Zoom Controls - Simple floating buttons */}
      {isMobile && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/90 dark:bg-[#2b2a2c]/90 backdrop-blur-md rounded-full px-3 py-2 shadow-lg border border-gray-200 dark:border-[#3d3c3e]">
          <button
            onClick={() => setMobileZoom(prev => Math.max(prev - 10, 30))}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-full transition-colors"
          >
            <ZoomOut className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[40px] text-center">
            {mobileZoom}%
          </span>
          <button
            onClick={() => setMobileZoom(prev => Math.min(prev + 10, 100))}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-full transition-colors"
          >
            <ZoomIn className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      )}

      {/* Preview Area - Less padding on mobile */}
      <div className={`flex-1 min-h-0 overflow-auto ${isMobile ? 'p-4' : 'p-8'}`}>
        <div className="flex justify-center" style={{ minWidth: 'fit-content' }}>
          <motion.div
            animate={{ scale: effectiveZoom / 100 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{
              transformOrigin: 'top center',
            }}
          >
            {/* A4 Paper Container with Overflow Indicator */}
            <div className="relative">
              <div
                ref={contentRef}
                id="cv-preview-content"
                className="bg-white shadow-xl transition-all duration-300"
                style={{
                  width: `${A4_WIDTH_PX}px`,
                  minHeight: `${A4_HEIGHT_PX}px`,
                  padding: '40px',
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                  borderRadius: '2px'
                }}
              >
                {/* Template Content */}
                <TemplateComponent
                  cvData={cvData}
                  layoutSettings={{
                    fontSize: layoutSettings?.fontSize ?? 10,
                    dateFormat: layoutSettings?.dateFormat ?? 'jan-24',
                    lineHeight: layoutSettings?.lineHeight ?? 1.3,
                    fontFamily: layoutSettings?.fontFamily ?? 'Inter',
                    accentColor: layoutSettings?.accentColor,
                    experienceSpacing: layoutSettings?.experienceSpacing,
                    showSkillLevel: layoutSettings?.showSkillLevel ?? true
                  }}
                  onSectionClick={onSectionClick}
                  highlightTarget={highlightTarget}
                />
              </div>

              {/* A4 Page Limit Indicator - Red line showing where A4 ends */}
              {isOverflowing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute left-0 pointer-events-none"
                  style={{
                    top: `${A4_HEIGHT_PX}px`,
                    width: `${A4_WIDTH_PX}px`
                  }}
                >
                  {/* Red border line marking the A4 limit */}
                  <div className="relative">
                    {/* Thick red line */}
                    <div
                      className="w-full bg-red-500"
                      style={{ height: '4px' }}
                    />

                    {/* Red overlay tint on overflow area */}
                    <div
                      className="absolute top-0 left-0 w-full bg-red-500 opacity-10"
                      style={{
                        height: `${overflowAmount}px`
                      }}
                    />

                    {/* Label indicator */}
                    <div className="absolute -top-8 right-4 flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-full shadow-lg">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>A4 Limit</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Page Break Indicator (if content exceeds one page) */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-400 dark:text-gray-600">
                A4 Paper (210mm × 297mm)
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* A4 Overflow Warning Badge */}
      <AnimatePresence>
        {isOverflowing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-3 px-6 py-3 bg-red-500 text-white rounded-full shadow-2xl backdrop-blur-sm border border-red-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm whitespace-nowrap">
                Content exceeds A4 page
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
