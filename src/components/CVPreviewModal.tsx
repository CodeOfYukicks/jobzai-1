import { motion } from 'framer-motion';
import { X, Download, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CVPreviewModalProps {
  cvUrl: string;
  cvName: string;
  onClose: () => void;
}

export default function CVPreviewModal({ cvUrl, cvName, onClose }: CVPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // For PDFs, we can use Google Docs Viewer as a fallback
        const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(cvUrl)}&embedded=true`;
        setPreviewUrl(googleDocsUrl);
      } catch (err) {
        console.error('Error loading CV preview:', err);
        setError('Failed to load CV preview');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();
  }, [cvUrl]);

  const handleDownload = () => {
    window.open(cvUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{cvName}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Download CV"
            >
              <Download className="h-5 w-5 text-gray-500" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative bg-gray-50">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Loading preview...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white">
              <div className="flex flex-col items-center max-w-sm text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                <p className="text-sm text-gray-900 font-medium mb-1">Failed to load preview</p>
                <p className="text-sm text-gray-500 mb-4">
                  You can still download the CV to view it on your device.
                </p>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Download CV
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && previewUrl && (
            <iframe
              src={previewUrl}
              className="w-full h-full border-0"
              onLoad={() => setIsLoading(false)}
              onError={() => setError('Failed to load preview')}
              title="CV Preview"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-500 text-center">
            Having trouble viewing the CV? You can{' '}
            <button
              onClick={handleDownload}
              className="text-[#6956A8] hover:text-[#6956A8]/80 font-medium"
            >
              download it
            </button>{' '}
            to view on your device.
          </p>
        </div>
      </motion.div>
    </div>
  );
}