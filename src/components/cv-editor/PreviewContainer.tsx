import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, Download, RefreshCw } from 'lucide-react';
import { CVData, CVTemplate } from '../../types/cvEditor';
import { A4_WIDTH_PX, A4_HEIGHT_PX } from '../../lib/cvEditorUtils';
import ModernProfessional from './templates/ModernProfessional';
import ExecutiveClassic from './templates/ExecutiveClassic';
import TechMinimalist from './templates/TechMinimalist';
import CreativeBalance from './templates/CreativeBalance';
import ZoomControls from './ZoomControls';

interface PreviewContainerProps {
  cvData: CVData;
  template: CVTemplate;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

const ZOOM_PRESETS = [50, 70, 100, 120, 150];

export default function PreviewContainer({
  cvData,
  template,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset
}: PreviewContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [fitToWidthZoom, setFitToWidthZoom] = useState(100);
  const [fitToPageZoom, setFitToPageZoom] = useState(100);

  // Calculate fit-to-width and fit-to-page zoom levels
  useEffect(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth - 80; // Account for padding
    const containerHeight = containerRef.current.clientHeight - 80;

    // Fit to width
    const widthZoom = Math.floor((containerWidth / A4_WIDTH_PX) * 100);
    setFitToWidthZoom(Math.min(widthZoom, 150));

    // Fit to page
    const heightZoom = Math.floor((containerHeight / A4_HEIGHT_PX) * 100);
    const pageZoom = Math.min(widthZoom, heightZoom);
    setFitToPageZoom(Math.min(pageZoom, 150));
  }, []);

  // Get the appropriate template component
  const getTemplateComponent = () => {
    switch (template) {
      case 'executive-classic':
        return ExecutiveClassic;
      case 'tech-minimalist':
        return TechMinimalist;
      case 'creative-balance':
        return CreativeBalance;
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

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-gray-100 dark:bg-gray-950">
      {/* Zoom Controls Bar */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
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
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

            {/* Zoom Presets */}
            <div className="flex items-center gap-1">
              {ZOOM_PRESETS.map(preset => (
                <button
                  key={preset}
                  onClick={() => handleZoomPreset(preset)}
                  className={`
                    px-3 py-1 text-xs font-medium rounded-md transition-colors
                    ${zoom === preset
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
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
            <button
              onClick={() => {
                // TODO: Implement fullscreen
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-8">
        <div className="flex justify-center">
          <motion.div
            animate={{ scale: zoom / 100 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{
              transformOrigin: 'top center',
            }}
          >
            {/* A4 Paper Container */}
            <div
              ref={contentRef}
              id="cv-preview-content"
              className="bg-white shadow-xl"
              style={{
                width: `${A4_WIDTH_PX}px`,
                minHeight: `${A4_HEIGHT_PX}px`,
                padding: '40px',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                borderRadius: '2px'
              }}
            >
              {/* Template Content */}
              <TemplateComponent cvData={cvData} />
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
    </div>
  );
}
