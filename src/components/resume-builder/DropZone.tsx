import { memo, useState, useCallback, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface DropZoneProps {
  children: ReactNode;
  onFileDrop: (files: File[]) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in bytes
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

const DEFAULT_ACCEPTED_TYPES = ['application/pdf'];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

const DropZone = memo(({
  children,
  onFileDrop,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxFileSize = DEFAULT_MAX_SIZE,
  multiple = true,
  disabled = false,
  className = ''
}: DropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const dragCounterRef = useRef(0);

  const validateFiles = useCallback((files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      // Check file type
      if (!acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', '/'));
        }
        return file.type === type;
      })) {
        errors.push(`${file.name}: Invalid file type`);
        return;
      }

      // Check file size
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: File too large (max ${formatFileSize(maxFileSize)})`);
        return;
      }

      valid.push(file);
    });

    return { valid, errors };
  }, [acceptedTypes, maxFileSize]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    dragCounterRef.current++;
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      // Check if any item is a file (not just a drag from another element)
      const hasFiles = Array.from(e.dataTransfer.items).some(item => item.kind === 'file');
      if (hasFiles) {
        setIsDragging(true);
        setDragError(null);
      }
    }
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    // Set dropEffect to copy for visual feedback
    e.dataTransfer.dropEffect = 'copy';
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current--;
    
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
      setDragError(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current = 0;
    setIsDragging(false);
    
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    
    if (droppedFiles.length === 0) {
      setDragError(null);
      return;
    }

    // If not multiple, only take the first file
    const filesToProcess = multiple ? droppedFiles : [droppedFiles[0]];
    
    const { valid, errors } = validateFiles(filesToProcess);
    
    if (errors.length > 0) {
      setDragError(errors[0]);
      setTimeout(() => setDragError(null), 3000);
    }
    
    if (valid.length > 0) {
      onFileDrop(valid);
    }
  }, [disabled, multiple, validateFiles, onFileDrop]);

  return (
    <div
      className={`relative ${className}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}

      {/* Drop Overlay */}
      <AnimatePresence>
        {isDragging && !disabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-50 pointer-events-none"
          >
            {/* Blurred backdrop */}
            <div className="absolute inset-0 bg-purple-900/20 backdrop-blur-sm" />
            
            {/* Animated border */}
            <div className="absolute inset-4 rounded-2xl border-2 border-dashed border-purple-400/60 animate-pulse" />
            
            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-3xl scale-150" />
                
                {/* Icon container */}
                <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-2xl shadow-purple-500/40 flex items-center justify-center">
                  <motion.div
                    animate={{ y: [-4, 4, -4] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Upload className="w-10 h-10 text-white" />
                  </motion.div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mt-6 text-center"
              >
                <p className="text-lg font-semibold text-white drop-shadow-lg">
                  Drop PDF files here
                </p>
                <p className="text-sm text-white/70 mt-1">
                  Release to upload
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {dragError && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-4 left-1/2 z-[100] px-4 py-3 bg-red-500/95 backdrop-blur-sm text-white rounded-xl shadow-2xl flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{dragError}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

DropZone.displayName = 'DropZone';

// Helper function
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default DropZone;

