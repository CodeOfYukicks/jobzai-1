import { useState } from 'react';
import { Wand2, Sparkles, Check, X, Loader2 } from 'lucide-react';
import { CVSection, CVData } from '../../../types/cvEditor';
import { rewriteSection } from '../../../lib/cvSectionAI';
import { notify } from '@/lib/notify';

interface MobileAchievementEditorProps {
    section: CVSection;
    itemId: string;
    bulletIndex: number;
    cvData: CVData;
    onUpdate: (sectionId: string, updates: any) => void;
    jobContext?: any;
}

export default function MobileAchievementEditor({
    section,
    itemId,
    bulletIndex,
    cvData,
    onUpdate,
    jobContext
}: MobileAchievementEditorProps) {
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

    // Get current bullet value
    const getListKey = (type: string) => {
        switch (type) {
            case 'experience': return 'experiences';
            default: return null;
        }
    };

    const listKey = getListKey(section.type);
    if (!listKey) return <div>Error: Invalid section type</div>;

    const items = (cvData as any)[listKey] || [];
    const item = items.find((i: any) => i.id === itemId);

    if (!item) return <div>Error: Item not found</div>;

    const currentBullet = item.bullets?.[bulletIndex] || '';

    // Update handler
    const updateBullet = (newValue: string) => {
        const currentBullets = item.bullets || [];
        const newBullets = [...currentBullets];
        newBullets[bulletIndex] = newValue;

        const updatedItems = items.map((i: any) =>
            i.id === itemId ? { ...i, bullets: newBullets } : i
        );

        onUpdate(section.type, { [listKey]: updatedItems });
    };

    // AI Action Handler
    const handleAIAction = async (action: 'improve' | 'rewrite' | 'metrics') => {
        if (!jobContext) {
            notify.error('Job context needed for AI suggestions');
            return;
        }

        setIsProcessingAI(true);
        try {
            // Construct a prompt context specifically for this bullet
            // We pass the whole item context but ask to focus on the specific bullet
            const itemContext = `Role: ${item.title} at ${item.company}\nAchievement: ${currentBullet}`;

            const result = await rewriteSection({
                action,
                sectionType: 'experience', // Reuse experience logic
                currentContent: itemContext,
                fullCV: '', // Not needed for single bullet
                jobContext
            });

            setAiSuggestion(result);
        } catch (error) {
            console.error('AI Error:', error);
            notify.error('Failed to generate suggestion');
        } finally {
            setIsProcessingAI(false);
        }
    };

    const applySuggestion = () => {
        if (aiSuggestion) {
            updateBullet(aiSuggestion);
            setAiSuggestion(null);
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-[#1c1c1e]">
            <div className="flex-1 p-4">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase">
                    Achievement Detail
                </label>

                <textarea
                    value={currentBullet}
                    onChange={(e) => updateBullet(e.target.value)}
                    className="w-full h-40 p-4 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none resize-none leading-relaxed"
                    placeholder="Describe what you achieved..."
                    autoFocus
                />

                {/* AI Suggestion Card */}
                {aiSuggestion && (
                    <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl">
                        <div className="flex items-center gap-2 mb-2 text-purple-700 dark:text-purple-300">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">AI Suggestion</span>
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200 mb-4 leading-relaxed">
                            {aiSuggestion}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={applySuggestion}
                                className="flex-1 py-2 bg-[#635BFF] text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Apply
                            </button>
                            <button
                                onClick={() => setAiSuggestion(null)}
                                className="px-4 py-2 bg-white dark:bg-[#2c2c2e] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#3a3a3c] rounded-lg text-sm font-medium"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* AI Actions Toolbar */}
            {!aiSuggestion && (
                <div className="p-4 bg-white dark:bg-[#2c2c2e] border-t border-gray-200 dark:border-[#3a3a3c] safe-area-bottom">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <button
                            onClick={() => handleAIAction('improve')}
                            disabled={isProcessingAI || !currentBullet}
                            className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-xl text-sm font-medium whitespace-nowrap disabled:opacity-50"
                        >
                            {isProcessingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                            Improve
                        </button>
                        <button
                            onClick={() => handleAIAction('metrics')}
                            disabled={isProcessingAI || !currentBullet}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl text-sm font-medium whitespace-nowrap disabled:opacity-50"
                        >
                            Add Metrics
                        </button>
                        <button
                            onClick={() => handleAIAction('rewrite')}
                            disabled={isProcessingAI || !currentBullet}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium whitespace-nowrap disabled:opacity-50"
                        >
                            Rewrite
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
