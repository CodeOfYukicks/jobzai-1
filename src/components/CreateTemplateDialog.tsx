import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Wand2, Plus, FileEdit, ArrowRight } from 'lucide-react';
import GenerateTemplateModal from './GenerateTemplateModal';
import TemplateEditModal from './TemplateEditModal';

interface CreateTemplateDialogProps {
  onClose: () => void;
  onTemplateCreated: (templateId: string) => void;
}

export default function CreateTemplateDialog({ onClose, onTemplateCreated }: CreateTemplateDialogProps) {
  const [mode, setMode] = useState<'select' | 'generate' | 'manual' | null>('select');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {mode === 'select' ? (
          <div className="flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create Template
              </h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <button
                onClick={() => setMode('generate')}
                className="w-full flex items-center justify-between p-5 rounded-xl 
                  border border-transparent 
                  bg-gradient-to-r from-purple-50 to-indigo-50
                  dark:from-purple-900/10 dark:to-indigo-900/10
                  hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                    <Wand2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      Generate with AI
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Let AI create a personalized template
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-purple-500 dark:text-purple-400" />
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white dark:bg-gray-900 text-sm text-gray-500 dark:text-gray-400">
                    or
                  </span>
                </div>
              </div>

              <button
                onClick={() => setMode('manual')}
                className="w-full flex items-center justify-between p-5 rounded-xl
                  border border-gray-200 dark:border-gray-700
                  bg-white dark:bg-gray-800/30
                  hover:border-purple-300 dark:hover:border-purple-700
                  hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <FileEdit className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      Create Manually
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Write your own template from scratch
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </button>
            </div>
          </div>
        ) : mode === 'generate' ? (
          <GenerateTemplateModal 
            onClose={() => setMode('select')}
            onTemplateCreated={onTemplateCreated}
          />
        ) : mode === 'manual' ? (
          <TemplateEditModal
            template={null}
            onClose={() => setMode('select')}
            onSave={onTemplateCreated}
          />
        ) : null}
      </motion.div>
    </motion.div>
  );
}
