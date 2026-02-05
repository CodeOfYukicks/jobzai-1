import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronUp, FileText, Briefcase, ArrowLeft, Check, Loader2, X, Clock, Sparkles, Building2, AlignLeft, Search, Upload, User, Linkedin } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../lib/firebase';
import { collection, query, orderBy, getDocs, doc, setDoc, serverTimestamp, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { notify } from '@/lib/notify';
import { generateId } from '../lib/cvEditorUtils';
import { analyzePDFWithPremiumATS } from '../lib/premiumATSAnalysis';
import { extractJobInfoWithGPT } from '../lib/jobExtractor';
import { getCompanyDomain, getLogoDevUrl, getCompanyInitials, getCompanyGradient } from '../utils/logo';
import { pdfToImages } from '../lib/pdfToImages';
import { extractCVTextAndTags } from '../lib/cvTextExtraction';
import { extractFullProfileFromText } from '../lib/cvExperienceExtractor';
import { mapExtractedProfileToCVData } from '../lib/profileToCVData';
import jsPDF from 'jspdf';

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

export default function CreateJobTailoredResumePage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
    const [jobTitle, setJobTitle] = useState('');
    const [company, setCompany] = useState('');
    const [jobDescription, setJobDescription] = useState('');

    // Resume Source Mode: 'profile' | 'upload' | 'linkedin'
    const [dataSource, setDataSource] = useState<'profile' | 'upload' | 'linkedin'>('profile');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [parsingStep, setParsingStep] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Existing Resumes State
    const [existingResumes, setExistingResumes] = useState<any[]>([]);
    const [isLoadingResumes, setIsLoadingResumes] = useState(false);

    // Job Input Mode State
    const [jobInputMode, setJobInputMode] = useState<'link' | 'manual' | 'saved'>('saved');
    const [savedJobs, setSavedJobs] = useState<any[]>([]); // Using any[] for now to avoid import issues, will fix type later
    const [selectedSavedJobId, setSelectedSavedJobId] = useState<string>('');
    const [jobUrl, setJobUrl] = useState('');

    // Custom Dropdown State
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [jobSearchQuery, setJobSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);



    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }

        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter saved jobs based on search
    const filteredSavedJobs = savedJobs.filter(job => {
        const searchLower = jobSearchQuery.toLowerCase();
        return (
            job.position?.toLowerCase().includes(searchLower) ||
            job.companyName?.toLowerCase().includes(searchLower)
        );
    });



    useEffect(() => {
        const fetchResumes = async () => {
            if (!currentUser) return;
            setIsLoadingResumes(true);
            try {
                // 1. Fetch User Profile to get Profile CV
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                const userData = userDocSnap.exists() ? userDocSnap.data() : null;
                const profileCvUrl = userData?.cvUrl;
                const profileCvName = userData?.cvName || 'Profile Resume';

                // 2. Fetch Existing CVs from Collection
                const resumesRef = collection(db, 'users', currentUser.uid, 'cvs');
                const q = query(resumesRef, orderBy('updatedAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const cvsResumes = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                let allResumes = [...cvsResumes];
                let profileResumeId = null;

                // 3. Identify or Create Profile Resume Object
                if (profileCvUrl) {
                    // Check if it exists in the collection
                    const matchIndex = allResumes.findIndex(r => r.sourceFileUrl === profileCvUrl);

                    if (matchIndex !== -1) {
                        // Found in collection, mark it
                        allResumes[matchIndex] = { ...allResumes[matchIndex], isProfile: true };
                        profileResumeId = allResumes[matchIndex].id;

                        // Move to top if not already
                        if (matchIndex !== 0) {
                            const [profileItem] = allResumes.splice(matchIndex, 1);
                            allResumes.unshift(profileItem);
                        }
                    } else {
                        // Not in collection (uploaded via Profile Documents), create virtual entry
                        const virtualProfileResume = {
                            id: 'profile_cv_virtual',
                            name: profileCvName,
                            sourceFileUrl: profileCvUrl,
                            updatedAt: userData?.updatedAt || new Date(),
                            isProfile: true,
                            isVirtual: true // Flag to know it's not in 'cvs' collection
                        };
                        allResumes.unshift(virtualProfileResume);
                        profileResumeId = virtualProfileResume.id;
                    }
                }

                setExistingResumes(allResumes);

                // Pre-select the profile resume if available, otherwise the most recent one
                if (profileResumeId) {
                    setSelectedResumeId(profileResumeId);
                } else if (allResumes.length > 0) {
                    setSelectedResumeId(allResumes[0].id);
                }
            } catch (error) {
                console.error('Error fetching resumes:', error);
            } finally {
                setIsLoadingResumes(false);
            }
        };

        fetchResumes();
    }, [currentUser]);

    // Fetch Saved Jobs
    useEffect(() => {
        const fetchSavedJobs = async () => {
            if (!currentUser) return;
            try {
                const jobsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
                const q = query(jobsRef, orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const jobs = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setSavedJobs(jobs);
            } catch (error) {
                console.error('Error fetching saved jobs:', error);
            }
        };

        fetchSavedJobs();
    }, [currentUser]);

    // Handle Saved Job Selection
    const handleSavedJobSelect = (jobId: string) => {
        setSelectedSavedJobId(jobId);
        const job = savedJobs.find(j => j.id === jobId);
        if (job) {
            setJobTitle(job.position || '');
            setCompany(job.companyName || '');
            setJobDescription(job.fullJobDescription || job.description || '');
        }
    };

    // Handle PDF file upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                notify.error('Please upload a PDF file');
                return;
            }
            setUploadedFile(file);
            setSelectedResumeId(null); // Clear existing selection when uploading
        }
    };

    const handleCreate = async () => {
        if (!currentUser) return;

        // Validate resume source
        if (dataSource === 'profile' && !selectedResumeId) {
            notify.error('Please select a source resume');
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

        let effectiveJobTitle = jobTitle;
        let effectiveCompany = company;
        let effectiveJobDescription = jobDescription;

        // Validation & Extraction based on Mode
        if (jobInputMode === 'link') {
            if (!jobUrl.trim()) {
                notify.error('Please enter a valid job URL');
                return;
            }

            setIsCreating(true);
            try {
                notify.info('Extracting job details...');
                const extractedInfo = await extractJobInfoWithGPT(jobUrl);
                effectiveJobTitle = extractedInfo.position;
                effectiveCompany = extractedInfo.companyName;
                effectiveJobDescription = extractedInfo.fullJobDescription || extractedInfo.summary;

                // Update state for visibility
                setJobTitle(effectiveJobTitle);
                setCompany(effectiveCompany);
                setJobDescription(effectiveJobDescription);
            } catch (error) {
                console.error('Error extracting job info:', error);
                notify.error('Failed to extract job details. Please enter manually.');
                setIsCreating(false);
                setJobInputMode('manual'); // Switch to manual so user can enter details
                return;
            }
        } else {
            // Manual or Saved Mode Validation
            if (!jobTitle.trim()) {
                notify.error('Please enter a target job title');
                return;
            }

            if (!company.trim()) {
                notify.error('Please enter the company name');
                return;
            }

            if (!jobDescription.trim()) {
                notify.error('Please enter the job description');
                return;
            }

            setIsCreating(true);
        }

        try {
            let effectiveCvFile: File | null = null;
            let effectiveResumeId = selectedResumeId;
            let effectiveResumeName = '';

            // Handle PDF Upload Mode
            if (dataSource === 'upload' && uploadedFile) {
                setIsParsing(true);
                const resumeId = generateId();

                try {
                    // Step 1: Upload file to storage
                    setParsingStep('Uploading your resume...');
                    const fileName = `${resumeId}_${uploadedFile.name}`;
                    const fileRef = ref(storage, `cvs/${currentUser.uid}/${fileName}`);
                    await uploadBytes(fileRef, uploadedFile);
                    const fileUrl = await getDownloadURL(fileRef);

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
                    const cvData = mapExtractedProfileToCVData(extractedProfile, effectiveJobTitle);

                    // Step 6: Save resume to Firestore
                    const newResume = {
                        id: resumeId,
                        name: uploadedFile.name.replace('.pdf', ''),
                        cvData: cvData,
                        targetJobTitle: effectiveJobTitle,
                        dataSource: 'upload',
                        sourceFileUrl: fileUrl,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                        template: 'modern-professional',
                        tags: []
                    };

                    const docRef = doc(db, 'users', currentUser.uid, 'cvs', resumeId);
                    await setDoc(docRef, newResume);

                    // Use the uploaded file directly for analysis
                    effectiveCvFile = uploadedFile;
                    effectiveResumeId = resumeId;
                    effectiveResumeName = uploadedFile.name.replace('.pdf', '');

                } catch (parseError: any) {
                    console.error('PDF parsing error:', parseError);
                    notify.error(parseError.message || 'Failed to parse resume.');
                    setIsParsing(false);
                    setIsCreating(false);
                    return;
                } finally {
                    setIsParsing(false);
                }
            } else {
                // Existing resume mode
                const selectedResume = existingResumes.find(r => r.id === selectedResumeId);
                if (!selectedResume) {
                    throw new Error('Selected resume not found');
                }

                effectiveResumeName = selectedResume.name;

                // Get the File object (either fetch from URL or generate from data)
                if (selectedResume.sourceFileUrl) {
                    try {
                        console.log('📥 Fetching PDF from URL:', selectedResume.sourceFileUrl);
                        const response = await fetch(selectedResume.sourceFileUrl);
                        const blob = await response.blob();
                        effectiveCvFile = new File([blob], `${selectedResume.name}.pdf`, { type: 'application/pdf' });
                    } catch (error) {
                        console.error('Error fetching PDF:', error);
                        notify.error('Failed to fetch the selected resume file');
                        setIsCreating(false);
                        return;
                    }
                } else if (selectedResume.cvData) {
                    try {
                        console.log('📝 Generating PDF from CV Data');
                        // Simple PDF generation for analysis purposes
                        const cvData = selectedResume.cvData;
                        let textContent = '';

                        // Personal Info
                        if (cvData.personalInfo) {
                            const p = cvData.personalInfo;
                            textContent += `${p.firstName || ''} ${p.lastName || ''}\n`;
                            if (p.title) textContent += `${p.title}\n`;
                            textContent += '\n';
                        }

                        // Summary
                        if (cvData.summary) textContent += `SUMMARY\n${cvData.summary}\n\n`;

                        // Experience
                        if (cvData.experiences?.length) {
                            textContent += 'EXPERIENCE\n';
                            cvData.experiences.forEach((exp: any) => {
                                textContent += `${exp.title} at ${exp.company}\n${exp.description || ''}\n\n`;
                            });
                        }

                        // Education
                        if (cvData.education?.length) {
                            textContent += 'EDUCATION\n';
                            cvData.education.forEach((edu: any) => {
                                textContent += `${edu.degree} at ${edu.institution}\n\n`;
                            });
                        }

                        // Skills
                        if (cvData.skills?.length) {
                            textContent += 'SKILLS\n';
                            cvData.skills.forEach((skill: any) => {
                                textContent += `${skill.name}\n`;
                            });
                            textContent += '\n';
                        }

                        const pdf = new jsPDF();
                        const splitText = pdf.splitTextToSize(textContent, 180);
                        pdf.text(splitText, 10, 10);
                        const pdfBlob = pdf.output('blob');
                        effectiveCvFile = new File([pdfBlob], `${selectedResume.name}.pdf`, { type: 'application/pdf' });

                    } catch (error) {
                        console.error('Error generating PDF:', error);
                        notify.error('Failed to process resume data');
                        setIsCreating(false);
                        return;
                    }
                } else {
                    notify.error('Selected resume has no file or data');
                    setIsCreating(false);
                    return;
                }
            }

            if (!effectiveCvFile) {
                notify.error('Failed to prepare resume file');
                setIsCreating(false);
                return;
            }

            // 2. Create Placeholder Analysis Document
            const analysisId = generateId();
            const placeholderAnalysis = {
                id: analysisId,
                date: new Date().toISOString(),
                userId: currentUser.uid,
                jobTitle: effectiveJobTitle,
                company: effectiveCompany,
                matchScore: 0,
                keyFindings: [],
                skillsMatch: { matching: [], missing: [], alternative: [] },
                categoryScores: { skills: 0, experience: 0, education: 0, industryFit: 0 },
                executiveSummary: '',
                experienceAnalysis: [],
                recommendations: [],
                _isLoading: true,
                createdAt: serverTimestamp(),
                originalCvId: effectiveResumeId,
                originalCvName: effectiveResumeName
            };

            const analysisRef = doc(db, 'users', currentUser.uid, 'analyses', analysisId);
            await setDoc(analysisRef, placeholderAnalysis);

            // 3. Navigate immediately
            notify.info('Analysis started. You can continue browsing, we\'ll notify you when it\'s ready.', { duration: 5000 });
            navigate('/cv-analysis', {
                state: {
                    activeTab: 'tailored',
                    highlightedAnalysisId: analysisId
                }
            });

            // 4. Run Analysis in Background (Fire and Forget)
            // We don't await this because we want the user to be able to navigate away
            analyzePDFWithPremiumATS(
                effectiveCvFile,
                {
                    jobTitle: effectiveJobTitle,
                    company: effectiveCompany,
                    jobDescription: effectiveJobDescription,
                    jobUrl: jobInputMode === 'link' ? jobUrl : ''
                },
                currentUser.uid,
                analysisId
            ).then(async (result) => {
                if (result.status === 'error') {
                    // Update doc with error
                    await setDoc(analysisRef, {
                        _isLoading: false,
                        status: 'failed',
                        error: result.message || 'Analysis failed'
                    }, { merge: true });
                    // Note: We don't show toast here because user might be elsewhere
                    // The CVAnalysisPage listener will handle error display if active
                } else {
                    // Update doc with success
                    await setDoc(analysisRef, {
                        ...result.analysis,
                        _isLoading: false,
                        status: 'completed',
                        updatedAt: serverTimestamp()
                    }, { merge: true });
                    // Success toast is handled by CVAnalysisPage listener
                }
            }).catch(async (error) => {
                console.error('Background analysis error:', error);
                await setDoc(analysisRef, {
                    _isLoading: false,
                    status: 'failed',
                    error: 'Unexpected error during analysis'
                }, { merge: true });
            });

        } catch (error) {
            console.error('Error creating tailored resume:', error);
            notify.error('Failed to start analysis');
            setIsCreating(false);
        }
        // Note: We don't call setIsCreating(false) in finally because we navigated away
    };

    return (
        <AuthLayout>
            <div className="min-h-screen bg-white dark:bg-[#2b2a2c] flex flex-col relative">
                {/* Breadcrumb Navigation */}
                <div className="w-full border-b border-gray-100 dark:border-[#3d3c3e] bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm">
                    <div className="max-w-5xl mx-auto px-6 md:px-12 py-3">
                        <nav className="flex items-center gap-2 text-sm">
                            <button
                                onClick={() => navigate('/cv-analysis')}
                                className="text-[#00B48C] dark:text-[#E2F4EE] hover:text-[#00B48C] dark:hover:text-[#00B48C] font-medium transition-colors"
                            >
                                Resume Builder
                            </button>
                            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                            <span className="font-semibold text-gray-900 dark:text-white">
                                New Job Tailored Resume
                            </span>
                        </nav>
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row max-w-5xl mx-auto w-full p-6 md:px-12 md:pb-12 md:pt-10 gap-10 lg:gap-20 items-start justify-center">
                    {/* Left Column - Info */}
                    <div className="w-full md:w-1/3 pt-2 md:sticky md:top-16">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Create a new</p>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            <span className="text-[#00B48C] dark:text-[#E2F4EE]">Job Tailored Resume</span>
                        </h1>

                        <p className="text-gray-500 dark:text-gray-400 mt-4 leading-relaxed text-sm">
                            Choose the job you're targeting and the base resume you'd like to start with. We'll help you tailor your resume to match the job description.
                        </p>

                        <div className="mt-6 hidden md:block">
                            <button
                                onClick={handleCreate}
                                disabled={isCreating}
                                className="px-6 py-2.5 bg-[#00B48C] hover:bg-[#00B48C] text-white font-semibold rounded-full shadow-md shadow-[#00B48C]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Tailoring...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Tailor Resume
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-gray-400 mt-2">
                                Fill out all required fields
                            </p>
                        </div>
                    </div>

                    {/* Right Column - Form */}
                    <div className="w-full md:w-2/3 max-w-lg space-y-5">

                        {/* Target Job Details */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-[#00B48C] dark:text-[#E2F4EE]" />
                                Target Job Details
                            </h3>

                            {/* Job Input Tabs */}
                            <div className="flex p-1 bg-gray-100 dark:bg-[#2b2a2c] rounded-full">
                                <button
                                    onClick={() => setJobInputMode('saved')}
                                    className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${jobInputMode === 'saved'
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }`}
                                >
                                    Saved Job
                                </button>
                                <button
                                    onClick={() => setJobInputMode('link')}
                                    className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${jobInputMode === 'link'
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }`}
                                >
                                    Link
                                </button>
                                <button
                                    onClick={() => setJobInputMode('manual')}
                                    className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${jobInputMode === 'manual'
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }`}
                                >
                                    Manual
                                </button>
                            </div>

                            {/* Saved Job Mode */}
                            {jobInputMode === 'saved' && (
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-gray-900 dark:text-white block">
                                            Select Saved Job <span className="text-[#00B48C] dark:text-[#E2F4EE]">*</span>
                                        </label>

                                        {/* Custom Dropdown */}
                                        <div className="relative" ref={dropdownRef}>
                                            {/* Dropdown Trigger - Anchor feel, taller, muted bg */}
                                            <button
                                                type="button"
                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                className={`w-full h-13 px-4 py-3.5 bg-gray-50 dark:bg-[#3d3c3e]/30 border rounded-xl text-left flex items-center justify-between transition-all group ${isDropdownOpen
                                                    ? 'border-[#00B48C] ring-2 ring-[#00B48C]/10 bg-white dark:bg-[#2b2a2c]'
                                                    : 'border-gray-200 dark:border-[#3d3c3e] hover:border-[#00B48C]/50 hover:bg-white dark:hover:bg-[#3d3c3e]/50'
                                                    }`}
                                            >
                                                {selectedSavedJobId ? (() => {
                                                    const selectedJob = savedJobs.find(j => j.id === selectedSavedJobId);
                                                    const domain = getCompanyDomain(selectedJob?.companyName);
                                                    const initials = getCompanyInitials(selectedJob?.companyName || '');
                                                    const gradient = getCompanyGradient(selectedJob?.companyName || '');
                                                    return (
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            {domain ? (
                                                                <img
                                                                    src={getLogoDevUrl(domain)}
                                                                    alt=""
                                                                    className="w-6 h-6 rounded-full object-cover flex-shrink-0 grayscale group-hover:grayscale-0 transition-all"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div
                                                                className={`${domain ? 'hidden' : ''} w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-sm`}
                                                                style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
                                                            >
                                                                {initials}
                                                            </div>
                                                            <span className="truncate text-gray-900 dark:text-white font-medium text-[15px]">
                                                                {selectedJob?.position} <span className="text-gray-400 font-normal mx-1">@</span> {selectedJob?.companyName}
                                                            </span>
                                                        </div>
                                                    );
                                                })() : (
                                                    <span className="text-gray-400 text-[15px] font-medium">Select a job from your board...</span>
                                                )}
                                                <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform duration-300 flex-shrink-0 ${isDropdownOpen ? '' : 'rotate-180'}`} />
                                            </button>

                                            {/* Dropdown Panel - Floating, shadow-xl */}
                                            {isDropdownOpen && (
                                                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1e1e20] border border-gray-100 dark:border-[#3d3c3e] rounded-xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">

                                                    {/* Search Input - Visually separated */}
                                                    <div className="p-3 border-b border-gray-50 dark:border-[#3d3c3e] bg-gray-50/50 dark:bg-[#2b2a2c]/50">
                                                        <div className="relative group">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#00B48C] transition-colors" />
                                                            <input
                                                                type="text"
                                                                value={jobSearchQuery}
                                                                onChange={(e) => setJobSearchQuery(e.target.value)}
                                                                placeholder="Search saved jobs..."
                                                                className="w-full pl-9 pr-3 h-10 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00B48C]/20 focus:border-[#00B48C] transition-all"
                                                                autoFocus
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Job List - Spaced out, dividers */}
                                                    <div className="max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                                                        {filteredSavedJobs.length === 0 ? (
                                                            <div className="px-3 py-8 text-center">
                                                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No jobs found</p>
                                                                <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                                                            </div>
                                                        ) : (
                                                            <div className="divide-y divide-gray-50 dark:divide-[#3d3c3e]">
                                                                {filteredSavedJobs.map((job) => {
                                                                    const domain = getCompanyDomain(job.companyName);
                                                                    const initials = getCompanyInitials(job.companyName || '');
                                                                    const gradient = getCompanyGradient(job.companyName || '');
                                                                    const isSelected = selectedSavedJobId === job.id;
                                                                    return (
                                                                        <button
                                                                            key={job.id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                handleSavedJobSelect(job.id);
                                                                                setIsDropdownOpen(false);
                                                                                setJobSearchQuery('');
                                                                            }}
                                                                            className={`w-full px-4 py-3.5 flex items-start gap-3.5 text-left transition-all hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50 group ${isSelected ? 'bg-[#E2F4EE]/30 dark:bg-[#E2F4EE]/5' : ''
                                                                                }`}
                                                                        >
                                                                            {/* Company Logo */}
                                                                            <div className="pt-0.5">
                                                                                {domain ? (
                                                                                    <img
                                                                                        src={getLogoDevUrl(domain)}
                                                                                        alt=""
                                                                                        className="w-8 h-8 rounded-lg object-cover flex-shrink-0 bg-white shadow-sm border border-gray-100 dark:border-gray-700"
                                                                                        onError={(e) => {
                                                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                                                        }}
                                                                                    />
                                                                                ) : null}
                                                                                <div
                                                                                    className={`${domain ? 'hidden' : ''} w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-sm`}
                                                                                    style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
                                                                                >
                                                                                    {initials}
                                                                                </div>
                                                                            </div>

                                                                            {/* Job Info - Better Hierarchy */}
                                                                            <div className="min-w-0 flex-1">
                                                                                <div className="flex items-center justify-between mb-0.5">
                                                                                    <p className={`text-[15px] font-medium truncate ${isSelected ? 'text-[#00B48C] dark:text-[#E2F4EE]' : 'text-gray-900 dark:text-white'
                                                                                        }`}>
                                                                                        {job.position}
                                                                                    </p>
                                                                                    {isSelected && (
                                                                                        <Check className="w-4 h-4 text-[#00B48C] dark:text-[#E2F4EE] flex-shrink-0 ml-2" />
                                                                                    )}
                                                                                </div>
                                                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                                                    {job.companyName}
                                                                                </p>
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Link Mode */}
                            {jobInputMode === 'link' && (
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-900 dark:text-white">Job URL <span className="text-[#00B48C] dark:text-[#E2F4EE]">*</span></label>
                                        <input
                                            type="url"
                                            value={jobUrl}
                                            onChange={(e) => setJobUrl(e.target.value)}
                                            placeholder="https://linkedin.com/jobs/..."
                                            className="w-full px-3 py-2.5 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg focus:ring-2 focus:ring-[#00B48C]/20 focus:border-[#00B48C] outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                                        />
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            We'll extract the job details automatically.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Manual Mode */}
                            {jobInputMode === 'manual' && (
                                <div className="space-y-3">
                                    {/* Job Title */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-900 dark:text-white">Job Title <span className="text-[#00B48C] dark:text-[#E2F4EE]">*</span></label>
                                        <input
                                            type="text"
                                            value={jobTitle}
                                            onChange={(e) => setJobTitle(e.target.value)}
                                            placeholder="e.g. Senior Product Designer"
                                            className="w-full px-3 py-2.5 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg focus:ring-2 focus:ring-[#00B48C]/20 focus:border-[#00B48C] outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                                        />
                                    </div>

                                    {/* Company */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-900 dark:text-white">Company <span className="text-[#00B48C] dark:text-[#E2F4EE]">*</span></label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={company}
                                                onChange={(e) => setCompany(e.target.value)}
                                                placeholder="e.g. Google"
                                                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg focus:ring-2 focus:ring-[#00B48C]/20 focus:border-[#00B48C] outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Job Description */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-baseline">
                                            <label className="text-sm font-semibold text-gray-900 dark:text-white">Job Description <span className="text-[#00B48C] dark:text-[#E2F4EE]">*</span></label>
                                            <span className="text-xs text-gray-400">Paste the full JD</span>
                                        </div>
                                        <div className="relative">
                                            <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                            <textarea
                                                value={jobDescription}
                                                onChange={(e) => setJobDescription(e.target.value)}
                                                placeholder="Paste the job description here..."
                                                rows={5}
                                                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg focus:ring-2 focus:ring-[#00B48C]/20 focus:border-[#00B48C] outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 text-sm resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Source Resume Selection */}
                        <div className="border-t border-gray-100 dark:border-[#3d3c3e] pt-5 space-y-1">
                            <div className="flex justify-between items-baseline">
                                <label className="text-sm font-semibold text-gray-900 dark:text-white">Source Resume</label>
                                <span className="text-xs text-gray-400">Required</span>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                Select a base resume to tailor for this job application. You can use an existing resume from your profile or upload a new one.
                            </p>

                            <div className="bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-xl p-1 mt-3">
                                <div className="grid grid-cols-3 gap-1">
                                    <button
                                        onClick={() => setDataSource('profile')}
                                        className={`py-2 px-4 rounded-full text-xs font-semibold transition-all ${dataSource === 'profile'
                                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        Cubbbe Profile
                                    </button>
                                    <button
                                        onClick={() => setDataSource('upload')}
                                        className={`py-2 px-4 rounded-full text-xs font-semibold transition-all ${dataSource === 'upload'
                                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        Resume Upload
                                    </button>
                                    <button
                                        onClick={() => setDataSource('linkedin')}
                                        className={`py-2 px-4 rounded-full text-xs font-semibold transition-all ${dataSource === 'linkedin'
                                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        LinkedIn
                                    </button>
                                </div>

                                <div className="p-4 mt-1 border-t border-gray-100 dark:border-[#3d3c3e]">
                                    {dataSource === 'profile' && (
                                        <div className="space-y-4">
                                            {isLoadingResumes ? (
                                                <div className="flex justify-center py-4">
                                                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                                </div>
                                            ) : existingResumes.length > 0 ? (
                                                <div className="max-h-60 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                                                    {existingResumes.map(resume => (
                                                        <div
                                                            key={resume.id}
                                                            onClick={() => setSelectedResumeId(resume.id)}
                                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${selectedResumeId === resume.id
                                                                ? 'bg-[#00B48C]/5 border-[#00B48C] dark:bg-[#00B48C]/10'
                                                                : 'border-transparent hover:bg-gray-50 dark:hover:bg-[#3d3c3e]'
                                                                }`}
                                                        >
                                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${selectedResumeId === resume.id ? 'border-[#00B48C]' : 'border-gray-300 dark:border-gray-600'
                                                                }`}>
                                                                {selectedResumeId === resume.id && <div className="w-2 h-2 rounded-full bg-[#00B48C]" />}
                                                            </div>
                                                            <FileText className={`w-5 h-5 flex-shrink-0 ${selectedResumeId === resume.id ? 'text-[#00B48C] dark:text-[#E2F4EE]' : 'text-gray-400'}`} />
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <p className={`font-medium text-sm truncate ${selectedResumeId === resume.id ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                                                        {resume.name}
                                                                    </p>
                                                                    {resume.isProfile && (
                                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E2F4EE]/20 text-[#00B48C] dark:bg-[#E2F4EE]/10 dark:text-[#E2F4EE] border border-[#E2F4EE]/30 dark:border-[#E2F4EE]/20">
                                                                            PROFILE
                                                                        </span>
                                                                    )}
                                                                    {resume.sourceFileUrl && (
                                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                                                                            PDF
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                                    <Clock className="w-3 h-3" />
                                                                    <span>Updated {formatDate(resume.updatedAt)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">No base resumes found.</p>
                                                    <button
                                                        onClick={() => navigate('/resume-builder/new')}
                                                        className="mt-2 text-sm font-medium text-[#00B48C] dark:text-[#E2F4EE] hover:underline"
                                                    >
                                                        Create a base resume first
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {dataSource === 'upload' && (
                                        <div className="space-y-3">
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${uploadedFile
                                                    ? 'border-[#00B48C] bg-[#E2F4EE]/10 dark:bg-[#E2F4EE]/5'
                                                    : 'border-gray-200 dark:border-[#3d3c3e] hover:border-[#00B48C] dark:hover:border-[#00B48C]'
                                                    }`}
                                            >
                                                {uploadedFile ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-[#E2F4EE]/20 dark:bg-[#E2F4EE]/10 flex items-center justify-center">
                                                            <Check className="w-5 h-5 text-[#00B48C] dark:text-[#E2F4EE]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                                                                {uploadedFile.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">Click to change file</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload PDF</p>
                                                        <p className="text-xs text-gray-500">PDF only, max 10MB</p>
                                                    </>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileUpload}
                                                accept=".pdf"
                                                className="hidden"
                                            />

                                            {/* Parsing Progress */}
                                            {isParsing && (
                                                <div className="flex items-center gap-3 p-3 bg-[#E2F4EE]/10 dark:bg-[#E2F4EE]/5 rounded-lg border border-[#E2F4EE]/30 dark:border-[#E2F4EE]/20">
                                                    <Loader2 className="w-4 h-4 animate-spin text-[#00B48C] dark:text-[#E2F4EE]" />
                                                    <span className="text-sm text-[#00B48C] dark:text-[#E2F4EE]">{parsingStep}</span>
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
                                className="w-full px-8 py-3 bg-[#00B48C] hover:bg-[#00B48C] text-white font-semibold rounded-full shadow-md shadow-[#00B48C]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Tailoring...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Tailor Resume
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </div >
            </div >
        </AuthLayout >
    );
}
