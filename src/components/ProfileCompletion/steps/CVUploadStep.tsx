import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Loader2 } from 'lucide-react';
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

      onNext({
        cvUrl: downloadUrl,
        cvName: selectedFile.name
      });
    } catch (error) {
      console.error('Error uploading CV:', error);
      toast.error('Failed to upload CV');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Upload Your CV</h2>
        <p className="mt-1 text-sm text-gray-500">
          Upload your CV to help us match you with the right opportunities
        </p>
      </div>

      {cvUrl && cvName ? (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-[#8D75E6]" />
            <div>
              <p className="font-medium text-gray-900">{cvName}</p>
              <p className="text-sm text-gray-500">CV uploaded successfully</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 mb-3 text-gray-400 animate-spin" />
                  <p className="text-sm text-gray-500">Uploading...</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF or Word (MAX. 5MB)</p>
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

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900"
        >
          Back
        </button>
        <button
          onClick={() => cvUrl && cvName && onNext({ cvUrl, cvName })}
          disabled={!cvUrl || !cvName}
          className="btn-primary px-6 py-2 rounded-lg disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}