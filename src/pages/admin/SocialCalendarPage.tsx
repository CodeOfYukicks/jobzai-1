import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Calendar as CalendarIcon,
    Linkedin,
    MessageCircle,
    Copy,
    Edit,
    Trash2,
    Clock,
    Check,
    Send,
    X,
} from 'lucide-react';
import { useSocialPosts } from '../../hooks/useSocialPosts';
import { useSocialScheduler } from '../../hooks/useSocialScheduler';
import { publishSocialPost } from '../../services/socialPublisher';
import { SocialPost, SocialPlatform, PLATFORM_INFO } from '../../types/socialPost';
import { forceLightMode } from '../../lib/theme';

// ============================================
// HELPERS
// ============================================

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    // 0 = Sunday, 1 = Monday, ...
    const day = new Date(year, month, 1).getDay();
    // Convert to Monday-first (0 = Mon, 6 = Sun)
    return day === 0 ? 6 : day - 1;
}

function isSameDay(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function formatTime(date: Date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ============================================
// PLATFORM PILL
// ============================================

function PlatformPill({ platform, small = false }: { platform: SocialPlatform; small?: boolean }) {
    const info = PLATFORM_INFO[platform];
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-md font-medium ${small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'}`}
            style={{ backgroundColor: info.bgColor, color: info.color }}
        >
            {platform === 'linkedin' && <Linkedin size={small ? 10 : 12} />}
            {platform === 'twitter' && <span style={{ fontSize: small ? 9 : 11 }}>𝕏</span>}
            {platform === 'reddit' && <MessageCircle size={small ? 10 : 12} />}
            {!small && info.name}
        </span>
    );
}

function StatusDot({ status }: { status: string }) {
    const colors: Record<string, string> = {
        published: 'bg-emerald-500',
        draft: 'bg-amber-500',
        scheduled: 'bg-blue-500',
        failed: 'bg-red-500',
    };
    return <span className={`w-1.5 h-1.5 rounded-full ${colors[status] || colors.draft}`} />;
}

// ============================================
// POST CARD IN CALENDAR
// ============================================

function CalendarPostCard({
    post,
    onClick,
}: {
    post: SocialPost;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="w-full text-left px-2 py-1 rounded-md hover:bg-gray-50 transition-colors group flex items-center gap-1.5 truncate"
        >
            <StatusDot status={post.status} />
            <PlatformPill platform={post.platform} small />
            <span className="text-[11px] text-gray-600 truncate flex-1">
                {post.content.substring(0, 30)}
            </span>
        </button>
    );
}

// ============================================
// POST DETAIL PANEL
// ============================================

function PostDetailPanel({
    post,
    onClose,
    onEdit,
    onDelete,
    onCopy,
    onPublish,
    onSchedule,
}: {
    post: SocialPost;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onCopy: () => void;
    onPublish: () => void;
    onSchedule: (date: Date) => void;
}) {
    const info = PLATFORM_INFO[post.platform];
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('09:00');
    const [showScheduler, setShowScheduler] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleScheduleSubmit = () => {
        if (!scheduleDate) return;
        const [year, month, day] = scheduleDate.split('-').map(Number);
        const [hours, minutes] = scheduleTime.split(':').map(Number);
        const date = new Date(year, month - 1, day, hours, minutes);
        onSchedule(date);
        setShowScheduler(false);
    };

    const getPostDate = () => {
        if (post.scheduledAt) {
            const d = post.scheduledAt.toDate ? post.scheduledAt.toDate() : new Date(post.scheduledAt as any);
            return `Scheduled: ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${formatTime(d)}`;
        }
        if (post.publishedAt) {
            const d = post.publishedAt.toDate ? post.publishedAt.toDate() : new Date(post.publishedAt as any);
            return `Published: ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
        return 'Draft';
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden"
        >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <PlatformPill platform={post.platform} />
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${post.status === 'published' ? 'bg-emerald-50 text-emerald-700' :
                        post.status === 'scheduled' ? 'bg-blue-50 text-blue-700' :
                            'bg-amber-50 text-amber-700'
                        }`}>
                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </span>
                </div>
                <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                    <X size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="p-5">
                <p className="text-sm text-gray-500 mb-3">{getPostDate()}</p>
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                </div>
                {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {post.hashtags.map((tag, i) => (
                            <span key={i} className="text-xs px-2 py-1 rounded-md" style={{ backgroundColor: info.bgColor, color: info.color }}>
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
                <p className="text-xs text-gray-400 font-mono">{post.content.length} characters</p>
            </div>

            {/* Actions */}
            <div className="px-5 py-4 border-t border-gray-50 space-y-2">
                <div className="flex gap-2">
                    <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                        {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                        <Edit size={14} />
                        Edit
                    </button>
                    <button onClick={onDelete} className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                        <Trash2 size={14} />
                    </button>
                </div>

                {post.status === 'draft' && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowScheduler(!showScheduler)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                        >
                            <Clock size={14} />
                            Schedule
                        </button>
                        <button
                            onClick={onPublish}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all"
                        >
                            <Send size={14} />
                            Publish
                        </button>
                    </div>
                )}

                {post.status === 'scheduled' && (
                    <button
                        onClick={onPublish}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all"
                    >
                        <Send size={14} />
                        Publish Now
                    </button>
                )}

                {/* Schedule picker */}
                <AnimatePresence>
                    {showScheduler && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-2 space-y-2">
                                <input
                                    type="date"
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                />
                                <input
                                    type="time"
                                    value={scheduleTime}
                                    onChange={(e) => setScheduleTime(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                />
                                <button
                                    onClick={handleScheduleSubmit}
                                    disabled={!scheduleDate}
                                    className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    Confirm Schedule
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ============================================
// MAIN CALENDAR PAGE
// ============================================

export default function SocialCalendarPage() {
    useEffect(() => { forceLightMode(); }, []);

    const navigate = useNavigate();
    const { getAllPosts, deletePost } = useSocialPosts();
    const { schedulePost, markAsPublished } = useSocialScheduler();

    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
    const [loading, setLoading] = useState(true);

    // Delete modal
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const loadPosts = useCallback(async () => {
        setLoading(true);
        const data = await getAllPosts();
        setPosts(data);
        setLoading(false);
    }, []);

    useEffect(() => { loadPosts(); }, []);

    const navigateMonth = (delta: number) => {
        let newMonth = currentMonth + delta;
        let newYear = currentYear;
        if (newMonth < 0) { newMonth = 11; newYear--; }
        if (newMonth > 11) { newMonth = 0; newYear++; }
        setCurrentMonth(newMonth);
        setCurrentYear(newYear);
    };

    const goToToday = () => {
        setCurrentMonth(today.getMonth());
        setCurrentYear(today.getFullYear());
    };

    // Build calendar grid
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    // Get posts for a specific day
    const getPostsForDay = (day: number) => {
        const date = new Date(currentYear, currentMonth, day);
        return posts.filter((post) => {
            // Check scheduledAt
            if (post.scheduledAt) {
                const d = post.scheduledAt.toDate ? post.scheduledAt.toDate() : new Date(post.scheduledAt as any);
                if (isSameDay(d, date)) return true;
            }
            // Check publishedAt
            if (post.publishedAt) {
                const d = post.publishedAt.toDate ? post.publishedAt.toDate() : new Date(post.publishedAt as any);
                if (isSameDay(d, date)) return true;
            }
            // Check createdAt for drafts
            if (post.status === 'draft' && post.createdAt) {
                const d = post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt as any);
                if (isSameDay(d, date)) return true;
            }
            return false;
        });
    };

    const handleCopy = (post: SocialPost) => {
        let text = post.content;
        if (post.hashtags?.length > 0 && post.platform !== 'reddit') {
            text += '\n\n' + post.hashtags.map((h) => `#${h}`).join(' ');
        }
        navigator.clipboard.writeText(text);
    };

    const handlePublish = async (post: SocialPost) => {
        setLoading(true);
        try {
            // 1. Publish to API
            const result = await publishSocialPost(post);

            if (!result.success) {
                alert(`Failed to publish to ${PLATFORM_INFO[post.platform].name}: ${result.error}`);
                setLoading(false);
                return;
            }

            // 2. Update Firestore
            await markAsPublished(post.id, result.platformPostId);

            setSelectedPost(null);
            loadPosts();
        } catch (error) {
            console.error('Publish error:', error);
            alert('An unexpected error occurred while publishing.');
            setLoading(false);
        }
    };

    const handleSchedule = async (post: SocialPost, date: Date) => {
        await schedulePost(post.id, date);
        setSelectedPost(null);
        loadPosts();
    };

    const handleDelete = async () => {
        if (selectedPost) {
            await deletePost(selectedPost.id);
            setSelectedPost(null);
            setShowDeleteConfirm(false);
            loadPosts();
        }
    };

    // Stats
    const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;
    const publishedCount = posts.filter((p) => p.status === 'published').length;
    const draftCount = posts.filter((p) => p.status === 'draft').length;

    return (
        <div className="bg-[#FAFAFA] min-h-screen font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-[1400px] mx-auto px-6 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
                            <CalendarIcon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-gray-900 tracking-tight">Content Calendar</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/admin/content')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                            ← Dashboard
                        </button>
                        <button onClick={() => navigate('/admin/content/new')} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-200">
                            <Plus size={16} />
                            New Post
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-6 py-8">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                            {MONTH_NAMES[currentMonth]} {currentYear}
                        </h1>
                        <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                {scheduledCount} scheduled
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                {publishedCount} published
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                {draftCount} drafts
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={goToToday} className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            Today
                        </button>
                        <button onClick={() => navigateMonth(-1)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors">
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={() => navigateMonth(1)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex gap-6">
                    {/* Calendar Grid */}
                    <div className="flex-1">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Day headers */}
                            <div className="grid grid-cols-7 border-b border-gray-100">
                                {DAY_NAMES.map((day) => (
                                    <div key={day} className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Day cells */}
                            <div className="grid grid-cols-7">
                                {/* Empty cells before first day */}
                                {Array.from({ length: firstDay }).map((_, i) => (
                                    <div key={`empty-${i}`} className="min-h-[120px] border-b border-r border-gray-50 bg-gray-50/50" />
                                ))}

                                {/* Day cells */}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const dayPosts = getPostsForDay(day);
                                    const isToday = isSameDay(new Date(currentYear, currentMonth, day), today);

                                    return (
                                        <div
                                            key={day}
                                            className={`min-h-[120px] border-b border-r border-gray-50 p-2 transition-colors ${isToday ? 'bg-violet-50/30' : 'hover:bg-gray-50/50'
                                                }`}
                                        >
                                            <div className={`text-sm font-medium mb-1.5 ${isToday
                                                ? 'w-7 h-7 bg-violet-600 text-white rounded-full flex items-center justify-center'
                                                : 'text-gray-700 pl-1'
                                                }`}>
                                                {day}
                                            </div>
                                            <div className="space-y-0.5">
                                                {dayPosts.slice(0, 3).map((post) => (
                                                    <CalendarPostCard
                                                        key={post.id}
                                                        post={post}
                                                        onClick={() => setSelectedPost(post)}
                                                    />
                                                ))}
                                                {dayPosts.length > 3 && (
                                                    <p className="text-[10px] text-gray-400 pl-2">+{dayPosts.length - 3} more</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Detail Panel */}
                    <div className="w-[360px] shrink-0">
                        <AnimatePresence mode="wait">
                            {selectedPost ? (
                                <PostDetailPanel
                                    key={selectedPost.id}
                                    post={selectedPost}
                                    onClose={() => setSelectedPost(null)}
                                    onEdit={() => navigate(`/admin/content/edit/${selectedPost.id}`)}
                                    onDelete={() => setShowDeleteConfirm(true)}
                                    onCopy={() => handleCopy(selectedPost)}
                                    onPublish={() => handlePublish(selectedPost)}
                                    onSchedule={(date) => handleSchedule(selectedPost, date)}
                                />
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center"
                                >
                                    <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <CalendarIcon className="w-7 h-7 text-violet-400" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Select a Post</h3>
                                    <p className="text-sm text-gray-500">Click on a post in the calendar to view details, schedule, or publish.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && selectedPost && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowDeleteConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Post?</h3>
                            <p className="text-gray-500 text-sm text-center mb-6">This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleDelete} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors">
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
