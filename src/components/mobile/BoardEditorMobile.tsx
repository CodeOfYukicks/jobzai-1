import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2 } from 'lucide-react';
import { Tldraw, Editor, loadSnapshot, getSnapshot } from 'tldraw';
import 'tldraw/tldraw.css';
import { WhiteboardDocument } from '../../types/whiteboardDoc';

// Hide tldraw watermark and adjust UI for mobile
const tldrawStyles = `
  .tlui-watermark_SEE-LICENSE {
    display: none !important;
  }
  .tl-watermark_SEE-LICENSE {
    display: none !important;
  }
  [class*="watermark"] {
    display: none !important;
  }
  /* Mobile adjustments */
  .tlui-layout {
    z-index: 0 !important;
  }
  /* Hide desktop-like UI elements if needed */
  .tlui-menu-zone {
    display: none !important;
  }
  .tlui-navigation-zone {
    display: none !important; /* Hide zoom controls to save space */
  }
  .tlui-help-menu {
    display: none !important;
  }
  .tlui-debug-panel {
    display: none !important;
  }
`;

interface BoardEditorMobileProps {
    whiteboard: WhiteboardDocument;
    onSave: () => Promise<void>;
    onClose: () => void;
    onTitleChange: (newTitle: string) => void;
    isSaving: boolean;
}

export default function BoardEditorMobile({
    whiteboard,
    onSave,
    onClose,
    onTitleChange,
    isSaving
}: BoardEditorMobileProps) {
    const [title, setTitle] = useState(whiteboard.title || '');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editor, setEditor] = useState<Editor | null>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    // Sync local title state with prop
    useEffect(() => {
        setTitle(whiteboard.title || '');
    }, [whiteboard.title]);

    const handleTitleSubmit = () => {
        if (title.trim() !== whiteboard.title) {
            onTitleChange(title);
        }
        setIsEditingTitle(false);
    };

    // Handle Tldraw mount
    const handleMount = useCallback((editorInstance: Editor) => {
        setEditor(editorInstance);

        // Load saved snapshot if available
        if (whiteboard?.snapshot) {
            try {
                const snapshot = JSON.parse(whiteboard.snapshot);
                loadSnapshot(editorInstance.store, snapshot);
            } catch (error) {
                console.error('[WHITEBOARD] Error loading snapshot:', error);
            }
        }

        // Set mobile mode preferences
        editorInstance.user.updateUserPreferences({
            isSnapMode: true,
        });

        // Zoom to fit content initially
        if (editorInstance.getCurrentPageShapeIds().size > 0) {
            editorInstance.zoomToFit();
        }
    }, [whiteboard?.snapshot]);

    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-[#1a1a1b] flex flex-col safe-top safe-bottom">
            {/* Top Bar */}
            <div className="flex-shrink-0 h-14 px-4 flex items-center justify-between border-b border-gray-100 dark:border-[#2d2c2e] bg-white dark:bg-[#1a1a1b] z-50 relative">
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
                            {title || 'Untitled Board'}
                        </h1>
                    )}
                </div>

                {/* Right: Save/Status */}
                <div className="w-10 flex justify-end">
                    {isSaving ? (
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : (
                        <button
                            onClick={onSave}
                            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-[#2d2c2e] transition-colors"
                        >
                            <Check className="w-6 h-6 text-[#635BFF]" />
                        </button>
                    )}
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 relative bg-gray-50 dark:bg-[#1a1a1b] overflow-hidden">
                <style>{tldrawStyles}</style>
                <div className="absolute inset-0">
                    <Tldraw
                        onMount={handleMount}
                        persistenceKey={`whiteboard-${whiteboard.id}`}
                        hideUi={false} // Keep UI but hide specific parts via CSS
                    />
                </div>
            </div>
        </div>
    );
}
