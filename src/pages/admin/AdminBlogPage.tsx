import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, FileText, CheckCircle, Clock, TrendingUp, Search, Globe, Calendar as CalendarIcon, LayoutGrid, ChevronLeft, ChevronRight, ChevronDown, Zap } from 'lucide-react';
import { useBlogPosts } from '../../hooks/useBlogPosts';
import { BlogPost } from '../../data/blogPosts';
import DeleteBlogPostModal from '../../components/blog/DeleteBlogPostModal';
import { generateSEOCoverImage, generateNewsArticle, generateSEOArticle, suggestRandomCareerTopic } from '../../services/blogAI';
import { getTrendingTopics, findTrendingNews } from '../../services/perplexity';
import CreateNewsModal from '../../components/blog/CreateNewsModal';
import CreateStandardArticleModal from '../../components/blog/CreateStandardArticleModal';
import CreateMagicArticleModal from '../../components/blog/CreateMagicArticleModal';
import { forceLightMode } from '../../lib/theme';
import { Timestamp } from 'firebase/firestore';

// ============================================
// CALENDAR HELPERS
// ============================================
function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // 0 = Mon, 6 = Sun
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const isPostLive = (post: any) => {
    if (post.status === 'published') return true;
    if (post.status === 'scheduled' && post.scheduledAt) {
        let timeMs = 0;
        if (typeof post.scheduledAt.toMillis === 'function') timeMs = post.scheduledAt.toMillis();
        else if (post.scheduledAt.seconds != null) timeMs = post.scheduledAt.seconds * 1000;
        else if (post.scheduledAt instanceof Date) timeMs = post.scheduledAt.getTime();
        else if (typeof post.scheduledAt === 'number') timeMs = post.scheduledAt;
        else if (typeof post.scheduledAt === 'string') timeMs = new Date(post.scheduledAt).getTime();

        return timeMs > 0 && timeMs <= Date.now();
    }
    return false;
};

export default function AdminBlogPage() {
    // Force light mode for admin pages
    useEffect(() => {
        forceLightMode();
    }, []);
    const navigate = useNavigate();
    const { getAllPosts, deletePost, createPost, updatePost, uploadImage, loading } = useBlogPosts();
    const [posts, setPosts] = useState<(BlogPost & { status: string, scheduledAt?: any })[]>([]);
    const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, views: 0 });
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showCreateMenu, setShowCreateMenu] = useState(false);

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [postToDelete, setPostToDelete] = useState<{ id: string; title: string } | null>(null);

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        const data = await getAllPosts();
        setPosts(data);

        // Calculate stats
        const published = data.filter(p => isPostLive(p)).length;
        const drafts = data.filter(p => !isPostLive(p)).length;
        // Sum actual views from all posts (views field in Firestore if it exists)
        const totalViews = data.reduce((sum, post) => sum + ((post as any).views || 0), 0);
        setStats({
            total: data.length,
            published,
            drafts,
            views: totalViews
        });
    };

    // Open delete confirmation modal
    const handleDelete = (id: string, title: string) => {
        setPostToDelete({ id, title });
        setShowDeleteModal(true);
    };

    // Confirm and execute delete
    const confirmDelete = async () => {
        if (postToDelete) {
            await deletePost(postToDelete.id);
            loadPosts();
            setPostToDelete(null);
        }
    };



    // New: News Article Generation
    const [showNewsModal, setShowNewsModal] = useState(false);
    const [isNewsGenerating, setIsNewsGenerating] = useState(false);

    // New: Standard Article Generation
    const [showStandardModal, setShowStandardModal] = useState(false);
    const [isStandardGenerating, setIsStandardGenerating] = useState(false);

    // New: Magic AutoPilot Generation
    const [showMagicModal, setShowMagicModal] = useState(false);

    const handleMagicGenerate = async (type: 'standard' | 'news', language: 'fr' | 'en', publishMode: 'publish' | 'draft' | 'schedule', scheduledAt?: Date) => {
        try {
            let articleResponse;
            let finalKeywords: string[] = [];

            if (type === 'standard') {
                // 1. Brainstorm Topic
                const topic = await suggestRandomCareerTopic(language);
                finalKeywords = ['carrière', 'tendance', 'emploi']; // Fallback

                // 2. Generate Standard Article
                articleResponse = await generateSEOArticle({
                    topic,
                    targetKeywords: finalKeywords,
                    targetAudience: 'general',
                    articleLength: 'medium',
                    language,
                    tone: 'professional'
                });
            } else {
                // 1. Fetch Trending News
                const trends = await getTrendingTopics('fr'); // Force FR for topics for now, or match language if better
                const topTrend = trends[0] || "Les nouvelles tendances de l'emploi";

                // 2. Search Web Context
                const searchResults = await findTrendingNews(topTrend);
                finalKeywords = ['actualité', 'RH'];

                // 3. Generate News Article
                articleResponse = await generateNewsArticle({
                    topic: topTrend,
                    targetKeywords: finalKeywords,
                    targetAudience: 'general',
                    articleLength: 'medium',
                    language,
                    tone: 'professional'
                }, searchResults);
            }

            // 4. Generate Image
            let imageUrl = '';
            try {
                const generatedImage = await generateSEOCoverImage(articleResponse.title, finalKeywords);
                if (generatedImage) imageUrl = generatedImage;
            } catch (err) {
                console.warn('Magic image gen failed', err);
            }

            // 5. Save Post
            const wordCount = articleResponse.content.split(/\s+/).filter(Boolean).length;
            const readTime = Math.max(1, Math.ceil(wordCount / 200));

            let statusToSave = 'draft';
            if (publishMode === 'publish') statusToSave = 'published';
            if (publishMode === 'schedule' && scheduledAt) statusToSave = 'scheduled';

            const postData: any = {
                title: articleResponse.title,
                slug: articleResponse.slug,
                excerpt: articleResponse.excerpt,
                content: articleResponse.content,
                category: type === 'news' ? 'News' : 'Conseils & Carrière',
                author: 'Team Cubbbe',
                image: imageUrl,
                readTime: `${readTime} min read`,
                status: statusToSave,
                date: scheduledAt ? scheduledAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            };

            if (scheduledAt) {
                postData.scheduledAt = Timestamp.fromDate(scheduledAt);
            }

            const postId = await createPost(postData);
            await loadPosts();
            return { id: postId, title: articleResponse.title };

        } catch (error) {
            console.error('Magic Generation Error:', error);
            alert('L\'AutoPilot a rencontré une erreur.');
            return null;
        }
    };

    const handleStandardGenerate = async (configData: any, publishMode: 'publish' | 'draft' | 'schedule', scheduledAt?: Date) => {
        setIsStandardGenerating(true);
        try {
            // 1. Generate Article
            const article = await generateSEOArticle(configData);

            // 2. Generate Cover Image
            let imageUrl = '';
            try {
                const generatedImage = await generateSEOCoverImage(article.title, configData.targetKeywords);
                if (generatedImage) {
                    imageUrl = generatedImage;
                }
            } catch (imgError) {
                console.warn('Image generation failed:', imgError);
            }

            // 3. Create Post
            const wordCount = article.content.split(/\s+/).filter(Boolean).length;
            const readTime = Math.max(1, Math.ceil(wordCount / 200));

            let statusToSave = 'draft';
            if (publishMode === 'publish') statusToSave = 'published';
            if (publishMode === 'schedule' && scheduledAt) statusToSave = 'scheduled';

            const postData: any = {
                title: article.title,
                slug: article.slug,
                excerpt: article.excerpt,
                content: article.content, // Markdown
                category: 'Conseils & Carrière', // Better default for standard
                author: 'Team Cubbbe',
                image: imageUrl,
                readTime: `${readTime} min read`,
                status: statusToSave,
                date: scheduledAt ? scheduledAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            };

            if (scheduledAt) {
                postData.scheduledAt = Timestamp.fromDate(scheduledAt);
            }

            const postId = await createPost(postData);

            await loadPosts();
            return { id: postId, title: article.title };

        } catch (error) {
            console.error('Standard generation error:', error);
            alert('Failed to generate standard article.');
            return null;
        } finally {
            setIsStandardGenerating(false);
        }
    };

    const handleNewsGenerate = async (configData: any, newsContext: string, publishMode: 'publish' | 'draft' | 'schedule', scheduledAt?: Date) => {
        setIsNewsGenerating(true);
        try {
            // 1. Generate Article with News Context
            const article = await generateNewsArticle(configData, newsContext);

            // 2. Generate Cover Image
            let imageUrl = '';
            try {
                const generatedImage = await generateSEOCoverImage(article.title, configData.targetKeywords);
                if (generatedImage) {
                    imageUrl = generatedImage;
                }
            } catch (imgError) {
                console.warn('Image generation failed:', imgError);
            }

            // 3. Create Post
            const wordCount = article.content.split(/\s+/).filter(Boolean).length;
            const readTime = Math.max(1, Math.ceil(wordCount / 200));

            // Determine status based on explicit publish mode
            let statusToSave = 'draft';
            if (publishMode === 'publish') statusToSave = 'published';
            if (publishMode === 'schedule' && scheduledAt) statusToSave = 'scheduled';

            // To be safe with importing Timestamp from firebase/firestore, we can also store Date
            // because createPost in useBlogPosts.ts can check it. Wait, the Firebase hook uses `serverTimestamp()` 
            // for creation, but we can pass a raw JS Date if we update useBlogPosts to handle it, or we can just 
            // pass the Date object and let the hook transform it. Looking at `BlogEditorPage.tsx` previously, 
            // it uses `Timestamp.fromDate(form.scheduledAt)`. 
            // We import `import { Timestamp } from 'firebase/firestore';` at top. Let's do that!

            const postData: any = {
                title: article.title,
                slug: article.slug,
                excerpt: article.excerpt,
                content: article.content, // Markdown
                category: 'News', // Or determine from topic
                author: 'Team Cubbbe',
                image: imageUrl,
                readTime: `${readTime} min read`,
                status: statusToSave,
                date: scheduledAt ? scheduledAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            };

            // Note: `createPost` from useBlogPosts needs to handle the generated Date. We will pass the raw JS Date or import Timestamp.
            // Wait, we need `import { Timestamp } from 'firebase/firestore'` for proper Timestamp handling if saving directly.
            // Let's just pass `scheduledAt` as the raw JS Date and we'll check `useBlogPosts.ts` if it handles `Date` properly in `createPost`.
            if (scheduledAt) {
                postData.scheduledAt = Timestamp.fromDate(scheduledAt);
            }

            const postId = await createPost(postData);

            await loadPosts();
            return { id: postId, title: article.title };

        } catch (error) {
            console.error('News generation error:', error);
            alert('Failed to generate news article.');
            return null;
        } finally {
            setIsNewsGenerating(false);
        }
    };

    // Calendar Calculations
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const getPostsForDay = (day: number) => {
        return posts.filter(post => {
            if (post.status === 'scheduled' && post.scheduledAt) {
                let timeMs = 0;
                if (typeof post.scheduledAt.toMillis === 'function') timeMs = post.scheduledAt.toMillis();
                else if (post.scheduledAt.seconds != null) timeMs = post.scheduledAt.seconds * 1000;
                else if (post.scheduledAt instanceof Date) timeMs = post.scheduledAt.getTime();
                else if (typeof post.scheduledAt === 'number') timeMs = post.scheduledAt;
                else if (typeof post.scheduledAt === 'string') timeMs = new Date(post.scheduledAt).getTime();

                if (timeMs > 0) {
                    const postDate = new Date(timeMs);
                    return postDate.getFullYear() === currentDate.getFullYear() &&
                        postDate.getMonth() === currentDate.getMonth() &&
                        postDate.getDate() === day;
                }
            }

            if (post.date) {
                const postDate = new Date(post.date);
                if (!isNaN(postDate.getTime())) {
                    return postDate.getFullYear() === currentDate.getFullYear() &&
                        postDate.getMonth() === currentDate.getMonth() &&
                        postDate.getDate() === day;
                }
            }
            return false;
        });
    };

    return (
        <div className="bg-[#FAFAFA] min-h-screen font-sans">
            {/* Minimalist Premium Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">C</span>
                        </div>
                        <span className="font-semibold text-gray-900 tracking-tight">CMS Studio</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-gray-400 font-medium">v2.0 Premium</div>
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
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">Content Dashboard</h1>
                        <p className="text-gray-500">Manage your publication with precision.</p>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowCreateMenu(!showCreateMenu)}
                            className="group flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                            <span className="font-medium">Create Content</span>
                            <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showCreateMenu ? 'rotate-180' : 'opacity-70 group-hover:opacity-100'}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {showCreateMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowCreateMenu(false)} />
                                <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={() => {
                                                setShowCreateMenu(false);
                                                setShowMagicModal(true);
                                            }}
                                            className="w-full text-left flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors group"
                                        >
                                            <div className="p-2 bg-gradient-to-tr from-purple-100 to-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors relative overflow-hidden">
                                                <div className="absolute inset-0 bg-white/20 group-hover:bg-black/10"></div>
                                                <Zap className="w-5 h-5 relative z-10" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                    AutoPilot Article
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    Génération 1-clic 100% magique
                                                </div>
                                            </div>
                                        </button>

                                        <div className="h-px bg-gray-100 my-1 mx-2"></div>

                                        <button
                                            onClick={() => {
                                                setShowCreateMenu(false);
                                                setShowStandardModal(true);
                                            }}
                                            className="w-full text-left flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors group"
                                        >
                                            <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl group-hover:bg-blue-100 transition-colors">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 mt-0.5">
                                                <div className="font-semibold text-gray-900 text-sm">Standard Article</div>
                                                <div className="text-xs text-gray-500 mt-0.5">Write manually or use AI writing assistant</div>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setShowCreateMenu(false);
                                                setShowNewsModal(true);
                                            }}
                                            className="w-full text-left flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors group"
                                        >
                                            <div className="bg-purple-50 text-purple-600 p-2.5 rounded-xl group-hover:bg-purple-100 transition-colors relative">
                                                <Globe className="w-5 h-5" />
                                                <div className="absolute -top-1 -right-1">
                                                    <span className="relative flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500 border-2 border-white"></span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-1 mt-0.5">
                                                <div className="font-semibold text-gray-900 text-sm">Quick News Flash</div>
                                                <div className="text-xs text-gray-500 mt-0.5">Generate hot news instantly from keywords</div>
                                            </div>
                                        </button>
                                    </div>
                                    <div className="bg-gray-50 p-3 text-xs text-gray-500 text-center border-t border-gray-100 flex items-center justify-center gap-1.5 font-medium">
                                        <Zap className="w-3.5 h-3.5 text-yellow-500" />
                                        Powered by AI Studio
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard icon={FileText} label="Total Posts" value={stats.total} color="bg-gray-50 text-gray-700" />
                    <StatCard icon={CheckCircle} label="Published" value={stats.published} color="bg-green-50 text-green-600" />
                    <StatCard icon={Clock} label="Drafts & Scheduled" value={stats.drafts} color="bg-blue-50 text-blue-600" />
                    <StatCard icon={TrendingUp} label="Total Views" value={stats.views.toLocaleString()} color="bg-purple-50 text-purple-600" />
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h3 className="font-semibold text-gray-900">All Articles</h3>

                            {/* View Toggle */}
                            <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                    List
                                </button>
                                <button
                                    onClick={() => setViewMode('calendar')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <CalendarIcon className="w-4 h-4" />
                                    Calendar
                                </button>
                            </div>
                        </div>

                        {viewMode === 'list' ? (
                            <div className="relative">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm text-gray-700 focus:ring-0 w-64"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                                </button>
                                <h2 className="text-lg font-bold text-gray-900 min-w-[140px] text-center">
                                    {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
                                </h2>
                                <button
                                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="p-20 flex justify-center">
                            <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" />
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-gray-900 font-medium mb-1">No articles yet</h3>
                            <p className="text-gray-500 text-sm">Start writing your first masterpiece.</p>
                        </div>
                    ) : viewMode === 'calendar' ? (
                        <div className="p-6">
                            <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-xl overflow-hidden">
                                {/* Week Days Header */}
                                {DAY_NAMES.map(day => (
                                    <div key={day} className="bg-white py-3 text-center text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {day}
                                    </div>
                                ))}

                                {/* Blanks */}
                                {blanks.map(blank => (
                                    <div key={`blank-${blank}`} className="bg-gray-50/50 min-h-[100px] md:min-h-[140px] p-2" />
                                ))}

                                {/* Days */}
                                {days.map(day => {
                                    const dayPosts = getPostsForDay(day);
                                    const isToday =
                                        day === new Date().getDate() &&
                                        currentDate.getMonth() === new Date().getMonth() &&
                                        currentDate.getFullYear() === new Date().getFullYear();

                                    return (
                                        <div key={day} className={`bg-white min-h-[100px] md:min-h-[140px] p-2 hover:bg-gray-50 transition-colors border-t border-r border-gray-100 relative group`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-xs md:text-sm font-medium w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-black text-white' : 'text-gray-900 group-hover:bg-gray-100'}`}>
                                                    {day}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5 flex flex-col items-center sm:items-stretch">
                                                {dayPosts.map(post => (
                                                    <div
                                                        key={post.id}
                                                        onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                                                        className="cursor-pointer flex flex-col gap-1 p-1.5 rounded-md border border-gray-100 bg-white hover:border-gray-300 transition-all shadow-sm w-full"
                                                        title={post.title}
                                                    >
                                                        <div className="font-medium text-gray-900 truncate text-[10px] md:text-xs">{post.title}</div>
                                                        <div className="flex items-center gap-1">
                                                            <StatusBadge post={post} small />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-50">
                                    <th className="px-6 py-4 font-medium w-16">Image</th>
                                    <th className="px-6 py-4 font-medium">Article</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Category</th>
                                    <th className="px-6 py-4 font-medium">Published</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {posts.map((post) => (
                                    <tr key={post.id} className="group hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            {post.image ? (
                                                <div className="w-12 h-8 rounded overflow-hidden bg-gray-100">
                                                    <img
                                                        src={post.image}
                                                        alt={post.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-8 rounded bg-gray-100 flex items-center justify-center">
                                                    <FileText className="w-4 h-4 text-gray-300" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 max-w-md">
                                            <div className="font-semibold text-gray-900 group-hover:text-black transition-colors">{post.title}</div>
                                            <div className="text-xs text-gray-400 font-mono mt-0.5 truncate">/{post.slug}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge post={post} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                                                {post.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-medium">{post.date}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                                                    className="p-2 text-gray-400 hover:text-black hover:bg-white rounded-lg transition-all"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(post.id, post.title)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
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
            <DeleteBlogPostModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setPostToDelete(null);
                }}
                onConfirm={confirmDelete}
                postTitle={postToDelete?.title || ''}
            />

            {/* News Creation Modal */}
            <CreateNewsModal
                isOpen={showNewsModal}
                onClose={() => setShowNewsModal(false)}
                onGenerate={handleNewsGenerate}
                onUploadImage={uploadImage}
                onUpdatePost={updatePost}
                isGenerating={isNewsGenerating}
            />

            {/* Standard Article Creation Modal */}
            <CreateStandardArticleModal
                isOpen={showStandardModal}
                onClose={() => setShowStandardModal(false)}
                onGenerate={handleStandardGenerate}
                onUploadImage={uploadImage}
                onUpdatePost={updatePost}
                isGenerating={isStandardGenerating}
            />

            {/* Magic AutoPilot Creation Modal */}
            <CreateMagicArticleModal
                isOpen={showMagicModal}
                onClose={() => setShowMagicModal(false)}
                onGenerate={handleMagicGenerate}
                onUploadImage={uploadImage}
                onUpdatePost={updatePost}
            />
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
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

function StatusBadge({ post, small = false }: { post: any, small?: boolean }) {
    if (isPostLive(post)) {
        return (
            <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-green-50 text-green-700 border border-green-100 ${small ? 'px-1.5 py-0.5 text-[9px]' : 'px-3 py-1 text-xs'}`}>
                <span className={`${small ? 'w-1 h-1' : 'w-1.5 h-1.5'} rounded-full bg-green-500`} />
                {small ? 'Pub' : 'Published'}
            </span>
        );
    }
    if (post.status === 'scheduled') {
        return (
            <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-100 ${small ? 'px-1.5 py-0.5 text-[9px]' : 'px-3 py-1 text-xs'}`}>
                <span className={`${small ? 'w-1 h-1' : 'w-1.5 h-1.5'} rounded-full bg-blue-500`} />
                {small ? 'Sch' : 'Scheduled'}
            </span>
        );
    }
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-yellow-50 text-yellow-700 border border-yellow-100 ${small ? 'px-1.5 py-0.5 text-[9px]' : 'px-3 py-1 text-xs'}`}>
            <span className={`${small ? 'w-1 h-1' : 'w-1.5 h-1.5'} rounded-full bg-yellow-500`} />
            {small ? 'Drf' : 'Draft'}
        </span>
    );
}
