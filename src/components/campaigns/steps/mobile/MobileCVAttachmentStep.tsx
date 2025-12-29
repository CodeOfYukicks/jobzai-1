import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Check, Paperclip, Upload, Loader2 } from 'lucide-react';
import { CampaignData } from '../../NewCampaignModal';
import { useAuth } from '../../../../contexts/AuthContext';
import { getDoc, doc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import MobileStepWrapper from './MobileStepWrapper';

interface MobileCVAttachmentStepProps {
    data: CampaignData;
    onUpdate: (updates: Partial<CampaignData>) => void;
    onNext: () => void;
    onBack: () => void;
}

interface CVOption {
    id: string;
    name: string;
    url: string;
    source: 'main' | 'resume-builder' | 'document';
    updatedAt?: any;
}

const SOURCE_CONFIG = {
    main: { label: 'Profile', color: 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400' },
    'resume-builder': { label: 'Builder', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
    document: { label: 'PDF', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' }
};

export default function MobileCVAttachmentStep({ data, onUpdate, onNext, onBack }: MobileCVAttachmentStepProps) {
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

            // 1. Load main CV
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

    return (
        <MobileStepWrapper
            title="CV Attachment"
            stepCurrent={5}
            stepTotal={6}
            onBack={onBack}
            onNext={onNext}
            canProceed={true}
            nextLabel="Continue"
        >
            <div className="flex flex-col h-full space-y-6">
                {/* Toggle Card */}
                <div className="bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                ${attachEnabled ? 'bg-[#b7e219]/20 text-[#b7e219]' : 'bg-gray-200 dark:bg-white/[0.1] text-gray-500'}
              `}>
                                <Paperclip className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                                    Attach Resume
                                </h3>
                                <p className="text-[12px] text-gray-500 dark:text-white/60">
                                    Include CV in emails
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => handleToggleAttach(!attachEnabled)}
                            className={`
                w-12 h-7 rounded-full p-1 transition-colors duration-300
                ${attachEnabled ? 'bg-[#b7e219]' : 'bg-gray-200 dark:bg-white/[0.1]'}
              `}
                        >
                            <motion.div
                                layout
                                className="w-5 h-5 rounded-full bg-white shadow-sm"
                                animate={{ x: attachEnabled ? 20 : 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        </button>
                    </div>
                </div>

                {/* CV List */}
                <AnimatePresence mode="wait">
                    {attachEnabled && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3"
                        >
                            <h4 className="text-[13px] font-medium text-gray-900 dark:text-white px-1">
                                Select Resume
                            </h4>

                            {isLoadingCVs ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                </div>
                            ) : cvOptions.length > 0 ? (
                                <div className="space-y-3 pb-20">
                                    {cvOptions.map((cv) => {
                                        const isSelected = selectedCVId === cv.id;
                                        const sourceConfig = SOURCE_CONFIG[cv.source];

                                        return (
                                            <motion.button
                                                key={cv.id}
                                                onClick={() => handleCVSelect(cv.id)}
                                                className={`
                          w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all
                          border
                          ${isSelected
                                                        ? 'bg-white dark:bg-[#1a1a1a] border-[#b7e219] shadow-lg shadow-black/5 ring-1 ring-[#b7e219]'
                                                        : 'bg-gray-50 dark:bg-white/[0.04] border-transparent'
                                                    }
                        `}
                                            >
                                                <div className={`
                          w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                          ${isSelected ? 'bg-[#b7e219]/10 text-[#b7e219]' : 'bg-white dark:bg-white/[0.06] text-gray-400'}
                        `}>
                                                    <FileText className="w-5 h-5" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-[14px] font-medium truncate mb-1 ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-white/70'}`}>
                                                        {cv.name}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${sourceConfig.color}`}>
                                                            {sourceConfig.label}
                                                        </span>
                                                        {cv.updatedAt && (
                                                            <span className="text-[11px] text-gray-400">
                                                                {cv.updatedAt?.toDate?.().toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {isSelected && (
                                                    <div className="w-6 h-6 rounded-full bg-[#b7e219] flex items-center justify-center flex-shrink-0">
                                                        <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />
                                                    </div>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 px-4 bg-gray-50 dark:bg-white/[0.04] rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.1]">
                                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                                    <p className="text-[13px] text-gray-500 dark:text-white/60">
                                        No resumes found. Please upload one in your profile.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </MobileStepWrapper>
    );
}
