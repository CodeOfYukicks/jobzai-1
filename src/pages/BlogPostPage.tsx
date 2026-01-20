import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Calendar, User, Clock, Share2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useBlogPosts } from '../hooks/useBlogPosts';
import { forceLightMode } from '../lib/theme';
import { notify } from '../lib/notify';

export default function BlogPostPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { getPostBySlug, incrementViews } = useBlogPosts();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        forceLightMode();
        if (slug) {
            loadPost(slug);
        }
    }, [slug]);

    const loadPost = async (slug: string) => {
        const data = await getPostBySlug(slug);
        if (data) {
            setPost(data);

            // Track view (only once per session per post)
            const viewedKey = `viewed_post_${data.id}`;
            if (!sessionStorage.getItem(viewedKey)) {
                incrementViews(data.id);
                sessionStorage.setItem(viewedKey, 'true');
            }
        } else {
            // Handle 404
            console.log('Post not found');
        }
        setLoading(false);
    };

    const handleShare = async () => {
        if (!post) return;

        const shareData = {
            title: post.title,
            text: post.excerpt,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                throw new Error('No native share');
            }
        } catch (err) {
            // Fallback to clipboard if native share fails or is not supported
            // This covers cases where navigator.share exists but fails (e.g. desktop)
            // or if the user cancels (we still copy to clipboard as a convenience)
            try {
                await navigator.clipboard.writeText(window.location.href);
                notify.success('Link copied to clipboard!');
            } catch (clipboardErr) {
                console.error('Clipboard write failed:', clipboardErr);
                notify.error('Failed to copy link');
            }
        }
    };

    if (loading) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <div className="pt-32 flex justify-center">
                    <div className="animate-pulse text-gray-400">Loading article...</div>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <div className="pt-32 max-w-7xl mx-auto px-4 text-center">
                    <h1 className="text-3xl font-bold mb-4">Article not found</h1>
                    <button
                        onClick={() => navigate('/blog')}
                        className="text-blue-600 hover:underline"
                    >
                        Back to Blog
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen font-sans text-gray-900">
            <Navbar />

            <main className="pb-20">
                {/* Green Header Section */}
                <section
                    className="mx-3 md:mx-4 lg:mx-6 mt-3 rounded-[24px] md:rounded-[32px] pt-32 pb-16 relative overflow-hidden mb-12"
                    style={{
                        backgroundColor: '#004b23',
                        boxShadow: 'inset 0 0 80px rgba(0,0,0,0.2), 0 4px 30px rgba(0,0,0,0.1)'
                    }}
                >
                    {/* Background noise/grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <button
                            onClick={() => navigate('/blog')}
                            className="group flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white mb-8 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Back to articles
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <span className="px-3 py-1 bg-[#9EF01A] text-[#004b23] text-xs font-bold uppercase tracking-wider rounded-sm">
                                {post.category}
                            </span>
                            <span className="text-white/40 text-sm font-medium">|</span>
                            <span className="flex items-center gap-1 text-white/60 text-sm font-medium">
                                <Clock className="w-4 h-4" />
                                {post.readTime}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-[1.15] tracking-tight">
                            {post.title}
                        </h1>

                        <div className="flex items-center justify-between border-t border-white/10 pt-8">
                            <div className="flex items-center gap-3">
                                {/* DiceBear avatar based on author name */}
                                <img
                                    src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(post.author || 'Cubbbe')}`}
                                    alt={post.author}
                                    className="w-10 h-10 rounded-full bg-white/10"
                                />
                                <div>
                                    <div className="text-sm font-bold text-white">{post.author}</div>
                                    <div className="text-xs text-white/60">{post.date}</div>
                                </div>
                            </div>
                            <button
                                onClick={handleShare}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                                aria-label="Share article"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Cover Image */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
                    <div className="aspect-[21/9] rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                        <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                </div>

                {/* Content */}
                <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-lg prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-[#7066fd]">
                    <ReactMarkdown>
                        {post.content || post.excerpt}
                    </ReactMarkdown>
                </article>
            </main>

            <section className="bg-[#f4f4f4] py-24 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                        Enjoyed this article?
                    </h2>
                    <p className="text-lg text-gray-600 mb-10 max-w-xl mx-auto">
                        Subscribe to get more career advice delivered to your inbox.
                    </p>
                    <button className="px-8 py-3 bg-black text-white font-semibold rounded-md hover:bg-gray-800 transition-colors">
                        Subscribe for free
                    </button>
                </div>
            </section>

            <Footer />
        </div>
    );
}
