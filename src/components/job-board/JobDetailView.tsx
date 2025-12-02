import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { CompanyLogo } from '../common/CompanyLogo';
import { Job } from '../../types/job-board';
import { Building2, MapPin, Clock, Share2, Bookmark, Heart, Sparkles, Target, Briefcase, GraduationCap, Code, AlertTriangle, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';
import { extractJobInfo, DetailedJobInfo } from '../../lib/jobExtractor';

interface JobDetailViewProps {
    job: Job | null;
}

export function JobDetailView({ job }: JobDetailViewProps) {
    const { currentUser } = useAuth();
    const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);

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

    const handleAddToWishlist = async () => {
        if (!currentUser) {
            toast.error('Please log in to add jobs to your wishlist');
            return;
        }

        if (!job) {
            toast.error('No job selected');
            return;
        }

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
                toast.error('This job is already in your applications');
                setIsAddingToWishlist(false);
                return;
            }

            // Create application immediately with basic info for fast feedback
            const basicApplication = {
                companyName: job.company,
                position: job.title,
                location: job.location,
                status: 'wishlist',
                appliedDate: new Date().toISOString().split('T')[0],
                url: job.applyUrl || '',
                description: '', // Will be filled by AI in background
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
                }]
            };

            // Add to Firestore immediately
            const docRef = await addDoc(applicationsRef, basicApplication);

            // Update UI state immediately for fast feedback
            setIsInWishlist(true);
            setIsAddingToWishlist(false);
            toast.success('Added to wishlist! 💜');

            // Run AI extraction in background (async, non-blocking)
            if (job.applyUrl) {
                // Show analyzing message
                toast.info('Analyzing job details...', { duration: 2000 });

                // Extract job info with AI asynchronously
                extractJobInfo(job.applyUrl, { detailed: true })
                    .then(async (extractedData) => {
                        const detailedData = extractedData as DetailedJobInfo;
                        // Format the summary for description - structured format with 3 bullet points
                        let formattedDescription = detailedData.summary;
                        if (formattedDescription) {
                            // Ensure proper formatting (unescape JSON escapes)
                            formattedDescription = formattedDescription
                                .replace(/\\n/g, '\n')
                                .replace(/\\"/g, '"')
                                .replace(/\\'/g, "'")
                                .trim();

                            // Ensure bullets are properly formatted (• or -)
                            if (!formattedDescription.includes('•') && !formattedDescription.includes('-')) {
                                const lines = formattedDescription.split('\n').filter((line: string) => line.trim().length > 0);
                                if (lines.length > 0) {
                                    formattedDescription = lines.map((line: string) => {
                                        const trimmed = line.trim();
                                        if (!trimmed.startsWith('•') && !trimmed.startsWith('-')) {
                                            return `• ${trimmed}`;
                                        }
                                        return trimmed;
                                    }).join('\n');
                                }
                            }
                        }

                        // Update the document with AI data
                        const { updateDoc, doc } = await import('firebase/firestore');
                        await updateDoc(doc(db, 'users', currentUser.uid, 'jobApplications', docRef.id), {
                            description: formattedDescription || '',
                            fullJobDescription: detailedData.fullJobDescription || job.description || '',
                            ...(detailedData.jobInsights && { jobInsights: detailedData.jobInsights }),
                            updatedAt: serverTimestamp()
                        });

                        toast.success('AI analysis complete! ✨', { duration: 2000 });
                    })
                    .catch((extractError) => {
                        console.error('Error extracting job info in background:', extractError);
                        // Silent fail - job is already added, just without AI enhancement
                    });
            }
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            setIsInWishlist(false); // Revert state on error
            toast.error('Failed to add to wishlist');
            setIsAddingToWishlist(false);
        }
    };

    if (!job) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-400 bg-white dark:bg-gray-900 h-full">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BriefcaseIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-500">Select a job to view details</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 h-full overflow-y-auto custom-scrollbar">
            <div className="p-8 max-w-4xl mx-auto w-full">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-start justify-between mb-6">
                        <div className="w-20 h-20 bg-white rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-2 flex items-center justify-center">
                            <CompanyLogo
                                companyName={job.company}
                                size="xl"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                                <Share2 className="w-5 h-5" />
                            </button>
                            <button className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                                <Bookmark className="w-5 h-5" />
                            </button>
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
                            onClick={() => window.open(job.applyUrl, '_blank')}
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

                {/* Match Score Breakdown V4.0 - Only show if job has match details */}
                {job.matchScore !== undefined && job.matchDetails && (
                    <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                job.matchScore >= 70 ? 'bg-emerald-500' :
                                job.matchScore >= 50 ? 'bg-blue-500' :
                                job.matchScore >= 35 ? 'bg-amber-500' : 'bg-gray-400'
                            }`}>
                                <span className="text-white font-bold text-lg">{job.matchScore}</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {job.matchScore >= 70 ? 'Excellent Match' :
                                     job.matchScore >= 50 ? 'Good Match' :
                                     job.matchScore >= 35 ? 'Partial Match' : 'Low Match'}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {job.roleFunction && job.roleFunction !== 'other' 
                                        ? `${job.roleFunction.charAt(0).toUpperCase() + job.roleFunction.slice(1)} role`
                                        : 'Based on your profile'}
                                </p>
                            </div>
                        </div>
                        
                        {/* Match Reasons */}
                        {job.matchReasons && job.matchReasons.length > 0 && (
                            <div className="mb-4 flex flex-wrap gap-2">
                                {job.matchReasons.map((reason, idx) => (
                                    <span 
                                        key={idx} 
                                        className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                                    >
                                        ✓ {reason}
                                    </span>
                                ))}
                            </div>
                        )}
                        
                        {/* Exclude Reasons (warnings) */}
                        {job.excludeReasons && job.excludeReasons.length > 0 && (
                            <div className="mb-4 flex flex-wrap gap-2">
                                {job.excludeReasons.map((reason, idx) => (
                                    <span 
                                        key={idx} 
                                        className="text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 flex items-center gap-1"
                                    >
                                        <AlertTriangle className="w-3 h-3" />
                                        {reason}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* V4.0 Score Grid - 6 columns */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            <MatchScoreItem 
                                icon={<Users className="w-4 h-4" />}
                                label="Role Fit" 
                                score={job.matchDetails.roleFunctionScore} 
                                maxScore={25}
                                canBeNegative={true}
                            />
                            <MatchScoreItem 
                                icon={<Code className="w-4 h-4" />}
                                label="Skills" 
                                score={job.matchDetails.skillsScore} 
                                maxScore={30}
                                canBeNegative={true}
                            />
                            <MatchScoreItem 
                                icon={<MapPin className="w-4 h-4" />}
                                label="Location" 
                                score={job.matchDetails.locationScore} 
                                maxScore={15}
                            />
                            <MatchScoreItem 
                                icon={<GraduationCap className="w-4 h-4" />}
                                label="Level" 
                                score={job.matchDetails.experienceScore} 
                                maxScore={10}
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
                        
                        {/* Bonuses & Penalties Summary */}
                        <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-700 flex flex-wrap gap-3 text-xs">
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
                        </div>
                        
                        {/* Language Requirements Warning */}
                        {job.languageRequirements && job.languageRequirements.length > 0 && (
                            <div className="mt-3 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                                ⚠️ Requires: {job.languageRequirements.map(l => l.charAt(0).toUpperCase() + l.slice(1)).join(', ')}
                            </div>
                        )}
                    </div>
                )}

                <div className="h-px bg-gray-100 dark:bg-gray-800 mb-8" />

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
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
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

function MatchScoreItem({ icon, label, score, maxScore, canBeNegative = false }: { 
    icon: React.ReactNode, 
    label: string, 
    score: number, 
    maxScore: number,
    canBeNegative?: boolean
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
        <div className={`flex flex-col items-center p-2 rounded-xl ${
            isNegative ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white/50 dark:bg-gray-800/50'
        }`}>
            <div className={`mb-1 ${isNegative ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                {icon}
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</div>
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${getColor(percentage, isNegative)} rounded-full transition-all duration-500`}
                    style={{ width: `${isNegative ? 100 : percentage}%` }}
                />
            </div>
            <div className={`text-xs font-bold mt-1 ${
                isNegative ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
            }`}>
                {isNegative ? `-${displayScore}` : `${score}/${maxScore}`}
            </div>
        </div>
    );
}
