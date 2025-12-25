import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Loader2, Sparkles, Layout, BarChart2, Globe, FileText, Check, ChevronLeft, Wand2, RefreshCw } from 'lucide-react';
import { useBlogPosts } from '../../hooks/useBlogPosts';
import { CATEGORIES } from '../../data/blogPosts';
import { generateAIArticle, generateAIImage } from '../../services/blogAI';

export default function BlogEditorPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { createPost, updatePost, getAllPosts, uploadImage, loading: hookLoading } = useBlogPosts();

    const [form, setForm] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category: CATEGORIES[1],
        author: 'Team Cubbbe',
        readTime: '5 min read',
        image: '',
        status: 'draft' as 'draft' | 'published'
    });

    const [uploading, setUploading] = useState(false);
    const [generatingText, setGeneratingText] = useState(false);
    const [generatingImage, setGeneratingImage] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!id);
    const [activeTab, setActiveTab] = useState<'settings' | 'seo'>('settings');

    useEffect(() => {
        if (id) {
            getAllPosts().then(posts => {
                const post = posts.find(p => p.id === id);
                if (post) {
                    setForm({
                        title: post.title,
                        slug: post.slug || '',
                        excerpt: post.excerpt || '',
                        content: post.content || '',
                        category: post.category || CATEGORIES[1],
                        author: post.author || 'Team Cubbbe',
                        readTime: post.readTime || '5 min read',
                        image: post.image || '',
                        status: (post.status as any) || 'draft'
                    });
                }
                setInitialLoading(false);
            });
        }
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'title' && !id && !prev.slug) {
                newData.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            }
            return newData;
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploading(true);
            try {
                const url = await uploadImage(e.target.files[0]);
                setForm(prev => ({ ...prev, image: url }));
            } catch (err) {
                alert('Failed to upload image');
            } finally {
                setUploading(false);
            }
        }
    };

    const handleAIWrite = async () => {
        if (!form.title) {
            alert('Please enter a title to guide the AI.');
            return;
        }

        setGeneratingText(true);
        try {
            const article = await generateAIArticle({
                topic: form.title,
                tone: 'Premium, authoritative, and actionable',
                keywords: form.category
            });

            // If AI returns content starting with title in markdown, remove it to avoid dup
            const cleanContent = article.replace(/^# .+\n/, '');

            setForm(prev => ({ ...prev, content: prev.content + '\n' + cleanContent }));
            setActiveTab('seo'); // Switch to SEO tab to show stats
        } catch (error) {
            alert('Failed to auto-write article. Please check your AI settings.');
        } finally {
            setGeneratingText(false);
        }
    };

    const handleAIGenerateImage = async () => {
        if (!form.title) {
            alert('Please add a title first to generate a relevant image.');
            return;
        }

        setGeneratingImage(true);
        try {
            const imageUrl = await generateAIImage(form.title);
            if (imageUrl) {
                // Determine if we need to upload this DALL-E URL to our storage to persist it?
                // DALL-E URLs expire. For production, we should fetch blob and upload.
                // For this MVP step, let's try to upload it via our uploadImage if it accepts blobs, 
                // or just set it directly if we want to confirm it works first.
                // Re-using uploadImage flow:

                const response = await fetch(imageUrl);
                const blob = await response.blob();
                const file = new File([blob], "ai-generated-cover.png", { type: "image/png" });

                const uploadedUrl = await uploadImage(file);
                setForm(prev => ({ ...prev, image: uploadedUrl }));
            }
        } catch (error) {
            alert('Failed to generate image. Please try again.');
        } finally {
            setGeneratingImage(false);
        }
    };

    const savePost = async (statusOverride?: 'draft' | 'published') => {
        try {
            const statusToSave = statusOverride || form.status;
            const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const dataToSave = { ...form, status: statusToSave, date };
            if (id) {
                await updatePost(id, dataToSave);
            } else {
                await createPost(dataToSave);
            }
            navigate('/admin/blog');
        } catch (err) {
            alert('Error saving post');
        }
    };

    if (initialLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    // SEO Calculations
    const titleScore = Math.min(100, (form.title.length / 60) * 100);
    const isTitleGood = form.title.length > 20 && form.title.length < 70;
    const wordCount = form.content.split(/\s+/).filter(Boolean).length;

    return (
        <div className="bg-[#fafafa] h-screen flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/blog')} className="p-2 -ml-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-px bg-gray-200" />
                    <span className="text-sm font-medium text-gray-500 hidden sm:inline-block">
                        {id ? 'Editing Article' : 'Drafting New Article'}
                    </span>
                    {form.status === 'published' && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Published</span>}
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-400 font-mono hidden sm:block mr-2">
                        {wordCount} words
                    </div>
                    <button
                        onClick={() => savePost('draft')}
                        className="text-sm px-4 py-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors font-medium"
                    >
                        Save Draft
                    </button>
                    <button
                        onClick={() => savePost('published')}
                        disabled={hookLoading}
                        className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 font-medium"
                    >
                        {hookLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                        Publish
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Editor */}
                <div className="flex-1 overflow-y-auto bg-white shadow-xl shadow-gray-200/50 z-10 max-w-4xl mx-auto my-6 rounded-xl border border-gray-100">
                    <div className="p-8 sm:p-12 space-y-6">
                        <input
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Enter a captivating title..."
                            className="w-full text-4xl sm:text-5xl font-extrabold tracking-tight placeholder-gray-300 border-none focus:ring-0 p-0 text-gray-900"
                        />
                        <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                            <div className="h-px w-20 bg-gray-100" />
                            <button
                                onClick={handleAIWrite}
                                disabled={generatingText || !form.title}
                                className="flex items-center gap-2 text-sm font-medium text-[#7066fd] hover:text-[#584cf4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {generatingText ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {generatingText ? 'Writing Article...' : 'Auto-Write with AI'}
                            </button>
                        </div>

                        <textarea
                            name="content"
                            value={form.content}
                            onChange={handleChange}
                            placeholder="Tell your story..."
                            className="w-full h-[calc(100vh-400px)] resize-none text-lg leading-relaxed text-gray-700 placeholder-gray-300 border-none focus:ring-0 p-0"
                        />
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-80 bg-[#FAFAFA] border-l border-gray-200 flex flex-col shrink-0">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider ${activeTab === 'settings' ? 'text-black border-b-2 border-black bg-white' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('seo')}
                            className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider ${activeTab === 'seo' ? 'text-black border-b-2 border-black bg-white' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            SEO
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {activeTab === 'settings' ? (
                            <>
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <Layout className="w-4 h-4" />
                                        Metadata
                                    </h3>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">Category</label>
                                        <select
                                            name="category"
                                            value={form.category}
                                            onChange={handleChange}
                                            className="w-full text-sm bg-white border border-gray-200 rounded-lg focus:ring-black focus:border-black transition-shadow"
                                        >
                                            {CATEGORIES.filter(c => c !== 'All').map(c => (<option key={c} value={c}>{c}</option>))}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">Slug</label>
                                        <input
                                            type="text"
                                            name="slug"
                                            value={form.slug}
                                            onChange={handleChange}
                                            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-600 focus:ring-black focus:border-black"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">Short Excerpt</label>
                                        <textarea
                                            name="excerpt"
                                            value={form.excerpt}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full text-sm bg-white border border-gray-200 rounded-lg focus:ring-black focus:border-black resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <Archive className="w-4 h-4" />
                                        Assets
                                    </h3>
                                    <div className="space-y-2">
                                        {form.image && (
                                            <div className="rounded-lg overflow-hidden border border-gray-100 shadow-sm relative group">
                                                <img src={form.image} alt="Cover" className="w-full h-32 object-cover" />
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setForm(p => ({ ...p, image: '' }))} className="text-white text-xs font-medium hover:underline">Remove</button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-2">
                                            <label className="flex flex-col items-center justify-center gap-1 px-2 py-3 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all text-center h-20">
                                                {uploading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <Upload className="w-4 h-4 text-gray-400" />}
                                                <span className="text-[10px] text-gray-500 font-medium leading-tight">
                                                    {uploading ? 'Uploading...' : 'Upload File'}
                                                </span>
                                                <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                                            </label>

                                            <button
                                                onClick={handleAIGenerateImage}
                                                disabled={generatingImage || !form.title}
                                                className="flex flex-col items-center justify-center gap-1 px-2 py-3 border border-dashed border-purple-200 bg-purple-50/50 rounded-lg cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-all text-center h-20 disabled:opacity-50"
                                            >
                                                {generatingImage ? <Loader2 className="w-4 h-4 animate-spin text-purple-500" /> : <Wand2 className="w-4 h-4 text-purple-500" />}
                                                <span className="text-[10px] text-purple-700 font-medium leading-tight">
                                                    {generatingImage ? 'Generating...' : 'Generate AI'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            // SEO TAB
                            <div className="space-y-6">
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <h4 className="text-blue-900 font-bold text-sm mb-1">SEO Health</h4>
                                    <p className="text-blue-700 text-xs">Based on current best practices.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">Title Length</span>
                                        <span className={`text-xs font-bold ${isTitleGood ? 'text-green-600' : 'text-orange-500'}`}>
                                            {form.title.length}/60
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${isTitleGood ? 'bg-green-500' : 'bg-orange-400'}`}
                                            style={{ width: `${Math.min(100, (form.title.length / 60) * 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400">Keep titles between 40-60 characters for optimal Google display.</p>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Checklist</h3>
                                    <CheckItem checked={!!form.image} label="Cover image set" />
                                    <CheckItem checked={form.excerpt.length > 50} label="Meta description > 50 chars" />
                                    <CheckItem checked={wordCount > 300} label="Content > 300 words" />
                                    <CheckItem checked={!!form.category} label="Category selected" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CheckItem({ checked, label }: { checked: boolean, label: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${checked ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-300'}`}>
                <Check className="w-2.5 h-2.5" />
            </div>
            <span className={`text-sm ${checked ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
        </div>
    );
}

// Icon wrapper
function Archive(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="20" height="5" x="2" y="3" rx="1" />
            <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
            <path d="M10 12h4" />
        </svg>
    )
}
