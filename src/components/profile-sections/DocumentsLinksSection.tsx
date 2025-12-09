import { useState, useEffect, useRef } from 'react';
import { FileText, Link as LinkIcon, Github, Linkedin, Upload, X, ExternalLink, CheckCircle2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { notify } from '@/lib/notify';
import { db } from '../../lib/firebase';
import { pdfToImages } from '../../lib/pdfToImages';
import { extractCVTextAndTags } from '../../lib/cvTextExtraction';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { PremiumInput, PremiumLabel, SectionDivider, FieldGroup, SectionSkeleton } from '../profile/ui';

interface SectionProps {
  onUpdate: (data: any) => void;
}

const DocumentsLinksSection = ({ onUpdate }: SectionProps) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
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
      } finally {
        setIsLoading(false);
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

    if (file.size > 5 * 1024 * 1024) {
      notify.error('CV must be less than 5MB');
      return;
    }

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      notify.error('Please upload a PDF or Word document');
      return;
    }

    try {
      setIsUploading(true);
      const fileRef = ref(storage, `cvs/${currentUser.uid}/${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(fileRef);

      let extractedData: Record<string, any> = {};
      try {
        notify.info('Analyzing your CV...');
        const images = await pdfToImages(file, 2, 1.5);
        const { text, technologies, skills, experiences } = await extractCVTextAndTags(images);

        extractedData = {
          cvText: text,
          cvTechnologies: technologies,
          cvSkills: skills
        };

        // Add experiences to professionalHistory if extracted
        if (experiences && experiences.length > 0) {
          extractedData.professionalHistory = experiences;
        }

        if (currentUser?.uid) {
          await updateDoc(doc(db, 'users', currentUser.uid), {
            cvUrl: downloadUrl,
            cvName: file.name,
            ...extractedData,
            updatedAt: serverTimestamp()
          });
        }

        const expCount = experiences?.length || 0;
        notify.success(`CV analyzed! Found ${technologies.length} technologies, ${skills.length} skills${expCount > 0 ? `, and ${expCount} experiences` : ''}`);
      } catch (extractionError) {
        console.error('CV extraction failed:', extractionError);
        notify.warning('CV uploaded but analysis failed');
      }

      const newFormData = {
        ...formData,
        cvUrl: downloadUrl,
        cvName: file.name,
        ...extractedData
      };
      setFormData(newFormData);
      onUpdate(newFormData);
      notify.success('CV uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading CV:', error);
      if (error.code === 'storage/unauthorized') {
        notify.error('Permission denied. Please try again or contact support.');
      } else {
        notify.error('Failed to upload CV. Please try again.');
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

  if (isLoading) {
    return <SectionSkeleton />;
  }

  return (
    <FieldGroup className="space-y-8">
      {/* CV Upload */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-gray-400" />
          <PremiumLabel className="mb-0">CV / Resume</PremiumLabel>
        </div>
        
        {formData.cvUrl ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/50 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.cvName}</p>
                <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  Uploaded & analyzed
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={formData.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => {
                  // Clear all CV-related fields in one update
                  const clearedData = {
                    ...formData,
                    cvUrl: '',
                    cvName: '',
                  };
                  setFormData(clearedData);
                  // Also clear cvText and extracted data from Firestore
                  onUpdate({
                    cvUrl: '',
                    cvName: '',
                    cvText: '',
                    cvTechnologies: [],
                    cvSkills: []
                  });
                  notify.success('CV removed');
                }}
                className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          <label
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all
              ${isDragging
                ? 'border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-800/50'
                : 'border-gray-200/80 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/30'
              }
            `}
          >
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors
              ${isDragging 
                ? 'bg-gray-200 dark:bg-gray-700' 
                : 'bg-gray-100 dark:bg-gray-700/60'
              }
            `}>
              <Upload className={`w-6 h-6 ${isUploading ? 'animate-bounce text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`} />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {isUploading ? 'Uploading...' : isDragging ? 'Drop your CV here' : 'Upload your CV'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PDF or Word, max 5MB
            </p>
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

      <SectionDivider title="Professional Links" />

      {/* LinkedIn */}
      <div>
        <div className="relative">
          <PremiumInput
            label="LinkedIn Profile"
            value={formData.linkedinUrl}
            onChange={(e) => handleChange('linkedinUrl', e.target.value)}
            placeholder="https://linkedin.com/in/username"
            icon={<Linkedin className="w-4 h-4" />}
            error={!validateUrl(formData.linkedinUrl) ? 'Please enter a valid URL' : undefined}
          />
        </div>
      </div>

      {/* Portfolio */}
      <div>
        <PremiumInput
          label="Portfolio URL"
          value={formData.portfolioUrl}
          onChange={(e) => handleChange('portfolioUrl', e.target.value)}
          placeholder="https://yourportfolio.com"
          icon={<LinkIcon className="w-4 h-4" />}
          error={!validateUrl(formData.portfolioUrl) ? 'Please enter a valid URL' : undefined}
        />
      </div>

      {/* GitHub */}
      <div>
        <PremiumInput
          label="GitHub Profile"
          value={formData.githubUrl}
          onChange={(e) => handleChange('githubUrl', e.target.value)}
          placeholder="https://github.com/username"
          icon={<Github className="w-4 h-4" />}
          error={!validateUrl(formData.githubUrl) ? 'Please enter a valid URL' : undefined}
        />
      </div>
    </FieldGroup>
  );
};

export default DocumentsLinksSection;
