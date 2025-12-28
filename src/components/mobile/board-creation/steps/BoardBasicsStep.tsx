import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

// Popular emoji suggestions
const EMOJI_SUGGESTIONS = ['📋', '💼', '🎯', '🚀', '⭐', '💡', '📊', '🏆', '💪', '📈', '✨', '🔥', '📨', '✉️', '💬', '🤝'];

interface BoardBasicsStepProps {
    name: string;
    description: string;
    icon: string;
    onChange: (field: string, value: string) => void;
    onNext: () => void;
}

export default function BoardBasicsStep({ name, description, icon, onChange, onNext }: BoardBasicsStepProps) {
    const [isFocused, setIsFocused] = useState<string | null>(null);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Board Basics</h2>
                    <p className="text-gray-500 dark:text-gray-400">Give your board a name and an icon to make it recognizable.</p>
                </div>

                {/* Name Input */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                        Board Name <span className="text-red-500">*</span>
                    </label>
                    <div className={`relative transition-all duration-200 ${isFocused === 'name' ? 'scale-[1.02]' : ''}`}>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => onChange('name', e.target.value)}
                            onFocus={() => setIsFocused('name')}
                            onBlur={() => setIsFocused(null)}
                            placeholder="e.g., Tech Jobs 2025"
                            className="w-full px-4 py-3.5 rounded-xl text-base border border-gray-200 dark:border-[#3d3c3e] bg-gray-50 dark:bg-[#2b2a2c] text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#635BFF] focus:bg-white dark:focus:bg-[#2b2a2c] focus:ring-2 focus:ring-[#635BFF]/20 transition-all outline-none"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Description Input */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                        Description <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <div className={`relative transition-all duration-200 ${isFocused === 'description' ? 'scale-[1.02]' : ''}`}>
                        <textarea
                            value={description}
                            onChange={(e) => onChange('description', e.target.value)}
                            onFocus={() => setIsFocused('description')}
                            onBlur={() => setIsFocused(null)}
                            placeholder="What kind of jobs will you track here?"
                            rows={3}
                            className="w-full px-4 py-3.5 rounded-xl text-base border border-gray-200 dark:border-[#3d3c3e] bg-gray-50 dark:bg-[#2b2a2c] text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#635BFF] focus:bg-white dark:focus:bg-[#2b2a2c] focus:ring-2 focus:ring-[#635BFF]/20 transition-all outline-none resize-none"
                        />
                    </div>
                </div>

                {/* Icon Selection */}
                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                        Icon
                    </label>
                    <div className="flex items-start gap-4">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-xl border-2 border-gray-200 dark:border-[#3d3c3e] bg-white dark:bg-[#2b2a2c] flex items-center justify-center text-2xl shadow-sm">
                                {icon || <Sparkles className="w-6 h-6 text-gray-300" />}
                            </div>
                            <input
                                type="text"
                                value={icon}
                                onChange={(e) => onChange('icon', e.target.value.slice(-2))} // Allow max 2 chars for emoji
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-wrap gap-2">
                                {EMOJI_SUGGESTIONS.slice(0, 8).map((emoji) => (
                                    <motion.button
                                        key={emoji}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => onChange('icon', emoji)}
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${icon === emoji
                                                ? 'bg-[#635BFF] text-white shadow-md'
                                                : 'bg-gray-100 dark:bg-[#2b2a2c] hover:bg-gray-200 dark:hover:bg-[#3d3c3e]'
                                            }`}
                                    >
                                        {emoji}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Bottom CTA */}
            <div className="p-4 bg-white dark:bg-[#1a191b] border-t border-gray-200 dark:border-[#3d3c3e] safe-area-bottom">
                <button
                    onClick={onNext}
                    disabled={!name.trim()}
                    className="w-full py-3.5 px-4 bg-[#635BFF] hover:bg-[#534be0] active:bg-[#4640c0] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-base shadow-lg shadow-[#635BFF]/20 transition-all flex items-center justify-center gap-2"
                >
                    <span>Next Step</span>
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
