import React, { useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, Download, Maximize2, AlertCircle, CheckCircle2, Info, FileText } from 'lucide-react';

interface CenterPreviewProps {
  children: React.ReactNode;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onDownload: () => void;
  onFullscreen: () => void;
  qualityScore?: number;
  qualityIssues?: Array<{
    type: 'error' | 'warning' | 'suggestion';
    section: string;
    message: string;
  }>;
  onFitToWidth?: () => void;
  onFitToPage?: () => void;
  showPageBoundaries?: boolean;
  onTogglePageBoundaries?: () => void;
}

export default function CenterPreview({ 
  children, 
  zoom, 
  onZoomIn, 
  onZoomOut, 
  onResetZoom,
  onDownload,
  onFullscreen,
  qualityScore,
  qualityIssues = [],
  onFitToWidth,
  onFitToPage,
  showPageBoundaries = false,
  onTogglePageBoundaries
}: CenterPreviewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        e.preventDefault();
        onZoomIn();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        onZoomOut();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        onResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onZoomIn, onZoomOut, onResetZoom]);

  return (
    <div className="flex-1 relative flex flex-col h-full bg-gray-100/50 dark:bg-[#0A0A0B] overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 p-1.5 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
        {/* Quality Score Badge */}
        {qualityScore !== undefined && (
          <>
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                qualityScore >= 80 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : qualityScore >= 60
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}
              title={`CV Quality Score: ${qualityScore}%`}
            >
              {qualityScore >= 80 ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              <span>{qualityScore}%</span>
            </div>
            {qualityIssues.length > 0 && (
              <div className="relative group">
                <button
                  className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
                  title={`${qualityIssues.length} quality ${qualityIssues.length === 1 ? 'issue' : 'issues'}`}
                >
                  <Info className="w-4 h-4" />
                </button>
                {/* Tooltip with issues */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                  <div className="text-xs font-semibold mb-2 text-gray-900 dark:text-white">Quality Issues:</div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {qualityIssues.slice(0, 5).map((issue, idx) => (
                      <div key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                        <span className={`font-medium ${
                          issue.type === 'error' ? 'text-red-600 dark:text-red-400' :
                          issue.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-blue-600 dark:text-blue-400'
                        }`}>
                          {issue.section}:
                        </span>{' '}
                        {issue.message}
                      </div>
                    ))}
                    {qualityIssues.length > 5 && (
                      <div className="text-xs text-gray-500 dark:text-gray-500 pt-1">
                        +{qualityIssues.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
          </>
        )}

        {/* Zoom Controls */}
        <button 
          onClick={onZoomOut}
          className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
          title="Zoom Out (Ctrl/Cmd + -)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium w-12 text-center text-gray-600 dark:text-gray-300 select-none">
          {zoom}%
        </span>
        <button 
          onClick={onZoomIn}
          className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
          title="Zoom In (Ctrl/Cmd + +)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        
        {/* Zoom Presets */}
        {(onFitToWidth || onFitToPage) && (
          <>
            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
            {onFitToWidth && (
              <button
                onClick={onFitToWidth}
                className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Fit to Width"
              >
                Fit Width
              </button>
            )}
            {onFitToPage && (
              <button
                onClick={onFitToPage}
                className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Fit to Page"
              >
                Fit Page
              </button>
            )}
          </>
        )}

        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
        {onTogglePageBoundaries && (
          <button
            onClick={onTogglePageBoundaries}
            className={`p-2 rounded-lg transition-colors ${
              showPageBoundaries
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
            title="Toggle Page Boundaries"
          >
            <FileText className="w-4 h-4" />
          </button>
        )}
        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
        <button 
          onClick={onDownload}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          PDF
        </button>
      </div>

      {/* Preview Area - Fixed scrolling */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-auto flex justify-center items-start p-8 min-h-0"
      >
        {/* Wrapper to handle scaled content properly */}
        <div 
          className="flex-shrink-0 relative" 
          style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
        >
          {children}
          {/* Page Boundaries Visualization - positioned over the CV */}
          {showPageBoundaries && (
            <div 
              className="absolute pointer-events-none border-t border-dashed border-gray-300 dark:border-gray-600"
              style={{
                top: '2rem',
                left: 0,
                right: 0,
                height: `calc(1122.52px * ${zoom / 100})`,
                background: `repeating-linear-gradient(
                  to bottom,
                  transparent,
                  transparent calc(1122.52px * ${zoom / 100} - 2px),
                  rgba(156, 163, 175, 0.3) calc(1122.52px * ${zoom / 100} - 2px),
                  rgba(156, 163, 175, 0.3) calc(1122.52px * ${zoom / 100})
                )`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

