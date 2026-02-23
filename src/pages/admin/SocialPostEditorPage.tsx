import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Sparkles,
    Loader2,
    Copy,
    Check,
    Save,
    Send,
    RefreshCw,
    Clock,
    Linkedin,
    MessageCircle,
    AlertCircle,
    Info,
    Lightbulb,
    TrendingUp,
    X,
    Maximize2,
    Minimize2,
    Search,
} from 'lucide-react';
import { useSocialPosts } from '../../hooks/useSocialPosts';
import { generateMultiPlatformPosts, regenerateSinglePost } from '../../services/socialContentAI';
import { suggestTopics, TopicSuggestion } from '../../services/socialTopicSuggestions';
import {
    SocialPlatform,
    SocialTone,
    SocialPostStatus,
    TweetTemplate,
    ContentMode,
    GeneratedSocialContent,
    PLATFORM_LIMITS,
    PLATFORM_INFO,
    SocialPostData,
    TWEET_TEMPLATES,
    CONTENT_MODES,
} from '../../types/socialPost';
import { publishSocialPost } from '../../services/socialPublisher';
import { forceLightMode } from '../../lib/theme';
import { Timestamp } from 'firebase/firestore';

// ============================================
// SUB-COMPONENTS
// ============================================

function PlatformCheckbox({
    platform,
    checked,
    onChange,
}: {
    platform: SocialPlatform;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    const info = PLATFORM_INFO[platform];
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${checked
                ? 'border-gray-900 bg-gray-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
        >
            <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${checked ? 'bg-gray-900 border-gray-900' : 'border-gray-300'
                    }`}
            >
                {checked && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-lg">{info.icon}</span>
            <span className="font-medium text-gray-900 text-sm">{info.name}</span>
            <span className="text-xs text-gray-400 ml-auto">{PLATFORM_LIMITS[platform].toLocaleString()} chars</span>
        </button>
    );
}

function ToneSelector({
    value,
    onChange,
}: {
    value: SocialTone;
    onChange: (tone: SocialTone) => void;
}) {
    const tones: { value: SocialTone; label: string; emoji: string; desc: string }[] = [
        { value: 'professional', label: 'Professional', emoji: '👔', desc: 'Expert & factual' },
        { value: 'casual', label: 'Casual', emoji: '😎', desc: 'Friendly & accessible' },
        { value: 'inspirational', label: 'Inspirational', emoji: '🚀', desc: 'Motivating & emotional' },
        { value: 'informative', label: 'Informative', emoji: '📚', desc: 'Educational & detailed' },
    ];

    return (
        <div className="grid grid-cols-2 gap-2">
            {tones.map((tone) => (
                <button
                    key={tone.value}
                    type="button"
                    onClick={() => onChange(tone.value)}
                    className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${value === tone.value
                        ? 'border-gray-900 bg-gray-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                >
                    <div className="flex items-center gap-2 mb-0.5">
                        <span>{tone.emoji}</span>
                        <span className="font-medium text-sm text-gray-900">{tone.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 pl-7">{tone.desc}</p>
                </button>
            ))}
        </div>
    );
}

function CharacterCounter({ current, limit }: { current: number; limit: number }) {
    const percentage = (current / limit) * 100;
    const isOver = current > limit;
    const isNear = percentage > 80;

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${isOver ? 'bg-red-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
            <span
                className={`text-xs font-mono font-medium ${isOver ? 'text-red-500' : isNear ? 'text-amber-500' : 'text-gray-400'
                    }`}
            >
                {current}/{limit}
            </span>
        </div>
    );
}

function PlatformPreviewCard({
    platform,
    content,
    hashtags,
    redditTitle,
    onChange,
    onRegenerate,
    onCopy,
    onPublish,
    onSchedule,
    onSaveDraft,
    isRegenerating,
    isPublishing,
}: {
    platform: SocialPlatform;
    content: string;
    hashtags: string[];
    redditTitle?: string;
    onChange: (content: string) => void;
    onRegenerate: () => void;
    onCopy: () => void;
    onPublish: () => void;
    onSchedule: () => void;
    onSaveDraft: () => void;
    isRegenerating: boolean;
    isPublishing?: boolean;
}) {
    const info = PLATFORM_INFO[platform];
    const limit = PLATFORM_LIMITS[platform];
    const [copied, setCopied] = useState(false);
    const [focusMode, setFocusMode] = useState(false);

    const handleCopy = () => {
        onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: info.bgColor, color: info.color }}
                        >
                            {platform === 'linkedin' && <Linkedin size={16} />}
                            {platform === 'twitter' && <span className="text-sm font-bold">𝕏</span>}
                            {platform === 'reddit' && <MessageCircle size={16} />}
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">{info.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setFocusMode(true)}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
                            title="Focus Mode"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onRegenerate}
                            disabled={isRegenerating}
                            className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all disabled:opacity-50"
                            title="Regenerate"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={handleCopy}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Copy"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5">
                    {/* Reddit title field */}
                    {platform === 'reddit' && (
                        <div className="mb-3">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                Post Title
                            </label>
                            <input
                                type="text"
                                value={redditTitle || ''}
                                readOnly
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
                            />
                        </div>
                    )}

                    <textarea
                        value={content}
                        onChange={(e) => onChange(e.target.value)}
                        rows={platform === 'twitter' ? 4 : 8}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all"
                        placeholder={`Write your ${info.name} post...`}
                    />

                    {/* Character counter */}
                    <div className="mt-3">
                        <CharacterCounter current={content.length} limit={limit} />
                    </div>

                    {/* Hashtags */}
                    {hashtags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {hashtags.map((tag, i) => (
                                <span
                                    key={i}
                                    className="text-xs px-2 py-1 rounded-md font-medium"
                                    style={{ backgroundColor: info.bgColor, color: info.color }}
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Per-platform actions */}
                <div className="px-5 py-3 border-t border-gray-50 flex items-center gap-2">
                    <button
                        onClick={onPublish}
                        disabled={isPublishing}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        {isPublishing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <Send className="w-3 h-3" />
                        )}
                        Publish
                    </button>
                    <button
                        onClick={onSchedule}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        <Clock className="w-3 h-3" />
                        Schedule
                    </button>
                    <button
                        onClick={onSaveDraft}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
                    >
                        <Save className="w-3 h-3" />
                        Save Draft
                    </button>
                </div>
            </motion.div>

            {/* Focus Mode Overlay */}
            <AnimatePresence>
                {focusMode && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center"
                        onClick={() => setFocusMode(false)}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col mx-4"
                        >
                            {/* Focus Header */}
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: info.bgColor, color: info.color }}
                                    >
                                        {platform === 'linkedin' && <Linkedin size={18} />}
                                        {platform === 'twitter' && <span className="text-base font-bold">𝕏</span>}
                                        {platform === 'reddit' && <MessageCircle size={18} />}
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-900">{info.name}</span>
                                        <p className="text-xs text-gray-500">Focus Mode</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={onRegenerate}
                                        disabled={isRegenerating}
                                        className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all disabled:opacity-50"
                                        title="Regenerate"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button
                                        onClick={handleCopy}
                                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                        title="Copy"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => setFocusMode(false)}
                                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all ml-1"
                                        title="Close"
                                    >
                                        <Minimize2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Focus Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {/* Reddit title */}
                                {platform === 'reddit' && redditTitle && (
                                    <div>
                                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5 block">
                                            Post Title
                                        </label>
                                        <p className="text-lg font-semibold text-gray-900">{redditTitle}</p>
                                    </div>
                                )}

                                {/* Readable content */}
                                <div className="text-[15px] text-gray-800 leading-[1.8] whitespace-pre-wrap">
                                    {content}
                                </div>

                                {/* Hashtags */}
                                {hashtags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {hashtags.map((tag, i) => (
                                            <span
                                                key={i}
                                                className="text-sm px-2.5 py-1 rounded-lg font-medium"
                                                style={{ backgroundColor: info.bgColor, color: info.color }}
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Character counter */}
                                <div className="pt-2">
                                    <CharacterCounter current={content.length} limit={limit} />
                                </div>

                                {/* Editable textarea */}
                                <div className="pt-2 border-t border-gray-100">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">
                                        Edit Content
                                    </label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => onChange(e.target.value)}
                                        rows={platform === 'twitter' ? 5 : 12}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] text-gray-900 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Focus Footer Actions */}
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-2 shrink-0 bg-gray-50/50">
                                <button
                                    onClick={onPublish}
                                    disabled={isPublishing}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Publish
                                </button>
                                <button
                                    onClick={onSchedule}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    <Clock className="w-4 h-4" />
                                    Schedule
                                </button>
                                <button
                                    onClick={onSaveDraft}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ml-auto"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Draft
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// ============================================
// MAIN EDITOR PAGE
// ============================================

export default function SocialPostEditorPage() {
    useEffect(() => { forceLightMode(); }, []);

    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = Boolean(id);

    const { createPost, updatePost, getPostById, getPostsByGroup } = useSocialPosts();

    // Form state
    const [topic, setTopic] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(['linkedin']);
    const [tone, setTone] = useState<SocialTone>('professional');
    const [language, setLanguage] = useState<'fr' | 'en'>('fr');

    // Generated content per platform
    const [generatedContent, setGeneratedContent] = useState<Map<SocialPlatform, GeneratedSocialContent>>(new Map());
    const [isGenerating, setIsGenerating] = useState(false);
    const [regeneratingPlatform, setRegeneratingPlatform] = useState<SocialPlatform | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

    // Topic suggestions state
    const [topicSuggestions, setTopicSuggestions] = useState<TopicSuggestion[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionContext, setSuggestionContext] = useState('');
    const [topicLocation, setTopicLocation] = useState<string>('Global');
    const [customLocation, setCustomLocation] = useState('');

    // Brand mention toggle
    const [mentionBrand, setMentionBrand] = useState(false);

    // Tweet template & content mode
    const [tweetTemplate, setTweetTemplate] = useState<TweetTemplate>('news_flash');
    const [contentMode, setContentMode] = useState<ContentMode>('news');

    // Scheduling state
    const [showScheduler, setShowScheduler] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('09:00');

    // Edit mode: load existing post
    useEffect(() => {
        if (id) {
            loadExistingPost(id);
        }
    }, [id]);

    const loadExistingPost = async (postId: string) => {
        const post = await getPostById(postId);
        if (post) {
            setSelectedPlatforms([post.platform]);
            setTone(post.tone);

            const content: GeneratedSocialContent = {
                platform: post.platform,
                content: post.content,
                hashtags: post.hashtags || [],
                characterCount: post.characterCount || post.content.length,
                redditTitle: post.redditTitle,
            };
            setGeneratedContent(new Map([[post.platform, content]]));
            setHasGenerated(true);

            // If post has a groupId, load sibling posts
            if (post.groupId) {
                const siblings = await getPostsByGroup(post.groupId);
                const map = new Map<SocialPlatform, GeneratedSocialContent>();
                const platforms: SocialPlatform[] = [];
                siblings.forEach((sibling) => {
                    platforms.push(sibling.platform);
                    map.set(sibling.platform, {
                        platform: sibling.platform,
                        content: sibling.content,
                        hashtags: sibling.hashtags || [],
                        characterCount: sibling.characterCount || sibling.content.length,
                        redditTitle: sibling.redditTitle,
                    });
                });
                setSelectedPlatforms(platforms);
                setGeneratedContent(map);
            }
        }
    };

    const togglePlatform = (platform: SocialPlatform) => {
        setSelectedPlatforms((prev) =>
            prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
        );
    };

    const handleSuggestTopics = async () => {
        setIsLoadingSuggestions(true);
        setShowSuggestions(true);
        try {
            const location = topicLocation === 'Custom' ? customLocation : topicLocation;
            const suggestions = await suggestTopics(language, suggestionContext, location);
            setTopicSuggestions(suggestions);
        } catch (error) {
            console.error('Topic suggestion error:', error);
            setTopicSuggestions([]);
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    const handleSelectSuggestion = (suggestion: TopicSuggestion) => {
        // Fill the topic with the suggestion title + context for richer generation
        const enrichedTopic = `${suggestion.title}\n\nContext: ${suggestion.context}\nWhy Now: ${suggestion.whyNow}\nAngle: ${suggestion.angle}`;
        setTopic(enrichedTopic);

        // Auto-select suggested platforms
        if (suggestion.suggestedPlatforms.length > 0) {
            setSelectedPlatforms(suggestion.suggestedPlatforms);
        }
        setShowSuggestions(false);
    };

    const handleGenerate = async () => {
        if (!topic.trim() || selectedPlatforms.length === 0) return;

        setIsGenerating(true);
        try {
            const results = await generateMultiPlatformPosts({
                topic,
                platforms: selectedPlatforms,
                tone,
                language,
                mentionBrand,
                tweetTemplate,
                contentMode,
            });

            const map = new Map<SocialPlatform, GeneratedSocialContent>();
            results.forEach((r) => map.set(r.platform, r));
            setGeneratedContent(map);
            setHasGenerated(true);
        } catch (error) {
            console.error('Generation error:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRegenerateSingle = async (platform: SocialPlatform) => {
        if (!topic.trim()) return;

        setRegeneratingPlatform(platform);
        try {
            const result = await regenerateSinglePost(topic, platform, tone, language, mentionBrand, undefined, tweetTemplate, contentMode);
            setGeneratedContent((prev) => {
                const map = new Map(prev);
                map.set(platform, result);
                return map;
            });
        } catch (error) {
            console.error('Regeneration error:', error);
        } finally {
            setRegeneratingPlatform(null);
        }
    };

    // Per-platform publish
    const [publishingPlatform, setPublishingPlatform] = useState<SocialPlatform | null>(null);

    // Per-platform schedule state
    const [schedulingPlatform, setSchedulingPlatform] = useState<SocialPlatform | null>(null);
    const [platformScheduleDate, setPlatformScheduleDate] = useState('');
    const [platformScheduleTime, setPlatformScheduleTime] = useState('09:00');

    const handlePublishSingle = async (platform: SocialPlatform) => {
        const content = generatedContent.get(platform);
        if (!content) return;

        setPublishingPlatform(platform);
        try {
            const tempPost: any = {
                content: content.content,
                platform,
                tone,
                status: 'draft',
                hashtags: content.hashtags,
                characterCount: content.content.length,
                ...(platform === 'reddit' && {
                    redditTitle: content.redditTitle,
                    subreddit: content.suggestedSubreddits?.[0]
                })
            };

            const result = await publishSocialPost(tempPost);

            const postData: Partial<SocialPostData> = {
                content: content.content,
                platform,
                tone,
                status: result.success ? 'published' : 'failed',
                hashtags: content.hashtags,
                characterCount: content.content.length,
                ...(platform === 'reddit' && { redditTitle: content.redditTitle }),
                ...(result.success && { publishedAt: Timestamp.now() }),
                ...(result.platformPostId && { platformPostId: result.platformPostId }),
            };

            await createPost(postData);

            if (result.success) {
                alert(`✅ Published to ${PLATFORM_INFO[platform].name}!`);
            } else {
                alert(`❌ Failed to publish to ${PLATFORM_INFO[platform].name}: ${result.error}`);
            }
        } catch (error) {
            console.error('Publish error:', error);
            alert(`Error publishing to ${PLATFORM_INFO[platform].name}`);
        } finally {
            setPublishingPlatform(null);
        }
    };

    const handleScheduleSingle = (platform: SocialPlatform) => {
        setSchedulingPlatform(platform);
        setPlatformScheduleDate('');
        setPlatformScheduleTime('09:00');
    };

    const handleConfirmScheduleSingle = async () => {
        if (!schedulingPlatform || !platformScheduleDate) return;

        const content = generatedContent.get(schedulingPlatform);
        if (!content) return;

        setIsSaving(true);
        try {
            const [year, month, day] = platformScheduleDate.split('-').map(Number);
            const [hours, minutes] = platformScheduleTime.split(':').map(Number);
            const scheduledAt = new Date(year, month - 1, day, hours, minutes);

            const postData = {
                content: content.content,
                platform: schedulingPlatform,
                tone,
                status: 'scheduled' as SocialPostStatus,
                hashtags: content.hashtags,
                characterCount: content.content.length,
                scheduledAt: Timestamp.fromDate(scheduledAt),
                ...(schedulingPlatform === 'reddit' && { redditTitle: content.redditTitle }),
            };

            await createPost(postData);
            alert(`✅ ${PLATFORM_INFO[schedulingPlatform].name} post scheduled!`);
            setSchedulingPlatform(null);
        } catch (error) {
            console.error('Schedule error:', error);
            alert('Error scheduling post');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveDraftSingle = async (platform: SocialPlatform) => {
        const content = generatedContent.get(platform);
        if (!content) return;

        setIsSaving(true);
        try {
            const postData: Partial<SocialPostData> = {
                content: content.content,
                platform,
                tone,
                status: 'draft',
                hashtags: content.hashtags,
                characterCount: content.content.length,
                ...(platform === 'reddit' && { redditTitle: content.redditTitle }),
            };

            await createPost(postData);
            alert(`✅ ${PLATFORM_INFO[platform].name} draft saved!`);
        } catch (error) {
            console.error('Save draft error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleContentChange = (platform: SocialPlatform, newContent: string) => {
        setGeneratedContent((prev) => {
            const map = new Map(prev);
            const existing = map.get(platform);
            if (existing) {
                map.set(platform, {
                    ...existing,
                    content: newContent,
                    characterCount: newContent.length,
                });
            }
            return map;
        });
    };

    const handleCopyContent = (platform: SocialPlatform) => {
        const content = generatedContent.get(platform);
        if (content) {
            let text = content.content;
            if (content.hashtags.length > 0 && platform !== 'reddit') {
                text += '\n\n' + content.hashtags.map((h) => `#${h}`).join(' ');
            }
            navigator.clipboard.writeText(text);
        }
    };

    const handleSave = async (targetStatus: 'draft' | 'published') => {
        if (generatedContent.size === 0) return;

        setIsSaving(true);
        const errors: string[] = [];

        try {
            const groupId = isEditing ? undefined : `group_${Date.now()}`;

            for (const [platform, content] of generatedContent) {
                let platformPostId: string | undefined;
                let finalStatus: SocialPostStatus = targetStatus;

                // If publishing immediately, call the API first
                if (targetStatus === 'published') {
                    // Create a temporary object for publishing
                    // (we don't persist ID or timestamps yet)
                    const tempPost: any = {
                        content: content.content,
                        platform,
                        tone,
                        status: 'draft', // Temporary
                        hashtags: content.hashtags,
                        characterCount: content.content.length,
                        ...(platform === 'reddit' && {
                            redditTitle: content.redditTitle,
                            subreddit: content.suggestedSubreddits?.[0]
                        })
                    };

                    const result = await publishSocialPost(tempPost);

                    if (result.success) {
                        platformPostId = result.platformPostId;
                        console.log(`Published to ${platform}:`, result.platformPostId);
                    } else {
                        finalStatus = 'failed'; // Or keep draft
                        errors.push(`${PLATFORM_INFO[platform].name}: ${result.error}`);
                        console.error(`Failed to publish to ${platform}:`, result.error);
                    }
                }

                const postData: Partial<SocialPostData> = {
                    content: content.content,
                    platform,
                    tone,
                    status: finalStatus as SocialPostStatus,
                    hashtags: content.hashtags,
                    characterCount: content.content.length,
                    ...(platform === 'reddit' && {
                        redditTitle: content.redditTitle,
                        subreddit: content.suggestedSubreddits?.[0]
                    }),
                    ...(generatedContent.size > 1 && { groupId }),
                    ...(finalStatus === 'published' && { publishedAt: Timestamp.now() }),
                    ...(platformPostId && { platformPostId }),
                };

                if (isEditing && id) {
                    await updatePost(id, postData);
                    // Only process the first one if editing single post
                    break;
                } else {
                    await createPost(postData);
                }
            }

            if (errors.length > 0) {
                alert(`Some posts failed to publish:\n${errors.join('\n')}`);
                // Stay on page to review? Or redirect?
                // Let's redirect to dashboard where they can see 'failed' status
            }

            navigate('/admin/content');
        } catch (error) {
            console.error('Save error:', error);
            alert('An unexpected error occurred while saving.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSchedule = async () => {
        if (generatedContent.size === 0 || !scheduleDate) return;

        setIsSaving(true);
        try {
            const groupId = isEditing ? undefined : `group_${Date.now()}`;
            const [year, month, day] = scheduleDate.split('-').map(Number);
            const [hours, minutes] = scheduleTime.split(':').map(Number);
            const scheduledAt = new Date(year, month - 1, day, hours, minutes);

            for (const [platform, content] of generatedContent) {
                const postData = {
                    content: content.content,
                    platform,
                    tone,
                    status: 'scheduled' as SocialPostStatus,
                    hashtags: content.hashtags,
                    characterCount: content.content.length,
                    scheduledAt: Timestamp.fromDate(scheduledAt),
                    ...(platform === 'reddit' && {
                        redditTitle: content.redditTitle,
                    }),
                    ...(generatedContent.size > 1 && { groupId }),
                };

                if (isEditing && id) {
                    await updatePost(id, postData);
                    break;
                } else {
                    await createPost(postData);
                }
            }

            navigate('/admin/content/calendar');
        } catch (error) {
            console.error('Schedule error:', error);
        } finally {
            setIsSaving(false);
            setShowScheduler(false);
        }
    };

    return (
        <div className="bg-[#FAFAFA] min-h-screen font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
                    <button
                        onClick={() => navigate('/admin/content')}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm font-medium">Back to Content</span>
                    </button>
                    <div className="flex items-center gap-3">
                        {hasGenerated && (
                            <>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowScheduler(!showScheduler)}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                                    >
                                        <Clock className="w-4 h-4" />
                                        Schedule
                                    </button>

                                    <AnimatePresence>
                                        {showScheduler && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50"
                                            >
                                                <h3 className="font-semibold text-gray-900 mb-3">Schedule Post</h3>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Date</label>
                                                        <input
                                                            type="date"
                                                            value={scheduleDate}
                                                            onChange={(e) => setScheduleDate(e.target.value)}
                                                            min={new Date().toISOString().split('T')[0]}
                                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Time</label>
                                                        <input
                                                            type="time"
                                                            value={scheduleTime}
                                                            onChange={(e) => setScheduleTime(e.target.value)}
                                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={handleSchedule}
                                                        disabled={!scheduleDate || isSaving}
                                                        className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {isSaving ? 'Scheduling...' : 'Confirm Schedule'}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <button
                                    onClick={() => handleSave('draft')}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Draft
                                </button>
                                <button
                                    onClick={() => handleSave('published')}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-200 disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    {isSaving ? 'Saving...' : 'Mark Published'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10">
                {/* Title */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
                        {isEditing ? 'Edit Post' : 'Create Social Post'}
                    </h1>
                    <p className="text-gray-500">
                        {isEditing
                            ? 'Modify your existing post content.'
                            : 'Enter a topic and let AI create adapted content for each platform.'}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Configuration */}
                    <div className="space-y-6">
                        {/* Topic */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-semibold text-gray-900">
                                    Topic / Idea
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="relative hidden sm:flex items-center gap-2">
                                        {/* Location Selector */}
                                        <select
                                            value={topicLocation}
                                            onChange={(e) => setTopicLocation(e.target.value)}
                                            className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all text-gray-700 cursor-pointer"
                                        >
                                            <option value="Global">Global / US</option>
                                            <option value="France">France</option>
                                            <option value="Custom">Custom...</option>
                                        </select>

                                        {topicLocation === 'Custom' && (
                                            <input
                                                type="text"
                                                value={customLocation}
                                                onChange={(e) => setCustomLocation(e.target.value)}
                                                placeholder="City/Region..."
                                                className="w-24 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
                                            />
                                        )}

                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={suggestionContext}
                                                onChange={(e) => setSuggestionContext(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSuggestTopics()}
                                                placeholder={language === 'fr' ? 'Focus (ex: IA, Recrutement)...' : 'Focus (e.g. AI, Hiring)...'}
                                                className="w-48 bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all placeholder:text-gray-400"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSuggestTopics}
                                        disabled={isLoadingSuggestions}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-all disabled:opacity-50"
                                    >
                                        {isLoadingSuggestions ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Lightbulb className="w-3.5 h-3.5" />
                                        )}
                                        {isLoadingSuggestions ? 'Analyzing...' : 'Suggest Topics'}
                                    </button>
                                </div>
                            </div>

                            {/* Topic Suggestions Panel */}
                            <AnimatePresence>
                                {showSuggestions && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden mb-4"
                                    >
                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="w-4 h-4 text-amber-600" />
                                                    <span className="text-sm font-semibold text-amber-900">
                                                        {language === 'fr' ? 'Sujets tendance' : 'Trending Topics'}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => setShowSuggestions(false)}
                                                    className="p-1 text-amber-400 hover:text-amber-600 rounded"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {isLoadingSuggestions ? (
                                                <div className="flex items-center justify-center gap-3 py-8">
                                                    <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                                                    <span className="text-sm text-amber-700">
                                                        {language === 'fr'
                                                            ? 'Analyse des tendances en cours...'
                                                            : 'Analyzing current trends...'}
                                                    </span>
                                                </div>
                                            ) : topicSuggestions.length === 0 ? (
                                                <p className="text-sm text-amber-600 text-center py-4">
                                                    {language === 'fr'
                                                        ? 'Aucune suggestion disponible. Réessayez.'
                                                        : 'No suggestions available. Try again.'}
                                                </p>
                                            ) : (
                                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                                    {topicSuggestions.map((suggestion, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleSelectSuggestion(suggestion)}
                                                            className="w-full text-left bg-white/80 hover:bg-white rounded-lg border border-amber-100 hover:border-amber-300 p-3 transition-all group"
                                                        >
                                                            <div className="flex items-start gap-2">
                                                                <span className="text-amber-500 text-base mt-0.5">💡</span>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-amber-800 transition-colors leading-snug">
                                                                        {suggestion.title}
                                                                    </h4>
                                                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                                                                        {suggestion.context}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mt-2">
                                                                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
                                                                            {suggestion.angle}
                                                                        </span>
                                                                        <span className="text-[10px] text-gray-400">
                                                                            {suggestion.suggestedPlatforms.map(p => PLATFORM_INFO[p]?.name || p).join(', ')}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <textarea
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                rows={3}
                                placeholder={language === 'fr'
                                    ? 'Ex: 5 conseils pour optimiser votre profil LinkedIn...'
                                    : 'Ex: 5 tips for optimizing your LinkedIn profile to attract recruiters...'}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all placeholder:text-gray-400"
                            />
                        </div>

                        {/* Platform Selection */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <label className="block text-sm font-semibold text-gray-900 mb-3">
                                Target Platforms
                            </label>
                            <div className="space-y-2">
                                {(['linkedin', 'twitter', 'reddit'] as SocialPlatform[]).map((p) => (
                                    <PlatformCheckbox
                                        key={p}
                                        platform={p}
                                        checked={selectedPlatforms.includes(p)}
                                        onChange={() => togglePlatform(p)}
                                    />
                                ))}
                            </div>
                            {selectedPlatforms.length === 0 && (
                                <div className="flex items-center gap-2 mt-3 text-amber-600 text-xs">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Select at least one platform
                                </div>
                            )}
                        </div>

                        {/* Tone */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <label className="block text-sm font-semibold text-gray-900 mb-3">Tone</label>
                            <ToneSelector value={tone} onChange={setTone} />
                        </div>

                        {/* Content Mode */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <label className="block text-sm font-semibold text-gray-900 mb-3">
                                {language === 'fr' ? 'Mode de contenu' : 'Content Mode'}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {(Object.entries(CONTENT_MODES) as [ContentMode, typeof CONTENT_MODES[ContentMode]][]).map(([key, mode]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setContentMode(key)}
                                        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all text-left ${contentMode === key
                                                ? 'border-violet-500 bg-violet-50 shadow-sm'
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                            }`}
                                    >
                                        <span className="text-lg">{mode.icon}</span>
                                        <div>
                                            <span className="font-medium text-sm text-gray-900">
                                                {language === 'fr' ? mode.labelFr : mode.label}
                                            </span>
                                            <p className="text-[11px] text-gray-500 mt-0.5">
                                                {language === 'fr' ? mode.descriptionFr : mode.description}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tweet Template (only visible when Twitter is selected) */}
                        {selectedPlatforms.includes('twitter') && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <label className="block text-sm font-semibold text-gray-900 mb-3">
                                    {language === 'fr' ? 'Style de tweet' : 'Tweet Style'}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(Object.entries(TWEET_TEMPLATES) as [TweetTemplate, typeof TWEET_TEMPLATES[TweetTemplate]][]).map(([key, template]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setTweetTemplate(key)}
                                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${tweetTemplate === key
                                                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                                }`}
                                        >
                                            <span className="text-base flex-shrink-0">{template.icon}</span>
                                            <div className="min-w-0">
                                                <span className="font-medium text-sm text-gray-900 block">
                                                    {template.label}
                                                </span>
                                                <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                                                    {language === 'fr' ? template.descriptionFr : template.description}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Language */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <label className="block text-sm font-semibold text-gray-900 mb-3">Language</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { value: 'fr', label: 'Français', flag: '🇫🇷' },
                                    { value: 'en', label: 'English', flag: '🇬🇧' },
                                ].map((lang) => (
                                    <button
                                        key={lang.value}
                                        type="button"
                                        onClick={() => {
                                            setLanguage(lang.value as 'fr' | 'en');
                                            setTopicLocation(lang.value === 'fr' ? 'France' : 'Global');
                                        }}
                                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${language === lang.value
                                            ? 'border-gray-900 bg-gray-50 shadow-sm'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                            }`}
                                    >
                                        <span className="text-lg">{lang.flag}</span>
                                        <span className="font-medium text-sm text-gray-900">{lang.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Brand Mention Toggle */}
                        <label className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                                type="checkbox"
                                checked={mentionBrand}
                                onChange={(e) => setMentionBrand(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                            />
                            <div className="flex-1">
                                <span className="text-sm font-medium text-gray-900">Mention Cubbbe</span>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {language === 'fr'
                                        ? 'Intégrer subtilement une référence à la plateforme'
                                        : 'Subtly integrate a reference to the platform'}
                                </p>
                            </div>
                        </label>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !topic.trim() || selectedPlatforms.length === 0}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-base group"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating for {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''}...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                    {hasGenerated ? 'Regenerate All' : 'Generate with AI'}
                                </>
                            )}
                        </button>

                        {hasGenerated && (
                            <div className="bg-violet-50 rounded-xl p-4 flex items-start gap-3">
                                <Info className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                                <p className="text-xs text-violet-700 leading-relaxed">
                                    Content has been adapted for each platform. You can edit the content directly, regenerate individual posts, or copy to clipboard for manual publishing.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right: Generated Content Preview */}
                    <div className="space-y-6">
                        {!hasGenerated && !isGenerating ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                    <Sparkles className="w-10 h-10 text-violet-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    AI-Powered Content
                                </h3>
                                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                                    Enter a topic, select your platforms and tone, then click "Generate with AI" to create adapted content.
                                </p>
                            </div>
                        ) : isGenerating && !hasGenerated ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                                <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-5" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Creating content...
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    Generating adapted posts for {selectedPlatforms.map((p) => PLATFORM_INFO[p].name).join(', ')}.
                                </p>
                            </div>
                        ) : (
                            <>
                                {selectedPlatforms.map((platform) => {
                                    const content = generatedContent.get(platform);
                                    if (!content) return null;
                                    return (
                                        <React.Fragment key={platform}>
                                            <PlatformPreviewCard
                                                platform={platform}
                                                content={content.content}
                                                hashtags={content.hashtags}
                                                redditTitle={content.redditTitle}
                                                onChange={(newContent) => handleContentChange(platform, newContent)}
                                                onRegenerate={() => handleRegenerateSingle(platform)}
                                                onCopy={() => handleCopyContent(platform)}
                                                onPublish={() => handlePublishSingle(platform)}
                                                onSchedule={() => handleScheduleSingle(platform)}
                                                onSaveDraft={() => handleSaveDraftSingle(platform)}
                                                isRegenerating={regeneratingPlatform === platform}
                                                isPublishing={publishingPlatform === platform}
                                            />

                                            {/* Per-platform schedule modal */}
                                            {schedulingPlatform === platform && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="bg-white rounded-xl border border-blue-100 shadow-sm p-4 -mt-3"
                                                >
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Clock className="w-4 h-4 text-blue-600" />
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            Schedule {PLATFORM_INFO[platform].name}
                                                        </span>
                                                        <button
                                                            onClick={() => setSchedulingPlatform(null)}
                                                            className="ml-auto p-1 text-gray-400 hover:text-gray-600 rounded"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-end gap-2">
                                                        <div className="flex-1">
                                                            <label className="text-xs text-gray-500 mb-1 block">Date</label>
                                                            <input
                                                                type="date"
                                                                value={platformScheduleDate}
                                                                onChange={(e) => setPlatformScheduleDate(e.target.value)}
                                                                min={new Date().toISOString().split('T')[0]}
                                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                                            />
                                                        </div>
                                                        <div className="w-24">
                                                            <label className="text-xs text-gray-500 mb-1 block">Time</label>
                                                            <input
                                                                type="time"
                                                                value={platformScheduleTime}
                                                                onChange={(e) => setPlatformScheduleTime(e.target.value)}
                                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={handleConfirmScheduleSingle}
                                                            disabled={!platformScheduleDate || isSaving}
                                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                        >
                                                            {isSaving ? 'Scheduling...' : 'Confirm'}
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
