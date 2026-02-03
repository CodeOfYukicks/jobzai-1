import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, FileText, Upload, Linkedin, User, ArrowLeft, Check, Loader2, X, Clock, Sparkles } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../lib/firebase';
import { doc, setDoc, serverTimestamp, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { notify } from '@/lib/notify';
import { generateId } from '../lib/cvEditorUtils';
import { pdfToImages } from '../lib/pdfToImages';
import { extractCVTextAndTags } from '../lib/cvTextExtraction';
import { extractFullProfileFromText } from '../lib/cvExperienceExtractor';
import { mapExtractedProfileToCVData, mapFirestoreProfileToCVData, cloneCVData, createEmptyCVData } from '../lib/profileToCVData';

// Initial empty CV data structure
const initialCVData = {
    personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        portfolio: '',
        github: '',
        title: '',
        photoUrl: ''
    },
    summary: '',
    experiences: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
    languages: [],
    sections: [
        { id: 'personal', type: 'personal', title: 'Personal Information', enabled: true, order: 0 },
        { id: 'summary', type: 'summary', title: 'Professional Summary', enabled: true, order: 1 },
        { id: 'experience', type: 'experience', title: 'Work Experience', enabled: true, order: 2 },
        { id: 'education', type: 'education', title: 'Education', enabled: true, order: 3 },
        { id: 'skills', type: 'skills', title: 'Skills', enabled: true, order: 4 },
        { id: 'certifications', type: 'certifications', title: 'Certifications', enabled: false, order: 5 },
        { id: 'projects', type: 'projects', title: 'Projects', enabled: false, order: 6 },
        { id: 'languages', type: 'languages', title: 'Languages', enabled: false, order: 7 }
    ]
};

// Helper to safely format dates
function formatDate(dateInput: any): string {
    if (!dateInput) return 'Unknown date';
    try {
        if (dateInput.toDate && typeof dateInput.toDate === 'function') {
            return dateInput.toDate().toLocaleDateString();
        } else if (dateInput instanceof Date) {
            return dateInput.toLocaleDateString();
        } else if (typeof dateInput === 'string') {
            return new Date(dateInput).toLocaleDateString();
        }
        return 'Unknown date';
    } catch (e) {
        return 'Unknown date';
    }
}

export default function CreateBaseResumePage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [isCreating, setIsCreating] = useState(false);

    // Parsing state for PDF upload
    const [isParsing, setIsParsing] = useState(false);
    const [parsingStep, setParsingStep] = useState('');

    // Form State
    const [jobTitle, setJobTitle] = useState('');
    const [experienceLevel, setExperienceLevel] = useState('mid');
    const [documentTitle, setDocumentTitle] = useState('');
    const [dataSource, setDataSource] = useState<'profile' | 'upload' | 'linkedin'>('profile');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    // Existing Resumes State
    const [existingResumes, setExistingResumes] = useState<any[]>([]);
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
    const [isLoadingResumes, setIsLoadingResumes] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchResumes = async () => {
            if (!currentUser) return;
            setIsLoadingResumes(true);
            try {
                const resumesRef = collection(db, 'users', currentUser.uid, 'cvs');
                const q = query(resumesRef, orderBy('updatedAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const resumes = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setExistingResumes(resumes);
            } catch (error) {
                console.error('Error fetching resumes:', error);
            } finally {
                setIsLoadingResumes(false);
            }
        };

        fetchResumes();
    }, [currentUser]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                notify.error('Please upload a PDF file');
                return;
            }
            setUploadedFile(file);
            // Auto-fill document title if empty
            if (!documentTitle) {
                setDocumentTitle(file.name.replace('.pdf', ''));
            }
        }
    };

    const handleCreate = async () => {
        if (!currentUser) return;

        if (!jobTitle.trim()) {
            notify.error('Please enter a target job title');
            return;
        }

        if (!documentTitle.trim()) {
            notify.error('Please enter a document title');
            return;
        }

        if (dataSource === 'upload' && !uploadedFile) {
            notify.error('Please upload a resume PDF');
            return;
        }

        if (dataSource === 'linkedin') {
            notify.info('LinkedIn import is coming soon!');
            return;
        }

        setIsCreating(true);

        try {
            const resumeId = generateId();
            let cvData: any = createEmptyCVData(jobTitle);
            let fileUrl = null;

            // Handle data source: Profile (Summary or existing CV)
            if (dataSource === 'profile') {
                if (selectedResumeId) {
                    // Clone existing CV
                    const selectedResume = existingResumes.find(r => r.id === selectedResumeId);
                    if (selectedResume && selectedResume.cvData) {
                        cvData = cloneCVData(selectedResume.cvData, jobTitle);
                        notify.info('Copying from existing resume...');
                    }
                } else {
                    // Use Cubbbe Profile Summary
                    notify.info('Importing from your profile...');
                    cvData = await mapFirestoreProfileToCVData(currentUser.uid, jobTitle);
                }
            }

            // Handle data source: PDF Upload with parsing
            if (dataSource === 'upload' && uploadedFile) {
                setIsParsing(true);

                try {
                    // Step 1: Upload file to storage
                    setParsingStep('Uploading your resume...');
                    const fileName = `${resumeId}_${uploadedFile.name}`;
                    const fileRef = ref(storage, `cvs/${currentUser.uid}/${fileName}`);
                    await uploadBytes(fileRef, uploadedFile);
                    fileUrl = await getDownloadURL(fileRef);

                    // Step 2: Convert PDF to images
                    setParsingStep('Converting PDF to images...');
                    const images = await pdfToImages(uploadedFile, 3, 1.5);

                    // Step 3: Extract text from images
                    setParsingStep('Reading your resume content...');
                    const { text } = await extractCVTextAndTags(images);

                    if (!text || text.length < 50) {
                        throw new Error('Could not extract text from PDF. Please try a different file.');
                    }

                    // Step 4: Parse with AI to extract structured data
                    setParsingStep('Analyzing your experience...');
                    const extractedProfile = await extractFullProfileFromText(text);

                    // Step 5: Map to CV data format
                    setParsingStep('Creating your resume...');
                    cvData = mapExtractedProfileToCVData(extractedProfile, jobTitle);

                } catch (parseError: any) {
                    console.error('PDF parsing error:', parseError);
                    notify.error(parseError.message || 'Failed to parse resume. Creating empty resume instead.');
                    // Fall back to empty CV data
                    cvData = createEmptyCVData(jobTitle);
                } finally {
                    setIsParsing(false);
                }
            }

            // Ensure title is set
            if (cvData.personalInfo) {
                cvData.personalInfo.title = jobTitle;
            }

            const newResume = {
                id: resumeId,
                name: documentTitle.trim(),
                cvData: cvData,
                targetJobTitle: jobTitle,
                experienceLevel: experienceLevel,
                dataSource: dataSource,
                sourceFileUrl: fileUrl,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                template: 'modern-professional',
                tags: []
            };

            // Save to Firestore
            const docRef = doc(db, 'users', currentUser.uid, 'cvs', resumeId);
            await setDoc(docRef, newResume);

            notify.success('Resume created successfully!');
            navigate(`/resume-builder/${resumeId}/cv-editor`);

        } catch (error: any) {
            console.error('Error creating resume:', error);
            notify.error(error.message || 'Failed to create resume');
        } finally {
            setIsCreating(false);
            setIsParsing(false);
        }
    };

    return (
        <AuthLayout>
            {/* Parsing Overlay */}
            <AnimatePresence>
                {isParsing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-[#2b2a2c] rounded-2xl p-8 shadow-2xl max-w-sm mx-4 text-center"
                        >
                            <div className="relative mb-6">
                                <div className="w-16 h-16 mx-auto rounded-full bg-[#E8E1FF]/20 dark:bg-[#E8E1FF]/10 flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-[#6236FF] dark:text-[#E8E1FF]" />
                                </div>
                                <div className="absolute inset-0 w-16 h-16 mx-auto">
                                    <Loader2 className="w-16 h-16 text-[#6236FF]/30 dark:text-[#E8E1FF]/30 animate-spin" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Analyzing Your Resume
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                {parsingStep || 'Processing...'}
                            </p>
                            <div className="h-1 w-full bg-gray-100 dark:bg-[#3d3c3e] rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-[#6236FF] to-[#6236FF]"
                                    initial={{ width: '0%' }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 15, ease: 'linear' }}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="min-h-screen bg-white dark:bg-[#2b2a2c] flex flex-col relative">
                {/* Breadcrumb Navigation */}
                <div className="w-full border-b border-gray-100 dark:border-[#3d3c3e] bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm">
                    <div className="max-w-5xl mx-auto px-6 md:px-12 py-3">
                        <nav className="flex items-center gap-2 text-sm">
                            <button
                                onClick={() => navigate('/cv-analysis')}
                                className="text-[#6236FF] dark:text-[#E8E1FF] hover:text-[#6236FF] dark:hover:text-[#6236FF] font-medium transition-colors"
                            >
                                Resume Builder
                            </button>
                            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                            <span className="font-semibold text-gray-900 dark:text-white">
                                New Base Resume
                            </span>
                        </nav>
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row max-w-5xl mx-auto w-full p-6 md:px-12 md:pb-12 md:pt-10 gap-10 lg:gap-20 items-start justify-center">
                    {/* Left Column - Info */}
                    <div className="w-full md:w-1/3 pt-2 md:sticky md:top-16">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Create a new</p>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            <span className="text-[#6236FF] dark:text-[#E8E1FF]">Base Resume</span>
                        </h1>

                        <p className="text-gray-500 dark:text-gray-400 mt-4 leading-relaxed text-sm">
                            Just a few quick questions to help us customize your resume for the perfect job title and experience level. You can always change these settings later.
                        </p>

                        <div className="mt-6 hidden md:block">
                            <button
                                onClick={handleCreate}
                                disabled={isCreating}
                                className="px-6 py-2.5 bg-[#6236FF] hover:bg-[#6236FF] text-white font-semibold rounded-full shadow-md shadow-[#6236FF]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Continue'
                                )}
                            </button>
                            <p className="text-xs text-gray-400 mt-2">
                                Fill out all required fields
                            </p>
                        </div>
                    </div>

                    {/* Right Column - Form */}
                    <div className="w-full md:w-2/3 max-w-lg space-y-4">

                        {/* Target Job Title */}
                        <div className="space-y-0.5">
                            <div className="flex justify-between items-baseline">
                                <label className="text-sm font-semibold text-gray-900 dark:text-white">Target Job Title</label>
                                <span className="text-xs text-gray-400">Required</span>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">What job title are your targeting with this resume?</p>
                            <input
                                type="text"
                                value={jobTitle}
                                onChange={(e) => {
                                    const newTitle = e.target.value;
                                    setJobTitle(newTitle);

                                    // Auto-update document title if user hasn't manually edited it
                                    // Or if it's empty/default
                                    const currentYear = new Date().getFullYear();
                                    const userName = currentUser?.displayName?.split(' ')[0] || '';
                                    const autoTitle = `${newTitle} - Resume - ${currentYear}${userName ? ` - ${userName}` : ''}`;

                                    // Simple heuristic: if document title is empty or looks like a previous auto-generated title (contains "Resume - 20"), update it
                                    if (!documentTitle || documentTitle.includes('Resume - 20')) {
                                        setDocumentTitle(autoTitle);
                                    }
                                }}
                                placeholder="e.g. Senior Product Designer"
                                className="w-full mt-1.5 px-3 py-2 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg focus:ring-2 focus:ring-[#6236FF]/20 focus:border-[#6236FF] outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                            />
                        </div>

                        {/* Experience Level */}
                        <div className="space-y-0.5">
                            <div className="flex justify-between items-baseline">
                                <label className="text-sm font-semibold text-gray-900 dark:text-white">Experience Level</label>
                                <span className="text-xs text-gray-400">Required</span>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">What experience level are your targeting?</p>

                            <div className="space-y-0 mt-1">
                                {[
                                    { id: 'entry', label: 'Entry · 0-2 years of exp.' },
                                    { id: 'mid', label: 'Mid Level · 2-5 years of exp.' },
                                    { id: 'senior', label: 'Senior · 5+ years of exp.' }
                                ].map((level) => (
                                    <label
                                        key={level.id}
                                        className={`flex items-center py-1.5 cursor-pointer transition-all ${experienceLevel === level.id
                                            ? ''
                                            : 'hover:bg-gray-50 dark:hover:bg-[#2b2a2c]'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${experienceLevel === level.id
                                            ? 'border-[#6236FF] dark:border-[#E8E1FF] bg-[#6236FF] dark:bg-[#E8E1FF]'
                                            : 'border-gray-300 dark:border-gray-500'
                                            }`}>
                                            {experienceLevel === level.id && (
                                                <div className="w-2 h-2 rounded-full bg-white dark:bg-[#1a191b]" />
                                            )}
                                        </div>
                                        <input
                                            type="radio"
                                            name="experienceLevel"
                                            value={level.id}
                                            checked={experienceLevel === level.id}
                                            onChange={(e) => setExperienceLevel(e.target.value)}
                                            className="hidden"
                                        />
                                        <span className={`ml-2.5 text-sm ${experienceLevel === level.id ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                                            }`}>
                                            {level.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Document Title */}
                        <div className="space-y-0.5">
                            <div className="flex justify-between items-baseline">
                                <label className="text-sm font-semibold text-gray-900 dark:text-white">Document Title</label>
                                <span className="text-xs text-gray-400">Required</span>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">This is used to find your resume in Cubbbe, it is not the file name.</p>
                            <input
                                type="text"
                                value={documentTitle}
                                onChange={(e) => setDocumentTitle(e.target.value)}
                                placeholder="Document title"
                                className="w-full mt-1.5 px-3 py-2 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg focus:ring-2 focus:ring-[#6236FF]/20 focus:border-[#6236FF] outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                            />
                        </div>

                        {/* Resume Data Source */}
                        <div className="space-y-0.5">
                            <div className="flex justify-between items-baseline">
                                <label className="text-sm font-semibold text-gray-900 dark:text-white">Resume Data Source</label>
                                <span className="text-xs text-gray-400">Required</span>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed mb-3">
                                Looks like you have data in your Cubbbe Profile, so we've pre-selected it as a source for this resume. If you don't have enough data in your profile, you can import your resume from LinkedIn or upload a PDF file.
                            </p>

                            <div className="border border-gray-200 dark:border-[#3d3c3e] rounded-2xl overflow-hidden">
                                {/* Tabs */}
                                <div className="flex border-b border-gray-200 dark:border-[#3d3c3e] p-2 gap-1">
                                    <button
                                        onClick={() => setDataSource('profile')}
                                        className={`flex-1 py-1.5 px-3 rounded-full text-xs font-medium transition-all ${dataSource === 'profile'
                                            ? 'border border-[#6236FF] text-[#6236FF] dark:border-[#E8E1FF] dark:text-[#E8E1FF]'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        Cubbbe Profile
                                    </button>
                                    <button
                                        onClick={() => setDataSource('upload')}
                                        className={`flex-1 py-1.5 px-3 rounded-full text-xs font-medium transition-all ${dataSource === 'upload'
                                            ? 'border border-[#6236FF] text-[#6236FF] dark:border-[#E8E1FF] dark:text-[#E8E1FF]'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        Resume Upload
                                    </button>
                                    <button
                                        onClick={() => setDataSource('linkedin')}
                                        className={`flex-1 py-1.5 px-3 rounded-full text-xs font-medium transition-all ${dataSource === 'linkedin'
                                            ? 'border border-[#6236FF] text-[#6236FF] dark:border-[#E8E1FF] dark:text-[#E8E1FF]'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        LinkedIn
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    {dataSource === 'profile' && (
                                        <div className="space-y-4">
                                            {/* Default Profile Option */}
                                            <div
                                                onClick={() => setSelectedResumeId(null)}
                                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${selectedResumeId === null
                                                    ? 'bg-violet-50 border-violet-200 dark:bg-violet-900/10 dark:border-violet-800'
                                                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-[#3d3c3e]'
                                                    }`}
                                            >
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedResumeId === null ? 'border-[#6236FF] dark:border-[#E8E1FF]' : 'border-gray-300 dark:border-gray-600'
                                                    }`}>
                                                    {selectedResumeId === null && <div className="w-2 h-2 rounded-full bg-[#6236FF] dark:bg-[#E8E1FF]" />}
                                                </div>
                                                <User className={`w-5 h-5 flex-shrink-0 ${selectedResumeId === null ? 'text-[#6236FF] dark:text-[#E8E1FF]' : 'text-gray-400'}`} />
                                                <div>
                                                    <p className={`font-medium text-sm ${selectedResumeId === null ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                                        Cubbbe Profile Summary
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">Using your saved professional profile data</p>
                                                </div>
                                            </div>

                                            {/* Existing Resumes List */}
                                            {isLoadingResumes ? (
                                                <div className="flex justify-center py-4">
                                                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                                </div>
                                            ) : existingResumes.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1">Or copy from existing resume</p>
                                                    <div className="max-h-48 overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                                                        {existingResumes.map(resume => (
                                                            <div
                                                                key={resume.id}
                                                                onClick={() => setSelectedResumeId(resume.id)}
                                                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${selectedResumeId === resume.id
                                                                    ? 'bg-[#6236FF]/5 border-[#6236FF] dark:bg-[#6236FF]/10'
                                                                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-[#3d3c3e]'
                                                                    }`}
                                                            >
                                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${selectedResumeId === resume.id ? 'border-[#6236FF]' : 'border-gray-300 dark:border-gray-600'
                                                                    }`}>
                                                                    {selectedResumeId === resume.id && <div className="w-2 h-2 rounded-full bg-[#6236FF]" />}
                                                                </div>
                                                                <FileText className={`w-5 h-5 flex-shrink-0 ${selectedResumeId === resume.id ? 'text-[#6236FF] dark:text-[#E8E1FF]' : 'text-gray-400'}`} />
                                                                <div className="min-w-0">
                                                                    <p className={`font-medium text-sm truncate ${selectedResumeId === resume.id ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                                                        {resume.name}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                                        <Clock className="w-3 h-3" />
                                                                        <span>Updated {formatDate(resume.updatedAt)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {dataSource === 'upload' && (
                                        <div className="space-y-3">
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-gray-200 dark:border-[#3d3c3e] hover:border-[#6236FF] dark:hover:border-[#6236FF] rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors"
                                            >
                                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload PDF</p>
                                                <p className="text-xs text-gray-500">PDF only, max 10MB</p>
                                            </div>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileUpload}
                                                accept=".pdf"
                                                className="hidden"
                                            />
                                            {uploadedFile && (
                                                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/10 p-2 rounded border border-green-100 dark:border-green-900/20">
                                                    <Check className="w-4 h-4" />
                                                    <span className="truncate">{uploadedFile.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {dataSource === 'linkedin' && (
                                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 opacity-60">
                                            <Linkedin className="w-5 h-5 text-[#0077b5]" />
                                            <div>
                                                <p className="font-medium text-sm">LinkedIn Import</p>
                                                <p className="text-xs text-gray-500 mt-0.5">Coming soon</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Mobile Continue Button */}
                        <div className="md:hidden pt-4">
                            <button
                                onClick={handleCreate}
                                disabled={isCreating}
                                className="w-full px-8 py-3 bg-[#6236FF] hover:bg-[#6236FF] text-white font-semibold rounded-full shadow-md shadow-[#6236FF]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Continue'
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </AuthLayout >
    );
}
