import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import {
    Building2,
    MapPin,
    Clock,
    Share2,
    Bookmark,
    Heart,
    ExternalLink,
    Briefcase,
    DollarSign,
    Globe,
    GraduationCap,
    Link2,
    Linkedin,
    Mail,
    MessageCircle,
    X,
    ChevronUp,
    ChevronDown,
    Sparkles,
} from 'lucide-react';
import { CompanyLogo } from '../common/CompanyLogo';
import { Job } from '../../types/job-board';
import { useAuth } from '../../contexts/AuthContext';
import { notify } from '@/lib/notify';
import { useJobInteractions } from '../../hooks/useJobInteractions';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { generateJobSummaryAndInsights, generateBasicInsightsFromJobData, generateBasicSummaryFromJobData, JobDataForFallback } from '../../lib/jobExtractor';
import { KanbanBoard } from '../../types/job';

// Snap point types and constants
type SnapPoint = 'peek' | 'half' | 'full';

const SNAP_POINTS: Record<SnapPoint, number> = {
    peek: 30,
    half: 60,
    full: 100,
};

// Thresholds for snapping (as vh)
const SNAP_THRESHOLDS = {
    peekToHalf: 45,  // If dragged above 45vh, snap to half
    halfToFull: 80,  // If dragged above 80vh, snap to full
};

interface JobBottomSheetProps {
    job: Job | null;
    isOpen: boolean;
    onClose: () => void;
    onApply?: (job: Job) => void;
    onSave?: (jobId: string) => void;
}

/**
 * Premium mobile bottom sheet for job details with 3 snap points.
 * 
 * Inspired by Airbnb, Apple Maps, and Notion mobile patterns.
 * Features:
 * - 3 snap points: Peek (30%), Half (60%), Full (100%)
 * - Spring-based drag gestures
 * - Content adapts to each snap level
 * - Sticky Apply button at full height
 * - Accessibility support (ESC, focus trap, ARIA)
 */
export default function JobBottomSheet({
    job,
    isOpen,
    onClose,
    onApply,
    onSave,
}: JobBottomSheetProps) {
    const { currentUser } = useAuth();
    const { isJobSaved, toggleSave, trackApply } = useJobInteractions();

    const [snapPoint, setSnapPoint] = useState<SnapPoint>('peek');
    const [showShareMenu, setShowShareMenu] = useState(false);
    const shareMenuRef = useRef<HTMLDivElement>(null);
    const sheetRef = useRef<HTMLDivElement>(null);

    // Wishlist / Application State
    const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [boards, setBoards] = useState<KanbanBoard[]>([]);

    const y = useMotionValue(0);
    const backdropOpacity = useTransform(y, [0, 300], [1, 0]);

    // Reset snap point when opening
    useEffect(() => {
        if (isOpen) {
            setSnapPoint('peek');
        }
    }, [isOpen]);

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Check if job is already in wishlist (applications)
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

        if (isOpen) {
            checkWishlistStatus();
        }
    }, [currentUser, job, isOpen]);

    // Fetch user's boards
    useEffect(() => {
        const fetchBoards = async () => {
            if (!currentUser) return;
            try {
                const boardsRef = collection(db, 'users', currentUser.uid, 'boards');
                const boardsQuery = query(boardsRef, orderBy('createdAt', 'asc'));
                const snapshot = await getDocs(boardsQuery);

                const allBoards = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as KanbanBoard[];

                const jobBoards = allBoards.filter(board =>
                    !board.boardType || board.boardType === 'jobs'
                );
                setBoards(jobBoards);
            } catch (error) {
                console.error('Error fetching boards:', error);
            }
        };
        fetchBoards();
    }, [currentUser]);

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

    // Handle drag end with snap logic
    const handleDragEnd = useCallback(
        (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            const velocity = info.velocity.y;
            const offset = info.offset.y;

            // Calculate current position as percentage of viewport
            const currentHeight = SNAP_POINTS[snapPoint];
            const draggedVh = (offset / window.innerHeight) * 100;
            const newHeight = currentHeight - draggedVh;

            // High velocity gestures
            if (velocity < -500) {
                // Fast swipe up
                if (snapPoint === 'peek') setSnapPoint('half');
                else if (snapPoint === 'half') setSnapPoint('full');
                return;
            }

            if (velocity > 500) {
                // Fast swipe down
                if (snapPoint === 'full') setSnapPoint('half');
                else if (snapPoint === 'half') setSnapPoint('peek');
                else onClose();
                return;
            }

            // Position-based snapping
            if (newHeight < 20) {
                onClose();
            } else if (newHeight < SNAP_THRESHOLDS.peekToHalf) {
                setSnapPoint('peek');
            } else if (newHeight < SNAP_THRESHOLDS.halfToFull) {
                setSnapPoint('half');
            } else {
                setSnapPoint('full');
            }
        },
        [snapPoint, onClose]
    );

    // Handle share
    const handleShare = (platform: 'copy' | 'linkedin' | 'twitter' | 'whatsapp' | 'email') => {
        if (!job) return;

        const shareUrl = job.applyUrl || window.location.href;
        const shareText = `${job.title} at ${job.company}`;

        switch (platform) {
            case 'copy':
                navigator.clipboard.writeText(shareUrl);
                notify.success('Link copied!');
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
                window.location.href = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent('Check out this job: ' + shareUrl)}`;
                break;
        }
        setShowShareMenu(false);
    };

    // Handle apply click
    const handleApply = () => {
        if (!job) return;
        trackApply(job.id, { matchScore: job.matchScore });
        if (onApply) {
            onApply(job);
        } else {
            window.open(job.applyUrl, '_blank');
        }
    };

    // Handle save
    // Core function to add job to wishlist (create application)
    const handleAddToWishlist = async () => {
        if (!currentUser) {
            notify.error('Please log in to add jobs to your wishlist');
            return;
        }
        if (!job) return;

        // Use first board or undefined if no boards
        const targetBoardId = boards.length > 0 ? boards[0].id : undefined;

        try {
            setIsAddingToWishlist(true);

            // Double check if already exists
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

            // Prepare job data
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

            // Create basic application
            const basicApplication = {
                companyName: job.company,
                position: job.title,
                location: job.location,
                status: 'wishlist',
                appliedDate: new Date().toISOString().split('T')[0],
                url: job.applyUrl || '',
                description: '',
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
                ...(targetBoardId && { boardId: targetBoardId })
            };

            // Add to Firestore
            const docRef = await addDoc(applicationsRef, basicApplication);

            setIsInWishlist(true);
            setIsAddingToWishlist(false);
            notify.success('Added to wishlist! 💜');

            // Background AI Analysis
            try {
                const result = await generateJobSummaryAndInsights(jobDataForAnalysis);

                const { updateDoc, doc } = await import('firebase/firestore');
                await updateDoc(doc(db, 'users', currentUser.uid, 'jobApplications', docRef.id), {
                    description: result.summary,
                    jobInsights: result.jobInsights,
                    ...(result.jobTags && { jobTags: result.jobTags }),
                    updatedAt: serverTimestamp()
                });
            } catch (aiError) {
                console.error('AI analysis failed, using fallback:', aiError);
                const localSummary = generateBasicSummaryFromJobData(jobDataForAnalysis);
                const localInsights = generateBasicInsightsFromJobData(jobDataForAnalysis);

                const { updateDoc, doc } = await import('firebase/firestore');
                await updateDoc(doc(db, 'users', currentUser.uid, 'jobApplications', docRef.id), {
                    description: localSummary,
                    jobInsights: localInsights,
                    _fallbackUsed: true,
                    updatedAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            setIsInWishlist(false);
            notify.error('Failed to add to wishlist');
            setIsAddingToWishlist(false);
        }
    };

    // Get snap height as animated value
    const getSnapHeight = () => `${SNAP_POINTS[snapPoint]}vh`;

    if (!job) return null;

    // Use isInWishlist instead of isSaved for the UI state of the wishlist button
    const showMetadata = snapPoint === 'half' || snapPoint === 'full';
    const showFullContent = snapPoint === 'full';

    // Match score colors
    const getMatchScoreColor = (score: number) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 60) return 'bg-blue-500';
        if (score >= 40) return 'bg-amber-500';
        return 'bg-gray-400';
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop with blur and dim */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ opacity: backdropOpacity }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
                        aria-hidden="true"
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        ref={sheetRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="job-sheet-title"
                        initial={{ y: '100%' }}
                        animate={{
                            y: 0,
                            height: getSnapHeight(),
                        }}
                        exit={{ y: '100%' }}
                        transition={{
                            type: 'spring',
                            damping: 30,
                            stiffness: 400,
                        }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0.1, bottom: 0.5 }}
                        onDragEnd={handleDragEnd}
                        style={{ y }}
                        className="fixed bottom-0 left-0 right-0 z-[101] 
                            bg-white dark:bg-[#242325] 
                            rounded-t-3xl shadow-2xl
                            overflow-hidden flex flex-col
                            safe-bottom"
                    >
                        {/* Drag Handle */}
                        <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none flex-shrink-0">
                            <div className="w-10 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto overscroll-contain px-5">

                            {/* === PEEK LEVEL (30%) === */}
                            {/* Always visible: Title, Company, Location, Apply CTA */}
                            <div className="pb-4">
                                {/* Header with logo */}
                                <div className="flex items-start gap-4 mb-4">
                                    <CompanyLogo
                                        companyName={job.company}
                                        size="xl"
                                        className="flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h2
                                            id="job-sheet-title"
                                            className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight"
                                        >
                                            {job.title}
                                        </h2>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-0.5">
                                            {job.company}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span>{job.location}</span>
                                            {job.published && (
                                                <>
                                                    <span className="text-gray-300 dark:text-gray-600">•</span>
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>{job.published}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Match Score Badge */}
                                    {job.matchScore !== undefined && (
                                        <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${getMatchScoreColor(job.matchScore)}`}>
                                            <span className="text-white font-bold text-sm">{job.matchScore}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Primary Actions - Split 50/50 */}
                                <div className="flex gap-3">
                                    {/* Wishlist Button */}
                                    <button
                                        onClick={handleAddToWishlist}
                                        disabled={isAddingToWishlist || isInWishlist}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-base transition-all active:scale-[0.98] ${isInWishlist
                                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                                            : 'bg-gray-100 dark:bg-[#3d3c3e] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#4a494b]'
                                            }`}
                                    >
                                        {isAddingToWishlist ? (
                                            <Sparkles className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Bookmark className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
                                        )}
                                        {isInWishlist ? 'Added' : 'Wishlist'}
                                    </button>

                                    {/* Apply Button */}
                                    <button
                                        onClick={handleApply}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white px-6 py-3.5 rounded-xl font-semibold text-base shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                        Apply
                                    </button>
                                </div>

                                {/* Expand hint at peek level */}
                                {snapPoint === 'peek' && (
                                    <button
                                        onClick={() => setSnapPoint('half')}
                                        className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-gray-400 dark:text-gray-500"
                                    >
                                        <ChevronUp className="w-4 h-4" />
                                        <span>Swipe up for more details</span>
                                    </button>
                                )}
                            </div>

                            {/* === HALF LEVEL (60%) === */}
                            {/* Metadata grid + Save/Share actions */}
                            {showMetadata && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="border-t border-gray-100 dark:border-[#3d3c3e] pt-4 pb-4"
                                >
                                    {/* Metadata Grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        {job.salaryRange && (
                                            <MetadataCard
                                                icon={<DollarSign className="w-4 h-4" />}
                                                label="Salary"
                                                value={job.salaryRange}
                                            />
                                        )}
                                        {job.type && (
                                            <MetadataCard
                                                icon={<Briefcase className="w-4 h-4" />}
                                                label="Type"
                                                value={job.type}
                                            />
                                        )}
                                        {job.seniority && (
                                            <MetadataCard
                                                icon={<GraduationCap className="w-4 h-4" />}
                                                label="Level"
                                                value={job.seniority}
                                            />
                                        )}
                                        {job.remote && (
                                            <MetadataCard
                                                icon={<Globe className="w-4 h-4" />}
                                                label="Remote"
                                                value={job.remote}
                                            />
                                        )}
                                    </div>

                                    {/* Action Buttons Row */}
                                    <div className="flex gap-3">
                                        {/* Save Button (Wishlist) */}
                                        <button
                                            onClick={handleAddToWishlist}
                                            disabled={isAddingToWishlist || isInWishlist}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all active:scale-[0.98] ${isInWishlist
                                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                                                    : 'bg-gray-100 dark:bg-[#3d3c3e] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#4a494b]'
                                                }`}
                                        >
                                            <Bookmark className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
                                            {isInWishlist ? 'Added' : 'Wishlist'}
                                        </button>

                                        {/* Share Button with Dropdown */}
                                        <div ref={shareMenuRef} className="relative flex-1">
                                            <button
                                                onClick={() => setShowShareMenu(!showShareMenu)}
                                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm bg-gray-100 dark:bg-[#3d3c3e] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#4a494b] transition-all active:scale-[0.98]"
                                            >
                                                <Share2 className="w-4 h-4" />
                                                Share
                                            </button>

                                            {/* Share Menu Dropdown */}
                                            <AnimatePresence>
                                                {showShareMenu && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-[#2b2a2c] rounded-xl shadow-lg border border-gray-200 dark:border-[#3d3c3e] overflow-hidden z-50"
                                                    >
                                                        <div className="py-1">
                                                            <ShareButton icon={<Link2 className="w-4 h-4" />} label="Copy link" onClick={() => handleShare('copy')} />
                                                            <ShareButton icon={<Linkedin className="w-4 h-4 text-[#0A66C2]" />} label="LinkedIn" onClick={() => handleShare('linkedin')} />
                                                            <ShareButton icon={<MessageCircle className="w-4 h-4 text-[#25D366]" />} label="WhatsApp" onClick={() => handleShare('whatsapp')} />
                                                            <ShareButton icon={<Mail className="w-4 h-4" />} label="Email" onClick={() => handleShare('email')} />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Expand hint at half level */}
                                    {snapPoint === 'half' && (
                                        <button
                                            onClick={() => setSnapPoint('full')}
                                            className="w-full mt-4 flex items-center justify-center gap-1 text-xs text-gray-400 dark:text-gray-500"
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                            <span>View full description</span>
                                        </button>
                                    )}
                                </motion.div>
                            )}

                            {/* === FULL LEVEL (100%) === */}
                            {/* Full job description with sections */}
                            {showFullContent && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: 0.1 }}
                                    className="border-t border-gray-100 dark:border-[#3d3c3e] pt-4 pb-24"
                                >
                                    {/* Skills/Tags */}
                                    {job.tags && job.tags.length > 0 && (
                                        <div className="mb-4">
                                            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                                Skills & Technologies
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {job.tags.slice(0, 10).map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Job Description */}
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                            About this role
                                        </h3>
                                        <div className="prose dark:prose-invert prose-sm max-w-none text-gray-600 dark:text-gray-300 leading-relaxed">
                                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                                {job.description || 'No description available.'}
                                            </ReactMarkdown>
                                        </div>
                                    </div>

                                    {/* Collapse hint */}
                                    <button
                                        onClick={() => setSnapPoint('half')}
                                        className="w-full mt-6 flex items-center justify-center gap-1 text-xs text-gray-400 dark:text-gray-500"
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                        <span>Collapse</span>
                                    </button>
                                </motion.div>
                            )}
                        </div>

                        {/* Sticky Apply Footer (Full mode only) */}
                        {showFullContent && (
                            <div className="sticky bottom-0 px-5 py-4 bg-white dark:bg-[#242325] border-t border-gray-100 dark:border-[#3d3c3e] safe-bottom flex-shrink-0">
                                <button
                                    onClick={handleApply}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white px-6 py-3.5 rounded-xl font-semibold text-base shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                    Apply Now
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Helper component for metadata cards
function MetadataCard({
    icon,
    label,
    value
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    // Format value for display
    const formatValue = (val: string) => {
        const specialCases: Record<string, string> = {
            'full-time': 'Full-time',
            'part-time': 'Part-time',
            'on-site': 'On-site',
            'remote': 'Remote',
            'hybrid': 'Hybrid',
        };
        const lower = val.toLowerCase();
        return specialCases[lower] || val.charAt(0).toUpperCase() + val.slice(1);
    };

    return (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-[#2b2a2c]/50 border border-gray-100 dark:border-[#3d3c3e]">
            <div className="text-gray-400 dark:text-gray-500">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    {label}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {formatValue(value)}
                </p>
            </div>
        </div>
    );
}

// Helper component for share buttons
function ShareButton({
    icon,
    label,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#3d3c3e] transition-colors active:bg-gray-100 dark:active:bg-[#4a494b]"
        >
            {icon}
            {label}
        </button>
    );
}
