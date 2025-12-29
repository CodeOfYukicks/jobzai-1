import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Loader2, Check, Sparkles } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '../../../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../../../contexts/AuthContext';
import { notify } from '@/lib/notify';
import { pdfToImages } from '../../../../lib/pdfToImages';
import { extractCVTextAndTags } from '../../../../lib/cvTextExtraction';
import { extractFullProfileFromText } from '../../../../lib/cvExperienceExtractor';

interface MobileCVUploadStepProps {
    cvUrl?: string;
    cvName?: string;
    onDataChange: (data: { cvUrl: string; cvName: string }) => void;
    onSkip: () => void;
}

export default function MobileCVUploadStep({
    cvUrl,
    cvName,
    onDataChange,
    onSkip
}: MobileCVUploadStepProps) {
    const { currentUser } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState(cvUrl || '');
    const [uploadedName, setUploadedName] = useState(cvName || '');
    const [isProcessingInBackground, setIsProcessingInBackground] = useState(false);
    const [showSkipConfirm, setShowSkipConfirm] = useState(false);
    const fileRef = useRef<File | null>(null);

    useEffect(() => {
        if (uploadedUrl && uploadedName) {
            onDataChange({ cvUrl: uploadedUrl, cvName: uploadedName });
        }
    }, [uploadedUrl, uploadedName, onDataChange]);

    // Background extraction process - doesn't block the user
    const runBackgroundExtraction = async (file: File, downloadUrl: string, userId: string) => {
        setIsProcessingInBackground(true);

        try {
            // Extract text from PDF
            const images = await pdfToImages(file, 2, 1.5);
            const { text, technologies, skills, experiences } = await extractCVTextAndTags(images);

            // Run full profile extraction
            if (text && text.length > 100) {
                try {
                    const extractedProfile = await extractFullProfileFromText(text);

                    const userRef = doc(db, 'users', userId);
                    const updateData: Record<string, any> = {
                        cvUrl: downloadUrl,
                        cvName: file.name,
                        cvText: text,
                        cvTechnologies: technologies || [],
                        cvSkills: skills || [],
                    };

                    // Add experiences
                    if (experiences && experiences.length > 0) {
                        const formattedExperiences = experiences.map(exp => ({
                            title: exp.title,
                            company: exp.company,
                            companyLogo: '',
                            startDate: exp.startDate,
                            endDate: exp.endDate,
                            current: exp.current,
                            industry: exp.industry || '',
                            contractType: exp.contractType || 'full-time',
                            location: exp.location || '',
                            responsibilities: exp.responsibilities?.length > 0 ? exp.responsibilities : [''],
                            achievements: []
                        }));
                        updateData.professionalHistory = formattedExperiences;
                    }

                    // Personal info
                    if (extractedProfile.personalInfo?.firstName) {
                        updateData.firstName = extractedProfile.personalInfo.firstName;
                    }
                    if (extractedProfile.personalInfo?.lastName) {
                        updateData.lastName = extractedProfile.personalInfo.lastName;
                    }
                    if (extractedProfile.personalInfo?.city) {
                        updateData.city = extractedProfile.personalInfo.city;
                    }
                    if (extractedProfile.personalInfo?.country) {
                        updateData.country = extractedProfile.personalInfo.country;
                    }
                    if (extractedProfile.personalInfo?.headline) {
                        updateData.targetPosition = extractedProfile.personalInfo.headline;
                        updateData.headline = extractedProfile.personalInfo.headline;
                    }

                    // Skills & Tools
                    if (extractedProfile.skills?.length > 0) {
                        updateData.skills = extractedProfile.skills;
                    }
                    if (extractedProfile.tools?.length > 0) {
                        updateData.tools = extractedProfile.tools;
                    }

                    // Languages
                    if (extractedProfile.languages?.length > 0) {
                        updateData.languages = extractedProfile.languages;
                    }

                    // Educations
                    if (extractedProfile.educations?.length > 0) {
                        updateData.educations = extractedProfile.educations;
                        const firstEdu = extractedProfile.educations[0];
                        if (firstEdu) {
                            updateData.educationLevel = firstEdu.degree;
                            updateData.educationField = firstEdu.field;
                            updateData.educationInstitution = firstEdu.institution;
                            if (firstEdu.endDate) {
                                updateData.graduationYear = firstEdu.endDate.split('-')[0];
                            }
                        }
                    }

                    // Summary & Tags
                    if (extractedProfile.summary) {
                        updateData.professionalSummary = extractedProfile.summary;
                    }
                    if (extractedProfile.profileTags?.length > 0) {
                        updateData.profileTags = extractedProfile.profileTags;
                    }

                    // Save to Firestore
                    await updateDoc(userRef, {
                        ...updateData,
                        lastUpdated: new Date().toISOString()
                    });

                    // Show success toast in background
                    const counts = [];
                    if (experiences?.length) counts.push(`${experiences.length} experiences`);
                    if (extractedProfile.skills?.length) counts.push(`${extractedProfile.skills.length} skills`);

                    if (counts.length > 0) {
                        notify.success(`CV analyzed! Found ${counts.join(', ')}`);
                    }
                } catch (profileError) {
                    console.error('Profile extraction failed:', profileError);
                }
            }
        } catch (error) {
            console.error('Background extraction failed:', error);
        } finally {
            setIsProcessingInBackground(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser) return;

        // Validate size
        if (file.size > 5 * 1024 * 1024) {
            notify.error('File must be under 5MB');
            return;
        }

        // Validate type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            notify.error('Please upload a PDF or Word document');
            return;
        }

        try {
            setIsUploading(true);
            fileRef.current = file;

            // Upload to Firebase Storage (quick operation)
            const cvRef = ref(storage, `cvs/${currentUser.uid}/${file.name}`);
            await uploadBytes(cvRef, file);
            const downloadUrl = await getDownloadURL(cvRef);

            // Immediately show success and allow user to continue
            setUploadedUrl(downloadUrl);
            setUploadedName(file.name);
            setIsUploading(false);

            notify.info('CV uploaded! Analyzing in background...');

            // Run extraction in background - don't await
            runBackgroundExtraction(file, downloadUrl, currentUser.uid);

        } catch (error) {
            console.error('Upload error:', error);
            notify.error('Upload failed');
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Question */}
            <div className="space-y-1">
                <h1 className="text-[28px] font-semibold text-gray-900 dark:text-white leading-tight">
                    Upload your CV
                </h1>
                <p className="text-[15px] text-gray-500 dark:text-white/50">
                    We'll auto-fill your profile
                </p>
            </div>

            {/* Upload area */}
            {uploadedUrl && uploadedName && !isUploading ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-800/30 rounded-lg flex items-center justify-center">
                        {isProcessingInBackground ? (
                            <Loader2 className="w-5 h-5 text-green-600 dark:text-green-400 animate-spin" />
                        ) : (
                            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-medium text-gray-900 dark:text-white truncate">
                            {uploadedName}
                        </p>
                        <p className="text-[13px] text-green-600 dark:text-green-400 flex items-center gap-1">
                            {isProcessingInBackground ? (
                                <>
                                    <Sparkles className="w-3 h-3" />
                                    Analyzing in background...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-3 h-3" />
                                    Ready to continue
                                </>
                            )}
                        </p>
                    </div>
                    <label className="text-[14px] font-medium text-[#635bff] cursor-pointer">
                        Change
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </label>
                </div>
            ) : (
                <label className="block cursor-pointer">
                    <motion.div
                        whileTap={{ scale: 0.98 }}
                        className={`
                            flex flex-col items-center justify-center py-10 px-4
                            border-2 border-dashed rounded-2xl transition-colors
                            ${isUploading
                                ? 'border-[#635bff] bg-[#635bff]/5'
                                : 'border-gray-200 dark:border-white/10 hover:border-[#635bff]/50'
                            }
                        `}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-8 h-8 text-[#635bff] animate-spin mb-3" />
                                <p className="text-[15px] font-medium text-gray-900 dark:text-white">
                                    Uploading...
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-12 bg-[#635bff]/10 rounded-xl flex items-center justify-center mb-3">
                                    <Upload className="w-6 h-6 text-[#635bff]" />
                                </div>
                                <p className="text-[15px] font-medium text-gray-900 dark:text-white mb-1">
                                    Upload CV
                                </p>
                                <p className="text-[13px] text-gray-500 dark:text-white/40">
                                    PDF or Word · Max 5MB
                                </p>
                            </>
                        )}
                    </motion.div>
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                        className="hidden"
                    />
                </label>
            )}

            {/* Skip link */}
            {!uploadedUrl && !isUploading && (
                <button
                    onClick={() => setShowSkipConfirm(true)}
                    className="w-full text-center text-[15px] text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/70"
                >
                    Do it later →
                </button>
            )}

            {/* Skip Confirmation Modal */}
            {showSkipConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowSkipConfirm(false)}
                    />
                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative bg-white dark:bg-[#1e1e1f] rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                    >
                        <h3 className="text-[18px] font-semibold text-gray-900 dark:text-white mb-2">
                            Skip CV upload?
                        </h3>
                        <p className="text-[14px] text-gray-500 dark:text-white/60 mb-6">
                            Your CV is used to auto-fill your professional profile, personalize job recommendations, and improve your applications. You can always upload it later.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSkipConfirm(false)}
                                className="flex-1 py-3 rounded-xl text-[15px] font-semibold bg-[#635bff] text-white"
                            >
                                Upload CV
                            </button>
                            <button
                                onClick={() => {
                                    setShowSkipConfirm(false);
                                    onSkip();
                                }}
                                className="flex-1 py-3 rounded-xl text-[15px] font-medium text-gray-700 dark:text-white/70 bg-gray-100 dark:bg-white/10"
                            >
                                Skip anyway
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
