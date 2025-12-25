import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, Loader2, Sparkles, Layout, Globe, Check, ChevronLeft, Wand2, Image as ImageIcon } from 'lucide-react';
import { useBlogPosts } from '../../hooks/useBlogPosts';
import { CATEGORIES } from '../../data/blogPosts';
import { generateAIImage, generateSEOArticle, generateSEOCoverImage, SEOArticleConfig, GeneratedSEOArticle } from '../../services/blogAI';
import AIArticleGeneratorModal from '../../components/blog/AIArticleGeneratorModal';
import { NotionEditor, NotionEditorRef } from '../../components/notion-editor';
import CoverPhotoGallery from '../../components/profile/CoverPhotoGallery';

export default function BlogEditorPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { createPost, updatePost, getAllPosts, uploadImage, loading: hookLoading } = useBlogPosts();
    const editorRef = useRef<NotionEditorRef>(null);

    const [form, setForm] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '' as string | any, // Can be string (markdown) or TipTap JSON
        category: CATEGORIES[1],
        author: 'Team Cubbbe',
        readTime: '5 min read',
        image: '',
        status: 'draft' as 'draft' | 'published'
    });

    const [uploading, setUploading] = useState(false);
    const [generatingImage, setGeneratingImage] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!id);
    const [activeTab, setActiveTab] = useState<'settings' | 'seo'>('settings');

    // States for AI SEO Generator
    const [showAIModal, setShowAIModal] = useState(false);
    const [isGeneratingFull, setIsGeneratingFull] = useState(false);
    const [generationStatus, setGenerationStatus] = useState('');

    // State for Cover Photo Gallery
    const [showCoverGallery, setShowCoverGallery] = useState(false);
    const [isApplyingCover, setIsApplyingCover] = useState(false);
    const coverButtonRef = useRef<HTMLButtonElement>(null);

    // Convert markdown to TipTap JSON format
    const markdownToTipTap = useCallback((markdown: string): any => {
        // Simple conversion - parse markdown and create TipTap JSON structure
        const lines = markdown.split('\n');
        const content: any[] = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];

            // Heading 1
            if (line.startsWith('# ')) {
                content.push({
                    type: 'heading',
                    attrs: { level: 1 },
                    content: [{ type: 'text', text: line.substring(2) }]
                });
            }
            // Heading 2
            else if (line.startsWith('## ')) {
                content.push({
                    type: 'heading',
                    attrs: { level: 2 },
                    content: [{ type: 'text', text: line.substring(3) }]
                });
            }
            // Heading 3
            else if (line.startsWith('### ')) {
                content.push({
                    type: 'heading',
                    attrs: { level: 3 },
                    content: [{ type: 'text', text: line.substring(4) }]
                });
            }
            // Bullet list item
            else if (line.startsWith('- ') || line.startsWith('* ')) {
                const items: any[] = [];
                while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
                    const itemText = lines[i].substring(2);
                    items.push({
                        type: 'listItem',
                        content: [{
                            type: 'paragraph',
                            content: parseInlineMarks(itemText)
                        }]
                    });
                    i++;
                }
                content.push({
                    type: 'bulletList',
                    content: items
                });
                continue;
            }
            // Numbered list item
            else if (/^\d+\.\s/.test(line)) {
                const items: any[] = [];
                while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
                    const itemText = lines[i].replace(/^\d+\.\s/, '');
                    items.push({
                        type: 'listItem',
                        content: [{
                            type: 'paragraph',
                            content: parseInlineMarks(itemText)
                        }]
                    });
                    i++;
                }
                content.push({
                    type: 'orderedList',
                    content: items
                });
                continue;
            }
            // Blockquote
            else if (line.startsWith('> ')) {
                content.push({
                    type: 'blockquote',
                    content: [{
                        type: 'paragraph',
                        content: parseInlineMarks(line.substring(2))
                    }]
                });
            }
            // Horizontal rule
            else if (line.match(/^[-*_]{3,}$/)) {
                content.push({ type: 'horizontalRule' });
            }
            // Empty line
            else if (line.trim() === '') {
                // Skip empty lines or add empty paragraph
            }
            // Regular paragraph
            else {
                const inlineContent = parseInlineMarks(line);
                if (inlineContent.length > 0) {
                    content.push({
                        type: 'paragraph',
                        content: inlineContent
                    });
                }
            }
            i++;
        }

        return {
            type: 'doc',
            content: content.length > 0 ? content : [{ type: 'paragraph' }]
        };
    }, []);

    // Parse inline markdown marks (bold, italic, etc.)
    const parseInlineMarks = (text: string): any[] => {
        if (!text || text.trim() === '') return [];

        const result: any[] = [];
        let remaining = text;

        // Simple regex-based parsing
        const patterns = [
            { regex: /\*\*(.+?)\*\*/g, mark: 'bold' },
            { regex: /\*(.+?)\*/g, mark: 'italic' },
            { regex: /`(.+?)`/g, mark: 'code' },
        ];

        // For simplicity, just handle bold and return plain text for the rest
        // A full implementation would handle nested marks properly
        const boldRegex = /\*\*(.+?)\*\*/;
        const parts: any[] = [];

        while (remaining.length > 0) {
            const match = remaining.match(boldRegex);
            if (match && match.index !== undefined) {
                // Add text before the match
                if (match.index > 0) {
                    parts.push({ type: 'text', text: remaining.substring(0, match.index) });
                }
                // Add bold text
                parts.push({
                    type: 'text',
                    marks: [{ type: 'bold' }],
                    text: match[1]
                });
                remaining = remaining.substring(match.index + match[0].length);
            } else {
                // No more matches, add remaining text
                if (remaining.length > 0) {
                    parts.push({ type: 'text', text: remaining });
                }
                break;
            }
        }

        return parts.length > 0 ? parts : [{ type: 'text', text: text }];
    };

    // Convert TipTap JSON to markdown for storage
    const tipTapToMarkdown = useCallback((json: any): string => {
        if (!json || !json.content) return '';

        const convertNode = (node: any): string => {
            switch (node.type) {
                case 'heading':
                    const prefix = '#'.repeat(node.attrs?.level || 1);
                    return `${prefix} ${getTextContent(node)}\n\n`;
                case 'paragraph':
                    const text = getTextContent(node);
                    return text ? `${text}\n\n` : '\n';
                case 'bulletList':
                    return node.content?.map((item: any) => `- ${getTextContent(item)}`).join('\n') + '\n\n';
                case 'orderedList':
                    return node.content?.map((item: any, idx: number) => `${idx + 1}. ${getTextContent(item)}`).join('\n') + '\n\n';
                case 'blockquote':
                    return `> ${getTextContent(node)}\n\n`;
                case 'horizontalRule':
                    return '---\n\n';
                case 'codeBlock':
                    return `\`\`\`\n${getTextContent(node)}\n\`\`\`\n\n`;
                default:
                    return getTextContent(node);
            }
        };

        const getTextContent = (node: any): string => {
            if (node.text) {
                let text = node.text;
                if (node.marks) {
                    node.marks.forEach((mark: any) => {
                        if (mark.type === 'bold') text = `**${text}**`;
                        if (mark.type === 'italic') text = `*${text}*`;
                        if (mark.type === 'code') text = `\`${text}\``;
                    });
                }
                return text;
            }
            return node.content?.map((child: any) => {
                if (child.type === 'listItem') {
                    return getTextContent(child);
                }
                return getTextContent(child);
            }).join('') || '';
        };

        return json.content.map(convertNode).join('').trim();
    }, []);

    useEffect(() => {
        if (id) {
            getAllPosts().then(posts => {
                const post = posts.find(p => p.id === id);
                if (post) {
                    // Convert markdown content to TipTap JSON if needed
                    let contentToSet = post.content || '';
                    if (typeof contentToSet === 'string' && contentToSet.trim()) {
                        contentToSet = markdownToTipTap(contentToSet);
                    }

                    setForm({
                        title: post.title,
                        slug: post.slug || '',
                        excerpt: post.excerpt || '',
                        content: contentToSet,
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
    }, [id, markdownToTipTap]);

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

    // Handle editor content change
    const handleEditorChange = useCallback((content: any) => {
        setForm(prev => ({ ...prev, content }));
    }, []);

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

    // Full SEO Article Generation
    const handleSEOGenerate = async (config: SEOArticleConfig) => {
        setIsGeneratingFull(true);

        try {
            // Step 1: Generate the article
            setGenerationStatus('✨ Rédaction de l\'article SEO...');
            const article: GeneratedSEOArticle = await generateSEOArticle(config);

            // Convert markdown to TipTap JSON for the editor
            const editorContent = markdownToTipTap(article.content);

            // Update form with generated content
            setForm(prev => ({
                ...prev,
                title: article.title,
                slug: article.slug,
                excerpt: article.excerpt,
                content: editorContent,
            }));

            // Update editor content
            if (editorRef.current) {
                editorRef.current.setContent(editorContent);
            }

            // Step 2: Generate the cover image
            setGenerationStatus('🎨 Génération de l\'image de couverture...');
            const imageUrl = await generateSEOCoverImage(article.title, config.targetKeywords);

            if (imageUrl) {
                // Download via proxy and upload to our storage (DALL-E URLs expire and have CORS issues)
                setGenerationStatus('📤 Upload de l\'image...');
                const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
                const response = await fetch(proxyUrl);
                const blob = await response.blob();
                const file = new File([blob], "ai-seo-cover.png", { type: "image/png" });
                const uploadedUrl = await uploadImage(file);

                setForm(prev => ({ ...prev, image: uploadedUrl }));
            }

            // Calculate read time based on word count
            const wordCount = article.content.split(/\s+/).filter(Boolean).length;
            const readTime = Math.max(1, Math.ceil(wordCount / 200));
            setForm(prev => ({ ...prev, readTime: `${readTime} min read` }));

            // Close modal and switch to SEO tab
            setShowAIModal(false);
            setActiveTab('seo');
            setGenerationStatus('');

        } catch (error) {
            console.error('SEO generation error:', error);
            alert('Erreur lors de la génération. Veuillez réessayer.');
        } finally {
            setIsGeneratingFull(false);
            setGenerationStatus('');
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
                // Use proxy to bypass CORS on DALL-E image URLs
                const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
                const response = await fetch(proxyUrl);
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

    // Handle cover photo selection from gallery
    const handleCoverPhotoApply = async (blob: Blob): Promise<void> => {
        setIsApplyingCover(true);
        try {
            const file = new File([blob], "cover-image.png", { type: blob.type || "image/png" });
            const uploadedUrl = await uploadImage(file);
            setForm(prev => ({ ...prev, image: uploadedUrl }));
            setShowCoverGallery(false);
        } catch (error) {
            console.error('Error applying cover photo:', error);
            alert('Failed to apply cover photo. Please try again.');
        } finally {
            setIsApplyingCover(false);
        }
    };

    const savePost = async (statusOverride?: 'draft' | 'published') => {
        try {
            const statusToSave = statusOverride || form.status;
            const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            // Convert TipTap JSON content to markdown for storage
            let contentToSave = form.content;
            if (typeof contentToSave === 'object') {
                contentToSave = tipTapToMarkdown(contentToSave);
            }

            const dataToSave = {
                ...form,
                content: contentToSave,
                status: statusToSave,
                date
            };

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
    const isTitleGood = form.title.length > 20 && form.title.length < 70;

    // Calculate word count from content
    const getWordCount = () => {
        if (typeof form.content === 'string') {
            return form.content.split(/\s+/).filter(Boolean).length;
        }
        // For TipTap JSON, extract text
        const extractText = (node: any): string => {
            if (node.text) return node.text;
            if (node.content) return node.content.map(extractText).join(' ');
            return '';
        };
        return extractText(form.content).split(/\s+/).filter(Boolean).length;
    };
    const wordCount = getWordCount();

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
                    {/* Generation Status */}
                    {generationStatus && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-sm font-medium">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {generationStatus}
                        </div>
                    )}

                    <div className="text-xs text-gray-400 font-mono hidden sm:block mr-2">
                        {wordCount} words
                    </div>

                    {/* AI Generate Button */}
                    <button
                        onClick={() => setShowAIModal(true)}
                        disabled={isGeneratingFull}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/25 font-medium text-sm"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span className="hidden sm:inline">Générer avec IA</span>
                        <span className="sm:hidden">IA</span>
                    </button>

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
                        {/* Title Input */}
                        <input
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Enter a captivating title..."
                            className="w-full text-4xl sm:text-5xl font-extrabold tracking-tight placeholder-gray-300 border-none focus:ring-0 p-0 text-gray-900 bg-transparent"
                        />

                        <div className="h-px bg-gray-100" />

                        {/* Rich Text Editor (TipTap) */}
                        <div className="min-h-[calc(100vh-400px)]">
                            <NotionEditor
                                ref={editorRef}
                                content={typeof form.content === 'object' ? form.content : markdownToTipTap(form.content || '')}
                                onChange={handleEditorChange}
                                placeholder="Start writing your article... Use '/' for formatting options"
                                editable={true}
                                className="prose-lg"
                            />
                        </div>
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

                                        <div className="grid grid-cols-3 gap-2">
                                            {/* Gallery Button */}
                                            <button
                                                ref={coverButtonRef}
                                                onClick={() => setShowCoverGallery(true)}
                                                disabled={isApplyingCover}
                                                className="flex flex-col items-center justify-center gap-1 px-2 py-3 border border-dashed border-blue-200 bg-blue-50/50 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all text-center h-20 disabled:opacity-50"
                                            >
                                                {isApplyingCover ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <ImageIcon className="w-4 h-4 text-blue-500" />}
                                                <span className="text-[10px] text-blue-700 font-medium leading-tight">
                                                    {isApplyingCover ? 'Applying...' : 'Gallery'}
                                                </span>
                                            </button>

                                            {/* Upload Button */}
                                            <label className="flex flex-col items-center justify-center gap-1 px-2 py-3 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all text-center h-20">
                                                {uploading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <Upload className="w-4 h-4 text-gray-400" />}
                                                <span className="text-[10px] text-gray-500 font-medium leading-tight">
                                                    {uploading ? 'Uploading...' : 'Upload'}
                                                </span>
                                                <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                                            </label>

                                            {/* AI Generate Button */}
                                            <button
                                                onClick={handleAIGenerateImage}
                                                disabled={generatingImage || !form.title}
                                                className="flex flex-col items-center justify-center gap-1 px-2 py-3 border border-dashed border-purple-200 bg-purple-50/50 rounded-lg cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-all text-center h-20 disabled:opacity-50"
                                            >
                                                {generatingImage ? <Loader2 className="w-4 h-4 animate-spin text-purple-500" /> : <Wand2 className="w-4 h-4 text-purple-500" />}
                                                <span className="text-[10px] text-purple-700 font-medium leading-tight">
                                                    {generatingImage ? 'Generating...' : 'AI Generate'}
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

            {/* AI Article Generator Modal */}
            <AIArticleGeneratorModal
                isOpen={showAIModal}
                onClose={() => setShowAIModal(false)}
                onGenerate={handleSEOGenerate}
                isGenerating={isGeneratingFull}
            />

            {/* Cover Photo Gallery Picker */}
            <CoverPhotoGallery
                isOpen={showCoverGallery}
                onClose={() => setShowCoverGallery(false)}
                onDirectApply={handleCoverPhotoApply}
                currentCover={form.image}
                triggerRef={coverButtonRef}
            />
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
