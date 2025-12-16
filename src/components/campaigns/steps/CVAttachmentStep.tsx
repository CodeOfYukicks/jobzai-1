import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Check, ExternalLink, Paperclip, Upload } from 'lucide-react';
import { CampaignData } from '../NewCampaignModal';
import { useAuth } from '../../../contexts/AuthContext';
import { getDoc, doc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface CVAttachmentStepProps {
  data: CampaignData;
  onUpdate: (updates: Partial<CampaignData>) => void;
}

interface CVOption {
  id: string;
  name: string;
  url: string;
  source: 'main' | 'resume-builder' | 'document';
  updatedAt?: any;
}

// Source badge config - neutral styling
const SOURCE_CONFIG = {
  main: { label: 'Profile', color: 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/[0.08]' },
  'resume-builder': { label: 'Resume Builder', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200/50 dark:border-violet-500/20' },
  document: { label: 'PDF', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20' }
};

export default function CVAttachmentStep({ data, onUpdate }: CVAttachmentStepProps) {
  const { currentUser } = useAuth();
  const [cvOptions, setCvOptions] = useState<CVOption[]>([]);
  const [selectedCVId, setSelectedCVId] = useState<string | null>(data.cvAttachment?.id || null);
  const [isLoadingCVs, setIsLoadingCVs] = useState(true);
  const [attachEnabled, setAttachEnabled] = useState(data.attachCV ?? true);

  useEffect(() => {
    loadCVOptions();
  }, [currentUser]);

  const loadCVOptions = async () => {
    if (!currentUser) {
      setIsLoadingCVs(false);
      return;
    }

    try {
      const options: CVOption[] = [];

      // 1. Load main CV from user profile
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.cvUrl) {
          options.push({
            id: 'main-cv',
            name: userData.cvName || 'My CV',
            url: userData.cvUrl,
            source: 'main'
          });
        }
      }

      // 2. Load CVs from Resume Builder
      const resumesRef = collection(db, 'users', currentUser.uid, 'cvs');
      const resumesQuery = query(resumesRef, orderBy('updatedAt', 'desc'));
      const resumesSnap = await getDocs(resumesQuery);

      resumesSnap.docs.forEach((docSnap) => {
        const resumeData = docSnap.data();
        if (resumeData.exportedPdfUrl && docSnap.id !== 'default') {
          options.push({
            id: docSnap.id,
            name: resumeData.name || 'Untitled Resume',
            url: resumeData.exportedPdfUrl,
            source: 'resume-builder',
            updatedAt: resumeData.updatedAt
          });
        }
      });

      // 3. Load imported PDF documents
      const docsRef = collection(db, 'users', currentUser.uid, 'documents');
      const docsQuery = query(docsRef, orderBy('updatedAt', 'desc'));
      const docsSnap = await getDocs(docsQuery);

      docsSnap.docs.forEach((docSnap) => {
        const docData = docSnap.data();
        if (docData.fileUrl) {
          options.push({
            id: docSnap.id,
            name: docData.name || 'Untitled Document',
            url: docData.fileUrl,
            source: 'document',
            updatedAt: docData.updatedAt
          });
        }
      });

      setCvOptions(options);

      // Auto-select first option if available and attachment is enabled
      if (options.length > 0 && !selectedCVId && attachEnabled) {
        handleCVSelect(options[0].id);
      }
    } catch (error) {
      console.error('Error loading CV options:', error);
    } finally {
      setIsLoadingCVs(false);
    }
  };

  const handleToggleAttach = (enabled: boolean) => {
    setAttachEnabled(enabled);
    
    if (!enabled) {
      setSelectedCVId(null);
      onUpdate({
        attachCV: false,
        cvAttachment: undefined
      });
    } else if (cvOptions.length > 0) {
      // Auto-select first CV when enabling
      handleCVSelect(cvOptions[0].id);
    }
  };

  const handleCVSelect = (cvId: string) => {
    const selected = cvOptions.find(cv => cv.id === cvId);
    if (!selected) return;

    setSelectedCVId(cvId);
    setAttachEnabled(true);
    onUpdate({
      attachCV: true,
      cvAttachment: {
        id: selected.id,
        name: selected.name,
        url: selected.url,
        source: selected.source
      }
    });
  };

  const selectedCV = cvOptions.find(cv => cv.id === selectedCVId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
          CV Attachment
        </h3>
        <p className="text-[13px] text-gray-500 dark:text-white/60">
          Attach your resume to each outreach email
        </p>
      </div>

      {/* Toggle Card */}
      <button
        onClick={() => handleToggleAttach(!attachEnabled)}
        disabled={isLoadingCVs || cvOptions.length === 0}
        className={`
          w-full flex items-center justify-between gap-4 p-4 rounded-xl text-left
          transition-all duration-200
          ${attachEnabled
            ? 'border-l-[3px] border-l-[#b7e219] border-y border-r border-y-transparent border-r-transparent bg-white dark:bg-[#1f1f1f] shadow-lg shadow-black/[0.06] dark:shadow-black/30 ring-1 ring-black/[0.04] dark:ring-white/[0.06]'
            : 'border border-gray-200/80 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.04]'
          }
          ${(isLoadingCVs || cvOptions.length === 0) ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
            ${attachEnabled
              ? 'bg-gray-100 dark:bg-white/[0.06]'
              : 'bg-gray-100 dark:bg-white/[0.04]'
            }
          `}>
            <Paperclip className={`w-5 h-5 transition-colors duration-200
              ${attachEnabled ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}
            `} />
          </div>
          <div>
            <p className={`text-[14px] font-medium transition-colors duration-200
              ${attachEnabled ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}
            `}>
              {attachEnabled ? 'Attachment enabled' : 'Attachment disabled'}
            </p>
            <p className="text-[12px] text-gray-500 dark:text-gray-500">
              {attachEnabled ? 'Your resume will be sent with each email' : 'Emails will be sent without attachment'}
            </p>
          </div>
        </div>

        {/* Toggle Indicator */}
        <div className={`
          w-12 h-7 rounded-full p-1 transition-all duration-300
          ${attachEnabled
            ? 'bg-gray-900 dark:bg-white'
            : 'bg-gray-200 dark:bg-white/[0.08]'
          }
        `}>
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`
              w-5 h-5 rounded-full shadow-sm transition-colors duration-200
              ${attachEnabled
                ? 'bg-white dark:bg-gray-900 translate-x-5'
                : 'bg-white dark:bg-gray-500 translate-x-0'
              }
            `}
            style={{ marginLeft: attachEnabled ? 20 : 0 }}
          />
        </div>
      </button>

      {/* Loading State */}
      {isLoadingCVs && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative w-12 h-12 mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-white/[0.08]" />
            <div className="absolute inset-0 rounded-full border-2 border-gray-400 dark:border-gray-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-[13px] text-gray-500 dark:text-white/60">
            Loading your resumes...
          </p>
        </div>
      )}

      {/* No CVs State */}
      {!isLoadingCVs && cvOptions.length === 0 && (
        <div className="text-center py-12 px-6">
          <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
            <Upload className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <h4 className="text-[14px] font-medium text-gray-900 dark:text-white mb-1.5">
            No resumes available
          </h4>
          <p className="text-[12px] text-gray-500 dark:text-white/60 max-w-xs mx-auto leading-relaxed">
            Upload a CV in your profile or create one with Resume Builder to attach it to your campaigns
          </p>
        </div>
      )}

      {/* CV List */}
      <AnimatePresence mode="wait">
        {!isLoadingCVs && cvOptions.length > 0 && attachEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-2 overflow-hidden"
          >
            <p className="text-[11px] font-medium text-gray-400 dark:text-white/40 uppercase tracking-wider px-1 mb-3">
              Select a resume
            </p>
            
            {cvOptions.map((cv, index) => {
              const isSelected = selectedCVId === cv.id;
              const sourceConfig = SOURCE_CONFIG[cv.source];
              
              return (
                <motion.div
                  key={cv.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <button
                    onClick={() => handleCVSelect(cv.id)}
                    className={`
                      w-full group relative flex items-center gap-4 p-4 rounded-xl text-left
                      transition-all duration-200
                      ${isSelected
                        ? 'border-l-[3px] border-l-[#b7e219] border-y border-r border-y-transparent border-r-transparent bg-white dark:bg-[#1a1a1a] shadow-md shadow-black/[0.04] dark:shadow-black/20 ring-1 ring-black/[0.03] dark:ring-white/[0.05]'
                        : 'border border-gray-200/80 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.04] hover:shadow-sm'
                      }
                    `}
                  >
                    {/* Selection Indicator */}
                    <div className={`
                      w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                      transition-all duration-200
                      ${isSelected
                        ? 'bg-gray-900 dark:bg-white'
                        : 'border-2 border-gray-300 dark:border-gray-600 group-hover:border-gray-400 dark:group-hover:border-gray-500'
                      }
                    `}>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <Check className="w-3 h-3 text-white dark:text-gray-900" strokeWidth={3} />
                        </motion.div>
                      )}
                    </div>

                    {/* File Icon */}
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                      transition-all duration-200
                      bg-gray-100 dark:bg-white/[0.06]
                    `}>
                      <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>

                    {/* CV Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`
                          text-[13px] font-medium truncate transition-colors duration-200
                          ${isSelected
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-gray-300'
                          }
                        `}>
                          {cv.name}
                        </p>
                        {/* Source Badge */}
                        <span className={`
                          inline-flex px-2 py-0.5 rounded text-[10px] font-medium
                          border ${sourceConfig.color}
                        `}>
                          {sourceConfig.label}
                        </span>
                      </div>
                      {cv.updatedAt && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                          Updated {cv.updatedAt?.toDate?.().toLocaleDateString() || 'recently'}
                        </p>
                      )}
                    </div>

                    {/* Green dot indicator when selected */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-2.5 h-2.5 rounded-full bg-[#b7e219] shadow-sm flex-shrink-0"
                      />
                    )}

                    {/* Preview Button */}
                    <a
                      href={cv.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={`
                        p-2 rounded-lg flex-shrink-0
                        text-gray-400 dark:text-gray-500
                        hover:text-gray-600 dark:hover:text-gray-300
                        hover:bg-gray-100 dark:hover:bg-white/[0.06]
                        opacity-0 group-hover:opacity-100
                        transition-all duration-200
                      `}
                      title="Preview CV"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer - Selected CV Summary */}
      {!isLoadingCVs && attachEnabled && selectedCV && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl 
            border-l-[3px] border-l-[#b7e219]
            bg-gray-50 dark:bg-white/[0.02] 
            border-y border-r border-y-gray-200/50 border-r-gray-200/50 dark:border-y-white/[0.04] dark:border-r-white/[0.04]"
        >
          <Check className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <p className="text-[12px] text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-white">{selectedCV.name}</span> will be attached to each email
          </p>
        </motion.div>
      )}
    </div>
  );
}
