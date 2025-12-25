import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap,
    ChevronDown,
    Sparkles,
    Clock,
    BarChart2,
    Check,
    Loader2,
    Globe,
    Type
} from 'lucide-react';
import { useBlogScheduler, BlogSchedulerConfig } from '../../hooks/useBlogScheduler';
import { CATEGORIES } from '../../data/blogPosts';

interface BlogSchedulerPanelProps {
    onGenerateNow?: () => void;
    isGenerating?: boolean;
}

const FREQUENCY_OPTIONS = [
    { value: 1, label: '1/day' },
    { value: 2, label: '2/day' },
    { value: 3, label: '3/day' },
    { value: 5, label: '5/day' },
    { value: 10, label: '10/day' },
];

const TONE_OPTIONS = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'authoritative', label: 'Expert' },
    { value: 'friendly', label: 'Friendly' },
];

export default function BlogSchedulerPanel({ onGenerateNow, isGenerating }: BlogSchedulerPanelProps) {
    const {
        config,
        loading,
        saving,
        toggleScheduler,
        setFrequency,
        setCategories,
        setLanguage,
        setTone,
        remainingThisMonth,
        canGenerateMore
    } = useBlogScheduler();

    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(config.categories || ['Career Advice']);

    useEffect(() => {
        if (config.categories?.length > 0) {
            setSelectedCategories(config.categories);
        }
    }, [config.categories]);

    const handleCategoryToggle = (category: string) => {
        const newCategories = selectedCategories.includes(category)
            ? selectedCategories.filter(c => c !== category)
            : [...selectedCategories, category];

        if (newCategories.length > 0) {
            setSelectedCategories(newCategories);
            setCategories(newCategories);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
            </div>
        );
    }

    const usagePercentage = Math.round((config.monthlyGenerated / config.monthlyLimit) * 100);

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${config.enabled ? 'bg-black' : 'bg-gray-100'
                        }`}>
                        <Zap className={`w-4 h-4 ${config.enabled ? 'text-white' : 'text-gray-400'}`} />
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">Auto Pilot</h3>
                            {config.enabled && (
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded">
                                    Active
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500">
                            {config.articlesPerDay} article{config.articlesPerDay > 1 ? 's' : ''}/day · {remainingThisMonth()} remaining
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleScheduler(!config.enabled);
                        }}
                        disabled={saving || !canGenerateMore()}
                        className={`relative w-11 h-6 rounded-full transition-colors ${config.enabled ? 'bg-black' : 'bg-gray-200'
                            } ${saving ? 'opacity-50' : ''}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${config.enabled ? 'left-6' : 'left-1'
                            }`} />
                    </button>

                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Expanded content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 pt-2 space-y-5 border-t border-gray-100">

                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="text-xs text-gray-500 mb-1">Generated</div>
                                    <div className="text-xl font-semibold text-gray-900">{config.totalGenerated}</div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="text-xs text-gray-500 mb-1">This month</div>
                                    <div className="text-xl font-semibold text-gray-900">{config.monthlyGenerated}</div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="text-xs text-gray-500 mb-1">Remaining</div>
                                    <div className="text-xl font-semibold text-gray-900">{remainingThisMonth()}</div>
                                </div>
                            </div>

                            {/* Usage Bar */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Usage</span>
                                    <span>{config.monthlyGenerated}/{config.monthlyLimit}</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gray-900 rounded-full transition-all duration-500"
                                        style={{ width: `${usagePercentage}%` }}
                                    />
                                </div>
                            </div>

                            {/* Frequency */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-2">
                                    <Clock className="w-3.5 h-3.5" />
                                    Frequency
                                </label>
                                <div className="flex gap-1.5">
                                    {FREQUENCY_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => setFrequency(option.value)}
                                            className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${config.articlesPerDay === option.value
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Categories */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-2">
                                    <BarChart2 className="w-3.5 h-3.5" />
                                    Topics
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {CATEGORIES.filter(c => c !== 'All').map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => handleCategoryToggle(category)}
                                            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${selectedCategories.includes(category)
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {selectedCategories.includes(category) && <Check className="w-3 h-3" />}
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Language & Tone */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-2">
                                        <Globe className="w-3.5 h-3.5" />
                                        Language
                                    </label>
                                    <div className="flex gap-1.5">
                                        <button
                                            onClick={() => setLanguage('fr')}
                                            className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${config.language === 'fr'
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            French
                                        </button>
                                        <button
                                            onClick={() => setLanguage('en')}
                                            className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${config.language === 'en'
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            English
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-2">
                                        <Type className="w-3.5 h-3.5" />
                                        Tone
                                    </label>
                                    <select
                                        value={config.tone}
                                        onChange={(e) => setTone(e.target.value as BlogSchedulerConfig['tone'])}
                                        className="w-full px-3 py-2 bg-gray-100 border-0 rounded-md text-xs text-gray-900 font-medium focus:ring-2 focus:ring-gray-900"
                                    >
                                        {TONE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <span className="text-xs text-gray-400">
                                    {config.lastRun
                                        ? `Last: ${new Date(config.lastRun).toLocaleDateString()}`
                                        : 'Never run'
                                    }
                                </span>

                                <button
                                    onClick={onGenerateNow}
                                    disabled={isGenerating || !canGenerateMore()}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            Generate
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
