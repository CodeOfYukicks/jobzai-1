import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { CompanyLogo } from '../common/CompanyLogo';
import { Job } from '../../types/job-board';
import { KanbanBoard } from '../../types/job';
import { Building2, MapPin, Clock, Share2, Bookmark, Heart, Target, Briefcase, GraduationCap, Code, AlertTriangle, Users, X, Link2, Linkedin, Mail, MessageCircle, Award, Brain, TrendingUp, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { notify } from '@/lib/notify';
import { generateJobSummaryAndInsights, generateBasicInsightsFromJobData, generateBasicSummaryFromJobData, JobDataForFallback } from '../../lib/jobExtractor';
import { useJobInteractions } from '../../hooks/useJobInteractions';
import SelectBoardModal from '../boards/SelectBoardModal';

interface JobDetailViewProps {
    job: Job | null;
    onDismiss?: (jobId: string) => void;
}

export function JobDetailView({ job, onDismiss }: JobDetailViewProps) {
    const { currentUser } = useAuth();
    const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const shareMenuRef = useRef<HTMLDivElement>(null);

    // Board selection state
    const [boards, setBoards] = useState<KanbanBoard[]>([]);
    const [showBoardSelector, setShowBoardSelector] = useState(false);

    // Job Interactions (V5.0 - Feedback Loop)
    const { isJobSaved, toggleSave, trackView, trackApply } = useJobInteractions();
    const viewStartTime = useRef<number | null>(null);
    const lastTrackedJobId = useRef<string | null>(null);

    // Track view time when job changes
    useEffect(() => {
        if (job?.id) {
            // Track previous job view duration
            if (viewStartTime.current && lastTrackedJobId.current && lastTrackedJobId.current !== job.id) {
                const timeSpent = Date.now() - viewStartTime.current;
                trackView(lastTrackedJobId.current, { timeSpentMs: timeSpent });
            }

            // Start tracking new job
            viewStartTime.current = Date.now();
            lastTrackedJobId.current = job.id;
        }

        // Cleanup on unmount
        return () => {
            if (viewStartTime.current && lastTrackedJobId.current) {
                const timeSpent = Date.now() - viewStartTime.current;
                trackView(lastTrackedJobId.current, { timeSpentMs: timeSpent });
            }
        };
    }, [job?.id, trackView]);

    // Check if job is already in wishlist on mount and when job changes
    useEffect(() => {
        const checkWishlistStatus = async () => {
            if (!currentUser || !job) {
                setIsInWishlist(false);
                return;
            }

            try {
                const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
                const q = query(
                    applicationsRef,
                    where('companyName', '==', job.company),
                    where('position', '==', job.title)
                );
                const existingApplications = await getDocs(q);
                setIsInWishlist(!existingApplications.empty);
            } catch (error) {
                console.error('Error checking wishlist status:', error);
            }
        };

        checkWishlistStatus();
    }, [currentUser, job]);

    // Close share menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
                setShowShareMenu(false);
            }
        };

        if (showShareMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showShareMenu]);

    // Fetch user's boards (only job-type boards, not campaigns)
    useEffect(() => {
        const fetchBoards = async () => {
            if (!currentUser) {
                setBoards([]);
                return;
            }

            try {
                const boardsRef = collection(db, 'users', currentUser.uid, 'boards');
                const boardsQuery = query(boardsRef, orderBy('createdAt', 'asc'));
                const snapshot = await getDocs(boardsQuery);

                const allBoards = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as KanbanBoard[];

                // Filter for job-type boards only (boardType === 'jobs' or undefined/null for legacy boards)
                const jobBoards = allBoards.filter(board =>
                    !board.boardType || board.boardType === 'jobs'
                );

                setBoards(jobBoards);
            } catch (error) {
                console.error('Error fetching boards:', error);
                setBoards([]);
            }
        };

        fetchBoards();
    }, [currentUser]);

    // Handle share to different platforms
    const handleShare = (platform: 'copy' | 'linkedin' | 'twitter' | 'whatsapp' | 'email') => {
        if (!job) return;

        const shareUrl = job.applyUrl || window.location.href;
        const shareText = `${job.title} chez ${job.company}`;

        switch (platform) {
            case 'copy':
                navigator.clipboard.writeText(shareUrl);
                notify.success('Lien copié !');
                break;
            case 'linkedin':
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
                break;
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
                break;
            case 'email':
                window.location.href = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent('Découvre cette offre d\'emploi : ' + shareUrl)}`;
                break;
        }
        setShowShareMenu(false);
    };

    // Core function to add job to wishlist with a specific boardId
    // SIMPLIFIED: Uses job data we already have instead of re-scraping the website
    const addJobToWishlist = async (boardId?: string) => {
        if (!currentUser || !job) return;

        try {
            setIsAddingToWishlist(true);

            // Check if this job already exists in user's applications
            const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
            const q = query(
                applicationsRef,
                where('companyName', '==', job.company),
                where('position', '==', job.title)
            );
            const existingApplications = await getDocs(q);

            if (!existingApplications.empty) {
                notify.error('This job is already in your applications');
                setIsAddingToWishlist(false);
                return;
            }

            // Prepare complete job data for AI analysis (we already have all this from the Job Board!)
            const jobDataForAnalysis: JobDataForFallback = {
                title: job.title,
                company: job.company,
                location: job.location,
                description: job.description,
                tags: job.tags,
                skills: job.skills,
                technologies: job.technologies,
                industries: job.industries,
                type: job.type,
                seniority: job.seniority,
                salaryRange: job.salaryRange,
                remote: job.remote,
                roleFunction: job.roleFunction,
            };

            // Create application immediately with basic info for fast feedback
            const basicApplication = {
                companyName: job.company,
                position: job.title,
                location: job.location,
                status: 'wishlist',
                appliedDate: new Date().toISOString().split('T')[0],
                url: job.applyUrl || '',
                description: '', // Will be filled by AI
                fullJobDescription: job.description || '',
                notes: '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                contactName: '',
                contactEmail: '',
                contactPhone: '',
                salary: job.salaryRange || '',
                generatedEmails: [],
                stickyNotes: [],
                statusHistory: [{
                    status: 'wishlist',
                    date: new Date().toISOString().split('T')[0],
                    notes: 'Added from Job Board'
                }],
                ...(boardId && { boardId })
            };

            // Add to Firestore immediately for fast UX
            const docRef = await addDoc(applicationsRef, basicApplication);

            // Update UI state immediately
            setIsInWishlist(true);
            setIsAddingToWishlist(false);
            notify.success('Added to wishlist! 💜');

            // Generate AI summary and insights in background (ONE API call)
            // No need to scrape - we use job.description we already have!
            console.log('🤖 [addJobToWishlist] Generating AI summary from existing job data...', {
                jobId: docRef.id,
                title: job.title,
                descriptionLength: job.description?.length || 0
            });

            notify.info('🤖 Analyzing job details...', { duration: 2000 });

            try {
                // Single API call to generate everything
                const result = await generateJobSummaryAndInsights(jobDataForAnalysis);

                console.log('✅ [addJobToWishlist] AI analysis complete:', {
                    jobId: docRef.id,
                    hasSummary: !!result.summary,
                    hasInsights: !!result.jobInsights,
                    hasTags: !!result.jobTags
                });

                // Update Firestore with AI-generated data
                const { updateDoc, doc } = await import('firebase/firestore');

                // Sanitize jobTags to remove undefined values (Firestore doesn't support undefined)
                const sanitizedTags = result.jobTags ? JSON.parse(JSON.stringify(result.jobTags)) : undefined;

                await updateDoc(doc(db, 'users', currentUser.uid, 'jobApplications', docRef.id), {
                    description: result.summary,
                    jobInsights: result.jobInsights,
                    ...(sanitizedTags && { jobTags: sanitizedTags }),
                    updatedAt: serverTimestamp()
                });

                notify.success('AI analysis complete! ✨', { duration: 2000 });
            } catch (aiError) {
                // AI failed - but the job is already saved with basic info
                console.error('❌ [addJobToWishlist] AI analysis failed:', aiError);

                // Use local fallback (no API call, instant)
                const localSummary = generateBasicSummaryFromJobData(jobDataForAnalysis);
                const localInsights = generateBasicInsightsFromJobData(jobDataForAnalysis);

                try {
                    const { updateDoc, doc } = await import('firebase/firestore');
                    await updateDoc(doc(db, 'users', currentUser.uid, 'jobApplications', docRef.id), {
                        description: localSummary,
                        jobInsights: localInsights,
                        _fallbackUsed: true,
                        updatedAt: serverTimestamp()
                    });
                    notify.info('Job summary created from listing data', { duration: 2000 });
                } catch (updateError) {
                    console.error('❌ Failed to update with fallback:', updateError);
                }
            }
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            setIsInWishlist(false);
            notify.error('Failed to add to wishlist');
            setIsAddingToWishlist(false);
        }
    };

    // Handler called when user clicks "Add to Wishlist" button
    const handleAddToWishlist = async () => {
        if (!currentUser) {
            notify.error('Please log in to add jobs to your wishlist');
            return;
        }

        if (!job) {
            notify.error('No job selected');
            return;
        }

        // If user has multiple job-type boards, show selection modal
        if (boards.length > 1) {
            setShowBoardSelector(true);
            return;
        }

        // If user has exactly one board or no boards, add directly
        const targetBoardId = boards.length === 1 ? boards[0].id : undefined;
        await addJobToWishlist(targetBoardId);
    };

    // Handler when user selects a board from the modal
    const handleBoardSelected = async (boardId: string) => {
        setShowBoardSelector(false);
        await addJobToWishlist(boardId);
    };

    if (!job) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-400 bg-white dark:bg-[#242325] h-full">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-[#2b2a2c] rounded-full flex items-center justify-center mx-auto mb-4">
                        <BriefcaseIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-500">Select a job to view details</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-[#242325] h-full overflow-y-auto custom-scrollbar">
            <div className="p-8 max-w-4xl mx-auto w-full">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-start justify-between mb-6">
                        <CompanyLogo
                            companyName={job.company}
                            size="2xl"
                        />
                        <div className="flex gap-2">
                            {/* Share Button with Dropdown */}
                            <div ref={shareMenuRef} className="relative">
                                <button
                                    onClick={() => setShowShareMenu(!showShareMenu)}
                                    className={`p-2.5 rounded-xl border transition-colors ${showShareMenu
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                            : 'border-gray-200 dark:border-[#3d3c3e] hover:bg-gray-50 dark:hover:bg-[#3d3c3e] text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                                        }`}
                                    title="Partager"
                                >
                                    <Share2 className="w-5 h-5" />
                                </button>

                                <AnimatePresence>
                                    {showShareMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#2b2a2c] rounded-xl shadow-lg border border-gray-200 dark:border-[#3d3c3e] overflow-hidden z-50"
                                        >
                                            <div className="py-1">
                                                <button
                                                    onClick={() => handleShare('copy')}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#3d3c3e] transition-colors"
                                                >
                                                    <Link2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                                    Copier le lien
                                                </button>
                                                <button
                                                    onClick={() => handleShare('linkedin')}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#3d3c3e] transition-colors"
                                                >
                                                    <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                                                    LinkedIn
                                                </button>
                                                <button
                                                    onClick={() => handleShare('twitter')}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#3d3c3e] transition-colors"
                                                >
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                                    </svg>
                                                    Twitter / X
                                                </button>
                                                <button
                                                    onClick={() => handleShare('whatsapp')}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#3d3c3e] transition-colors"
                                                >
                                                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                                                    WhatsApp
                                                </button>
                                                <button
                                                    onClick={() => handleShare('email')}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#3d3c3e] transition-colors"
                                                >
                                                    <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                                    Email
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <button
                                onClick={() => {
                                    toggleSave(job.id, { matchScore: job.matchScore });
                                    notify.success(isJobSaved(job.id) ? 'Removed from saved jobs' : 'Saved for later');
                                }}
                                className={`p-2.5 rounded-xl border transition-colors ${isJobSaved(job.id)
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                        : 'border-gray-200 dark:border-[#3d3c3e] hover:bg-gray-50 dark:hover:bg-[#3d3c3e] text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                                    }`}
                                title={isJobSaved(job.id) ? 'Remove from saved' : 'Save for later'}
                            >
                                <Bookmark className={`w-5 h-5 ${isJobSaved(job.id) ? 'fill-current' : ''}`} />
                            </button>
                            {onDismiss && (
                                <button
                                    onClick={() => {
                                        onDismiss(job.id);
                                        notify.success('Job hidden from your feed');
                                    }}
                                    className="p-2.5 rounded-xl border border-gray-200 dark:border-[#3d3c3e] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                                    title="Not interested"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">{job.title}</h1>

                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-gray-600 dark:text-gray-300 mb-8 text-sm">
                        <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            {job.company}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {job.location}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {job.published}
                        </span>
                        {job.type && (
                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-xs font-medium text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                                {job.type}
                            </span>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                trackApply(job.id, { matchScore: job.matchScore });
                                window.open(job.applyUrl, '_blank');
                            }}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Apply Now
                        </button>
                        <button
                            onClick={handleAddToWishlist}
                            disabled={isAddingToWishlist || isInWishlist}
                            className={`px-6 py-3.5 rounded-xl font-semibold text-base border-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed flex items-center gap-2 ${isInWishlist
                                ? 'border-purple-600 bg-purple-600 text-white dark:border-purple-500 dark:bg-purple-500'
                                : 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50'
                                }`}
                        >
                            <Heart className={`w-5 h-5 ${isAddingToWishlist ? 'animate-pulse' : ''} ${isInWishlist ? 'fill-current' : ''}`} />
                            {isAddingToWishlist ? 'Adding...' : isInWishlist ? 'Added to Wishlist' : 'Add to Wishlist'}
                        </button>
                    </div>
                </div>

                {/* V6.0 Match Score Breakdown - Enhanced with Why This Matches & Skill Gaps */}
                {job.matchScore !== undefined && job.matchDetails && (
                    <MatchExplanationSection job={job} />
                )}

                <div className="h-px bg-gray-100 dark:bg-[#2b2a2c] mb-8" />

                {/* Job Details */}
                <div className="space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <DetailCard label="Experience" value={job.seniority} />
                        <DetailCard label="Job Type" value={job.type} />
                        <DetailCard label="Salary" value={job.salaryRange} />
                        <DetailCard label="Remote" value={job.remote} />
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About the job</h3>
                        <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed">
                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                {job.description || 'No description available.'}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            </div>

            {/* Board Selection Modal */}
            <SelectBoardModal
                isOpen={showBoardSelector}
                onClose={() => setShowBoardSelector(false)}
                onSelect={handleBoardSelected}
                boards={boards}
                jobTitle={job.title}
                companyName={job.company}
                isLoading={isAddingToWishlist}
            />
        </div>
    );
}

// Helper to format metadata values with proper capitalization
function formatMetadataValue(value: string | undefined): string {
    if (!value) return 'Not specified';

    // Handle special cases for proper formatting
    const specialCases: Record<string, string> = {
        'full-time': 'Full-time',
        'part-time': 'Part-time',
        'on-site': 'On-site',
        'remote': 'Remote',
        'hybrid': 'Hybrid',
        'internship': 'Internship',
        'entry': 'Entry Level',
        'mid': 'Mid Level',
        'senior': 'Senior',
        'lead': 'Lead',
        'contract': 'Contract',
    };

    const lowerValue = value.toLowerCase();
    if (specialCases[lowerValue]) {
        return specialCases[lowerValue];
    }

    // Default: capitalize first letter
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function DetailCard({ label, value }: { label: string, value?: string }) {
    const formattedValue = formatMetadataValue(value);

    return (
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#2b2a2c]/50 border border-gray-100 dark:border-[#3d3c3e]">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">{label}</div>
            <div className="font-semibold text-gray-900 dark:text-white truncate text-sm" title={formattedValue}>
                {formattedValue}
            </div>
        </div>
    );
}

function BriefcaseIcon(props: any) {
    return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
}

function MatchScoreItem({ icon, label, score, maxScore }: {
    icon: React.ReactNode,
    label: string,
    score: number,
    maxScore: number,
}) {
    const isNegative = score < 0;
    const displayScore = Math.abs(score);
    const percentage = Math.max(0, Math.round((score / maxScore) * 100));

    const getColor = (pct: number, negative: boolean) => {
        if (negative) return 'bg-red-500';
        if (pct >= 80) return 'bg-emerald-500';
        if (pct >= 60) return 'bg-blue-500';
        if (pct >= 40) return 'bg-amber-500';
        return 'bg-gray-400';
    };

    return (
        <div className={`flex flex-col items-center p-2 rounded-xl ${isNegative ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white/50 dark:bg-[#2b2a2c]/50'
            }`}>
            <div className={`mb-1 ${isNegative ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                {icon}
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</div>
            <div className="w-full h-1.5 bg-gray-200 dark:bg-[#3d3c3e] rounded-full overflow-hidden">
                <div
                    className={`h-full ${getColor(percentage, isNegative)} rounded-full transition-all duration-500`}
                    style={{ width: `${isNegative ? 100 : percentage}%` }}
                />
            </div>
            <div className={`text-xs font-bold mt-1 ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                }`}>
                {isNegative ? `-${displayScore}` : `${score}/${maxScore}`}
            </div>
        </div>
    );
}

/**
 * V6.1 Match Explanation Section - Simplified
 * Compact UI showing score, role type, and skill gaps only
 */
function MatchExplanationSection({ job }: { job: Job }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'bg-emerald-500';
        if (score >= 50) return 'bg-blue-500';
        if (score >= 35) return 'bg-amber-500';
        return 'bg-gray-400';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 70) return 'Excellent Match';
        if (score >= 50) return 'Good Match';
        if (score >= 35) return 'Partial Match';
        return 'Low Match';
    };

    const roleLabel = job.roleFunction && job.roleFunction !== 'other'
        ? job.roleFunction.charAt(0).toUpperCase() + job.roleFunction.slice(1).replace(/_/g, ' ') + ' role'
        : null;

    const skillGaps = job.matchDetails?.skillGaps?.slice(0, 5) || [];

    return (
        <div className="mb-8 rounded-xl bg-gray-50 dark:bg-[#2b2a2c]/50 border border-gray-200 dark:border-[#3d3c3e] overflow-hidden">
            {/* Compact Header */}
            <div className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getScoreColor(job.matchScore || 0)}`}>
                            <span className="text-white font-bold text-sm">{job.matchScore}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {getScoreLabel(job.matchScore || 0)}
                            </span>
                            {roleLabel && (
                                <>
                                    <span className="text-gray-400">·</span>
                                    <span className="text-gray-500 dark:text-gray-400">{roleLabel}</span>
                                </>
                            )}
                        </div>
                    </div>
                    {job.matchDetails && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[#3d3c3e] transition-colors text-gray-400"
                        >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    )}
                </div>

                {/* Skills to develop - inline compact */}
                {skillGaps.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-xs">
                        <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 shrink-0">
                            <AlertTriangle className="w-3 h-3" />
                            Skills to develop:
                        </span>
                        <div className="flex flex-wrap gap-1">
                            {skillGaps.map((skill, idx) => (
                                <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Expandable Detailed Breakdown */}
            <AnimatePresence>
                {isExpanded && job.matchDetails && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-indigo-200 dark:border-indigo-800"
                    >
                        <div className="p-6 pt-4">
                            {/* Score Grid - V6.0 Enhanced with new scores */}
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                Detailed Score Breakdown
                            </h4>
                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
                                <MatchScoreItem
                                    icon={<Users className="w-4 h-4" />}
                                    label="Role Fit"
                                    score={job.matchDetails.roleFunctionScore}
                                    maxScore={25}
                                />
                                <MatchScoreItem
                                    icon={<Code className="w-4 h-4" />}
                                    label="Skills"
                                    score={job.matchDetails.skillsScore}
                                    maxScore={35}
                                />
                                <MatchScoreItem
                                    icon={<MapPin className="w-4 h-4" />}
                                    label="Location"
                                    score={job.matchDetails.locationScore}
                                    maxScore={15}
                                />
                                <MatchScoreItem
                                    icon={<TrendingUp className="w-4 h-4" />}
                                    label="Level"
                                    score={job.matchDetails.experienceScore}
                                    maxScore={15}
                                />
                                <MatchScoreItem
                                    icon={<Briefcase className="w-4 h-4" />}
                                    label="Industry"
                                    score={job.matchDetails.industryScore}
                                    maxScore={10}
                                />
                                <MatchScoreItem
                                    icon={<Target className="w-4 h-4" />}
                                    label="Title"
                                    score={job.matchDetails.titleScore}
                                    maxScore={10}
                                />
                            </div>

                            {/* V6.0 New Scores Grid */}
                            {(job.matchDetails.companyNetworkScore !== undefined ||
                                job.matchDetails.cultureFitScore !== undefined ||
                                job.matchDetails.certificationBoost !== undefined) && (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
                                        {job.matchDetails.companyNetworkScore !== undefined && job.matchDetails.companyNetworkScore > 0 && (
                                            <MatchScoreItem
                                                icon={<Building2 className="w-4 h-4" />}
                                                label="Network"
                                                score={job.matchDetails.companyNetworkScore}
                                                maxScore={10}
                                            />
                                        )}
                                        {job.matchDetails.cultureFitScore !== undefined && job.matchDetails.cultureFitScore > 0 && (
                                            <MatchScoreItem
                                                icon={<Users className="w-4 h-4" />}
                                                label="Culture"
                                                score={job.matchDetails.cultureFitScore}
                                                maxScore={8}
                                            />
                                        )}
                                        {job.matchDetails.educationMatchScore !== undefined && job.matchDetails.educationMatchScore > 0 && (
                                            <MatchScoreItem
                                                icon={<GraduationCap className="w-4 h-4" />}
                                                label="Education"
                                                score={job.matchDetails.educationMatchScore}
                                                maxScore={5}
                                            />
                                        )}
                                        {job.matchDetails.certificationBoost !== undefined && job.matchDetails.certificationBoost > 0 && (
                                            <MatchScoreItem
                                                icon={<Award className="w-4 h-4" />}
                                                label="Certs"
                                                score={job.matchDetails.certificationBoost}
                                                maxScore={15}
                                            />
                                        )}
                                        {job.matchDetails.semanticScore > 0 && (
                                            <MatchScoreItem
                                                icon={<Brain className="w-4 h-4" />}
                                                label="AI Match"
                                                score={job.matchDetails.semanticScore}
                                                maxScore={40}
                                            />
                                        )}
                                        {job.matchDetails.collaborativeScore > 0 && (
                                            <MatchScoreItem
                                                icon={<Sparkles className="w-4 h-4" />}
                                                label="Popular"
                                                score={job.matchDetails.collaborativeScore}
                                                maxScore={8}
                                            />
                                        )}
                                    </div>
                                )}

                            {/* Bonuses & Penalties Summary */}
                            <div className="flex flex-wrap gap-3 text-xs">
                                {job.matchDetails.historyBonus > 0 && (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                        +{job.matchDetails.historyBonus} history bonus
                                    </span>
                                )}
                                {job.matchDetails.environmentBonus > 2 && (
                                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                                        +{job.matchDetails.environmentBonus} environment fit
                                    </span>
                                )}
                                {job.matchDetails.profileTagsScore && job.matchDetails.profileTagsScore > 5 && (
                                    <span className="text-purple-600 dark:text-purple-400 font-medium">
                                        +{job.matchDetails.profileTagsScore} profile match
                                    </span>
                                )}
                                {job.matchDetails.salaryScore > 5 && (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                        +{job.matchDetails.salaryScore} salary match
                                    </span>
                                )}
                                {job.matchDetails.dataQualityPenalty > 0 && (
                                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                                        -{job.matchDetails.dataQualityPenalty} data quality
                                    </span>
                                )}
                                {job.matchDetails.dealBreakerPenalty > 0 && (
                                    <span className="text-red-600 dark:text-red-400 font-medium">
                                        -{job.matchDetails.dealBreakerPenalty} deal breaker
                                    </span>
                                )}
                                {job.matchDetails.sectorAvoidPenalty > 0 && (
                                    <span className="text-red-600 dark:text-red-400 font-medium">
                                        -{job.matchDetails.sectorAvoidPenalty} sector avoid
                                    </span>
                                )}
                                {job.matchDetails.domainMismatchPenalty && job.matchDetails.domainMismatchPenalty > 0 && (
                                    <span className="text-red-600 dark:text-red-400 font-medium">
                                        -{job.matchDetails.domainMismatchPenalty} domain mismatch
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Language Requirements Warning */}
            {job.languageRequirements && job.languageRequirements.length > 0 && (
                <div className="px-6 pb-4">
                    <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
                        ⚠️ Requires: {job.languageRequirements.map(l => l.charAt(0).toUpperCase() + l.slice(1)).join(', ')}
                    </div>
                </div>
            )}
        </div>
    );
}
