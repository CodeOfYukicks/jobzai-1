import { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { ArrowRight, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { syncUserToBrevo } from '../services/brevo';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { forceLightMode } from '../lib/theme';
import { motion } from 'framer-motion';
import { CATEGORIES } from '../data/blogPosts';
import { useBlogPosts } from '../hooks/useBlogPosts';

export default function BlogPage() {
    const [activeCategory, setActiveCategory] = useState('All');
    const [carouselIndex, setCarouselIndex] = useState(0);

    // Newsletter state
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        setMessage('');

        try {
            await syncUserToBrevo({
                email,
                MARKETING: true
            });
            setStatus('success');
            setMessage('You have successfully subscribed to our newsletter!');
            setEmail('');
        } catch (error) {
            console.error('Subscription error:', error);
            setStatus('error');
            setMessage('An error occurred. Please try again later.');
        }
    };

    // Force light mode
    useEffect(() => {
        forceLightMode();
    }, []);

    const { getPublishedPosts, loading } = useBlogPosts();
    const [posts, setPosts] = useState<any[]>([]);

    useEffect(() => {
        forceLightMode();
        loadPosts();
    }, []);

    const loadPosts = async () => {
        const data = await getPublishedPosts();
        setPosts(data);
    };

    // Get the 3 latest posts for the carousel
    const featuredPosts = posts.slice(0, 3);
    const featuredPost = featuredPosts[carouselIndex] || posts[0];
    const otherPosts = (!featuredPost) ? [] : (activeCategory === 'All'
        ? posts.filter(post => !featuredPosts.some(fp => fp.id === post.id))
        : posts.filter(post => post.category === activeCategory && !featuredPosts.some(fp => fp.id === post.id)));

    const handlePrevious = () => {
        setCarouselIndex((prev) => (prev === 0 ? featuredPosts.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCarouselIndex((prev) => (prev === featuredPosts.length - 1 ? 0 : prev + 1));
    };

    if (loading) {
        return (
            <div className="bg-white min-h-screen font-sans text-gray-900">
                <Navbar />
                <div className="pt-32 text-center">Loading articles...</div>
                <Footer />
            </div>
        );
    }

    if (!featuredPost) {
        return (
            <div className="bg-white min-h-screen font-sans text-gray-900">
                <Navbar />
                <main className="pt-32 pb-20 max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-4">No articles found</h2>
                    <p className="text-gray-600">Check back soon for our latest updates!</p>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen font-sans text-gray-900">
            <SEO
                title="Blog Cubbbe – Conseils emploi, carrière et recherche d'emploi"
                description="Retrouvez nos articles et conseils sur la recherche d'emploi, la rédaction de CV, la préparation d'entretiens et les tendances du marché du travail."
                url="/blog"
            />
            <Navbar />

            {/* Decorative Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            <main className="relative z-10">

                {/* Header Title */}

                {/* Featured Section - Qonto Style (Split Layout) */}
                {activeCategory === 'All' && (
                    <section
                        className="mb-8 mx-3 md:mx-4 lg:mx-6 mt-3 rounded-[24px] md:rounded-[32px] pt-32 pb-12 relative overflow-hidden"
                        style={{
                            backgroundColor: '#004b23',
                            boxShadow: 'inset 0 0 80px rgba(0,0,0,0.2), 0 4px 30px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
                                {/* Left Content */}
                                <div className="order-2 md:order-1 flex flex-col justify-center">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="px-3 py-1 bg-[#9EF01A] text-[#004b23] text-xs font-bold uppercase tracking-wider rounded-sm">
                                            {featuredPost.category}
                                        </span>
                                        <span className="text-white/40 text-sm font-medium">|</span>
                                        <span className="text-white/60 text-sm font-medium">
                                            {featuredPost.readTime}
                                        </span>
                                    </div>

                                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-[1.15] tracking-tight line-clamp-3">
                                        {featuredPost.title}
                                    </h2>

                                    <p className="text-lg text-white/80 mb-8 leading-relaxed line-clamp-2">
                                        {featuredPost.excerpt}
                                    </p>

                                    <div className="flex items-center gap-6">
                                        <button
                                            onClick={() => window.location.href = `/ blog / ${featuredPost.slug} `}
                                            className="group inline-flex items-center text-lg font-medium text-white border-b border-white pb-0.5 hover:text-[#9EF01A] hover:border-[#9EF01A] transition-all"
                                        >
                                            Read article
                                            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                                        </button>

                                        {/* Carousel Controls */}
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={handlePrevious}
                                                className="w-10 h-10 bg-white text-[#004b23] flex items-center justify-center rounded-full hover:bg-[#9EF01A] transition-colors"
                                            >
                                                <ArrowLeft className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={handleNext}
                                                className="w-10 h-10 bg-white text-[#004b23] flex items-center justify-center rounded-full hover:bg-[#9EF01A] transition-colors"
                                            >
                                                <ArrowRight className="w-5 h-5" />
                                            </button>

                                            {/* Pagination Dots */}
                                            <div className="flex gap-1.5 ml-2">
                                                {featuredPosts.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setCarouselIndex(idx)}
                                                        className={`w - 2 h - 2 rounded - full transition - all ${idx === carouselIndex ? 'bg-[#9EF01A] w-6' : 'bg-white/30 hover:bg-white/50'
                                                            } `}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Image */}
                                <div className="order-1 md:order-2">
                                    <motion.div
                                        key={carouselIndex}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="aspect-[4/3] rounded-2xl overflow-hidden relative bg-white/5 border border-white/10 shadow-2xl"
                                    >
                                        <img
                                            src={featuredPost.image}
                                            alt={featuredPost.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </motion.div>
                                </div>
                            </div>
                        </div>

                    </section>
                )}

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Recent Articles Section - Qonto Style */}
                    <div className="grid lg:grid-cols-12 gap-12 border-t border-gray-200 pt-10">

                        {/* Column 1: Sticky Sidebar (Title & Intro) */}
                        <div className="lg:col-span-3">
                            <div className="sticky top-32">
                                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 tracking-tight">
                                    Our most recent articles
                                </h3>
                                <p className="text-gray-600 mb-8 leading-relaxed">
                                    Here's our latest selection of articles on running your career effectively with minimal fuss.
                                </p>
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                                    Last update: {posts[0]?.date || 'N/A'}
                                </p>

                                {/* Categories List (Vertical now) */}
                                <div className="mt-12 flex flex-col items-start gap-2">
                                    {CATEGORIES.map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => setActiveCategory(category)}
                                            className={`text - sm font - medium transition - colors ${activeCategory === category
                                                ? 'text-gray-900 font-bold decoration-2 underline underline-offset-4'
                                                : 'text-gray-500 hover:text-gray-900'
                                                } `}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Column 2 & 3: Content Feed */}
                        <div className="lg:col-span-9 grid md:grid-cols-2 gap-12">

                            {/* Sub-Col 1: Highlighted Article (Big with Image) */}
                            {otherPosts.length > 0 && (
                                <div className="flex flex-col">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => window.location.href = `/ blog / ${otherPosts[0].slug} `}
                                        className="group cursor-pointer h-full flex flex-col"
                                    >
                                        <div className="aspect-[4/3] overflow-hidden rounded-lg mb-6 bg-gray-100">
                                            <img
                                                src={otherPosts[0].image}
                                                alt={otherPosts[0].title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                                {otherPosts[0].category}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {otherPosts[0].readTime}
                                            </span>
                                        </div>

                                        <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-[#7066fd] transition-colors leading-tight line-clamp-2">
                                            {otherPosts[0].title}
                                        </h3>

                                        <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-2">
                                            {otherPosts[0].excerpt}
                                        </p>

                                        <div className="mt-auto flex items-center gap-2 text-xs font-medium text-gray-500">
                                            <span>{otherPosts[0].date}</span>
                                            <span>•</span>
                                            <span>By {otherPosts[0].author}</span>
                                        </div>
                                    </motion.div>
                                </div>
                            )}

                            {/* Sub-Col 2: List of Articles (Text only / Minimal) */}
                            <div className="flex flex-col gap-10">
                                {otherPosts.slice(1).map((post, index) => (
                                    <motion.div
                                        key={post.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => window.location.href = `/ blog / ${post.slug} `}
                                        className="group cursor-pointer border-b border-gray-100 pb-8 last:border-0"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-600 transition-colors">
                                                {post.category}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {post.readTime}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#7066fd] transition-colors leading-tight line-clamp-2">
                                            {post.title}
                                        </h3>

                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                            <span>{post.date}</span>
                                            <span>•</span>
                                            <span>By {post.author}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                        </div>
                    </div>

                </div>
            </main>

            {/* Newsletter / CTA Section */}
            <section className="bg-[#f4f4f4] py-24 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                        Get the latest career advice
                    </h2>
                    <p className="text-lg text-gray-600 mb-10 max-w-xl mx-auto">
                        Join 150,000+ professionals who get our weekly career tips.
                    </p>

                    <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto relative" onSubmit={handleSubscribe}>
                        <div className="flex-1 relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Your email address"
                                className="w-full px-5 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                                required
                                disabled={status === 'loading' || status === 'success'}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={status === 'loading' || status === 'success'}
                            className={`px - 6 py - 3 font - semibold rounded - md transition - all flex items - center justify - center min - w - [120px]
                                ${status === 'success'
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : status === 'error'
                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                        : 'bg-black text-white hover:bg-gray-800'
                                } disabled: opacity - 80 disabled: cursor - not - allowed`}
                        >
                            {status === 'loading' ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : status === 'success' ? (
                                <>
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Subscribed
                                </>
                            ) : status === 'error' ? (
                                <>
                                    <AlertCircle className="w-5 h-5 mr-2" />
                                    Retry
                                </>
                            ) : (
                                'Subscribe'
                            )}
                        </button>
                    </form>
                    {message && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mt - 4 text - sm font - medium ${status === 'success' ? 'text-green-600' : 'text-red-600'} `}
                        >
                            {message}
                        </motion.p>
                    )}
                </div>
            </section>

            <Footer />
        </div >
    );
}
