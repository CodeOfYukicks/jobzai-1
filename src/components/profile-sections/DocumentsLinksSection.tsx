import { useState, useEffect, useRef } from 'react';
import { FileText, Link as LinkIcon, Github, Linkedin, Upload, X, ExternalLink } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { db } from '../../lib/firebase';
import { pdfToImages } from '../../lib/pdfToImages';
import { extractCVTextAndTags } from '../../lib/cvTextExtraction';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface SectionProps {
  onUpdate: (data: any) => void;
}

const DocumentsLinksSection = ({ onUpdate }: SectionProps) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    cvName: '',
    cvUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
    githubUrl: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef<HTMLLabelElement>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const newFormData = {
            cvName: userData.cvName || '',
            cvUrl: userData.cvUrl || '',
            linkedinUrl: userData.linkedinUrl || '',
            portfolioUrl: userData.portfolioUrl || '',
            githubUrl: userData.githubUrl || ''
          };
          setFormData(newFormData);
          onUpdate(newFormData);
        }
      } catch (error) {
        console.error('Error loading documents data:', error);
      }
    };

    loadData();
  }, [currentUser]);

  const handleChange = (field: string, value: any) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    setFormData(newFormData);
    onUpdate(newFormData);
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
      const fileRef = ref(storage, `cvs/${currentUser.uid}/${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(fileRef);

      // Extract text and tags
      let extractedData = {};
      try {
        toast.info('Analyzing your CV...');
        const images = await pdfToImages(file, 2, 1.5);
        const { text, technologies, skills } = await extractCVTextAndTags(images);

        extractedData = {
          cvText: text,
          cvTechnologies: technologies,
          cvSkills: skills
        };

        // Update Firestore with extracted data
        if (currentUser?.uid) {
          await updateDoc(doc(db, 'users', currentUser.uid), {
            cvUrl: downloadUrl,
            cvName: file.name,
            ...extractedData,
            updatedAt: serverTimestamp()
          });
        }

        toast.success(`CV analyzed! Found ${technologies.length} technologies and ${skills.length} skills`);
      } catch (extractionError) {
        console.error('CV extraction failed:', extractionError);
        toast.warning('CV uploaded but analysis failed');
      }

      const newFormData = {
        ...formData,
        cvUrl: downloadUrl,
        cvName: file.name,
        ...extractedData
      };
      setFormData(newFormData);
      onUpdate(newFormData);
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

  const validateUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <section id="documents" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="space-y-6">
        {/* CV Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            CV / Resume
          </label>
          <div className="flex items-center gap-4">
            {formData.cvUrl ? (
              <div className="flex-1 flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{formData.cvName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={formData.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleChange('cvUrl', '')}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <label
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex-1 flex items-center justify-center p-6 border-2 border-dashed rounded-lg transition-all cursor-pointer bg-white dark:bg-gray-700 ${isDragging
                    ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-400'
                  }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className={`w-8 h-8 ${isUploading ? 'animate-bounce text-purple-600' : isDragging ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
                  <span className={`text-sm ${isDragging ? 'text-purple-600 dark:text-purple-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                    {isUploading ? 'Uploading...' : isDragging ? 'Drop your CV here' : 'Click to upload or drag and drop'}
                  </span>
                </div>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            )}
          </div>
        </div>

        {/* Professional Links */}
        <div className="space-y-4">
          {/* LinkedIn */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              LinkedIn Profile
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Linkedin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent
                  ${!validateUrl(formData.linkedinUrl) ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}`}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
          </div>

          {/* Portfolio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Portfolio URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="url"
                value={formData.portfolioUrl}
                onChange={(e) => handleChange('portfolioUrl', e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent
                  ${!validateUrl(formData.portfolioUrl) ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}`}
                placeholder="https://yourportfolio.com"
              />
            </div>
          </div>

          {/* GitHub */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              GitHub Profile
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Github className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="url"
                value={formData.githubUrl}
                onChange={(e) => handleChange('githubUrl', e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent
                  ${!validateUrl(formData.githubUrl) ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}`}
                placeholder="https://github.com/username"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DocumentsLinksSection; 