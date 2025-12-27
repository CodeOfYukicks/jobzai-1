import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2 } from 'lucide-react';
import NotionEditor from '../notion-editor/NotionEditor';
import { NotionDocument } from '../../lib/notionDocService';

interface NoteEditorMobileProps {
    note: NotionDocument;
    onSave: () => Promise<void>;
    onClose: () => void;
    onTitleChange: (newTitle: string) => void;
    onContentChange: (content: any) => void;
    isSaving: boolean;
    lastSaved: Date | null;
    hasUnsavedChanges: boolean;
}

export default function NoteEditorMobile({
    note,
    onSave,
    onClose,
    onTitleChange,
    onContentChange,
    isSaving,
    lastSaved,
    hasUnsavedChanges
}: NoteEditorMobileProps) {
    const [title, setTitle] = useState(note.title || '');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);

    // Sync local title state with prop
    useEffect(() => {
        setTitle(note.title || '');
    }, [note.title]);

    const handleTitleSubmit = () => {
        if (title.trim() !== note.title) {
            onTitleChange(title);
        }
        setIsEditingTitle(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-[#1a1a1b] flex flex-col safe-top safe-bottom">
            {/* Top Bar */}
            <div className="flex-shrink-0 h-14 px-4 flex items-center justify-between border-b border-gray-100 dark:border-[#2d2c2e] bg-white dark:bg-[#1a1a1b]">
                {/* Left: Close */}
                <button
                    onClick={onClose}
                    className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-[#2d2c2e] transition-colors"
                >
                    <X className="w-6 h-6 text-gray-900 dark:text-white" />
                </button>

                {/* Center: Title */}
                <div className="flex-1 mx-2 text-center">
                    {isEditingTitle ? (
                        <input
                            ref={titleInputRef}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleSubmit}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                            className="w-full text-center bg-transparent text-[17px] font-semibold text-gray-900 dark:text-white border-none outline-none p-0"
                            autoFocus
                        />
                    ) : (
                        <h1
                            onClick={() => setIsEditingTitle(true)}
                            className="text-[17px] font-semibold text-gray-900 dark:text-white truncate max-w-[200px] mx-auto"
                        >
                            {title || 'Untitled Note'}
                        </h1>
                    )}
                </div>

                {/* Right: Save/Status */}
                <div className="w-10 flex justify-end">
                    {isSaving ? (
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : hasUnsavedChanges ? (
                        <button
                            onClick={onSave}
                            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-[#2d2c2e] transition-colors"
                        >
                            <Check className="w-6 h-6 text-[#635BFF]" />
                        </button>
                    ) : (
                        <Check className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                    )}
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#1a1a1b]">
                <div className="min-h-full px-4 py-6 pb-32">
                    <NotionEditor
                        content={note.content}
                        onChange={onContentChange}
                        placeholder="Start writing..."
                        className="prose-lg dark:prose-invert focus:outline-none"
                    />
                </div>
            </div>
        </div>
    );
}
