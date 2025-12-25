import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Calendar, User, Clock, Share2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useBlogPosts } from '../hooks/useBlogPosts';
import { BlogPost } from '../data/blogPosts';
import { forceLightMode } from '../lib/theme';

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

            <main className="pt-24 pb-20">
                {/* Hero / Header */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
                    <button
                        onClick={() => navigate('/blog')}
                        className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Back to articles
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                        <span className="px-3 py-1 bg-[#E8E5FF] text-[#7066fd] text-xs font-bold uppercase tracking-wider rounded-sm">
                            {post.category}
                        </span>
                        <span className="text-gray-400 text-sm font-medium">|</span>
                        <span className="flex items-center gap-1 text-gray-500 text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            {post.readTime}
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 leading-[1.15] tracking-tight">
                        {post.title}
                    </h1>

                    <div className="flex items-center justify-between border-b border-gray-100 pb-8">
                        <div className="flex items-center gap-3">
                            {/* DiceBear avatar based on author name */}
                            <img
                                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(post.author || 'Cubbbe')}`}
                                alt={post.author}
                                className="w-10 h-10 rounded-full bg-gray-100"
                            />
                            <div>
                                <div className="text-sm font-bold text-gray-900">{post.author}</div>
                                <div className="text-xs text-gray-500">{post.date}</div>
                            </div>
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

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
