import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Link, CheckCircle, Upload, X, Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';

interface FinalizationStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

const FinalizationStep = ({ data, onUpdate }: FinalizationStepProps) => {
  const { currentUser } = useAuth();
  const [cvUrl, setCvUrl] = useState(data.cvUrl || '');
  const [cvName, setCvName] = useState(data.cvName || '');
  const [linkedinUrl, setLinkedinUrl] = useState(data.linkedinUrl || '');
  const [portfolioUrl, setPortfolioUrl] = useState(data.portfolioUrl || '');
  const [githubUrl, setGithubUrl] = useState(data.githubUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCvUrl(data.cvUrl || '');
    setCvName(data.cvName || '');
    setLinkedinUrl(data.linkedinUrl || '');
    setPortfolioUrl(data.portfolioUrl || '');
    setGithubUrl(data.githubUrl || '');
  }, [data]);

  const handleUpdate = (updates: any) => {
    onUpdate(updates);
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !currentUser) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('CV must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document');
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload to Firebase Storage
      const cvRef = ref(storage, `cvs/${currentUser.uid}/${file.name}`);
      await uploadBytes(cvRef, file);
      const downloadUrl = await getDownloadURL(cvRef);

      setCvUrl(downloadUrl);
      setCvName(file.name);
      handleUpdate({ cvUrl: downloadUrl, cvName: file.name });
      toast.success('CV uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading CV:', error);
      if (error.code === 'storage/unauthorized') {
        toast.error('Permission denied. Please try again or contact support.');
      } else {
        toast.error('Failed to upload CV. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const removeCV = () => {
    setCvUrl('');
    setCvName('');
    handleUpdate({ cvUrl: '', cvName: '' });
    toast.success('CV removed');
  };

  const completionChecklist = [
    { key: 'firstName', label: 'First and Last Name', completed: !!(data.firstName && data.lastName) },
    { key: 'email', label: 'Email', completed: !!data.email },
    { key: 'currentSituation', label: 'Current Situation', completed: !!data.currentSituation },
    { key: 'educationLevel', label: 'Education Level', completed: !!data.educationLevel },
    { key: 'professionalHistory', label: 'Professional Experience', completed: !!(data.professionalHistory && data.professionalHistory.length > 0) },
    { key: 'skills', label: 'Skills', completed: !!(data.skills && data.skills.length > 0) },
    { key: 'targetPosition', label: 'Target Position', completed: !!data.targetPosition },
    { key: 'city', label: 'Location', completed: !!(data.city && data.country) }
  ];

  const completedCount = completionChecklist.filter(item => item.completed).length;
  const completionPercentage = Math.round((completedCount / completionChecklist.length) * 100);

  return (
    <div className="space-y-6">
      {/* Checklist de complétion */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800 max-w-md mx-auto overflow-hidden isolate"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
            Profile Completion
          </h3>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {completionPercentage}%
          </div>
        </div>
        <div className="space-y-2">
          {completionChecklist.map((item, index) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
              className="flex items-center gap-3"
            >
              {item.completed ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
              )}
              <span className={`
                text-sm
                ${item.completed
                  ? 'text-gray-700 dark:text-gray-300 line-through'
                  : 'text-gray-500 dark:text-gray-400'
                }
              `}>
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Documents & Liens */}
      <div className="max-w-md mx-auto mt-8">
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="font-semibold text-lg text-gray-900 dark:text-white mb-4"
        >
          Documents & Links
        </motion.h3>
        <div className="space-y-4">
          {/* CV */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              CV
            </label>
            
            {cvUrl ? (
              // CV exists - show current CV with option to change
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800 overflow-hidden">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{cvName || 'CV uploaded'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Click to change</div>
                    </div>
                  </div>
                  <button
                    onClick={removeCV}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  {isUploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    'Change CV'
                  )}
                </button>
              </div>
            ) : (
              // No CV - show drag and drop zone
              <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                  ${isDragging
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }
                  ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Uploading CV...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-full">
                      <Upload className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Drop your CV here or click to browse
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PDF or Word document (max 5MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* LinkedIn */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              LinkedIn
            </label>
            <div className="relative">
              <Link className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => {
                  setLinkedinUrl(e.target.value);
                  handleUpdate({ linkedinUrl: e.target.value });
                }}
                placeholder="https://linkedin.com/in/..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
              />
            </div>
          </motion.div>

          {/* Portfolio */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Portfolio
            </label>
            <div className="relative">
              <Link className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => {
                  setPortfolioUrl(e.target.value);
                  handleUpdate({ portfolioUrl: e.target.value });
                }}
                placeholder="https://..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
              />
            </div>
          </motion.div>

          {/* GitHub */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.8 }}
          >
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              GitHub
            </label>
            <div className="relative">
              <Link className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => {
                  setGithubUrl(e.target.value);
                  handleUpdate({ githubUrl: e.target.value });
                }}
                placeholder="https://github.com/..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
              />
            </div>
          </motion.div>
        </div>
      </div>

    </div>
  );
};

export default FinalizationStep;

