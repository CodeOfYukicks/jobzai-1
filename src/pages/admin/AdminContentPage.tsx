import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Edit,
    Trash2,
    Copy,
    FileText,
    CheckCircle,
    Clock,
    Search,
    Linkedin,
    MessageCircle,
    Hash,
    Sparkles,
    Calendar,
    Settings,
} from 'lucide-react';
import SocialSettingsModal from '../../components/admin/SocialSettingsModal';
import { useSocialPosts } from '../../hooks/useSocialPosts';
import { SocialPost, SocialPlatform, PLATFORM_INFO } from '../../types/socialPost';
import { forceLightMode } from '../../lib/theme';

// Platform icon component
function PlatformIcon({ platform, size = 16 }: { platform: SocialPlatform; size?: number }) {
    const info = PLATFORM_INFO[platform];
    return (
        <span
            className="inline-flex items-center justify-center rounded-md font-bold"
            style={{
                backgroundColor: info.bgColor,
                color: info.color,
                width: size + 12,
                height: size + 12,
                fontSize: size - 2,
            }}
        >
            {platform === 'linkedin' && <Linkedin size={size} />}
            {platform === 'twitter' && <span style={{ fontSize: size }}>𝕏</span>}
            {platform === 'reddit' && <MessageCircle size={size} />}
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
        published: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Published' },
        draft: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Draft' },
        scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Scheduled' },
        failed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Failed' },
    };
    const c = config[status] || config.draft;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text} border border-current/10`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-sm text-gray-500 font-medium">{label}</div>
            </div>
        </div>
    );
}

export default function AdminContentPage() {
    useEffect(() => { forceLightMode(); }, []);

    const navigate = useNavigate();
    const { getAllPosts, deletePost, loading } = useSocialPosts();
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<SocialPost[]>([]);
    const [activeFilter, setActiveFilter] = useState<'all' | SocialPlatform>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, linkedin: 0, twitter: 0, reddit: 0 });

    // Delete modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [postToDelete, setPostToDelete] = useState<SocialPost | null>(null);

    // Settings modal
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    useEffect(() => { loadPosts(); }, []);

    useEffect(() => {
        let result = posts;
        if (activeFilter !== 'all') {
            result = result.filter((p) => p.platform === activeFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter((p) => p.content.toLowerCase().includes(q));
        }
        setFilteredPosts(result);
    }, [posts, activeFilter, searchQuery]);

    const loadPosts = async () => {
        const data = await getAllPosts();
        setPosts(data);
        setStats({
            total: data.length,
            published: data.filter((p) => p.status === 'published').length,
            drafts: data.filter((p) => p.status === 'draft').length,
            linkedin: data.filter((p) => p.platform === 'linkedin').length,
            twitter: data.filter((p) => p.platform === 'twitter').length,
            reddit: data.filter((p) => p.platform === 'reddit').length,
        });
    };

    const handleDelete = (post: SocialPost) => {
        setPostToDelete(post);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (postToDelete) {
            await deletePost(postToDelete.id);
            loadPosts();
            setPostToDelete(null);
            setShowDeleteModal(false);
        }
    };

    const handleCopyContent = (content: string) => {
        navigator.clipboard.writeText(content);
        // Could add a toast notification here
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '—';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return '—';
        }
    };

    const truncateContent = (content: string, maxLength = 80) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    const platformTabs: { key: 'all' | SocialPlatform; label: string; count: number }[] = [
        { key: 'all', label: 'All', count: stats.total },
        { key: 'linkedin', label: 'LinkedIn', count: stats.linkedin },
        { key: 'twitter', label: 'Twitter / X', count: stats.twitter },
        { key: 'reddit', label: 'Reddit', count: stats.reddit },
    ];

    return (
        <div className="bg-[#FAFAFA] min-h-screen font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-gray-900 tracking-tight">Social Studio</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/content/calendar')}
                            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <Calendar className="w-4 h-4" />
                            Calendar
                        </button>
                        <button
                            onClick={() => setShowSettingsModal(true)}
                            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            Settings
                        </button>
                        <div className="w-px h-4 bg-gray-200" />
                        <button
                            onClick={() => navigate('/admin/blog')}
                            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Blog CMS
                        </button>
                        <div className="w-px h-4 bg-gray-200" />
                        <button
                            onClick={() => navigate('/')}
                            className="text-sm text-gray-500 hover:text-black transition-colors"
                        >
                            Exit to Site
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Hero / Actions */}
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">Social Content</h1>
                        <p className="text-gray-500">Create, manage and publish content across platforms.</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/content/new')}
                        className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                        <span className="font-medium">Create Post</span>
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard icon={FileText} label="Total Posts" value={stats.total} color="bg-gray-50 text-gray-600" />
                    <StatCard icon={CheckCircle} label="Published" value={stats.published} color="bg-emerald-50 text-emerald-600" />
                    <StatCard icon={Clock} label="Drafts" value={stats.drafts} color="bg-amber-50 text-amber-600" />
                    <StatCard icon={Hash} label="Platforms" value={`${stats.linkedin > 0 ? 'Li ' : ''}${stats.twitter > 0 ? 'X ' : ''}${stats.reddit > 0 ? 'Rd' : ''}`.trim() || '—'} color="bg-violet-50 text-violet-600" />
                </div>

                {/* Platform Filter Tabs */}
                <div className="flex items-center gap-1 mb-6 bg-white rounded-xl border border-gray-100 p-1.5 w-fit shadow-sm">
                    {platformTabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveFilter(tab.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeFilter === tab.key
                                ? 'bg-gray-900 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            {tab.label}
                            <span className={`ml-1.5 text-xs ${activeFilter === tab.key ? 'text-gray-300' : 'text-gray-400'}`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Content Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">All Posts</h3>
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search content..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm text-gray-700 focus:ring-0 w-64"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-20 flex justify-center">
                            <div className="animate-spin w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full" />
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-8 h-8 text-violet-300" />
                            </div>
                            <h3 className="text-gray-900 font-medium mb-1">No posts yet</h3>
                            <p className="text-gray-500 text-sm mb-4">Create your first social media post with AI.</p>
                            <button
                                onClick={() => navigate('/admin/content/new')}
                                className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                            >
                                Create Post
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-50">
                                    <th className="px-6 py-4 font-medium w-16">Platform</th>
                                    <th className="px-6 py-4 font-medium">Content</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Chars</th>
                                    <th className="px-6 py-4 font-medium">Created</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredPosts.map((post) => (
                                    <tr key={post.id} className="group hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            <PlatformIcon platform={post.platform} />
                                        </td>
                                        <td className="px-6 py-4 max-w-md">
                                            <div className="text-sm text-gray-900 font-medium leading-snug">
                                                {truncateContent(post.content)}
                                            </div>
                                            {post.hashtags && post.hashtags.length > 0 && (
                                                <div className="flex gap-1 mt-1.5 flex-wrap">
                                                    {post.hashtags.slice(0, 3).map((tag, i) => (
                                                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-mono">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                    {post.hashtags.length > 3 && (
                                                        <span className="text-[10px] text-gray-400">+{post.hashtags.length - 3}</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={post.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-500 font-mono">{post.characterCount || post.content.length}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                            {formatDate(post.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleCopyContent(post.content)}
                                                    className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                                                    title="Copy content"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/admin/content/edit/${post.id}`)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(post)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && postToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowDeleteModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Post?</h3>
                            <p className="text-gray-500 text-sm text-center mb-6">
                                This will permanently delete this {PLATFORM_INFO[postToDelete.platform].name} post. This action cannot be undone.
                            </p>
                            <div className="bg-gray-50 rounded-lg p-3 mb-6">
                                <p className="text-xs text-gray-600 line-clamp-2">{truncateContent(postToDelete.content, 120)}</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Settings Modal */}
            <SocialSettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
            />
        </div>
    );
}
