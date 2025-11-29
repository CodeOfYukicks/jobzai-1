import { memo, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { flushSync, createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Calendar, Trash2, Eye, Download, MoreHorizontal, FolderInput
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker - use the worker bundled with pdfjs-dist
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// A4 dimensions for consistent sizing with CV cards
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

export interface ImportedDocument {
  id: string;
  name: string;
  fileUrl: string;
  fileSize: number;
  pageCount?: number;
  folderId?: string;
  createdAt: any;
  updatedAt: any;
}

interface PDFPreviewCardProps {
  document: ImportedDocument;
  onDelete: (id: string) => void;
  onView: (document: ImportedDocument) => void;
  onDownload?: (document: ImportedDocument) => void;
  compact?: boolean;
  draggable?: boolean;
}

function formatDateString(dateInput: any): string {
  if (!dateInput) return 'Unknown date';
  
  try {
    let date: Date;
    
    if (dateInput.toDate && typeof dateInput.toDate === 'function') {
      date = dateInput.toDate();
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      return 'Unknown date';
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown date';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// PDF Thumbnail Loading State
const ThumbnailLoading = memo(() => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
    <div className="relative">
      <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-700 shadow-lg flex items-center justify-center">
        <FileText className="w-7 h-7 text-slate-400 dark:text-slate-500 animate-pulse" />
      </div>
      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 rounded-md flex items-center justify-center shadow-lg shadow-red-500/30">
        <span className="text-[7px] font-bold text-white">PDF</span>
      </div>
    </div>
    <div className="mt-4 flex items-center gap-1.5">
      <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
));

ThumbnailLoading.displayName = 'ThumbnailLoading';

// PDF Thumbnail Error/Fallback State
const ThumbnailFallback = memo(({ name }: { name: string }) => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 p-3">
    <div className="relative mb-3">
      <div className="w-16 h-20 bg-white dark:bg-slate-700 rounded-lg shadow-xl border border-slate-200 dark:border-slate-600 flex flex-col overflow-hidden">
        {/* Document header */}
        <div className="h-4 bg-gradient-to-r from-red-500 to-red-600" />
        {/* Document lines */}
        <div className="flex-1 p-2 space-y-1.5">
          <div className="h-1 bg-slate-200 dark:bg-slate-600 rounded-full w-full" />
          <div className="h-1 bg-slate-200 dark:bg-slate-600 rounded-full w-4/5" />
          <div className="h-1 bg-slate-200 dark:bg-slate-600 rounded-full w-full" />
          <div className="h-1 bg-slate-200 dark:bg-slate-600 rounded-full w-3/5" />
          <div className="h-1 bg-slate-200 dark:bg-slate-600 rounded-full w-4/5" />
        </div>
      </div>
      <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/40 ring-2 ring-white dark:ring-slate-800">
        <span className="text-[8px] font-bold text-white">PDF</span>
      </div>
    </div>
    <p className="text-[9px] text-slate-500 dark:text-slate-400 text-center font-medium truncate max-w-full px-1">
      {name.length > 20 ? name.slice(0, 20) + '...' : name}
    </p>
  </div>
));

ThumbnailFallback.displayName = 'ThumbnailFallback';

const PDFPreviewCard = memo(({
  document,
  onDelete,
  onView,
  onDownload,
  compact = false,
  draggable = true
}: PDFPreviewCardProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ open: boolean; x: number; y: number }>({ open: false, x: 0, y: 0 });
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Card dimensions - match A4 proportions like CVPreviewCard
  const targetWidth = compact ? 140 : 220;
  const scale = targetWidth / A4_WIDTH_PX;
  const scaledHeight = A4_HEIGHT_PX * scale;
  const scaledWidth = A4_WIDTH_PX * scale;

  // Memoize PDF options to prevent re-renders
  const pdfOptions = useMemo(() => ({
    cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
  }), []);

  const handleView = useCallback(() => {
    onView(document);
  }, [document, onView]);

  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload(document);
    } else {
      window.open(document.fileUrl, '_blank');
    }
  }, [document, onDownload]);

  const confirmDelete = useCallback(() => {
    onDelete(document.id);
    setIsDeleteDialogOpen(false);
  }, [document.id, onDelete]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate position ensuring menu stays on screen
    const x = e.clientX;
    const y = e.clientY;
    
    // Adjust if menu would go off-screen (assuming menu is ~160px wide and ~120px tall)
    const menuWidth = 160;
    const menuHeight = 120;
    const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
    const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);
    
    flushSync(() => {
      setContextMenu({ open: true, x: adjustedX, y: adjustedY });
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, open: false }));
  }, []);

  const handleDeleteFromContext = useCallback(() => {
    closeContextMenu();
    setIsDeleteDialogOpen(true);
  }, [closeContextMenu]);

  // Handle click outside to close context menu
  useEffect(() => {
    if (!contextMenu.open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };

    // Use capture phase for faster response - use window.document to avoid shadowing
    window.document.addEventListener('mousedown', handleClickOutside, true);
    window.document.addEventListener('contextmenu', closeContextMenu, true);
    
    return () => {
      window.document.removeEventListener('mousedown', handleClickOutside, true);
      window.document.removeEventListener('contextmenu', closeContextMenu, true);
    };
  }, [contextMenu.open, closeContextMenu]);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', document.id);
    e.dataTransfer.setData('application/x-document-id', document.id);
    e.dataTransfer.effectAllowed = 'move';
    
    const dragImage = window.document.createElement('div');
    dragImage.style.cssText = `
      width: 80px;
      height: 100px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border-radius: 6px;
      box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: white;
      font-weight: 600;
      position: absolute;
      top: -1000px;
      left: -1000px;
    `;
    dragImage.textContent = 'PDF';
    window.document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 40, 50);
    
    setTimeout(() => {
      if (window.document.body.contains(dragImage)) {
        window.document.body.removeChild(dragImage);
      }
    }, 100);
  }, [document.id]);

  const onDocumentLoadSuccess = useCallback(({ numPages: pages }: { numPages: number }) => {
    setNumPages(pages);
    setThumbnailLoaded(true);
  }, []);

  const onDocumentLoadError = useCallback(() => {
    setThumbnailError(true);
  }, []);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -8,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
      className="group relative flex flex-col items-center p-4 rounded-xl transition-all duration-300 cursor-pointer"
      onClick={handleView}
      onContextMenu={handleContextMenu}
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
    >
      {/* PDF Preview */}
      <div 
        className="relative mb-4"
        style={{ 
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`
        }}
      >
        {/* Red Glow Effect for PDF */}
        <div 
          className="absolute -inset-4 rounded-lg opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500 -z-30"
          style={{
            background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.25), transparent 70%)'
          }}
        />

        {/* Enhanced Stack effect layers */}
        <div className="absolute top-0 left-0 w-full h-full bg-white/80 dark:bg-gray-700/80 rounded-[3px] transform translate-y-1.5 translate-x-1.5 opacity-0 group-hover:opacity-60 transition-all duration-300 -z-10 shadow-sm" />
        <div className="absolute top-0 left-0 w-full h-full bg-white/60 dark:bg-gray-600/60 rounded-[3px] transform translate-y-3 translate-x-3 opacity-0 group-hover:opacity-40 transition-all duration-300 -z-20 shadow-sm" />

        <div className="relative w-full h-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.15)] transition-all duration-300 overflow-hidden rounded-[3px] ring-1 ring-black/5 group-hover:ring-black/10">
          
          {/* PDF Badge */}
          <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-bold rounded shadow-lg">
            PDF
          </div>

          {/* Page count badge */}
          {numPages && numPages > 1 && (
            <div className="absolute bottom-2 right-2 z-10 px-1.5 py-0.5 bg-black/60 text-white text-[8px] font-medium rounded backdrop-blur-sm">
              {numPages} pages
            </div>
          )}

          {/* PDF Thumbnail using react-pdf */}
          <div className="w-full h-full flex items-start justify-center overflow-hidden bg-white">
            {!thumbnailError ? (
              <Document
                file={document.fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={<ThumbnailLoading />}
                error={<ThumbnailFallback name={document.name} />}
                className="flex items-center justify-center w-full h-full"
                options={pdfOptions}
              >
                <Page
                  pageNumber={1}
                  width={scaledWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-none"
                  loading={<ThumbnailLoading />}
                  error={<ThumbnailFallback name={document.name} />}
                />
              </Document>
            ) : (
              <ThumbnailFallback name={document.name} />
            )}
          </div>

          {/* Glass Action Bar - Appears on hover */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <div className="flex items-center gap-1 px-2 py-1.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-full shadow-xl border border-black/5 dark:border-white/10">
              <motion.button
                onClick={(e) => { e.stopPropagation(); handleView(); }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all"
                title="View"
              >
                <Eye className="w-3.5 h-3.5" />
              </motion.button>
              <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
              <motion.button
                onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-all"
                title="Download"
              >
                <Download className="w-3.5 h-3.5" />
              </motion.button>
              <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
              <motion.button
                onClick={(e) => { e.stopPropagation(); setIsDeleteDialogOpen(true); }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full flex flex-col items-center gap-1">
        <h3 
          className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[180px] text-center"
          title={document.name}
        >
          {document.name}
        </h3>
        
        {!compact && (
          <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDateString(document.updatedAt || document.createdAt)}
            </span>
            <span>•</span>
            <span>{formatFileSize(document.fileSize)}</span>
          </div>
        )}
      </div>

      {/* Context Menu - Using Portal to escape transform hierarchy */}
      {contextMenu.open && typeof window !== 'undefined' && window.document?.body && createPortal(
        <div
          ref={contextMenuRef}
          className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-xl shadow-2xl
            border border-gray-200 dark:border-gray-700 py-1.5 min-w-[160px]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onMouseDown={(e) => {
              e.stopPropagation();
              closeContextMenu();
              handleView();
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200
              hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3 transition-colors"
          >
            <Eye className="w-4 h-4 text-blue-500" />
            View PDF
          </button>
          <button
            onMouseDown={(e) => {
              e.stopPropagation();
              closeContextMenu();
              handleDownload();
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200
              hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3 transition-colors"
          >
            <Download className="w-4 h-4 text-green-500" />
            Download
          </button>
          <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
          <button
            onMouseDown={(e) => {
              e.stopPropagation();
              handleDeleteFromContext();
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400
              hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>,
        window.document.body
      )}

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {isDeleteDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsDeleteDialogOpen(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Delete Document?
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                "{document.name}" will be permanently deleted.
              </p>
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                    hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 
                    rounded-lg transition-colors shadow-lg shadow-red-600/25"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

PDFPreviewCard.displayName = 'PDFPreviewCard';

export default PDFPreviewCard;
export type { ImportedDocument };

