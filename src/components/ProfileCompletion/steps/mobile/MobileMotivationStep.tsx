import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import { getOpenAIInstance } from '../../../../lib/openai';
import { notify } from '@/lib/notify';

interface MobileMotivationStepProps {
    value: string;
    onDataChange: (data: { motivation: string }) => void;
}

const STARTER_TEXT = "I'm looking for opportunities in...";

export default function MobileMotivationStep({ value, onDataChange }: MobileMotivationStepProps) {
    const [motivation, setMotivation] = useState(value || STARTER_TEXT);
    const [isImproving, setIsImproving] = useState(false);
    const [charCount, setCharCount] = useState(0);

    useEffect(() => {
        setCharCount(motivation.length);
        // Only send if user has modified from starter
        if (motivation !== STARTER_TEXT) {
            onDataChange({ motivation: motivation.trim() });
        }
    }, [motivation, onDataChange]);

    const improveWithAI = async () => {
        if (!motivation.trim() || motivation === STARTER_TEXT) {
            notify.error('Please write something first');
            return;
        }

        setIsImproving(true);
        try {
            const openai = await getOpenAIInstance();
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `Improve this career motivation statement. Keep it concise (under 200 chars), professional but authentic. Return only the improved text.`
                    },
                    { role: "user", content: motivation }
                ],
                temperature: 0.7,
                max_completion_tokens: 200
            });

            const improved = completion.choices[0]?.message?.content?.trim();
            if (improved) {
                setMotivation(improved);
                notify.success('Text improved!');
            }
        } catch (error) {
            console.error('AI improve error:', error);
            notify.error('Could not improve text');
        } finally {
            setIsImproving(false);
        }
    };

    const handleFocus = () => {
        // Clear starter text on first focus
        if (motivation === STARTER_TEXT) {
            setMotivation('');
        }
    };

    return (
        <div className="space-y-6">
            {/* Question */}
            <h1 className="text-[28px] font-semibold text-gray-900 dark:text-white leading-tight">
                What motivates you?
            </h1>

            {/* Textarea */}
            <div className="relative">
                <textarea
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    onFocus={handleFocus}
                    rows={4}
                    className="w-full p-4 bg-gray-50 dark:bg-white/[0.04] rounded-xl
            border border-gray-200 dark:border-white/10
            text-[16px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40
            resize-none outline-none
            focus:border-[#635bff] dark:focus:border-[#635bff]/50
            focus:ring-2 focus:ring-[#635bff]/10"
                />

                {/* Character count */}
                <div className="absolute bottom-3 left-4 text-[12px] text-gray-400 dark:text-white/30">
                    {charCount}/250 recommended
                </div>

                {/* AI improve button */}
                {motivation.trim() && motivation !== STARTER_TEXT && (
                    <button
                        onClick={improveWithAI}
                        disabled={isImproving}
                        className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1
              text-[12px] text-gray-400 dark:text-white/40
              hover:text-[#635bff] dark:hover:text-[#635bff]
              hover:bg-[#635bff]/5 rounded-md transition-colors"
                    >
                        {isImproving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>{isImproving ? 'Improving...' : 'Improve'}</span>
                    </button>
                )}
            </div>
        </div>
    );
}
