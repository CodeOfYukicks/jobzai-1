import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, FileText, CheckCircle, Clock, TrendingUp, Search } from 'lucide-react';
import { useBlogPosts } from '../../hooks/useBlogPosts';
import { useBlogScheduler } from '../../hooks/useBlogScheduler';
import { BlogPost } from '../../data/blogPosts';
import DeleteBlogPostModal from '../../components/blog/DeleteBlogPostModal';
import BlogSchedulerPanel from '../../components/blog/BlogSchedulerPanel';
import { generateSEOArticle, generateSEOCoverImage } from '../../services/blogAI';
import { forceLightMode } from '../../lib/theme';

export default function AdminBlogPage() {
    // Force light mode for admin pages
    useEffect(() => {
        forceLightMode();
    }, []);
    const navigate = useNavigate();
    const { getAllPosts, deletePost, createPost, loading } = useBlogPosts();
    const { config, updateConfig, reload: reloadScheduler } = useBlogScheduler();
    const [posts, setPosts] = useState<(BlogPost & { status: string })[]>([]);
    const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, views: 0 });
    const [isAutoGenerating, setIsAutoGenerating] = useState(false);

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
        const published = data.filter(p => p.status === 'published').length;
        const drafts = data.filter(p => p.status !== 'published').length;
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

    // Auto-generate a new article using AI
    const handleAutoGenerate = async () => {
        if (config.monthlyGenerated >= config.monthlyLimit) {
            alert('Monthly limit reached (100 articles). Please wait for next month.');
            return;
        }

        setIsAutoGenerating(true);
        try {
            // Get existing titles to avoid duplicates
            const existingTitles = posts.map(p => p.title.toLowerCase());

            // Pick a random category from configured ones
            const categories = config.categories.length > 0 ? config.categories : ['Career Advice'];
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];

            // Generate unique topic using existing titles context
            const topicPrompt = `Generate a unique blog topic for category "${randomCategory}" that is NOT similar to these existing articles: ${existingTitles.slice(0, 10).join(', ')}. Focus on job search, career development, CV writing, interviews, or LinkedIn optimization.`;

            // Generate the article
            const article = await generateSEOArticle({
                topic: topicPrompt,
                targetKeywords: [randomCategory.toLowerCase(), 'career', 'job'],
                targetAudience: 'job_seekers',
                articleLength: 'medium',
                language: config.language,
                tone: config.tone
            });

            // Generate cover image
            let imageUrl = '';
            try {
                const generatedImage = await generateSEOCoverImage(article.title, [randomCategory]);
                imageUrl = generatedImage || '';
            } catch (imgError) {
                console.warn('Image generation failed, continuing without image:', imgError);
            }

            // Calculate read time
            const wordCount = article.content.split(/\s+/).filter(Boolean).length;
            const readTime = Math.max(1, Math.ceil(wordCount / 200));

            // Create the post
            await createPost({
                title: article.title,
                slug: article.slug,
                excerpt: article.excerpt,
                content: article.content,
                category: randomCategory,
                author: 'Team Cubbbe',
                image: imageUrl,
                readTime: `${readTime} min read`,
                status: 'published',
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            });

            // Update scheduler stats
            await updateConfig({
                lastRun: new Date(),
                totalGenerated: config.totalGenerated + 1,
                monthlyGenerated: config.monthlyGenerated + 1
            });

            // Reload everything
            await loadPosts();
            await reloadScheduler();

            alert(`✅ Article "${article.title}" generated and published successfully!`);
        } catch (error) {
            console.error('Auto-generation error:', error);
            alert('Error generating article. Please try again.');
        } finally {
            setIsAutoGenerating(false);
        }
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
                    <button
                        onClick={() => navigate('/admin/blog/new')}
                        className="group flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                        <span className="font-medium">Write New Article</span>
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard icon={FileText} label="Total Posts" value={stats.total} color="bg-blue-50 text-blue-600" />
                    <StatCard icon={CheckCircle} label="Published" value={stats.published} color="bg-green-50 text-green-600" />
                    <StatCard icon={Clock} label="Drafts" value={stats.drafts} color="bg-yellow-50 text-yellow-600" />
                    <StatCard icon={TrendingUp} label="Total Views" value={stats.views.toLocaleString()} color="bg-purple-50 text-purple-600" />
                </div>

                {/* Auto Pilot Scheduler */}
                <div className="mb-8">
                    <BlogSchedulerPanel
                        onGenerateNow={handleAutoGenerate}
                        isGenerating={isAutoGenerating}
                    />
                </div>

                {/* Content Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">All Articles</h3>
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm text-gray-700 focus:ring-0 w-64"
                            />
                        </div>
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
                                            <StatusBadge status={post.status} />
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

function StatusBadge({ status }: { status: string }) {
    const isPublished = status === 'published';
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isPublished ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-green-500' : 'bg-yellow-500'}`} />
            {isPublished ? 'Published' : 'Draft'}
        </span>
    );
}
