import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Linkedin, Upload, X, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LinkedInConnectButtonProps {
  onImportComplete?: (data: LinkedInProfileData) => void;
  className?: string;
  variant?: 'button' | 'card';
}

export interface LinkedInProfileData {
  firstName?: string;
  lastName?: string;
  headline?: string;
  profilePicture?: string;
  email?: string;
  positions?: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    location?: string;
    description?: string;
  }>;
  education?: Array<{
    school: string;
    degree?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
  }>;
  skills?: string[];
  languages?: Array<{
    language: string;
    level?: string;
  }>;
}

const LinkedInConnectButton = ({
  onImportComplete,
  className = '',
  variant = 'button'
}: LinkedInConnectButtonProps) => {
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<LinkedInProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOpenModal = () => {
    setShowModal(true);
    setUploadedFile(null);
    setParsedData(null);
    setError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setUploadedFile(null);
    setParsedData(null);
    setError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    setError(null);
    setIsParsing(true);

    try {
      // Parse the LinkedIn PDF
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-linkedin-pdf', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to parse LinkedIn PDF');
      }

      const data = await response.json();
      setParsedData(data);
      toast.success('LinkedIn profile parsed successfully!');
    } catch (err) {
      console.error('Error parsing LinkedIn PDF:', err);
      setError('Failed to parse the LinkedIn PDF. Please try again.');
      toast.error('Failed to parse LinkedIn PDF');
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = () => {
    if (parsedData && onImportComplete) {
      onImportComplete(parsedData);
      handleCloseModal();
      toast.success('Profile data imported successfully!');
    }
  };

  // Button variant
  if (variant === 'button') {
    return (
      <>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenModal}
          className={`
            flex items-center gap-2 px-4 py-2.5 
            bg-[#0A66C2] text-white text-sm font-semibold 
            rounded-xl hover:bg-[#004182] transition-colors shadow-sm
            ${className}
          `}
        >
          <Linkedin className="w-4 h-4" />
          <span>Import from LinkedIn</span>
        </motion.button>

        <LinkedInImportModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onFileUpload={handleFileUpload}
          onImport={handleImport}
          uploadedFile={uploadedFile}
          parsedData={parsedData}
          isParsing={isParsing}
          error={error}
        />
      </>
    );
  }

  // Card variant for prominent display
  return (
    <>
      <motion.div
        whileHover={{ scale: 1.01 }}
        onClick={handleOpenModal}
        className={`
          cursor-pointer p-5 rounded-2xl
          bg-gradient-to-r from-[#0A66C2] to-[#0077B5]
          text-white shadow-lg
          transition-all hover:shadow-xl
          ${className}
        `}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Linkedin className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Import from LinkedIn</h3>
            <p className="text-sm text-white/80 mt-0.5">
              Auto-fill your profile with LinkedIn data
            </p>
          </div>
          <div className="p-2 bg-white/20 rounded-lg">
            <Upload className="w-5 h-5" />
          </div>
        </div>
      </motion.div>

      <LinkedInImportModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onFileUpload={handleFileUpload}
        onImport={handleImport}
        uploadedFile={uploadedFile}
        parsedData={parsedData}
        isParsing={isParsing}
        error={error}
      />
    </>
  );
};

// Import Modal Component - Exported for use in other components
export interface LinkedInImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImport: () => void;
  uploadedFile: File | null;
  parsedData: LinkedInProfileData | null;
  isParsing: boolean;
  error: string | null;
}

export const LinkedInImportModal = ({
  isOpen,
  onClose,
  onFileUpload,
  onImport,
  uploadedFile,
  parsedData,
  isParsing,
  error
}: LinkedInImportModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[10%] md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg z-50"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#0A66C2] rounded-xl">
                    <Linkedin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Import from LinkedIn
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Upload your LinkedIn profile PDF
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Instructions */}
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    How to export your LinkedIn profile:
                  </h3>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                    <li>Go to your LinkedIn profile</li>
                    <li>Click "More" → "Save to PDF"</li>
                    <li>Upload the downloaded PDF below</li>
                  </ol>
                </div>

                {/* Upload Area */}
                {!uploadedFile ? (
                  <label className="block">
                    <div className={`
                      flex flex-col items-center justify-center p-8
                      border-2 border-dashed rounded-xl cursor-pointer
                      transition-all
                      ${error 
                        ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-[#0A66C2] dark:hover:border-[#0A66C2] bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                      }
                    `}>
                      <Upload className={`w-10 h-10 mb-3 ${error ? 'text-red-400' : 'text-gray-400'}`} />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PDF only, max 10MB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={onFileUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="space-y-4">
                    {/* Uploaded File */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {uploadedFile.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      {isParsing ? (
                        <Loader2 className="w-5 h-5 text-[#0A66C2] animate-spin" />
                      ) : parsedData ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : null}
                    </div>

                    {/* Parsed Data Preview */}
                    {parsedData && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/30"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            Profile data extracted successfully
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                          {parsedData.firstName && (
                            <p>Name: <span className="font-medium">{parsedData.firstName} {parsedData.lastName}</span></p>
                          )}
                          {parsedData.headline && (
                            <p>Headline: <span className="font-medium">{parsedData.headline}</span></p>
                          )}
                          {parsedData.positions && parsedData.positions.length > 0 && (
                            <p>Positions: <span className="font-medium">{parsedData.positions.length} found</span></p>
                          )}
                          {parsedData.education && parsedData.education.length > 0 && (
                            <p>Education: <span className="font-medium">{parsedData.education.length} entries</span></p>
                          )}
                          {parsedData.skills && parsedData.skills.length > 0 && (
                            <p>Skills: <span className="font-medium">{parsedData.skills.length} skills</span></p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onImport}
                  disabled={!parsedData || isParsing}
                  className={`
                    flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors
                    ${parsedData && !isParsing
                      ? 'bg-[#0A66C2] text-white hover:bg-[#004182]'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Parsing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Import Profile</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LinkedInConnectButton;

