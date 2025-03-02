import { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  X, 
  Check, 
  AlertCircle, 
  Info, 
  Eye, 
  Download,
  Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface CVSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCVSelected: (file: File | string) => void;
  enableContentValidation: boolean;
  setEnableContentValidation: (value: boolean) => void;
}

export default function CVSelectionModal({
  isOpen,
  onClose,
  onCVSelected,
  enableContentValidation,
  setEnableContentValidation
}: CVSelectionModalProps) {
  const { currentUser } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [savedCVs, setSavedCVs] = useState<Array<{id: string; url: string; name: string; date: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Fetch user's saved CVs
  useEffect(() => {
    if (!currentUser) return;
    
    setIsLoading(true);
    // This would be replaced with your actual fetch logic
    // For example, fetching from Firestore
    const fetchSavedCVs = async () => {
      try {
        // Mock data - replace with actual fetch
        const mockCVs = [
          { 
            id: '1', 
            url: 'https://example.com/cv1.pdf', 
            name: 'Professional_Resume_2023.pdf',
            date: new Date().toISOString()
          }
        ];
        setSavedCVs(mockCVs);
      } catch (error) {
        console.error('Error fetching saved CVs:', error);
        toast.error('Failed to load your saved CVs');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSavedCVs();
  }, [currentUser]);

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file: File) => {
    setFileError(null);
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size exceeds 5MB limit');
      return;
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Only PDF and Word documents are accepted');
      return;
    }
    
    // Set the file and create preview URL for PDF
    setSelectedFile(file);
    
    // Create preview URL if it's a PDF
    if (file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
    
    toast.success('Resume selected successfully');
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleSavedCVSelect = (cvUrl: string) => {
    setSelectedFile(null);
    setPreviewUrl(cvUrl);
    onCVSelected(cvUrl);
  };

  const handleContentValidationToggle = () => {
    setEnableContentValidation(!enableContentValidation);
  };

  const handleSubmit = async () => {
    if (!selectedFile && !previewUrl) {
      toast.error('Please select a CV to continue');
      return;
    }
    
    if (selectedFile) {
      // If we have a new file, we need to upload it
      setIsLoading(true);
      setUploadProgress(0);
      
      try {
        // If you need to upload to Firebase Storage
        if (currentUser) {
          const storageRef = ref(storage, `cvs/${currentUser.uid}/${selectedFile.name}`);
          
          // Upload with progress monitoring
          const uploadTask = uploadBytes(storageRef, selectedFile);
          
          // Monitor progress (simplified since Firebase doesn't have built-in progress)
          const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
              if (prev >= 90) {
                clearInterval(progressInterval);
                return 90;
              }
              return prev + 10;
            });
          }, 200);
          
          await uploadTask;
          clearInterval(progressInterval);
          setUploadProgress(100);
          
          // Get download URL
          const downloadUrl = await getDownloadURL(storageRef);
          
          // Update user record in Firestore
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, {
            cvUrl: downloadUrl,
            cvName: selectedFile.name,
            lastUpdated: new Date().toISOString()
          });
          
          toast.success('CV uploaded successfully');
          onCVSelected(selectedFile);
        } else {
          // Just pass the file object if not uploading
          onCVSelected(selectedFile);
        }
      } catch (error) {
        console.error('Error uploading CV:', error);
        toast.error('Failed to upload CV. Please try again.');
      } finally {
        setIsLoading(false);
        onClose();
      }
    } else if (previewUrl) {
      // If using an existing CV URL
      onCVSelected(previewUrl);
      onClose();
    }
  };

  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Select CV
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choose which CV you want to analyze
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <div className="space-y-6">
            {/* Upload section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload your resume
              </label>
              
              {/* Content validation toggle */}
              <div className="flex items-center mb-4">
                <input
                  id="enable-validation"
                  type="checkbox"
                  checked={enableContentValidation}
                  onChange={handleContentValidationToggle}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="enable-validation" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Enable content validation
                </label>
                <button
                  type="button"
                  className="ml-2 text-gray-400 hover:text-gray-500"
                  onClick={() => toast.info(
                    "Content validation helps ensure that you've uploaded a proper CV and job description. " +
                    "If you're having issues with legitimate files being rejected, you can temporarily disable validation.",
                    { duration: 8000 }
                  )}
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
              
              {/* Drag & Drop zone */}
              <div
                ref={dropZoneRef}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                    : selectedFile
                    ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                }`}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
                      <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatFileSize(selectedFile.size)}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      Resume selected successfully
                    </p>
                    
                    {/* Preview button for PDF */}
                    {selectedFile.type === 'application/pdf' && previewUrl && (
                      <div className="flex mt-3 space-x-3">
                        <a 
                          href={previewUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Preview
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            if (previewUrl) {
                              URL.revokeObjectURL(previewUrl);
                              setPreviewUrl(null);
                            }
                          }}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {isDragging ? 'Drop your file here' : 'Upload your resume'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Click to browse or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                      Accepted formats: PDF, DOC, DOCX (MAX. 5MB)
                    </p>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              
              {/* Error message */}
              <AnimatePresence>
                {fileError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 flex items-center text-red-600 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 mr-1.5" />
                    <span>{fileError}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Your resume will be analyzed to determine its match with the job posting
              </p>
            </div>
            
            {/* Previously uploaded CVs section */}
            {savedCVs.length > 0 && (
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Your saved resumes
                </h3>
                
                <div className="space-y-2">
                  {savedCVs.map(cv => (
                    <button
                      key={cv.id}
                      onClick={() => handleSavedCVSelect(cv.url)}
                      className={`w-full flex items-center p-3 rounded-lg border transition-colors ${
                        previewUrl === cv.url 
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <FileText className="w-5 h-5 text-gray-400 mr-3" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {cv.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(cv.date).toLocaleDateString()}
                        </p>
                      </div>
                      {previewUrl === cv.url && (
                        <Check className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer with action buttons */}
        <div className="flex justify-end items-center gap-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || (!selectedFile && !previewUrl)}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
              isLoading || (!selectedFile && !previewUrl)
                ? 'bg-purple-400 dark:bg-purple-600 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span>Processing...</span>
              </div>
            ) : 'Next'}
          </button>
        </div>

        {/* Upload progress overlay */}
        {isLoading && uploadProgress > 0 && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex flex-col items-center justify-center">
            <div className="w-16 h-16 mb-4 relative">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  className="text-gray-200 dark:text-gray-700"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="44"
                  cx="50"
                  cy="50"
                />
                <circle
                  className="text-purple-600 dark:text-purple-400"
                  strokeWidth="8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="44"
                  cx="50"
                  cy="50"
                  strokeDasharray={2 * Math.PI * 44}
                  strokeDashoffset={2 * Math.PI * 44 * (1 - uploadProgress / 100)}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold">
                {uploadProgress}%
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">Uploading CV...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
} 