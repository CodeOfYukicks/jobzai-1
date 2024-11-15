import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface DeleteTemplateDialogProps {
  templateName: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export default function DeleteTemplateDialog({ templateName, onConfirm, onClose }: DeleteTemplateDialogProps) {
  const handleDelete = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
      >
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
            Delete Template
          </h3>
          <p className="text-sm text-gray-500 text-center mb-6">
            Are you sure you want to delete "{templateName}"? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Delete Template
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}