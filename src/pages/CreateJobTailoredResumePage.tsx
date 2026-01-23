import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronUp, FileText, Briefcase, ArrowLeft, Check, Loader2, X, Clock, Sparkles, Building2, AlignLeft, Search } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs, doc, setDoc, serverTimestamp, deleteDoc, getDoc } from 'firebase/firestore';
import { notify } from '@/lib/notify';
import { generateId } from '../lib/cvEditorUtils';
import { analyzePDFWithPremiumATS } from '../lib/premiumATSAnalysis';
import { extractJobInfoWithGPT } from '../lib/jobExtractor';
import { getCompanyDomain, getLogoDevUrl, getCompanyInitials, getCompanyGradient } from '../utils/logo';
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

    // Resume Dropdown State
    const [isResumeDropdownOpen, setIsResumeDropdownOpen] = useState(false);
    const [resumeSearchQuery, setResumeSearchQuery] = useState('');
    const resumeDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (resumeDropdownRef.current && !resumeDropdownRef.current.contains(event.target as Node)) {
                setIsResumeDropdownOpen(false);
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

    // Filter resumes based on search (exclude profile resume)
    const filteredResumes = existingResumes.filter(resume => {
        if (resume.isProfile) return false;
        const searchLower = resumeSearchQuery.toLowerCase();
        return resume.name?.toLowerCase().includes(searchLower);
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

    const handleCreate = async () => {
        if (!currentUser) return;

        if (!selectedResumeId) {
            notify.error('Please select a source resume');
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
            const selectedResume = existingResumes.find(r => r.id === selectedResumeId);
            if (!selectedResume) {
                throw new Error('Selected resume not found');
            }

            let effectiveCvFile: File | null = null;

            // 1. Get the File object (either fetch from URL or generate from data)
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
                    // We construct a text representation and put it in a PDF
                    // This mirrors the logic in CVAnalysisPage but simplified
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
                originalCvId: selectedResumeId,
                originalCvName: selectedResume.name
            };

            const analysisRef = doc(db, 'users', currentUser.uid, 'analyses', analysisId);
            await setDoc(analysisRef, placeholderAnalysis);

            notify.info('Analysis started in background...');

            const result = await analyzePDFWithPremiumATS(
                effectiveCvFile,
                {
                    jobTitle: effectiveJobTitle,
                    company: effectiveCompany,
                    jobDescription: effectiveJobDescription,
                    jobUrl: jobInputMode === 'link' ? jobUrl : ''
                },
                currentUser.uid,
                analysisId
            );

            if (result.status === 'error') {
                // Update doc with error
                await setDoc(analysisRef, {
                    _isLoading: false,
                    status: 'failed',
                    error: result.message || 'Analysis failed'
                }, { merge: true });
                notify.error('Analysis failed: ' + result.message);
                setIsCreating(false);
                return;
            }

            // Update doc with success
            await setDoc(analysisRef, {
                ...result.analysis,
                _isLoading: false,
                status: 'completed',
                updatedAt: serverTimestamp()
            }, { merge: true });

            notify.success('Resume tailored successfully!');
            navigate(`/ats-analysis/${analysisId}`);

        } catch (error) {
            console.error('Error creating tailored resume:', error);
            notify.error('Failed to create tailored resume');
        } finally {
            setIsCreating(false);
        }
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
                                className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors"
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
                            <span className="text-teal-600 dark:text-teal-400">Job Tailored Resume</span>
                        </h1>

                        <p className="text-gray-500 dark:text-gray-400 mt-4 leading-relaxed text-sm">
                            Choose the job you're targeting and the base resume you'd like to start with. We'll help you tailor your resume to match the job description.
                        </p>

                        <div className="mt-6 hidden md:block">
                            <button
                                onClick={handleCreate}
                                disabled={isCreating}
                                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-full shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
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

                        {/* Source Resume Selection */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-baseline">
                                <label className="text-sm font-semibold text-gray-900 dark:text-white">Source Resume</label>
                                <span className="text-xs text-gray-400">Required</span>
                            </div>

                            {isLoadingResumes ? (
                                <div className="flex items-center gap-2 px-4 py-3 border border-gray-200 dark:border-[#3d3c3e] rounded-xl bg-gray-50 dark:bg-[#2b2a2c] text-gray-400 text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Loading resumes...
                                </div>
                            ) : existingResumes.length > 0 ? (
                                <div className="space-y-4">
                                    {/* Primary Option: Profile Resume (Only if it exists) */}
                                    {existingResumes[0]?.isProfile && (
                                        <>
                                            <div
                                                onClick={() => setSelectedResumeId(existingResumes[0].id)}
                                                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedResumeId === existingResumes[0].id
                                                    ? 'bg-teal-50 border-teal-200 ring-1 ring-teal-200/50 dark:bg-teal-900/10 dark:border-teal-800'
                                                    : 'bg-white dark:bg-[#2b2a2c] border-gray-200 dark:border-[#3d3c3e] hover:border-gray-300 dark:hover:border-gray-600'
                                                    }`}
                                            >
                                                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedResumeId === existingResumes[0].id
                                                    ? 'border-teal-600 dark:border-teal-400'
                                                    : 'border-gray-300 dark:border-gray-600'
                                                    }`}>
                                                    {selectedResumeId === existingResumes[0].id && (
                                                        <div className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                                        {existingResumes[0].name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        Base Resume from Professional Profile
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="relative flex items-center py-2">
                                                <div className="flex-grow border-t border-gray-200 dark:border-[#3d3c3e]"></div>
                                                <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Or select another</span>
                                                <div className="flex-grow border-t border-gray-200 dark:border-[#3d3c3e]"></div>
                                            </div>
                                        </>
                                    )}

                                    {/* Secondary Option: Custom Dropdown */}
                                    <div className="relative" ref={resumeDropdownRef}>
                                        {/* Dropdown Trigger */}
                                        <button
                                            type="button"
                                            onClick={() => setIsResumeDropdownOpen(!isResumeDropdownOpen)}
                                            className={`w-full px-3 py-2.5 bg-white dark:bg-[#2b2a2c] border rounded-lg text-left flex items-center justify-between transition-all text-sm ${isResumeDropdownOpen
                                                ? 'border-teal-500 ring-2 ring-teal-500/20'
                                                : selectedResumeId && (!existingResumes[0]?.isProfile || selectedResumeId !== existingResumes[0].id)
                                                    ? 'border-teal-500 ring-1 ring-teal-500/20'
                                                    : 'border-gray-200 dark:border-[#3d3c3e] hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                        >
                                            {selectedResumeId && (!existingResumes[0]?.isProfile || selectedResumeId !== existingResumes[0].id) ? (() => {
                                                const selectedResume = existingResumes.find(r => r.id === selectedResumeId);
                                                return (
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                                                        <span className="truncate text-gray-900 dark:text-white text-sm">
                                                            {selectedResume?.name}
                                                        </span>
                                                        <span className="text-gray-400 text-xs flex-shrink-0">
                                                            ({formatDate(selectedResume?.updatedAt)})
                                                        </span>
                                                    </div>
                                                );
                                            })() : (
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <span className="text-gray-400 text-sm">
                                                        {existingResumes[0]?.isProfile ? "Select another resume..." : "Select a base resume"}
                                                    </span>
                                                </div>
                                            )}
                                            <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isResumeDropdownOpen ? '' : 'rotate-180'}`} />
                                        </button>

                                        {/* Dropdown Panel */}
                                        {isResumeDropdownOpen && (
                                            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg shadow-lg overflow-hidden">
                                                {/* Search Input */}
                                                <div className="p-2 border-b border-gray-100 dark:border-[#3d3c3e]">
                                                    <div className="relative">
                                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            value={resumeSearchQuery}
                                                            onChange={(e) => setResumeSearchQuery(e.target.value)}
                                                            placeholder="Search resumes..."
                                                            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-[#2b2a2c] border-0 rounded-md text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>

                                                {/* Resume List */}
                                                <div className="max-h-52 overflow-y-auto">
                                                    {filteredResumes.length === 0 ? (
                                                        <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                                            No resumes found
                                                        </div>
                                                    ) : (
                                                        filteredResumes.map((resume, index) => (
                                                            <button
                                                                key={resume.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedResumeId(resume.id);
                                                                    setIsResumeDropdownOpen(false);
                                                                    setResumeSearchQuery('');
                                                                }}
                                                                className={`w-full px-3 py-2.5 flex items-center gap-2.5 text-left hover:bg-gray-50 dark:hover:bg-[#3d3c3e] transition-colors ${selectedResumeId === resume.id ? 'bg-teal-50/50 dark:bg-teal-900/10' : ''
                                                                    } ${index !== 0 ? 'border-t border-gray-100 dark:border-[#3d3c3e]' : ''}`}
                                                            >
                                                                {/* Resume Icon */}
                                                                <FileText className={`w-4 h-4 flex-shrink-0 ${selectedResumeId === resume.id ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400'}`} />
                                                                {/* Resume Info */}
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-sm text-gray-900 dark:text-white truncate">
                                                                        {resume.name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-400 truncate">
                                                                        Updated {formatDate(resume.updatedAt)}
                                                                    </p>
                                                                </div>
                                                                {/* Checkmark if selected */}
                                                                {selectedResumeId === resume.id && (
                                                                    <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                                                                )}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            ) : (
                                <div className="text-center py-8 border border-dashed border-gray-200 dark:border-[#3d3c3e] rounded-xl bg-gray-50 dark:bg-[#2b2a2c]">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No base resumes found.</p>
                                    <button
                                        onClick={() => navigate('/resume-builder/new')}
                                        className="mt-2 text-sm font-medium text-teal-600 hover:underline"
                                    >
                                        Create a base resume first
                                    </button>
                                </div>
                            )}
                            {existingResumes.length > 0 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Select the base resume you want to tailor for this job application.
                                </p>
                            )}
                        </div>

                        <div className="border-t border-gray-100 dark:border-[#3d3c3e] pt-5 space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-teal-600 dark:text-teal-400" />
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
                                <div className="space-y-2">
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-900 dark:text-white">Select Saved Job <span className="text-teal-600">*</span></label>

                                        {/* Custom Dropdown */}
                                        <div className="relative" ref={dropdownRef}>
                                            {/* Dropdown Trigger */}
                                            <button
                                                type="button"
                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                className={`w-full px-3 py-2.5 bg-white dark:bg-[#2b2a2c] border rounded-lg text-left flex items-center justify-between transition-all text-sm ${isDropdownOpen
                                                    ? 'border-teal-500 ring-2 ring-teal-500/20'
                                                    : 'border-gray-200 dark:border-[#3d3c3e] hover:border-gray-300 dark:hover:border-gray-600'
                                                    }`}
                                            >
                                                {selectedSavedJobId ? (() => {
                                                    const selectedJob = savedJobs.find(j => j.id === selectedSavedJobId);
                                                    const domain = getCompanyDomain(selectedJob?.companyName);
                                                    const initials = getCompanyInitials(selectedJob?.companyName || '');
                                                    const gradient = getCompanyGradient(selectedJob?.companyName || '');
                                                    return (
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            {domain ? (
                                                                <img
                                                                    src={getLogoDevUrl(domain)}
                                                                    alt=""
                                                                    className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div
                                                                className={`${domain ? 'hidden' : ''} w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-white`}
                                                                style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
                                                            >
                                                                {initials}
                                                            </div>
                                                            <span className="truncate text-gray-900 dark:text-white text-sm">
                                                                {selectedJob?.position} <span className="text-gray-400">@</span> {selectedJob?.companyName}
                                                            </span>
                                                        </div>
                                                    );
                                                })() : (
                                                    <span className="text-gray-400 text-sm">Select one of your saved jobs</span>
                                                )}
                                                <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isDropdownOpen ? '' : 'rotate-180'}`} />
                                            </button>

                                            {/* Dropdown Panel */}
                                            {isDropdownOpen && (
                                                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg shadow-lg overflow-hidden">
                                                    {/* Search Input */}
                                                    <div className="p-2 border-b border-gray-100 dark:border-[#3d3c3e]">
                                                        <div className="relative">
                                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                value={jobSearchQuery}
                                                                onChange={(e) => setJobSearchQuery(e.target.value)}
                                                                placeholder="Search"
                                                                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-[#2b2a2c] border-0 rounded-md text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                                                                autoFocus
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Job List */}
                                                    <div className="max-h-[150px] overflow-y-auto">
                                                        {filteredSavedJobs.length === 0 ? (
                                                            <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                                                No jobs found
                                                            </div>
                                                        ) : (
                                                            filteredSavedJobs.map((job, index) => {
                                                                const domain = getCompanyDomain(job.companyName);
                                                                const initials = getCompanyInitials(job.companyName || '');
                                                                const gradient = getCompanyGradient(job.companyName || '');
                                                                return (
                                                                    <button
                                                                        key={job.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            handleSavedJobSelect(job.id);
                                                                            setIsDropdownOpen(false);
                                                                            setJobSearchQuery('');
                                                                        }}
                                                                        className={`w-full px-3 py-2.5 flex items-center gap-2.5 text-left hover:bg-gray-50 dark:hover:bg-[#3d3c3e] transition-colors ${selectedSavedJobId === job.id ? 'bg-teal-50/50 dark:bg-teal-900/10' : ''
                                                                            } ${index !== 0 ? 'border-t border-gray-100 dark:border-[#3d3c3e]' : ''}`}
                                                                    >
                                                                        {/* Company Logo */}
                                                                        {domain ? (
                                                                            <img
                                                                                src={getLogoDevUrl(domain)}
                                                                                alt=""
                                                                                className="w-7 h-7 rounded-full object-cover flex-shrink-0 bg-gray-100 dark:bg-[#3d3c3e]"
                                                                                onError={(e) => {
                                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                                                }}
                                                                            />
                                                                        ) : null}
                                                                        <div
                                                                            className={`${domain ? 'hidden' : ''} w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white`}
                                                                            style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
                                                                        >
                                                                            {initials}
                                                                        </div>
                                                                        {/* Job Info */}
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="text-sm text-gray-900 dark:text-white truncate">
                                                                                {job.position} <span className="text-gray-400">@</span> <span className="font-medium">{job.companyName}</span>
                                                                            </p>
                                                                        </div>
                                                                        {/* Checkmark if selected */}
                                                                        {selectedSavedJobId === job.id && (
                                                                            <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                                                                        )}
                                                                    </button>
                                                                );
                                                            })
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
                                        <label className="text-sm font-semibold text-gray-900 dark:text-white">Job URL <span className="text-teal-600">*</span></label>
                                        <input
                                            type="url"
                                            value={jobUrl}
                                            onChange={(e) => setJobUrl(e.target.value)}
                                            placeholder="https://linkedin.com/jobs/..."
                                            className="w-full px-3 py-2.5 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 text-sm"
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
                                        <label className="text-sm font-semibold text-gray-900 dark:text-white">Job Title <span className="text-teal-600">*</span></label>
                                        <input
                                            type="text"
                                            value={jobTitle}
                                            onChange={(e) => setJobTitle(e.target.value)}
                                            placeholder="e.g. Senior Product Designer"
                                            className="w-full px-3 py-2.5 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                                        />
                                    </div>

                                    {/* Company */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-900 dark:text-white">Company <span className="text-teal-600">*</span></label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={company}
                                                onChange={(e) => setCompany(e.target.value)}
                                                placeholder="e.g. Google"
                                                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Job Description */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-baseline">
                                            <label className="text-sm font-semibold text-gray-900 dark:text-white">Job Description <span className="text-teal-600">*</span></label>
                                            <span className="text-xs text-gray-400">Paste the full JD</span>
                                        </div>
                                        <div className="relative">
                                            <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                            <textarea
                                                value={jobDescription}
                                                onChange={(e) => setJobDescription(e.target.value)}
                                                placeholder="Paste the job description here..."
                                                rows={5}
                                                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 text-sm resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile Continue Button */}
                        <div className="md:hidden pt-4">
                            <button
                                onClick={handleCreate}
                                disabled={isCreating}
                                className="w-full px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-full shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
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
