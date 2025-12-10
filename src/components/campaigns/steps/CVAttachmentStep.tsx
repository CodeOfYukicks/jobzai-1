import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Check, Upload, Loader2 } from 'lucide-react';
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
  source: 'main' | 'resume-builder';
}

export default function CVAttachmentStep({ data, onUpdate }: CVAttachmentStepProps) {
  const { currentUser } = useAuth();
  const [attachCV, setAttachCV] = useState(data.attachCV || false);
  const [cvOptions, setCvOptions] = useState<CVOption[]>([]);
  const [selectedCVId, setSelectedCVId] = useState<string | null>(data.cvAttachment?.id || null);
  const [isLoadingCVs, setIsLoadingCVs] = useState(true);

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
            name: userData.cvName || 'My Main CV',
            url: userData.cvUrl,
            source: 'main'
          });
        }
      }

      // 2. Load CVs from Resume Builder
      const resumesRef = collection(db, 'users', currentUser.uid, 'cvs');
      const q = query(resumesRef, orderBy('updatedAt', 'desc'));
      const resumesSnap = await getDocs(q);

      resumesSnap.docs.forEach((docSnap) => {
        const resumeData = docSnap.data();
        // Only include if it has an exported PDF URL
        if (resumeData.exportedPdfUrl && docSnap.id !== 'default') {
          options.push({
            id: docSnap.id,
            name: resumeData.name || 'Untitled Resume',
            url: resumeData.exportedPdfUrl,
            source: 'resume-builder'
          });
        }
      });

      setCvOptions(options);

      // Auto-select first option if available and not already selected
      if (options.length > 0 && !selectedCVId) {
        handleCVSelect(options[0].id);
      }
    } catch (error) {
      console.error('Error loading CV options:', error);
    } finally {
      setIsLoadingCVs(false);
    }
  };

  const handleAttachCVChange = (shouldAttach: boolean) => {
    setAttachCV(shouldAttach);
    
    if (!shouldAttach) {
      // Clear CV selection
      onUpdate({
        attachCV: false,
        cvAttachment: undefined
      });
    } else if (cvOptions.length > 0) {
      // Auto-select first option
      const firstCV = cvOptions[0];
      handleCVSelect(firstCV.id);
    } else {
      onUpdate({
        attachCV: true,
        cvAttachment: undefined
      });
    }
  };

  const handleCVSelect = (cvId: string) => {
    const selected = cvOptions.find(cv => cv.id === cvId);
    if (!selected) return;

    setSelectedCVId(cvId);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Attach a CV? (Optional)
        </h3>
        <p className="text-sm text-gray-500 dark:text-white/60">
          Including your resume can increase response rates
        </p>
      </div>

      {isLoadingCVs ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#b7e219] mb-4" />
          <p className="text-sm text-gray-500 dark:text-white/60">
            Loading your CVs...
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* No CV Option */}
          <motion.button
            type="button"
            onClick={() => handleAttachCVChange(false)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`
              w-full p-5 rounded-xl border-2 transition-all duration-200 text-left
              ${!attachCV
                ? 'border-[#b7e219] bg-[#b7e219]/5 dark:bg-[#b7e219]/10 shadow-md'
                : 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1a] hover:border-gray-300 dark:hover:border-white/[0.12]'
              }
            `}
          >
            <div className="flex items-start gap-4">
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                ${!attachCV
                  ? 'border-[#b7e219] bg-[#b7e219]'
                  : 'border-gray-300 dark:border-white/[0.2]'
                }
              `}>
                {!attachCV && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check className="w-3 h-3 text-gray-900" strokeWidth={3} />
                  </motion.div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  No CV - Send without attachment
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Emails will be sent without any resume attached
                </p>
              </div>
            </div>
          </motion.button>

          {/* Attach CV Option */}
          <motion.button
            type="button"
            onClick={() => cvOptions.length > 0 && handleAttachCVChange(true)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={cvOptions.length === 0}
            className={`
              w-full p-5 rounded-xl border-2 transition-all duration-200 text-left
              ${attachCV
                ? 'border-[#b7e219] bg-[#b7e219]/5 dark:bg-[#b7e219]/10 shadow-md'
                : 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1a] hover:border-gray-300 dark:hover:border-white/[0.12]'
              }
              ${cvOptions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex items-start gap-4">
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                ${attachCV
                  ? 'border-[#b7e219] bg-[#b7e219]'
                  : 'border-gray-300 dark:border-white/[0.2]'
                }
              `}>
                {attachCV && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check className="w-3 h-3 text-gray-900" strokeWidth={3} />
                  </motion.div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  Attach CV
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Include your resume as a PDF attachment
                </p>

                {/* CV Dropdown - Only show when Attach CV is selected */}
                {attachCV && cvOptions.length > 0 && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3"
                  >
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select CV
                    </label>
                    <select
                      value={selectedCVId || ''}
                      onChange={(e) => handleCVSelect(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.08]
                        rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b7e219]/20 focus:border-[#b7e219]
                        text-gray-900 dark:text-white"
                    >
                      {cvOptions.map((cv) => (
                        <option key={cv.id} value={cv.id}>
                          {cv.name} {cv.source === 'main' ? '(Main CV)' : '(Resume Builder)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* No CVs Available Message */}
                {cvOptions.length === 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      No CVs found. Please upload a CV in your profile or create one in the Resume Builder first.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.button>

          {/* Selected CV Info */}
          {attachCV && selectedCVId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20"
            >
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                    CV will be attached to all emails
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Selected: {cvOptions.find(cv => cv.id === selectedCVId)?.name}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

