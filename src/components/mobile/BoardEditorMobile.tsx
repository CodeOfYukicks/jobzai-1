import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Check, Loader2, MousePointer2, Hand, Pencil, Eraser,
    Square, ArrowRight, Type, StickyNote, Palette, Undo2,
    Redo2, ZoomOut, ZoomIn, Map, Minus
} from 'lucide-react';
import { Tldraw, Editor, loadSnapshot, DefaultColorStyle, DefaultSizeStyle } from 'tldraw';
import 'tldraw/tldraw.css';
import { WhiteboardDocument } from '../../types/whiteboardDoc';

// Hide tldraw watermark and adjust UI for mobile
const tldrawStyles = `
  /* Hide watermark only */
  .tlui-watermark_SEE-LICENSE,
  .tl-watermark_SEE-LICENSE,
  [class*="watermark"] {
    display: none !important;
  }
  
  /* Mobile adjustments */
  .tlui-layout {
    z-index: 0 !important;
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
    const minimapRef = useRef<HTMLCanvasElement>(null);

    // UI State
    const [activeTool, setActiveTool] = useState('select');
    const [showStylePanel, setShowStylePanel] = useState(false);
    const [showMinimap, setShowMinimap] = useState(false);
    const [selectedColor, setSelectedColor] = useState('black');
    const [selectedSize, setSelectedSize] = useState<'s' | 'm' | 'l' | 'xl'>('m');
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Detect dark mode
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };
        checkDarkMode();
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

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
            colorScheme: isDarkMode ? 'dark' : 'light'
        });

        // Zoom to fit content initially
        if (editorInstance.getCurrentPageShapeIds().size > 0) {
            editorInstance.zoomToFit();
        }
    }, [whiteboard?.snapshot, isDarkMode]);

    // Update minimap
    useEffect(() => {
        if (!editor || !minimapRef.current || !showMinimap) return;

        const canvas = minimapRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const updateMinimap = () => {
            const bounds = editor.getCurrentPageBounds();
            const viewport = editor.getViewportScreenBounds();
            const camera = editor.getCamera();

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (!bounds) return;

            // Calculate scale to fit bounds in canvas
            const padding = 10;
            const availableWidth = canvas.width - padding * 2;
            const availableHeight = canvas.height - padding * 2;

            const scaleX = availableWidth / (bounds.width || 1);
            const scaleY = availableHeight / (bounds.height || 1);
            const scale = Math.min(scaleX, scaleY, 0.1); // Cap max scale

            // Center content
            const offsetX = (canvas.width - bounds.width * scale) / 2;
            const offsetY = (canvas.height - bounds.height * scale) / 2;

            // Draw shapes (simplified)
            const shapeIds = editor.getCurrentPageShapeIds();
            ctx.fillStyle = isDarkMode ? '#3b82f6' : '#3b82f6';

            shapeIds.forEach(id => {
                const shape = editor.getShape(id);
                if (!shape) return;

                // Get shape bounds
                const shapeBounds = editor.getShapePageBounds(id);
                if (!shapeBounds) return;

                const x = (shapeBounds.x - bounds.x) * scale + offsetX;
                const y = (shapeBounds.y - bounds.y) * scale + offsetY;
                const w = shapeBounds.width * scale;
                const h = shapeBounds.height * scale;

                ctx.fillRect(x, y, w, h);
            });

            // Draw viewport rectangle
            const vx = (viewport.x - bounds.x) * scale + offsetX;
            const vy = (viewport.y - bounds.y) * scale + offsetY;
            const vw = viewport.width * scale;
            const vh = viewport.height * scale;

            ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(vx, vy, vw, vh);
        };

        // Initial update
        updateMinimap();

        // Subscribe to changes
        const cleanup = editor.store.listen(updateMinimap);

        // Also listen to camera changes
        const unsubscribeCamera = editor.on('change', () => {
            requestAnimationFrame(updateMinimap);
        });

        return () => {
            cleanup();
            unsubscribeCamera();
        };
    }, [editor, showMinimap, isDarkMode]);


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
                        hideUi={true}
                    />
                </div>

                {/* Style Panel - Mobile Position (Top) */}
                {editor && (
                    <AnimatePresence>
                        {showStylePanel && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                className="absolute top-4 left-4 right-4 z-[1000] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 flex flex-col gap-3"
                            >
                                {/* Colors */}
                                <div>
                                    <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Color</p>
                                    <div className="grid grid-cols-8 gap-1">
                                        {[
                                            { id: 'black', color: '#1e1e1e', dark: '#ffffff' },
                                            { id: 'grey', color: '#9ca3af', dark: '#9ca3af' },
                                            { id: 'red', color: '#ef4444', dark: '#f87171' },
                                            { id: 'orange', color: '#f97316', dark: '#fb923c' },
                                            { id: 'yellow', color: '#eab308', dark: '#facc15' },
                                            { id: 'green', color: '#22c55e', dark: '#4ade80' },
                                            { id: 'blue', color: '#3b82f6', dark: '#60a5fa' },
                                            { id: 'violet', color: '#8b5cf6', dark: '#a78bfa' },
                                        ].map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => {
                                                    setSelectedColor(c.id);
                                                    const selectedShapes = editor.getSelectedShapes();
                                                    if (selectedShapes.length > 0) {
                                                        const updates = selectedShapes.map(shape => ({
                                                            id: shape.id,
                                                            type: shape.type,
                                                            props: { ...shape.props, color: c.id }
                                                        }));
                                                        editor.updateShapes(updates);
                                                    }
                                                    editor.setStyleForNextShapes(DefaultColorStyle as any, c.id);
                                                }}
                                                className={`w-full aspect-square rounded-full transition-all ${selectedColor === c.id ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-900 scale-110' : ''}`}
                                                style={{ backgroundColor: isDarkMode ? c.dark : c.color }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Stroke Size */}
                                <div>
                                    <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Size</p>
                                    <div className="flex gap-2">
                                        {[
                                            { id: 's' as const, label: 'Small', width: 1 },
                                            { id: 'm' as const, label: 'Medium', width: 2 },
                                            { id: 'l' as const, label: 'Large', width: 3 },
                                            { id: 'xl' as const, label: 'Extra', width: 4 },
                                        ].map((s) => (
                                            <button
                                                key={s.id}
                                                onClick={() => {
                                                    setSelectedSize(s.id);
                                                    const selectedShapes = editor.getSelectedShapes();
                                                    if (selectedShapes.length > 0) {
                                                        const updates = selectedShapes.map(shape => ({
                                                            id: shape.id,
                                                            type: shape.type,
                                                            props: { ...shape.props, size: s.id }
                                                        }));
                                                        editor.updateShapes(updates);
                                                    }
                                                    editor.setStyleForNextShapes(DefaultSizeStyle as any, s.id);
                                                }}
                                                className={`flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-medium transition-all ${selectedSize === s.id
                                                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                                                    }`}
                                            >
                                                <Minus style={{ width: 12 + s.width * 4, height: s.width + 1 }} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}

                {/* Minimap - Mobile Position (Bottom Right) */}
                {editor && showMinimap && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute bottom-24 right-4 z-[999]"
                    >
                        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 overflow-hidden">
                            <div
                                className="relative w-32 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-crosshair"
                                onPointerDown={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const y = e.clientY - rect.top;

                                    const bounds = editor.getCurrentPageBounds();
                                    if (!bounds) return;

                                    const padding = 10;
                                    const availableWidth = 128 - padding * 2;
                                    const availableHeight = 96 - padding * 2;
                                    const scaleX = availableWidth / (bounds.width || 1);
                                    const scaleY = availableHeight / (bounds.height || 1);
                                    const scale = Math.min(scaleX, scaleY, 0.1);

                                    const canvasX = bounds.x + (x - padding) / scale;
                                    const canvasY = bounds.y + (y - padding) / scale;

                                    editor.centerOnPoint({ x: canvasX, y: canvasY }, { animation: { duration: 200 } });
                                }}
                            >
                                <canvas
                                    ref={minimapRef}
                                    width={128}
                                    height={96}
                                    className="w-full h-full pointer-events-none"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Custom Floating Toolbar */}
                {editor && (
                    <div className="absolute bottom-6 left-0 right-0 z-[1000] px-4">
                        <div className="flex items-center gap-1 px-2 py-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-x-auto no-scrollbar mx-auto w-full max-w-md">
                            {/* Select Tool */}
                            <button
                                onClick={() => { editor.setCurrentTool('select'); setActiveTool('select'); }}
                                className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${activeTool === 'select' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                            >
                                <MousePointer2 className="w-5 h-5" />
                            </button>

                            {/* Hand Tool */}
                            <button
                                onClick={() => { editor.setCurrentTool('hand'); setActiveTool('hand'); }}
                                className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${activeTool === 'hand' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                            >
                                <Hand className="w-5 h-5" />
                            </button>

                            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />

                            {/* Draw Tool */}
                            <button
                                onClick={() => { editor.setCurrentTool('draw'); setActiveTool('draw'); }}
                                className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${activeTool === 'draw' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                            >
                                <Pencil className="w-5 h-5" />
                            </button>

                            {/* Eraser */}
                            <button
                                onClick={() => { editor.setCurrentTool('eraser'); setActiveTool('eraser'); }}
                                className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${activeTool === 'eraser' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                            >
                                <Eraser className="w-5 h-5" />
                            </button>

                            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />

                            {/* Shapes */}
                            <button
                                onClick={() => { editor.setCurrentTool('geo'); setActiveTool('geo'); }}
                                className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${activeTool === 'geo' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                            >
                                <Square className="w-5 h-5" />
                            </button>

                            <button
                                onClick={() => { editor.setCurrentTool('arrow'); setActiveTool('arrow'); }}
                                className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${activeTool === 'arrow' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                            >
                                <ArrowRight className="w-5 h-5" />
                            </button>

                            <button
                                onClick={() => { editor.setCurrentTool('text'); setActiveTool('text'); }}
                                className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${activeTool === 'text' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                            >
                                <Type className="w-5 h-5" />
                            </button>

                            <button
                                onClick={() => { editor.setCurrentTool('note'); setActiveTool('note'); }}
                                className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${activeTool === 'note' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                            >
                                <StickyNote className="w-5 h-5" />
                            </button>

                            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />

                            {/* Style Panel Toggle */}
                            <button
                                onClick={() => setShowStylePanel(!showStylePanel)}
                                className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${showStylePanel ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                            >
                                <Palette className="w-5 h-5" />
                            </button>

                            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />

                            {/* Undo/Redo */}
                            <button
                                onClick={() => editor.undo()}
                                className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all flex-shrink-0"
                            >
                                <Undo2 className="w-5 h-5" />
                            </button>

                            <button
                                onClick={() => editor.redo()}
                                className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all flex-shrink-0"
                            >
                                <Redo2 className="w-5 h-5" />
                            </button>

                            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />

                            {/* Minimap Toggle */}
                            <button
                                onClick={() => setShowMinimap(!showMinimap)}
                                className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${showMinimap ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                            >
                                <Map className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
