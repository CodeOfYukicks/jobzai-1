import { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Tldraw, TLStoreSnapshot, TldrawEditor, loadSnapshot, getSnapshot, Editor } from 'tldraw';
import 'tldraw/tldraw.css';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Minimize2 } from 'lucide-react';

export interface TldrawWhiteboardRef {
  toggleFullscreen: () => void;
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

  // Expose toggleFullscreen method via ref
  useImperativeHandle(ref, () => ({
    toggleFullscreen: () => setIsFullscreen(prev => !prev),
  }));

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
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600 dark:border-gray-600 dark:border-t-indigo-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Loading whiteboard...
          </span>
        </div>
      </div>
    );
  }

  const tldrawContent = (
    <div 
      className={`tldraw-container ${isDarkMode ? 'tldraw-dark' : ''}`}
      style={{ 
        width: isFullscreen ? '100%' : (width || '100%'), 
        height: isFullscreen ? '100%' : (height || 600),
        ['--tldraw-bg' as any]: isDarkMode ? '#0a0a0a' : '#f9fafb',
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
          className="fixed inset-0 z-50 bg-white dark:bg-gray-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with close button */}
          <div className="absolute top-4 right-4 z-[60]">
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-lg"
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

