import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Loader2, Info } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';

interface CVUploadStepProps {
  cvUrl?: string;
  cvName?: string;
  onNext: (data: { cvUrl: string; cvName: string }) => void;
  onBack: () => void;
}

export default function CVUploadStep({ cvUrl, cvName, onNext, onBack }: CVUploadStepProps) {
  const { currentUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadedCvUrl, setUploadedCvUrl] = useState<string>(cvUrl || '');
  const [uploadedCvName, setUploadedCvName] = useState<string>(cvName || '');

  // Update local state when props change
  useEffect(() => {
    setUploadedCvUrl(cvUrl || '');
    setUploadedCvName(cvName || '');
  }, [cvUrl, cvName]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !currentUser) return;

    // Validate file size (5MB limit)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Please upload a PDF or Word document');
      return;
    }

    try {
      setIsUploading(true);
      setFile(selectedFile);

      // Upload to Firebase Storage
      const cvRef = ref(storage, `cvs/${currentUser.uid}/${selectedFile.name}`);
      await uploadBytes(cvRef, selectedFile);
      const downloadUrl = await getDownloadURL(cvRef);

      // Store in local state instead of calling onNext immediately
      setUploadedCvUrl(downloadUrl);
      setUploadedCvName(selectedFile.name);
      
      toast.success('CV uploaded successfully! Click Continue to proceed.');
    } catch (error) {
      console.error('Error uploading CV:', error);
      toast.error('Failed to upload CV');
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Upload Your CV</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Upload your CV to help us match you with the right opportunities
        </p>
      </div>

      {uploadedCvUrl && uploadedCvName ? (
        <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700
          shadow-sm dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-[#8D75E6]" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{uploadedCvName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">CV uploaded successfully</p>
              </div>
            </div>
            
            <label className="flex items-center px-4 py-2 text-sm font-medium text-[#8D75E6] 
              bg-[#8D75E6]/10 dark:bg-[#8D75E6]/20 rounded-lg cursor-pointer 
              hover:bg-[#8D75E6]/20 dark:hover:bg-[#8D75E6]/30 
              transition-all duration-200
              shadow-sm dark:shadow-[0_2px_4px_rgba(141,117,230,0.2)]
              hover:shadow-md dark:hover:shadow-[0_4px_8px_rgba(141,117,230,0.3)]">
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Change CV
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
          </div>

          <div className="mt-4 flex items-center space-x-4 text-sm">
            <a
              href={uploadedCvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8D75E6] hover:underline flex items-center"
            >
              <FileText className="w-4 h-4 mr-1" />
              View CV
            </a>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col w-full h-32 border-2 border-gray-300 dark:border-gray-700 border-dashed 
            rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 
            transition-all duration-200 bg-white dark:bg-gray-800
            shadow-sm dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)]
            hover:shadow-md dark:hover:shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 mb-3 text-gray-400 dark:text-gray-500 animate-spin" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Uploading...</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 mb-3 text-gray-400 dark:text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">PDF or Word (MAX. 5MB)</p>
                </>
              )}
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        </div>
      )}

      {/* Info box about CV importance */}
      {!uploadedCvUrl && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                Why upload your CV?
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your CV helps our AI understand your experience, skills, and background to provide more relevant job recommendations and personalized suggestions.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium"
        >
          Back
        </button>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNext({ cvUrl: '', cvName: '' })}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium
              border border-gray-300 dark:border-gray-600 rounded-lg
              hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200"
          >
            Do it later
          </button>
          <button
            onClick={() => uploadedCvUrl && uploadedCvName && onNext({ cvUrl: uploadedCvUrl, cvName: uploadedCvName })}
            disabled={!uploadedCvUrl || !uploadedCvName}
            className="px-8 py-2 bg-[#8D75E6] text-white rounded-lg font-medium
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:bg-[#7B64D3] transition-all duration-200
              shadow-md dark:shadow-[0_4px_8px_rgba(141,117,230,0.3)]
              hover:shadow-lg dark:hover:shadow-[0_6px_12px_rgba(141,117,230,0.4)]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
