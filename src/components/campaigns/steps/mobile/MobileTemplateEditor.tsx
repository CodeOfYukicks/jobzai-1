import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ChevronLeft } from 'lucide-react';

interface MobileTemplateEditorProps {
    initialSubject: string;
    initialBody: string;
    onSave: (subject: string, body: string) => void;
    onCancel: () => void;
}

const MERGE_FIELDS = [
    { field: '{{firstName}}', label: 'First Name' },
    { field: '{{lastName}}', label: 'Last Name' },
    { field: '{{company}}', label: 'Company' },
    { field: '{{position}}', label: 'Position' },
    { field: '{{location}}', label: 'Location' },
];

export default function MobileTemplateEditor({
    initialSubject,
    initialBody,
    onSave,
    onCancel
}: MobileTemplateEditorProps) {
    const [subject, setSubject] = useState(initialSubject);
    const [body, setBody] = useState(initialBody);
    const [activeField, setActiveField] = useState<'subject' | 'body'>('body');

    const subjectRef = useRef<HTMLInputElement>(null);
    const bodyRef = useRef<HTMLTextAreaElement>(null);

    const insertMergeField = (field: string) => {
        if (activeField === 'subject') {
            const input = subjectRef.current;
            if (!input) {
                setSubject(prev => prev + field);
                return;
            }
            const start = input.selectionStart || 0;
            const end = input.selectionEnd || 0;
            const newText = subject.substring(0, start) + field + subject.substring(end);
            setSubject(newText);
            setTimeout(() => {
                input.focus();
                input.setSelectionRange(start + field.length, start + field.length);
            }, 0);
        } else {
            const textarea = bodyRef.current;
            if (!textarea) {
                setBody(prev => prev + field);
                return;
            }
            const start = textarea.selectionStart || 0;
            const end = textarea.selectionEnd || 0;
            const newText = body.substring(0, start) + field + body.substring(end);
            setBody(newText);
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + field.length, start + field.length);
            }, 0);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-white dark:bg-[#121212] flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
                <button
                    onClick={onCancel}
                    className="p-2 -ml-2 text-gray-500 dark:text-white/60"
                >
                    <X className="w-6 h-6" />
                </button>
                <span className="font-semibold text-[17px] text-gray-900 dark:text-white">
                    Edit Template
                </span>
                <button
                    onClick={() => onSave(subject, body)}
                    className="text-[17px] font-semibold text-[#b7e219]"
                >
                    Save
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-6">
                    {/* Subject */}
                    <div className="space-y-2">
                        <label className="text-[13px] font-medium text-gray-500 dark:text-white/40 uppercase tracking-wide">
                            Subject
                        </label>
                        <input
                            ref={subjectRef}
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            onFocus={() => setActiveField('subject')}
                            className="w-full text-[16px] bg-transparent border-b border-gray-200 dark:border-white/[0.1] py-2
                focus:border-[#b7e219] focus:outline-none transition-colors
                text-gray-900 dark:text-white placeholder-gray-400"
                            placeholder="Enter subject..."
                        />
                    </div>

                    {/* Body */}
                    <div className="space-y-2">
                        <label className="text-[13px] font-medium text-gray-500 dark:text-white/40 uppercase tracking-wide">
                            Body
                        </label>
                        <textarea
                            ref={bodyRef}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            onFocus={() => setActiveField('body')}
                            className="w-full h-[400px] text-[16px] bg-transparent border-none p-0
                focus:ring-0 focus:outline-none resize-none leading-relaxed
                text-gray-900 dark:text-white placeholder-gray-400"
                            placeholder="Write your email..."
                        />
                    </div>
                </div>
            </div>

            {/* Merge Fields Toolbar */}
            <div className="border-t border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-[#1a1a1a] pb-safe">
                <div className="px-4 py-2">
                    <p className="text-[11px] text-gray-400 dark:text-white/30 mb-2 font-medium">
                        TAP TO INSERT VARIABLE
                    </p>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {MERGE_FIELDS.map((item) => (
                            <button
                                key={item.field}
                                onClick={() => insertMergeField(item.field)}
                                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-white dark:bg-white/[0.06] 
                  border border-gray-200 dark:border-white/[0.04] shadow-sm
                  text-[13px] font-medium text-gray-700 dark:text-white/80
                  active:scale-95 transition-transform"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
