import { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Tldraw, TLStoreSnapshot, TldrawEditor, loadSnapshot, getSnapshot, Editor } from 'tldraw';
import { createShapeId, toRichText } from '@tldraw/editor';
import 'tldraw/tldraw.css';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Minimize2 } from 'lucide-react';

export interface TldrawWhiteboardRef {
  toggleFullscreen: () => void;
  addStarStoryToBoard: (skill: string, story: { situation: string; action: string; result: string }) => Promise<void>;
}

interface TldrawWhiteboardProps {
  applicationId: string;
  interviewId: string;
  width?: number;
  height?: number;
}

// Custom styles for tldraw to match the app theme and hide watermark
const tldrawCustomStyles = `
  .tl-background {
    background-color: var(--tldraw-bg) !important;
  }
  
  .tldraw-dark .tl-background {
    background-color: #0a0a0a !important;
  }
  
  .tldraw__editor {
    --color-background: var(--tldraw-bg);
  }
  
  /* Hide tldraw watermark */
  .tlui-watermark_SEE-LICENSE,
  .tl-watermark_SEE-LICENSE,
  [class*="watermark"] {
    display: none !important;
  }
  
  /* Ensure toolbar sticks to the board */
  .tldraw-container .tlui-layout {
    z-index: 10 !important;
  }
  .tldraw-container .tlui-layout__top {
    z-index: 10 !important;
  }
  .tldraw-container .tlui-layout__bottom {
    z-index: 10 !important;
    position: absolute !important;
    bottom: 0 !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
  }
  
  /* Light mode specific toolbar styling - only target toolbar, not style panels */
  .tldraw-light .tlui-toolbar__inner {
    background-color: #ffffff !important;
    border: 1px solid #e5e7eb !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1) !important;
  }
  
  .tldraw-light .tlui-toolbar__inner .tlui-button {
    color: #374151 !important;
  }
  
  .tldraw-light .tlui-toolbar__inner .tlui-button:hover {
    background-color: #f3f4f6 !important;
  }
  
  .tldraw-light .tlui-toolbar__inner .tlui-button[data-state="selected"],
  .tldraw-light .tlui-toolbar__inner .tlui-button[data-isactive="true"] {
    background-color: #e0e7ff !important;
    color: #4f46e5 !important;
  }
  
  .tldraw-light .tlui-toolbar__inner .tlui-icon {
    color: inherit !important;
  }
  
  /* Toolbar extras (undo/redo section) */
  .tldraw-light .tlui-toolbar__extras {
    background-color: #ffffff !important;
    border: 1px solid #e5e7eb !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1) !important;
  }
  
  .tldraw-light .tlui-toolbar__extras .tlui-button {
    color: #374151 !important;
  }
`;

/**
 * Save tldraw document to Firestore
 */
async function saveTldrawToFirestore(
  userId: string,
  applicationId: string,
  interviewId: string,
  snapshot: TLStoreSnapshot
): Promise<void> {
  try {
    const applicationRef = doc(db, 'users', userId, 'jobApplications', applicationId);
    const applicationDoc = await getDoc(applicationRef);
    
    if (!applicationDoc.exists()) {
      throw new Error('Application not found');
    }

    const applicationData = applicationDoc.data();
    const interviews = applicationData.interviews || [];
    const interviewIndex = interviews.findIndex((i: any) => i.id === interviewId);

    if (interviewIndex === -1) {
      throw new Error('Interview not found');
    }

    const updatedInterviews = [...interviews];
    updatedInterviews[interviewIndex] = {
      ...interviews[interviewIndex],
      tldrawDocument: {
        snapshot: JSON.stringify(snapshot),
        lastSaved: new Date().toISOString(),
      },
    };

    await updateDoc(applicationRef, {
      interviews: updatedInterviews,
      updatedAt: serverTimestamp(),
    });
    
    console.log('[TLDRAW] Saved to Firestore');
  } catch (error) {
    console.error('[TLDRAW] Error saving to Firestore:', error);
    throw error;
  }
}

/**
 * Load tldraw document from Firestore
 */
async function loadTldrawFromFirestore(
  userId: string,
  applicationId: string,
  interviewId: string
): Promise<TLStoreSnapshot | null> {
  try {
    const applicationRef = doc(db, 'users', userId, 'jobApplications', applicationId);
    const applicationDoc = await getDoc(applicationRef);
    
    if (!applicationDoc.exists()) {
      return null;
    }

    const applicationData = applicationDoc.data();
    const interviews = applicationData.interviews || [];
    const interview = interviews.find((i: any) => i.id === interviewId);

    if (!interview || !interview.tldrawDocument?.snapshot) {
      return null;
    }

    return JSON.parse(interview.tldrawDocument.snapshot);
  } catch (error) {
    console.error('[TLDRAW] Error loading from Firestore:', error);
    return null;
  }
}

export const TldrawWhiteboard = forwardRef<TldrawWhiteboardRef, TldrawWhiteboardProps>(({
  applicationId,
  interviewId,
  width,
  height,
}, ref) => {
  const { currentUser } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialSnapshot, setInitialSnapshot] = useState<TLStoreSnapshot | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Helper function to truncate text intelligently
  const truncateText = (text: string, maxLength: number = 200): string => {
    if (!text || text.length <= maxLength) return text;
    // Try to truncate at a sentence boundary
    const truncated = text.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastSpace = truncated.lastIndexOf(' ');
    const cutPoint = lastPeriod > maxLength * 0.7 ? lastPeriod + 1 : lastSpace;
    return truncated.substring(0, cutPoint) + '...';
  };

  // Helper function to format text with title
  const formatStarText = (title: string, content: string): string => {
    const truncated = truncateText(content, 180);
    return `${title}\n\n${truncated}`;
  };

  // Function to add STAR story to board
  const addStarStoryToBoard = useCallback(async (skill: string, story: { situation: string; action: string; result: string }) => {
    if (!editor) {
      throw new Error('Editor not ready');
    }

    try {
      // Get viewport center
      const viewport = editor.getViewportPageBounds();
      const centerX = viewport.x + viewport.width / 2;
      const centerY = viewport.y + viewport.height / 2;

      // Compact layout: vertical flow with notes (post-it style)
      const noteWidth = 260;
      const noteHeight = 160; // Compact height for notes
      const noteSpacing = 50; // Tight vertical spacing
      const startX = centerX - noteWidth / 2;
      const startY = centerY - 250; // Start higher for vertical layout

      // Create shapes using tldraw API
      const shapes: any[] = [];

      // Title note (yellow/amber) - compact header
      const titleNoteId = createShapeId();
      shapes.push({
        id: titleNoteId,
        type: 'note',
        x: startX,
        y: startY,
        props: {
          richText: toRichText(`⭐ STAR: ${skill}`),
          color: 'yellow',
          size: 'm',
        },
      });

      // Situation note (blue) - compact with formatted text
      const situationNoteId = createShapeId();
      const situationY = startY + noteHeight + noteSpacing;
      shapes.push({
        id: situationNoteId,
        type: 'note',
        x: startX,
        y: situationY,
        props: {
          richText: toRichText(formatStarText('📋 SITUATION', story.situation || 'No situation provided')),
          color: 'blue',
          size: 'm',
        },
      });

      // Action note (orange) - compact with formatted text
      const actionNoteId = createShapeId();
      const actionY = situationY + noteHeight + noteSpacing;
      shapes.push({
        id: actionNoteId,
        type: 'note',
        x: startX,
        y: actionY,
        props: {
          richText: toRichText(formatStarText('⚡ ACTION', story.action || 'No action provided')),
          color: 'orange',
          size: 'm',
        },
      });

      // Result note (green) - compact with formatted text
      const resultNoteId = createShapeId();
      const resultY = actionY + noteHeight + noteSpacing;
      shapes.push({
        id: resultNoteId,
        type: 'note',
        x: startX,
        y: resultY,
        props: {
          richText: toRichText(formatStarText('✅ RESULT', story.result || 'No result provided')),
          color: 'green',
          size: 'm',
        },
      });

      // Create arrows connecting the notes vertically (centered)
      // Arrow from Title to Situation
      const arrow1Id = createShapeId();
      shapes.push({
        id: arrow1Id,
        type: 'arrow',
        x: centerX,
        y: startY + noteHeight,
        props: {
          start: { x: 0, y: 0 },
          end: { x: 0, y: noteSpacing },
          arrowheadEnd: 'arrow',
          color: 'grey',
          size: 'm',
          fill: 'none',
        },
      });

      // Arrow from Situation to Action
      const arrow2Id = createShapeId();
      shapes.push({
        id: arrow2Id,
        type: 'arrow',
        x: centerX,
        y: situationY + noteHeight,
        props: {
          start: { x: 0, y: 0 },
          end: { x: 0, y: noteSpacing },
          arrowheadEnd: 'arrow',
          color: 'grey',
          size: 'm',
          fill: 'none',
        },
      });

      // Arrow from Action to Result
      const arrow3Id = createShapeId();
      shapes.push({
        id: arrow3Id,
        type: 'arrow',
        x: centerX,
        y: actionY + noteHeight,
        props: {
          start: { x: 0, y: 0 },
          end: { x: 0, y: noteSpacing },
          arrowheadEnd: 'arrow',
          color: 'grey',
          size: 'm',
          fill: 'none',
        },
      });

      // Create a frame to group everything visually
      // Note: Create frame first so other shapes can be parented to it
      const frameId = createShapeId();
      const framePadding = 40;
      const frameHeight = resultY - startY + noteHeight + framePadding;
      shapes.unshift({
        id: frameId,
        type: 'frame',
        x: startX - framePadding / 2,
        y: startY - framePadding / 2,
        props: {
          w: noteWidth + framePadding,
          h: frameHeight,
        },
      });

      // Create all shapes at once
      editor.createShapes(shapes);

      // Reparent notes and arrows to frame for better grouping
      const noteIds = [titleNoteId, situationNoteId, actionNoteId, resultNoteId];
      const arrowIds = [arrow1Id, arrow2Id, arrow3Id];
      try {
        editor.reparentShapes([...noteIds, ...arrowIds], frameId);
      } catch (e) {
        // If reparenting fails, shapes will still be visually grouped by the frame bounds
        console.warn('[TLDRAW] Could not reparent shapes to frame:', e);
      }

      // Select all created shapes
      editor.setSelectedShapes(shapes.map(s => s.id));

      // Zoom to fit the new content
      editor.zoomToFit();
    } catch (error) {
      console.error('[TLDRAW] Error adding STAR story:', error);
      throw error;
    }
  }, [editor]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    toggleFullscreen: () => setIsFullscreen(prev => !prev),
    addStarStoryToBoard,
  }), [addStarStoryToBoard]);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Watch for theme changes
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

  // Load initial data from Firestore
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;

      try {
        setIsLoading(true);
        const snapshot = await loadTldrawFromFirestore(
          currentUser.uid,
          applicationId,
          interviewId
        );

        if (snapshot) {
          setInitialSnapshot(snapshot);
          console.log('[TLDRAW] Loaded snapshot from Firestore');
        }
      } catch (error) {
        console.error('[TLDRAW] Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser, applicationId, interviewId]);

  // Auto-save to Firestore when content changes
  const handleMount = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance);

    // Load initial snapshot if available
    if (initialSnapshot) {
      try {
        loadSnapshot(editorInstance.store, initialSnapshot);
        console.log('[TLDRAW] Applied initial snapshot');
      } catch (error) {
        console.error('[TLDRAW] Error applying snapshot:', error);
      }
    }

    // Subscribe to store changes for auto-save
    let saveTimeout: NodeJS.Timeout | null = null;
    
    const unsubscribe = editorInstance.store.listen(() => {
      if (!currentUser) return;

      // Debounce saves
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      saveTimeout = setTimeout(async () => {
        try {
          const snapshot = getSnapshot(editorInstance.store);
          await saveTldrawToFirestore(
            currentUser.uid,
            applicationId,
            interviewId,
            snapshot
          );
        } catch (error) {
          console.error('[TLDRAW] Auto-save error:', error);
        }
      }, 2000); // Debounce 2 seconds
    });

    return () => {
      unsubscribe();
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [currentUser, applicationId, interviewId, initialSnapshot]);

  // Save before page unload
  useEffect(() => {
    if (!editor || !currentUser) return;

    const handleBeforeUnload = async () => {
      try {
        const snapshot = getSnapshot(editor.store);
        await saveTldrawToFirestore(
          currentUser.uid,
          applicationId,
          interviewId,
          snapshot
        );
      } catch (error) {
        console.error('[TLDRAW] Error saving before unload:', error);
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
  }, [editor, currentUser, applicationId, interviewId]);

  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 dark:bg-neutral-950"
        style={{ width: width || '100%', height: height || 600 }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600 dark:border-[#3d3c3e] dark:border-t-indigo-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Loading whiteboard...
          </span>
        </div>
      </div>
    );
  }

  const tldrawContent = (
    <div 
      className={`tldraw-container ${isDarkMode ? 'tldraw-dark' : 'tldraw-light'}`}
      style={{ 
        width: isFullscreen ? '100%' : (width || '100%'), 
        height: isFullscreen ? '100%' : (height || 600),
        ['--tldraw-bg' as any]: isDarkMode ? '#0a0a0a' : '#f9fafb',
        position: 'relative',
      }}
    >
      <style>{tldrawCustomStyles}</style>
      <Tldraw
        onMount={handleMount}
        persistenceKey={`interview-${applicationId}-${interviewId}`}
        inferDarkMode={false}
        forceMobile={false}
      />
    </div>
  );

  if (isFullscreen) {
    return (
      <AnimatePresence>
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsFullscreen(false)}
        />

        {/* Fullscreen panel */}
        <motion.div
          initial={{ y: -window.innerHeight, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -window.innerHeight, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-0 z-50 bg-white dark:bg-[#242325]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with close button */}
          <div className="absolute top-4 right-4 z-[60]">
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-lg bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] hover:bg-gray-50 dark:hover:bg-[#3d3c3e] transition-colors shadow-lg"
              title="Réduire"
            >
              <Minimize2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {tldrawContent}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <>
      {/* Hidden button for external control */}
      <button
        data-whiteboard-toggle
        onClick={() => setIsFullscreen(prev => !prev)}
        className="hidden"
        aria-hidden="true"
      />
      {tldrawContent}
    </>
  );
});

TldrawWhiteboard.displayName = 'TldrawWhiteboard';

export default TldrawWhiteboard;

