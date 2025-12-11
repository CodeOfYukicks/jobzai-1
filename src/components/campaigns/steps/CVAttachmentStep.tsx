import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Check, Upload, Loader2, Eye, ChevronDown, X, Info } from 'lucide-react';
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

export default function CVAttachmentStep({ data, onUpdate }: CVAttachmentStepProps) {
  const { currentUser } = useAuth();
  const [cvOptions, setCvOptions] = useState<CVOption[]>([]);
  const [selectedCVId, setSelectedCVId] = useState<string | null>(data.cvAttachment?.id || null);
  const [isLoadingCVs, setIsLoadingCVs] = useState(true);
  const [showCVSelector, setShowCVSelector] = useState(false);

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
            name: userData.cvName || 'CV (8).pdf',
            url: userData.cvUrl,
            source: 'main'
          });
        }
      }

      // 2. Load CVs from Resume Builder (structured CVs with exported PDFs)
      const resumesRef = collection(db, 'users', currentUser.uid, 'cvs');
      const resumesQuery = query(resumesRef, orderBy('updatedAt', 'desc'));
      const resumesSnap = await getDocs(resumesQuery);

      resumesSnap.docs.forEach((docSnap) => {
        const resumeData = docSnap.data();
        // Only include if it has an exported PDF URL
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

      // 3. Load imported PDF documents from Resume Builder
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

  const selectedCV = cvOptions.find(cv => cv.id === selectedCVId);
  const attachCV = !!selectedCVId;

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Upload Resume
        </h2>
        <p className="text-sm text-gray-500 dark:text-white/60">
          Select or upload your resume for analysis
        </p>
      </div>

      {isLoadingCVs ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#6366f1] mb-4" />
          <p className="text-sm text-gray-500 dark:text-white/60">
            Loading your resumes...
          </p>
        </div>
      ) : (
        <>
          {/* Two-Column Choice: No CV or Attach CV */}
          <div className="grid grid-cols-2 gap-4">
          {/* No CV Option */}
          <motion.button
            type="button"
              onClick={() => {
                setSelectedCVId(null);
                setShowCVSelector(false);
                onUpdate({
                  attachCV: false,
                  cvAttachment: undefined
                });
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            className={`
                p-5 rounded-xl border-2 transition-all duration-200 text-center
              ${!attachCV
                  ? 'border-[#6366f1] bg-gradient-to-br from-[#6366f1]/10 to-[#818cf8]/5 dark:from-[#6366f1]/20 dark:to-[#818cf8]/10 shadow-lg'
                  : 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1a] hover:border-gray-300 dark:hover:border-white/[0.12] hover:shadow-md'
              }
            `}
          >
              <div className="flex flex-col items-center">
              <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center mb-3
                ${!attachCV
                    ? 'bg-[#6366f1]'
                    : 'bg-gray-100 dark:bg-[#3d3c3e]'
                  }
                `}>
                  <X className={`
                    w-6 h-6
                    ${!attachCV ? 'text-white' : 'text-gray-400 dark:text-gray-500'}
                  `} />
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  No CV
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Send without attachment
                </p>
                {!attachCV && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="mt-3 px-3 py-1 bg-[#6366f1] text-white text-xs font-semibold rounded-full flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Selected
                  </motion.div>
                )}
            </div>
          </motion.button>

          {/* Attach CV Option */}
          <motion.button
            type="button"
              onClick={() => {
                if (cvOptions.length > 0) {
                  // Select first available CV
                  const firstCV = cvOptions[0];
                  handleCVSelect(firstCV.id);
                  setShowCVSelector(false);
                }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            disabled={cvOptions.length === 0}
            className={`
                p-5 rounded-xl border-2 transition-all duration-200 text-center
              ${attachCV
                  ? 'border-[#6366f1] bg-gradient-to-br from-[#6366f1]/10 to-[#818cf8]/5 dark:from-[#6366f1]/20 dark:to-[#818cf8]/10 shadow-lg'
                  : 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1a] hover:border-gray-300 dark:hover:border-white/[0.12] hover:shadow-md'
              }
              ${cvOptions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
              <div className="flex flex-col items-center">
              <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center mb-3
                ${attachCV
                    ? 'bg-[#6366f1]'
                    : 'bg-gray-100 dark:bg-[#3d3c3e]'
                  }
                `}>
                  <FileText className={`
                    w-6 h-6
                    ${attachCV ? 'text-white' : 'text-gray-400 dark:text-gray-500'}
                  `} />
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Attach CV
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Include as PDF
                </p>
                {attachCV && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="mt-3 px-3 py-1 bg-[#6366f1] text-white text-xs font-semibold rounded-full flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Selected
                  </motion.div>
                )}
                {cvOptions.length === 0 && (
                  <p className="mt-2 text-[10px] text-amber-600 dark:text-amber-400">
                    No CVs available
                  </p>
                )}
              </div>
            </motion.button>
          </div>

          {/* Expanded CV Selection - Only show when CV is selected */}
          <AnimatePresence>
            {attachCV && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="h-px bg-gray-200 dark:bg-white/[0.08]" />

                {/* SAVED CV - Main Profile CV - Prominent Display */}
                {cvOptions.filter(cv => cv.source === 'main').map((cv) => {
                  const isSelected = selectedCVId === cv.id;
                  
                  return (
                    <motion.div
                      key={cv.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`
                        border-2 rounded-xl p-4 transition-all duration-200 cursor-pointer
                        ${isSelected
                          ? 'border-[#6366f1] bg-gradient-to-br from-[#6366f1]/10 to-[#818cf8]/5 dark:from-[#6366f1]/20 dark:to-[#818cf8]/10 shadow-lg'
                          : 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1a] hover:border-[#6366f1]/50 dark:hover:border-[#818cf8]/50 hover:shadow-md'
                        }
                      `}
                      onClick={() => handleCVSelect(cv.id)}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`
                            w-10 h-10 rounded-lg flex items-center justify-center
                            ${isSelected
                              ? 'bg-[#6366f1]'
                              : 'bg-[#6366f1]/10 dark:bg-[#6366f1]/20'
                            }
                          `}>
                            <FileText className={`
                              w-5 h-5
                              ${isSelected ? 'text-white' : 'text-[#6366f1] dark:text-[#818cf8]'}
                            `} />
                          </div>
                          <div>
                            <span className={`
                              text-xs font-semibold uppercase tracking-wide
                              ${isSelected
                                ? 'text-[#6366f1] dark:text-[#818cf8]'
                                : 'text-gray-600 dark:text-gray-400'
                              }
                            `}>
                              SAVED CV
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="px-2.5 py-1 bg-[#6366f1] text-white text-xs font-semibold rounded-full flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Selected
                          </motion.div>
                        )}
                      </div>

                      {/* CV Name */}
                      <div className="mb-4">
                        <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                          {cv.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          From your professional profile
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(cv.url, '_blank');
                          }}
                          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                            bg-gray-100 dark:bg-[#3d3c3e] hover:bg-gray-200 dark:hover:bg-[#4a494b] 
                            rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Preview
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCVSelect(cv.id);
                          }}
                          className={`
                            flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-all 
                            flex items-center justify-center gap-2
                            ${isSelected
                              ? 'bg-[#6366f1] text-white cursor-default shadow-md'
                              : 'bg-gradient-to-r from-[#6366f1] to-[#818cf8] text-white hover:from-[#5558e3] hover:to-[#6366f1] shadow-lg shadow-[#6366f1]/20'
                            }
                          `}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-4 h-4" />
                              Selected
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Use This CV
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}

                {/* OR Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-[#4a494b]"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white dark:bg-[#2b2a2c] px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      OR
                    </span>
                  </div>
                </div>

                {/* Choose from My CVs (Resume Builder) */}
                <motion.div
                  initial={false}
                  className={`
                    border-2 rounded-xl overflow-hidden transition-all duration-200
                    ${selectedCV && selectedCV.source !== 'main'
                      ? 'border-[#6366f1] dark:border-[#818cf8] bg-[#6366f1]/5 dark:bg-[#6366f1]/10'
                      : 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1a]'
                    }
                  `}
                >
                  {/* Header - Collapsible */}
                  <button
                    type="button"
                    onClick={() => setShowCVSelector(!showCVSelector)}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-xl flex items-center justify-center
                        ${selectedCV && selectedCV.source !== 'main'
                          ? 'bg-[#6366f1]'
                          : 'bg-[#6366f1]/10 dark:bg-[#6366f1]/20'
                        }
                      `}>
                        <FileText className={`
                          w-5 h-5
                          ${selectedCV && selectedCV.source !== 'main' ? 'text-white' : 'text-[#6366f1] dark:text-[#818cf8]'}
                        `} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedCV && selectedCV.source !== 'main' ? selectedCV.name : 'Choose from My CVs'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Select from Resume Builder
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedCV && selectedCV.source !== 'main' && (
                        <span className="px-2.5 py-1 bg-[#6366f1] text-white text-xs font-semibold rounded-full flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          Selected
                        </span>
                      )}
                      <ChevronDown className={`
                        w-5 h-5 text-gray-400 transition-transform duration-200
                        ${showCVSelector ? 'rotate-180' : ''}
                      `} />
                    </div>
                  </button>

                  {/* Expandable CV List */}
                  <AnimatePresence>
                    {showCVSelector && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-200 dark:border-white/[0.08]"
                      >
                        <div className="max-h-64 overflow-y-auto">
                          {/* Resume Builder CVs */}
                          {cvOptions
                            .filter(cv => cv.source === 'resume-builder')
                            .map((cv) => {
                              const isSelected = selectedCVId === cv.id;
                              const displayDate = cv.updatedAt?.toDate 
                                ? cv.updatedAt.toDate() 
                                : new Date(cv.updatedAt || Date.now());
                              
                              return (
                                <div
                                  key={cv.id}
                                  onClick={() => handleCVSelect(cv.id)}
                                  className={`
                                    px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors
                                    ${isSelected
                                      ? 'bg-[#6366f1]/10 dark:bg-[#6366f1]/20'
                                      : 'hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/60'
                                    }
                                  `}
                                >
                                  <div className={`
                                    w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                                    ${isSelected
                                      ? 'bg-[#6366f1]'
                                      : 'bg-[#6366f1]/10 dark:bg-[#6366f1]/20'
                                    }
                                  `}>
                                    <FileText className={`
                                      w-4 h-4
                                      ${isSelected ? 'text-white' : 'text-[#6366f1] dark:text-[#818cf8]'}
                                    `} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`
                                      text-sm font-medium truncate
                                      ${isSelected ? 'text-[#6366f1] dark:text-[#818cf8]' : 'text-gray-900 dark:text-white'}
                                    `}>
                                      {cv.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Resume Builder • {displayDate.toLocaleDateString()}
                                    </p>
                                  </div>
                                  {isSelected && (
                                    <Check className="w-5 h-5 text-[#6366f1] dark:text-[#818cf8] flex-shrink-0" />
                                  )}
                                </div>
                              );
                            })}

                          {/* Imported PDF Documents */}
                          {cvOptions
                            .filter(cv => cv.source === 'document')
                            .map((cv) => {
                              const isSelected = selectedCVId === cv.id;
                              const displayDate = cv.updatedAt?.toDate 
                                ? cv.updatedAt.toDate() 
                                : new Date(cv.updatedAt || Date.now());
                              
                              return (
                                <div
                                  key={cv.id}
                                  onClick={() => handleCVSelect(cv.id)}
                                  className={`
                                    px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors
                                    ${isSelected
                                      ? 'bg-[#6366f1]/10 dark:bg-[#6366f1]/20'
                                      : 'hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/60'
                                    }
                                  `}
                                >
                                  <div className={`
                                    w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                                    ${isSelected
                                      ? 'bg-[#6366f1]'
                                      : 'bg-red-100 dark:bg-red-900/30'
                                    }
                                  `}>
                                    <FileText className={`
                                      w-4 h-4
                                      ${isSelected ? 'text-white' : 'text-red-600 dark:text-red-400'}
                                    `} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`
                                      text-sm font-medium truncate
                                      ${isSelected ? 'text-[#6366f1] dark:text-[#818cf8]' : 'text-gray-900 dark:text-white'}
                                    `}>
                                      {cv.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      PDF • {displayDate.toLocaleDateString()}
                                    </p>
                                  </div>
                                  {isSelected && (
                                    <Check className="w-5 h-5 text-[#6366f1] dark:text-[#818cf8] flex-shrink-0" />
                                  )}
                                </div>
                              );
                            })}

                          {/* Empty State */}
                          {cvOptions.filter(cv => cv.source !== 'main').length === 0 && (
                            <div className="py-8 px-4 text-center">
                              <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                No CVs in Resume Builder yet
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                Create one in the Resume Builder
                    </p>
                  </div>
                )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* OR Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-[#4a494b]"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white dark:bg-[#2b2a2c] px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      OR
                    </span>
                  </div>
                </div>

                {/* Upload Your Resume Section */}
                <div className="border-2 border-dashed rounded-xl p-8 text-center border-gray-300 dark:border-[#4a494b] bg-gray-50/50 dark:bg-[#1a1a1a]/50">
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-[#6366f1]/10 dark:bg-[#6366f1]/20 flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6 text-[#6366f1] dark:text-[#818cf8]" />
                    </div>
                    <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                      Upload Your Resume
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Click to select or drag and drop a PDF file
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Coming soon - For now, please add a CV in Resume Builder
                    </p>
              </div>
            </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Box - Always visible */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
              <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                  Your resume will be analyzed to determine its match with the job description
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                  {selectedCV 
                    ? `Selected: ${selectedCV.name}`
                    : 'No resume selected - emails will be sent without attachment'
                  }
                  </p>
                </div>
              </div>
        </div>
        </>
      )}
    </div>
  );
}
