import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  MoreHorizontal,
  Trash2,
  FileText,
  Check,
  X,
  Pencil,
  MousePointer2,
  Hand,
  Square,
  Circle,
  Type,
  StickyNote,
  ArrowRight,
  Eraser,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Palette,
  Map,
  Minus,
  ChevronDown,
} from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import BoardEditorMobile from '../components/mobile/BoardEditorMobile';
import { useAuth } from '../contexts/AuthContext';
import { useAssistant, WhiteboardEditorCallbacks, MindMapStructure, FlowDiagramNode, FlowDiagramConnection, WhiteboardPosition } from '../contexts/AssistantContext';
import { useAssistantPageData } from '../hooks/useAssistantPageData';
import { Tldraw, getSnapshot, loadSnapshot, Editor, DefaultColorStyle, DefaultSizeStyle } from 'tldraw';
import 'tldraw/tldraw.css';
import {
  createStickyNote,
  createTextBox,
  createFrame,
  createStickyNotes,
  createMindMap,
  createFlowDiagram,
  getViewportCenter,
  zoomToFit as tldrawZoomToFit,
  getShapeIds,
} from '../lib/tldrawHelpers';
import { GeneratedStickyNote } from '../lib/whiteboardAI';

// Hide tldraw watermark and ensure toolbar visibility
const tldrawStyles = `
  /* Hide watermark only */
  .tlui-watermark_SEE-LICENSE,
  .tl-watermark_SEE-LICENSE,
  [class*="watermark"] {
    display: none !important;
  }
  
  /* Ensure the tldraw container fills the space */
  .tldraw-container {
    width: 100% !important;
    height: 100% !important;
  }
  
  /* Force tldraw editor to take full space */
  .tldraw-container .tldraw,
  .tldraw-container .tldraw__editor {
    width: 100% !important;
    height: 100% !important;
  }
  
  /* Ensure tlui-layout is visible and properly positioned */
  .tldraw-container .tlui-layout {
    z-index: 100 !important;
    position: absolute !important;
    inset: 0 !important;
    pointer-events: none;
  }
  
  /* Make toolbar clickable */
  .tldraw-container .tlui-layout * {
    pointer-events: auto;
  }
  
  /* Force toolbar visibility at bottom */
  .tldraw-container .tlui-layout__bottom {
    position: absolute !important;
    bottom: 16px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    z-index: 1000 !important;
    display: flex !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
  
  /* Ensure toolbar inner is visible */
  .tldraw-container .tlui-toolbar,
  .tldraw-container .tlui-toolbar__inner {
    display: flex !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
  
  /* Top toolbar area */
  .tldraw-container .tlui-layout__top {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 1000 !important;
  }
`;

import {
  getWhiteboard,
  updateWhiteboard,
  deleteWhiteboard,
  saveWhiteboardSnapshot,
  saveWhiteboardThumbnail,
} from '../lib/whiteboardDocService';
import { WhiteboardDocument } from '../types/whiteboardDoc';
import { notify } from '@/lib/notify';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Common emojis for quick selection
const commonEmojis = [
  '🎨', '📝', '💡', '🚀', '⭐', '🎯', '📊', '🗂️',
  '📋', '📌', '💼', '🔧', '✅', '❤️', '📚', '🖼️',
];

export default function WhiteboardEditorPage() {
  const { whiteboardId } = useParams<{ whiteboardId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isOpen: isAssistantOpen, registerWhiteboardEditor, unregisterWhiteboardEditor } = useAssistant();

  const [whiteboard, setWhiteboard] = useState<WhiteboardDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTool, setActiveTool] = useState('select');
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [selectedColor, setSelectedColor] = useState('black');
  const [selectedSize, setSelectedSize] = useState<'s' | 'm' | 'l' | 'xl'>('m');

  // Editor state
  const [editor, setEditor] = useState<Editor | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Sync tldraw color scheme with app theme
  useEffect(() => {
    if (editor) {
      editor.user.updateUserPreferences({
        colorScheme: isDarkMode ? 'dark' : 'light'
      });
    }
  }, [editor, isDarkMode]);

  // Update minimap in real-time
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
      ctx.fillStyle = isDarkMode ? '#1f2937' : '#f3f4f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!bounds) return;

      // Calculate scale to fit content in minimap
      const padding = 10;
      const availableWidth = canvas.width - padding * 2;
      const availableHeight = canvas.height - padding * 2;
      const scaleX = availableWidth / (bounds.width || 1);
      const scaleY = availableHeight / (bounds.height || 1);
      const scale = Math.min(scaleX, scaleY, 0.1);

      // Draw shapes as simple rectangles
      const shapes = editor.getCurrentPageShapes();
      shapes.forEach(shape => {
        const shapeBounds = editor.getShapePageBounds(shape);
        if (!shapeBounds) return;

        const x = padding + (shapeBounds.x - bounds.x) * scale;
        const y = padding + (shapeBounds.y - bounds.y) * scale;
        const w = Math.max(2, shapeBounds.width * scale);
        const h = Math.max(2, shapeBounds.height * scale);

        // Color based on shape type
        if (shape.type === 'note') {
          ctx.fillStyle = '#fbbf24';
        } else if (shape.type === 'draw') {
          ctx.fillStyle = isDarkMode ? '#60a5fa' : '#3b82f6';
        } else if (shape.type === 'geo') {
          ctx.fillStyle = isDarkMode ? '#a78bfa' : '#8b5cf6';
        } else if (shape.type === 'arrow') {
          ctx.fillStyle = isDarkMode ? '#94a3b8' : '#64748b';
        } else {
          ctx.fillStyle = isDarkMode ? '#6b7280' : '#9ca3af';
        }

        ctx.fillRect(x, y, w, h);
      });

      // Draw viewport indicator
      const viewportX = padding + (-camera.x / camera.z - bounds.x) * scale;
      const viewportY = padding + (-camera.y / camera.z - bounds.y) * scale;
      const viewportW = viewport.width / camera.z * scale;
      const viewportH = viewport.height / camera.z * scale;

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(viewportX, viewportY, viewportW, viewportH);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.fillRect(viewportX, viewportY, viewportW, viewportH);
    };

    // Initial update
    updateMinimap();

    // Subscribe to store changes
    const unsubscribe = editor.store.listen(() => {
      requestAnimationFrame(updateMinimap);
    });

    return () => unsubscribe();
  }, [editor, showMinimap, isDarkMode]);

  // Fetch whiteboard data
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !whiteboardId) {
        setIsLoading(false);
        return;
      }

      try {
        const fetchedWhiteboard = await getWhiteboard(currentUser.uid, whiteboardId);
        if (fetchedWhiteboard) {
          setWhiteboard(fetchedWhiteboard);
          setEditedTitle(fetchedWhiteboard.title || '');
        } else {
          notify.error('Whiteboard not found');
          navigate('/resume-builder');
        }
      } catch (error) {
        console.error('Error fetching whiteboard:', error);
        notify.error('Failed to load whiteboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser, whiteboardId, navigate]);

  // Handle tldraw mount
  const handleMount = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance);
    editorRef.current = editorInstance;

    // Ensure UI is visible - disable focus mode
    editorInstance.updateInstanceState({ isFocusMode: false });

    // Load saved snapshot if available
    if (whiteboard?.snapshot) {
      try {
        const snapshot = JSON.parse(whiteboard.snapshot);
        loadSnapshot(editorInstance.store, snapshot);
        console.log('[WHITEBOARD] Loaded snapshot');

        // Make sure focus mode stays off after snapshot load
        editorInstance.updateInstanceState({ isFocusMode: false });
      } catch (error) {
        console.error('[WHITEBOARD] Error loading snapshot:', error);
      }
    }

    // Ensure focus mode is off (in case snapshot had it enabled)
    setTimeout(() => {
      editorInstance.updateInstanceState({ isFocusMode: false });
    }, 100);

    // Auto-save on changes
    let saveTimeout: NodeJS.Timeout | null = null;

    const unsubscribe = editorInstance.store.listen(() => {
      if (!currentUser || !whiteboardId) return;

      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      saveTimeout = setTimeout(async () => {
        try {
          const snapshot = getSnapshot(editorInstance.store);
          await saveWhiteboardSnapshot(currentUser.uid, whiteboardId, snapshot);
          console.log('[WHITEBOARD] Auto-saved');
        } catch (error) {
          console.error('[WHITEBOARD] Auto-save error:', error);
        }
      }, 2000);
    });

    return () => {
      unsubscribe();
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [currentUser, whiteboardId, whiteboard?.snapshot]);

  // Save thumbnail on leave
  const saveThumbnail = useCallback(async () => {
    if (!editor || !currentUser || !whiteboardId) return;

    try {
      const shapeIds = editor.getCurrentPageShapeIds();
      if (shapeIds.size === 0) return;

      const svgResult = await editor.getSvgElement([...shapeIds], {
        background: true,
        padding: 16,
      });

      if (!svgResult?.svg) return;

      const svgString = new XMLSerializer().serializeToString(svgResult.svg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = 0.5;
          canvas.width = Math.min(img.width * scale, 400);
          canvas.height = Math.min(img.height * scale, 300);

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }

          canvas.toBlob(async (blob) => {
            if (blob) {
              const timestamp = Date.now();
              const fileName = `whiteboard_${whiteboardId}_thumb_${timestamp}.png`;
              const thumbRef = ref(storage, `whiteboard-thumbnails/${currentUser.uid}/${fileName}`);

              await uploadBytes(thumbRef, blob, { contentType: 'image/png' });
              const thumbnailUrl = await getDownloadURL(thumbRef);

              await saveWhiteboardThumbnail(currentUser.uid, whiteboardId, thumbnailUrl);
            }
            resolve();
          }, 'image/png', 0.8);

          URL.revokeObjectURL(svgUrl);
        };
        img.onerror = () => {
          URL.revokeObjectURL(svgUrl);
          reject(new Error('Failed to load SVG'));
        };
        img.src = svgUrl;
      });
    } catch (error) {
      console.error('[WHITEBOARD] Error saving thumbnail:', error);
    }
  }, [editor, currentUser, whiteboardId]);

  // Save before leaving
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (!editorRef.current || !currentUser || !whiteboardId) return;
      try {
        const snapshot = getSnapshot(editorRef.current.store);
        await saveWhiteboardSnapshot(currentUser.uid, whiteboardId, snapshot);
      } catch (error) {
        console.error('[WHITEBOARD] Error saving before unload:', error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleBeforeUnload();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser, whiteboardId]);

  // Handle title change
  const handleTitleSave = useCallback(async (titleToSave?: string) => {
    const title = titleToSave !== undefined ? titleToSave : editedTitle;
    if (!currentUser || !whiteboardId || !title.trim()) return;

    try {
      await updateWhiteboard({
        userId: currentUser.uid,
        whiteboardId,
        updates: { title: title.trim() },
      });
      setWhiteboard((prev) => prev ? { ...prev, title: title.trim() } : null);
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Error updating title:', error);
      notify.error('Failed to update title');
    }
  }, [currentUser, whiteboardId, editedTitle]);

  // Handle emoji change
  const handleEmojiChange = useCallback(async (emoji: string) => {
    if (!currentUser || !whiteboardId) return;

    try {
      await updateWhiteboard({
        userId: currentUser.uid,
        whiteboardId,
        updates: { emoji },
      });
      setWhiteboard((prev) => prev ? { ...prev, emoji } : null);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error updating emoji:', error);
    }
  }, [currentUser, whiteboardId]);

  // Delete whiteboard
  const handleDelete = useCallback(async () => {
    if (!currentUser || !whiteboardId) return;

    setIsDeleting(true);
    try {
      await deleteWhiteboard(currentUser.uid, whiteboardId);
      notify.success('Whiteboard deleted');
      navigate('/resume-builder');
    } catch (error) {
      console.error('Error deleting whiteboard:', error);
      notify.error('Failed to delete whiteboard');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [currentUser, whiteboardId, navigate]);

  // Create whiteboard callbacks for AI assistant integration
  const whiteboardCallbacks = useMemo<WhiteboardEditorCallbacks | null>(() => {
    if (!editor) return null;

    return {
      addStickyNote: async (text: string, color?: string, position?: WhiteboardPosition): Promise<string> => {
        const id = createStickyNote(editor, text, color || 'yellow', position);
        return id.toString();
      },
      addTextBox: async (text: string, position?: WhiteboardPosition): Promise<string> => {
        const id = createTextBox(editor, text, position);
        return id.toString();
      },
      addFrame: async (title: string, bounds?: { x: number; y: number; width: number; height: number }): Promise<string> => {
        const id = createFrame(editor, title, bounds);
        return id.toString();
      },
      createMindMap: async (structure: MindMapStructure): Promise<string[]> => {
        const ids = createMindMap(editor, structure);
        return ids.map(id => id.toString());
      },
      createFlowDiagram: async (nodes: FlowDiagramNode[], connections: FlowDiagramConnection[]): Promise<string[]> => {
        const ids = createFlowDiagram(editor, nodes, connections);
        return ids.map(id => id.toString());
      },
      getViewportCenter: (): WhiteboardPosition => {
        return getViewportCenter(editor);
      },
      zoomToFit: (): void => {
        tldrawZoomToFit(editor);
      },
      getShapeIds: (): string[] => {
        return getShapeIds(editor);
      },
      getEditor: () => editor,
    };
  }, [editor]);

  // Register whiteboard with AI assistant
  useEffect(() => {
    if (whiteboardCallbacks) {
      registerWhiteboardEditor(whiteboardCallbacks);
      console.log('[WHITEBOARD] Registered with AI assistant');
    }

    return () => {
      unregisterWhiteboardEditor();
      console.log('[WHITEBOARD] Unregistered from AI assistant');
    };
  }, [whiteboardCallbacks, registerWhiteboardEditor, unregisterWhiteboardEditor]);

  // Register page data for AI assistant context
  const whiteboardSummary = useMemo(() => {
    if (!whiteboard) return null;

    return {
      title: whiteboard.title || 'Untitled Whiteboard',
      id: whiteboardId,
      shapeCount: editor ? getShapeIds(editor).length : 0,
      hasContent: editor ? getShapeIds(editor).length > 0 : false,
    };
  }, [whiteboard, whiteboardId, editor]);

  useAssistantPageData('currentWhiteboard', whiteboardSummary, !!whiteboard);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex h-full items-center justify-center bg-white dark:bg-gray-950">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Loading whiteboard...</span>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (!whiteboard) {
    return (
      <AuthLayout>
        <div className="flex h-full flex-col items-center justify-center bg-white dark:bg-gray-950 gap-4">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">Whiteboard not found</p>
          <button
            onClick={() => navigate('/resume-builder')}
            className="px-4 py-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
          >
            Go back
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {/* Mobile Editor */}
      <div className="md:hidden h-full">
        {whiteboard && (
          <BoardEditorMobile
            whiteboard={whiteboard}
            onSave={async () => {
              if (editorRef.current && currentUser && whiteboardId) {
                const snapshot = getSnapshot(editorRef.current.store);
                await saveWhiteboardSnapshot(currentUser.uid, whiteboardId, snapshot);
              }
              navigate('/resume-builder');
            }}
            onClose={() => navigate('/resume-builder')}
            onTitleChange={handleTitleSave}
            isSaving={false}
          />
        )}
      </div>

      {/* Desktop Editor */}
      <div className={`hidden md:flex flex-col h-full min-h-0 transition-all duration-300 ${isAssistantOpen ? 'mr-[440px]' : 'mr-0'}`}>
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-40">
          <div className="flex items-center gap-3">
            {/* Close button */}
            <button
              onClick={() => navigate('/resume-builder')}
              className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Emoji picker */}
            <div className="relative" ref={emojiPickerRef}>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-1.5 transition-colors"
              >
                {whiteboard.emoji || '🎨'}
              </button>

              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute left-0 mt-2 p-3 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50"
                  >
                    <div className="grid grid-cols-8 gap-1">
                      {commonEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleEmojiChange(emoji)}
                          className={`p-2 text-xl rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${whiteboard.emoji === emoji ? 'bg-amber-100 dark:bg-amber-900/30' : ''
                            }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Title */}
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSave();
                    if (e.key === 'Escape') {
                      setIsEditingTitle(false);
                      setEditedTitle(whiteboard.title || '');
                    }
                  }}
                  autoFocus
                  className="px-3 py-1.5 text-lg font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 rounded-lg border-none outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <button
                  onClick={() => handleTitleSave()}
                  className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsEditingTitle(false);
                    setEditedTitle(whiteboard.title || '');
                  }}
                  className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="flex items-center gap-2 group"
              >
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {whiteboard.title || 'Untitled Whiteboard'}
                </h1>
                <Pencil className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>

          {/* Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1 z-50"
                >
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Whiteboard
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Tldraw Canvas - Takes all remaining space */}
        <div className="flex-1 relative min-h-0" style={{ minHeight: '400px' }}>
          <div className="absolute inset-0 tldraw-container" style={{ zIndex: 1 }}>
            <style>{tldrawStyles}</style>
            <Tldraw
              onMount={handleMount}
              persistenceKey={`whiteboard-${whiteboardId}`}
              autoFocus
            />
          </div>

          {/* Style Panel - Right Side */}
          {editor && (
            <AnimatePresence>
              {showStylePanel && (
                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  className="fixed top-24 md:top-[35%] right-4 transform md:-translate-y-1/2 z-[1000] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 flex flex-col gap-2"
                >
                  {/* Colors */}
                  <div>
                    <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Color</p>
                    <div className="grid grid-cols-2 gap-1">
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
                            // Apply to selected shapes
                            const selectedShapes = editor.getSelectedShapes();
                            if (selectedShapes.length > 0) {
                              const updates = selectedShapes.map(shape => ({
                                id: shape.id,
                                type: shape.type,
                                props: { ...shape.props, color: c.id }
                              }));
                              editor.updateShapes(updates);
                            }
                            // Set for next shapes
                            editor.setStyleForNextShapes(DefaultColorStyle as any, c.id);
                          }}
                          className={`w-5 h-5 rounded-full transition-all hover:scale-110 ${selectedColor === c.id ? 'ring-2 ring-offset-1 ring-blue-500 dark:ring-offset-gray-900' : ''
                            }`}
                          style={{ backgroundColor: isDarkMode ? c.dark : c.color }}
                          title={c.id.charAt(0).toUpperCase() + c.id.slice(1)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Stroke Size */}
                  <div>
                    <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Size</p>
                    <div className="flex flex-col gap-1">
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
                            // Apply to selected shapes
                            const selectedShapes = editor.getSelectedShapes();
                            if (selectedShapes.length > 0) {
                              const updates = selectedShapes.map(shape => ({
                                id: shape.id,
                                type: shape.type,
                                props: { ...shape.props, size: s.id }
                              }));
                              editor.updateShapes(updates);
                            }
                            // Set for next shapes
                            editor.setStyleForNextShapes(DefaultSizeStyle as any, s.id);
                          }}
                          className={`flex items-center gap-2 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${selectedSize === s.id
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                            }`}
                        >
                          <div className="w-4 flex items-center justify-center">
                            <Minus style={{ width: 8 + s.width * 3, height: s.width }} />
                          </div>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Custom Floating Toolbar */}
          {editor && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] max-w-[calc(100vw-32px)] w-full sm:w-auto">
              <div className="flex items-center gap-1 px-2 py-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-x-auto no-scrollbar mx-auto w-fit">
                {/* Select Tool */}
                <button
                  onClick={() => { editor.setCurrentTool('select'); setActiveTool('select'); }}
                  className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${activeTool === 'select' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                  title="Select (V)"
                >
                  <MousePointer2 className="w-5 h-5" />
                </button>

                {/* Hand Tool */}
                <button
                  onClick={() => { editor.setCurrentTool('hand'); setActiveTool('hand'); }}
                  className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${activeTool === 'hand' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                  title="Hand (H)"
                >
                  <Hand className="w-5 h-5" />
                </button>

                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />

                {/* Draw Tool */}
                <button
                  onClick={() => { editor.setCurrentTool('draw'); setActiveTool('draw'); }}
                  className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${activeTool === 'draw' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                  title="Draw (D)"
                >
                  <Pencil className="w-5 h-5" />
                </button>

                {/* Eraser */}
                <button
                  onClick={() => { editor.setCurrentTool('eraser'); setActiveTool('eraser'); }}
                  className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${activeTool === 'eraser' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                  title="Eraser (E)"
                >
                  <Eraser className="w-5 h-5" />
                </button>

                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />

                {/* Rectangle */}
                <button
                  onClick={() => { editor.setCurrentTool('geo'); setActiveTool('geo'); }}
                  className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${activeTool === 'geo' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                  title="Shapes (R)"
                >
                  <Square className="w-5 h-5" />
                </button>

                {/* Arrow */}
                <button
                  onClick={() => { editor.setCurrentTool('arrow'); setActiveTool('arrow'); }}
                  className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${activeTool === 'arrow' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                  title="Arrow (A)"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>

                {/* Text */}
                <button
                  onClick={() => { editor.setCurrentTool('text'); setActiveTool('text'); }}
                  className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${activeTool === 'text' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                  title="Text (T)"
                >
                  <Type className="w-5 h-5" />
                </button>

                {/* Note */}
                <button
                  onClick={() => { editor.setCurrentTool('note'); setActiveTool('note'); }}
                  className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${activeTool === 'note' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                  title="Sticky Note (N)"
                >
                  <StickyNote className="w-5 h-5" />
                </button>

                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />

                {/* Style Panel Toggle */}
                <button
                  onClick={() => setShowStylePanel(!showStylePanel)}
                  className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${showStylePanel ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                  title="Styles"
                >
                  <Palette className="w-5 h-5" />
                </button>

                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />

                {/* Undo */}
                <button
                  onClick={() => editor.undo()}
                  className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all flex-shrink-0"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="w-5 h-5" />
                </button>

                {/* Redo */}
                <button
                  onClick={() => editor.redo()}
                  className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all flex-shrink-0"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 className="w-5 h-5" />
                </button>

                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />

                {/* Zoom Out */}
                <button
                  onClick={() => editor.zoomOut()}
                  className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all flex-shrink-0"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>

                {/* Zoom In */}
                <button
                  onClick={() => editor.zoomIn()}
                  className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all flex-shrink-0"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>

                {/* Minimap Toggle */}
                <button
                  onClick={() => setShowMinimap(!showMinimap)}
                  className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${showMinimap ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                  title="Minimap"
                >
                  <Map className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Minimap */}
          {editor && showMinimap && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed bottom-24 right-4 md:bottom-4 md:right-4 z-[999]"
            >
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 overflow-hidden">
                <div
                  className="relative w-40 h-28 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-crosshair"
                  onPointerDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    const bounds = editor.getCurrentPageBounds();
                    if (!bounds) return;

                    const padding = 10;
                    const availableWidth = 160 - padding * 2;
                    const availableHeight = 112 - padding * 2;
                    const scaleX = availableWidth / (bounds.width || 1);
                    const scaleY = availableHeight / (bounds.height || 1);
                    const scale = Math.min(scaleX, scaleY, 0.1);

                    // Convert minimap click to canvas coordinates
                    const canvasX = bounds.x + (x - padding) / scale;
                    const canvasY = bounds.y + (y - padding) / scale;

                    editor.centerOnPoint({ x: canvasX, y: canvasY }, { animation: { duration: 200 } });
                  }}
                >
                  {/* Simple minimap representation */}
                  <canvas
                    ref={minimapRef}
                    width={160}
                    height={112}
                    className="w-full h-full pointer-events-none"
                    style={{ imageRendering: 'auto' }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 px-1">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    Minimap
                  </span>
                  <button
                    onClick={() => editor.zoomToFit()}
                    className="text-[10px] text-blue-500 hover:text-blue-600 font-medium"
                  >
                    Fit All
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && whiteboard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Whiteboard?</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                  "{whiteboard.title || 'Untitled'}" will be permanently deleted.
                </p>
                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-lg shadow-red-600/25 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
}
