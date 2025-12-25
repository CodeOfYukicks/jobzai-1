import { useState, useEffect } from 'react';
import { ArrowRight, ChevronRight, Search, Clock, Calendar, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { forceLightMode } from '../lib/theme';
import { motion } from 'framer-motion';
import { CATEGORIES } from '../data/blogPosts';
import { useBlogPosts } from '../hooks/useBlogPosts';
import { useNavigate } from 'react-router-dom';

export default function BlogPage() {
    const [activeCategory, setActiveCategory] = useState('All');

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

    // If no posts yet, fallback to static for demo or show empty state? 
    // Let's mix: if dynamic empty, use static for now to avoid breaking UI until user adds content?
    // User asked for CMS to write article. 
    // Let's prioritize dynamic. If empty, show "Coming Soon" or empty state.
    // Actually, let's keep static as fallback *only* if dynamic fails? No, clean switch.
    // But for demo purposes, if db is empty, maybe we want to initialize it?
    // Let's just render `posts`. If empty, the UI handles it naturally (map won't render).

    const featuredPost = posts.find(post => post.featured) || posts[0];
    const otherPosts = (!featuredPost) ? [] : (activeCategory === 'All'
        ? posts.filter(post => post.id !== featuredPost.id)
        : posts.filter(post => post.category === activeCategory && post.id !== featuredPost.id));

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
            <Navbar />

            {/* Decorative Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            <main className="pt-40 pb-20 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Header Title */}

                    {/* Featured Section - Qonto Style (Split Layout) */}
                    {activeCategory === 'All' && (
                        <section className="mb-20">
                            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
                                {/* Left Content */}
                                <div className="order-2 md:order-1 flex flex-col justify-center">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="px-3 py-1 bg-[#E8E5FF] text-[#7066fd] text-xs font-bold uppercase tracking-wider rounded-sm">
                                            {featuredPost.category}
                                        </span>
                                        <span className="text-gray-400 text-sm font-medium">|</span>
                                        <span className="text-gray-500 text-sm font-medium">
                                            {featuredPost.readTime}
                                        </span>
                                    </div>

                                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-[1.15] tracking-tight">
                                        {featuredPost.title}
                                    </h2>

                                    <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                        {featuredPost.excerpt}
                                    </p>

                                    <div className="flex items-center gap-6">
                                        <button
                                            onClick={() => window.location.href = `/blog/${featuredPost.slug}`}
                                            className="group inline-flex items-center text-lg font-medium text-gray-900 border-b border-gray-900 pb-0.5 hover:text-[#7066fd] hover:border-[#7066fd] transition-all"
                                        >
                                            Read article
                                            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                                        </button>

                                        {/* Carousel Controls (Mock) */}
                                        <div className="flex gap-2">
                                            <button className="w-10 h-10 bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors">
                                                <ArrowLeft className="w-5 h-5" />
                                            </button>
                                            <button className="w-10 h-10 bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors">
                                                <ArrowRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Image */}
                                <div className="order-1 md:order-2">
                                    <div className="aspect-[4/3] rounded-lg overflow-hidden relative bg-gray-100">
                                        <img
                                            src={featuredPost.image}
                                            alt={featuredPost.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Recent Articles Section - Qonto Style */}
                    <div className="grid lg:grid-cols-12 gap-12 border-t border-gray-200 pt-16">

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
                                            className={`text-sm font-medium transition-colors ${activeCategory === category
                                                ? 'text-gray-900 font-bold decoration-2 underline underline-offset-4'
                                                : 'text-gray-500 hover:text-gray-900'
                                                }`}
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
                                        onClick={() => window.location.href = `/blog/${otherPosts[0].slug}`}
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

                                        <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-[#7066fd] transition-colors leading-tight">
                                            {otherPosts[0].title}
                                        </h3>

                                        <p className="text-gray-600 text-sm leading-relaxed mb-6">
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
                                        onClick={() => window.location.href = `/blog/${post.slug}`}
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

                                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#7066fd] transition-colors leading-tight">
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

                    <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
                        <input
                            type="email"
                            placeholder="Your email address"
                            className="flex-1 px-5 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                            required
                        />
                        <button
                            type="submit"
                            className="px-6 py-3 bg-black text-white font-semibold rounded-md hover:bg-gray-800 transition-colors"
                        >
                            Subscribe
                        </button>
                    </form>
                </div>
            </section>

            <Footer />
        </div>
    );
}
