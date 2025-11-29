import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight,
  Maximize2, Minimize2, RotateCw, FileText, Loader2
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { ImportedDocument } from './PDFPreviewCard';

// Configure PDF.js worker - use the worker bundled with pdfjs-dist
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PremiumPDFViewerProps {
  pdfDocument: ImportedDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];
const DEFAULT_ZOOM_INDEX = 2; // 1 = 100%

// Thumbnail component for sidebar
const PageThumbnail = memo(({ 
  pageNumber, 
  isActive, 
  onClick,
  fileUrl
}: { 
  pageNumber: number; 
  isActive: boolean; 
  onClick: () => void;
  fileUrl: string;
}) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={`relative w-full aspect-[3/4] rounded-lg overflow-hidden transition-all duration-200
      ${isActive 
        ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-500/20' 
        : 'ring-1 ring-white/10 hover:ring-white/30'
      }`}
  >
    <Document file={fileUrl} loading={null}>
      <Page
        pageNumber={pageNumber}
        width={80}
        renderTextLayer={false}
        renderAnnotationLayer={false}
      />
    </Document>
    <div className={`absolute bottom-0 inset-x-0 py-1 text-center text-[10px] font-medium
      ${isActive 
        ? 'bg-purple-500 text-white' 
        : 'bg-black/60 text-white/80'
      }`}
    >
      {pageNumber}
    </div>
  </motion.button>
));

PageThumbnail.displayName = 'PageThumbnail';

// Loading spinner component
const LoadingSpinner = memo(() => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="relative">
      <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-purple-500 animate-spin" />
      <FileText className="absolute inset-0 m-auto w-6 h-6 text-white/40" />
    </div>
    <p className="mt-4 text-sm text-white/60">Loading PDF...</p>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

const PremiumPDFViewer = memo(({ pdfDocument, isOpen, onClose }: PremiumPDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const zoom = ZOOM_LEVELS[zoomIndex];
  const zoomPercent = Math.round(zoom * 100);

  // Reset state when document changes
  useEffect(() => {
    if (pdfDocument) {
      setCurrentPage(1);
      setZoomIndex(DEFAULT_ZOOM_INDEX);
      setRotation(0);
      setIsLoading(true);
    }
  }, [pdfDocument?.id]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevPage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNextPage();
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPage, numPages, zoomIndex]);

  const onDocumentLoadSuccess = useCallback(({ numPages: pages }: { numPages: number }) => {
    setNumPages(pages);
    setIsLoading(false);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setIsLoading(false);
  }, []);

  const goToPrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(numPages, prev + 1));
  }, [numPages]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(numPages, page)));
  }, [numPages]);

  const zoomIn = useCallback(() => {
    setZoomIndex(prev => Math.min(ZOOM_LEVELS.length - 1, prev + 1));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomIndex(prev => Math.max(0, prev - 1));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomIndex(DEFAULT_ZOOM_INDEX);
  }, []);

  const rotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (pdfDocument?.fileUrl) {
      window.open(pdfDocument.fileUrl, '_blank');
    }
  }, [pdfDocument?.fileUrl]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!pdfDocument) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

          {/* Main Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10 backdrop-blur-sm">
              {/* Left: Document info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-[400px]">
                    {pdfDocument.name}
                  </h2>
                  <p className="text-xs text-white/50">
                    {numPages > 0 ? `${numPages} page${numPages > 1 ? 's' : ''}` : 'Loading...'}
                  </p>
                </div>
              </div>

              {/* Center: Navigation & Zoom */}
              <div className="hidden md:flex items-center gap-2">
                {/* Page Navigation */}
                <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage <= 1}
                    className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1 px-2">
                    <input
                      type="number"
                      value={currentPage}
                      onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                      className="w-10 text-center text-sm font-medium text-white bg-white/10 rounded px-1 py-0.5 border-0 focus:ring-1 focus:ring-purple-500"
                      min={1}
                      max={numPages}
                    />
                    <span className="text-white/40 text-sm">/</span>
                    <span className="text-white/70 text-sm">{numPages}</span>
                  </div>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage >= numPages}
                    className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-px h-6 bg-white/10" />

                {/* Zoom Controls */}
                <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg">
                  <button
                    onClick={zoomOut}
                    disabled={zoomIndex <= 0}
                    className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Zoom out (-)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={resetZoom}
                    className="px-2 py-0.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded transition-all min-w-[50px]"
                    title="Reset zoom"
                  >
                    {zoomPercent}%
                  </button>
                  <button
                    onClick={zoomIn}
                    disabled={zoomIndex >= ZOOM_LEVELS.length - 1}
                    className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Zoom in (+)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={rotate}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  title="Rotate"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowThumbnails(!showThumbnails)}
                  className={`p-2 rounded-lg transition-all ${showThumbnails ? 'text-purple-400 bg-purple-500/20' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                  title="Toggle thumbnails"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  title="Fullscreen (F)"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button
                  onClick={onClose}
                  className="p-2 text-white/70 hover:text-white hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex overflow-hidden">
              {/* Thumbnails Sidebar */}
              <AnimatePresence>
                {showThumbnails && numPages > 0 && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 100, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="hidden sm:flex flex-col bg-black/30 border-r border-white/10 overflow-hidden"
                  >
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                      {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                        <PageThumbnail
                          key={pageNum}
                          pageNumber={pageNum}
                          isActive={pageNum === currentPage}
                          onClick={() => goToPage(pageNum)}
                          fileUrl={pdfDocument.fileUrl}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* PDF Viewer */}
              <div 
                ref={viewerRef}
                className="flex-1 overflow-auto bg-gray-900/50 flex items-start justify-center p-4"
              >
                {isLoading && <LoadingSpinner />}
                
                <Document
                  file={pdfDocument.fileUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={null}
                  className={isLoading ? 'hidden' : 'flex flex-col items-center gap-4'}
                >
                  <motion.div
                    key={`page-${currentPage}-${rotation}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className="shadow-2xl rounded-lg overflow-hidden"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    <Page
                      pageNumber={currentPage}
                      scale={zoom}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="bg-white"
                      loading={
                        <div className="w-[600px] h-[800px] bg-gray-800 animate-pulse rounded-lg flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
                        </div>
                      }
                    />
                  </motion.div>
                </Document>
              </div>
            </div>

            {/* Mobile Navigation Footer */}
            <div className="md:hidden flex items-center justify-between px-4 py-3 bg-black/40 border-t border-white/10">
              <button
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 px-3 py-2 text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              
              <div className="flex items-center gap-2">
                <button onClick={zoomOut} className="p-2 text-white/70 hover:text-white bg-white/5 rounded-lg">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm text-white/70 min-w-[50px] text-center">{zoomPercent}%</span>
                <button onClick={zoomIn} className="p-2 text-white/70 hover:text-white bg-white/5 rounded-lg">
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage >= numPages}
                className="flex items-center gap-1 px-3 py-2 text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all disabled:opacity-30"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

PremiumPDFViewer.displayName = 'PremiumPDFViewer';

export default PremiumPDFViewer;

