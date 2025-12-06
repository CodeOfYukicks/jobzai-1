import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  MoreHorizontal,
  Trash2,
  FileText,
  ArrowLeft,
  Check,
  X,
  Pencil,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Tldraw, getSnapshot, loadSnapshot, Editor } from 'tldraw';
import 'tldraw/tldraw.css';

// Hide tldraw watermark
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
`;

import {
  getWhiteboard,
  updateWhiteboard,
  deleteWhiteboard,
  saveWhiteboardSnapshot,
  saveWhiteboardThumbnail,
} from '../lib/whiteboardDocService';
import { WhiteboardDocument } from '../types/whiteboardDoc';
import { toast } from '@/contexts/ToastContext';
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

  const [whiteboard, setWhiteboard] = useState<WhiteboardDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Editor state
  const [editor, setEditor] = useState<Editor | null>(null);
  const editorRef = useRef<Editor | null>(null);

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
          toast.error('Whiteboard not found');
          navigate('/resume-builder');
        }
      } catch (error) {
        console.error('Error fetching whiteboard:', error);
        toast.error('Failed to load whiteboard');
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

    // Load saved snapshot if available
    if (whiteboard?.snapshot) {
      try {
        const snapshot = JSON.parse(whiteboard.snapshot);
        loadSnapshot(editorInstance.store, snapshot);
        console.log('[WHITEBOARD] Loaded snapshot');
      } catch (error) {
        console.error('[WHITEBOARD] Error loading snapshot:', error);
      }
    }

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
  const handleTitleSave = useCallback(async () => {
    if (!currentUser || !whiteboardId || !editedTitle.trim()) return;

    try {
      await updateWhiteboard({
        userId: currentUser.uid,
        whiteboardId,
        updates: { title: editedTitle.trim() },
      });
      setWhiteboard((prev) => prev ? { ...prev, title: editedTitle.trim() } : null);
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Error updating title:', error);
      toast.error('Failed to update title');
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
      toast.success('Whiteboard deleted');
      navigate('/resume-builder');
    } catch (error) {
      console.error('Error deleting whiteboard:', error);
      toast.error('Failed to delete whiteboard');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [currentUser, whiteboardId, navigate]);

  // Go back handler
  const handleGoBack = useCallback(() => {
    // Save in background, don't block navigation
    if (editorRef.current && currentUser && whiteboardId) {
      const snapshot = getSnapshot(editorRef.current.store);
      saveWhiteboardSnapshot(currentUser.uid, whiteboardId, snapshot).catch((error) => {
        console.error('[WHITEBOARD] Error saving before leaving:', error);
      });
      // Thumbnail saving in background (fire and forget)
      saveThumbnail().catch(() => {});
    }
    navigate('/resume-builder');
  }, [navigate, currentUser, whiteboardId, saveThumbnail]);

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
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Loading whiteboard...</span>
        </div>
      </div>
    );
  }

  if (!whiteboard) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-950 gap-4">
        <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400">Whiteboard not found</p>
        <button
          onClick={() => navigate('/resume-builder')}
          className="px-4 py-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-gray-950">
      {/* Minimal Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-50">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={handleGoBack}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
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
                        className={`p-2 text-xl rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                          whiteboard.emoji === emoji ? 'bg-amber-100 dark:bg-amber-900/30' : ''
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
                onClick={handleTitleSave}
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

      {/* Tldraw Canvas - Full Height */}
      <div className="flex-1 relative tldraw-container">
        <style>{tldrawStyles}</style>
        <Tldraw
          onMount={handleMount}
          persistenceKey={`whiteboard-${whiteboardId}`}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
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
  );
}
