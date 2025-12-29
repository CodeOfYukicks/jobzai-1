import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Sparkles, Loader2, Wand2 } from 'lucide-react';
import MergeFieldPills from '../../MergeFieldPills';
import { useAvatarConfig } from '@/hooks/useAvatarConfig';
import Avatar from '@/components/assistant/avatar/Avatar';

interface MobileVariantEditorProps {
    initialValue: string;
    type: 'hook' | 'body' | 'cta';
    title: string;
    subtitle: string;
    placeholder: string;
    onSave: (value: string) => void;
    onCancel: () => void;
    onGenerate: () => Promise<string>;
    isGenerating: boolean;
}

export default function MobileVariantEditor({
    initialValue,
    type,
    title,
    subtitle,
    placeholder,
    onSave,
    onCancel,
    onGenerate,
    isGenerating
}: MobileVariantEditorProps) {
    const [value, setValue] = useState(initialValue);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const avatarConfig = useAvatarConfig();

    // Auto-focus textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            // Move cursor to end
            textareaRef.current.setSelectionRange(value.length, value.length);
        }
    }, []);

    const handleInsertMergeField = (field: string) => {
        if (!textareaRef.current) return;

        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const newValue = value.substring(0, start) + field + value.substring(end);

        setValue(newValue);

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newPosition = start + field.length;
                textareaRef.current.setSelectionRange(newPosition, newPosition);
            }
        }, 0);
    };

    const handleGenerate = async () => {
        const generated = await onGenerate();
        if (generated) {
            setValue(generated);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[70] bg-white dark:bg-[#1a1a1a] flex flex-col safe-top safe-bottom"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
                <button
                    onClick={onCancel}
                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-500 dark:text-white/60"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center">
                    <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                        {title}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-white/40">
                        {subtitle}
                    </p>
                </div>

                <button
                    onClick={() => onSave(value)}
                    disabled={!value.trim()}
                    className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.06] text-[#b7e219] disabled:opacity-40 disabled:text-gray-400"
                >
                    <Check className="w-5 h-5" />
                </button>
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 w-full bg-transparent border-none resize-none focus:ring-0 p-0
            text-[16px] leading-relaxed text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20"
                />

                {/* AI Generation Button */}
                <div className="mt-4 mb-4">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
              bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]
              text-gray-600 dark:text-white/60 font-medium text-[14px]
              active:scale-[0.98] transition-all"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Writing...</span>
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-4 h-4 text-[#b7e219]" />
                                <span>Generate with AI</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Merge Fields */}
                <div className="pt-4 border-t border-gray-100 dark:border-white/[0.06]">
                    <p className="text-[11px] font-medium text-gray-400 dark:text-white/30 uppercase tracking-wider mb-3">
                        Insert Variable
                    </p>
                    <MergeFieldPills onInsert={handleInsertMergeField} />
                </div>
            </div>
        </motion.div>
    );
}
