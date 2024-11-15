import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Wand2, Plus } from 'lucide-react';
import GenerateTemplateModal from './GenerateTemplateModal';
import TemplateEditModal from './TemplateEditModal';

interface CreateTemplateDialogProps {
  onClose: () => void;
  onTemplateCreated: (templateId: string) => void;
}

export default function CreateTemplateDialog({ onClose, onTemplateCreated }: CreateTemplateDialogProps) {
  const [mode, setMode] = useState<'select' | 'generate' | 'manual' | null>('select');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
      >
        {mode === 'select' ? (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Create Template</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setMode('generate')}
                className="w-full flex items-center justify-between p-4 bg-[#8D75E6]/10 rounded-lg hover:bg-[#8D75E6]/20 transition-colors"
              >
                <div className="flex items-center">
                  <Wand2 className="h-5 w-5 text-[#8D75E6] mr-3" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Generate with AI</div>
                    <div className="text-sm text-gray-500">Let AI create a personalized template</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode('manual')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <Plus className="h-5 w-5 text-gray-600 mr-3" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Create Manually</div>
                    <div className="text-sm text-gray-500">Write your own template from scratch</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : mode === 'generate' ? (
          <GenerateTemplateModal 
            onClose={() => setMode('select')}
            onTemplateCreated={onTemplateCreated}
            inCampaignFlow={true}
          />
        ) : mode === 'manual' ? (
          <TemplateEditModal
            template={null}
            onClose={() => setMode('select')}
            onSave={onTemplateCreated}
            inCampaignFlow={true}
          />
        ) : null}
      </motion.div>
    </div>
  );
}