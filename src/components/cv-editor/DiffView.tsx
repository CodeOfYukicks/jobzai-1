import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, GitCompare, Check, X } from 'lucide-react';
import DiffText, { DiffBullet } from './DiffText';

interface DiffViewProps {
  original: string;
  modified: string;
  onAccept?: () => void;
  onReject?: () => void;
  sectionName?: string;
  type?: 'text' | 'bullets';
}

export default function DiffView({ 
  original, 
  modified, 
  onAccept, 
  onReject,
  sectionName = 'Section',
  type = 'text'
}: DiffViewProps) {
  const [viewMode, setViewMode] = useState<'diff' | 'original' | 'modified'>('diff');
  
  const renderContent = () => {
    if (type === 'bullets') {
      const originalBullets = original ? original.split('\n').filter(b => b.trim()) : [];
      const modifiedBullets = modified ? modified.split('\n').filter(b => b.trim()) : [];
      
      if (viewMode === 'original') {
        return (
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            {originalBullets.map((bullet, index) => (
              <li key={index}>{bullet}</li>
            ))}
          </ul>
        );
      }
      
      if (viewMode === 'modified') {
        return (
          <ul className="list-disc list-inside space-y-1 text-gray-900 dark:text-white">
            {modifiedBullets.map((bullet, index) => (
              <li key={index}>{bullet}</li>
            ))}
          </ul>
        );
      }
      
      // Diff view for bullets
      const maxLength = Math.max(originalBullets.length, modifiedBullets.length);
      return (
        <ul className="list-disc list-inside space-y-1">
          {Array.from({ length: maxLength }).map((_, index) => (
            <DiffBullet
              key={index}
              original={originalBullets[index] || ''}
              modified={modifiedBullets[index] || ''}
              showDiff={true}
            />
          ))}
        </ul>
      );
    }
    
    // Text content
    if (viewMode === 'original') {
      return <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{original}</p>;
    }
    
    if (viewMode === 'modified') {
      return <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{modified}</p>;
    }
    
    // Diff view for text
    return (
      <p className="whitespace-pre-wrap">
        <DiffText original={original} modified={modified} showDiff={true} />
      </p>
    );
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-[#635BFF]/5 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border border-[#635BFF]/20 dark:border-[#3d3c3e]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-[#5249e6] dark:text-[#a5a0ff]" />
          <h4 className="font-medium text-gray-900 dark:text-white">
            AI Suggestion for {sectionName}
          </h4>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-white dark:bg-[#2b2a2c] rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setViewMode('diff')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'diff'
                ? 'bg-[#635BFF]/10 dark:bg-[#5249e6]/50 text-[#635BFF] dark:text-[#a5a0ff]'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5 inline mr-1" />
            Diff
          </button>
          <button
            onClick={() => setViewMode('original')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'original'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5 inline mr-1" />
            Before
          </button>
          <button
            onClick={() => setViewMode('modified')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'modified'
                ? 'bg-[#635BFF]/10 dark:bg-[#5249e6]/50 text-[#635BFF] dark:text-[#a5a0ff]'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5 inline mr-1" />
            After
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="bg-white dark:bg-[#2b2a2c] rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, x: viewMode === 'original' ? -20 : viewMode === 'modified' ? 20 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: viewMode === 'original' ? -20 : viewMode === 'modified' ? 20 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Legend */}
      {viewMode === 'diff' && (
        <div className="flex items-center gap-4 text-xs mb-3">
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-red-100 dark:bg-red-900/30 rounded"></span>
            <span className="text-gray-600 dark:text-gray-400">Removed</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-[#635BFF]/10 dark:bg-[#5249e6]/30 rounded"></span>
            <span className="text-gray-600 dark:text-gray-400">Added</span>
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onReject}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#2b2a2c] border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Reject
        </button>
        <button
          onClick={onAccept}
          className="px-4 py-2 text-sm font-medium text-white bg-[#635BFF] hover:bg-[#5249e6] rounded-lg transition-all shadow-sm hover:shadow-md flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          Accept Changes
        </button>
      </div>
    </motion.div>
  );
}