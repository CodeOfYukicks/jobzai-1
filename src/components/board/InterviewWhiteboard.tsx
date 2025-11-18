import { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Whiteboard } from './Whiteboard';
import { useWhiteboardStore } from '../../stores/whiteboardStore';
import { BoardObject } from '../../types/whiteboard';
import {
  migrateNotesToBoardObjects,
  saveWhiteboardToFirestore,
  loadWhiteboardFromFirestore,
} from './utils/firestoreSync';
import { useAuth } from '../../contexts/AuthContext';
import { AnimatePresence } from 'framer-motion';

export interface InterviewWhiteboardRef {
  toggleFullscreen: () => void;
}

interface InterviewWhiteboardProps {
  applicationId: string;
  interviewId: string;
  initialNotes?: Array<{
    id: string;
    title: string;
    content: string;
    color: string;
    createdAt: number;
    updatedAt: number;
    position?: { x: number; y: number };
    width?: number;
    height?: number;
  }>;
  initialConnections?: Array<{
    id: string;
    start: string;
    end: string;
  }>;
  width?: number;
  height?: number;
}

export const InterviewWhiteboard = forwardRef<InterviewWhiteboardRef, InterviewWhiteboardProps>(({
  applicationId,
  interviewId,
  initialNotes = [],
  initialConnections = [],
  width,
  height,
}, ref) => {
  const { currentUser } = useAuth();
  const { objects, loadObjects, clearAll } = useWhiteboardStore();
  const [isLoading, setIsLoading] = useState(true);
  const [hasMigrated, setHasMigrated] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const prevInterviewKeyRef = useRef<string>('');
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // Expose toggleFullscreen method via ref
  useImperativeHandle(ref, () => ({
    toggleFullscreen: () => setIsFullscreen(prev => !prev),
  }));

  // Reset store when interview changes
  useEffect(() => {
    const interviewKey = `${applicationId}-${interviewId}`;
    
    // If interview changed, reset the store
    if (prevInterviewKeyRef.current && prevInterviewKeyRef.current !== interviewKey) {
      clearAll();
      setHasMigrated(false);
    }
    
    prevInterviewKeyRef.current = interviewKey;
  }, [applicationId, interviewId, clearAll]);

  // Load whiteboard data from Firestore or migrate from old format
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;

      try {
        setIsLoading(true);

        // Try to load whiteboard data from Firestore
        const whiteboardData = await loadWhiteboardFromFirestore(
          currentUser.uid,
          applicationId,
          interviewId
        );

        if (whiteboardData && whiteboardData.objects && whiteboardData.objects.length > 0) {
          // Load existing whiteboard data
          // loadObjects initializes history immediately
          loadObjects(whiteboardData.objects);
          useWhiteboardStore.getState().setCanvasState(whiteboardData.canvasState || { panX: 0, panY: 0, zoom: 1 });
        } else if (initialNotes.length > 0 && !hasMigrated) {
          // Migrate from old sticky notes format
          const migratedObjects = migrateNotesToBoardObjects(
            initialNotes,
            initialConnections
          );
          // loadObjects initializes history immediately
          loadObjects(migratedObjects);
          setHasMigrated(true);

          // Save migrated data to Firestore
          const currentCanvasState = useWhiteboardStore.getState().canvasState;
          await saveWhiteboardToFirestore(
            currentUser.uid,
            applicationId,
            interviewId,
            migratedObjects,
            currentCanvasState
          );
        } else {
          // Initialize empty whiteboard
          // loadObjects initializes history immediately
          loadObjects([]);
        }
      } catch (error) {
        console.error('Error loading whiteboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [
    currentUser,
    applicationId,
    interviewId,
    initialNotes,
    initialConnections,
    hasMigrated,
    loadObjects,
    clearAll,
  ]);

  // Save to Firestore when objects change
  const handleSave = async (objectsToSave: BoardObject[]) => {
    if (!currentUser) {
      console.log('[SAVE] No current user, skipping save');
      return;
    }

    try {
      // Get current canvasState from store at save time
      const currentCanvasState = useWhiteboardStore.getState().canvasState;
      console.log('[SAVE] Saving to Firestore:', {
        objectsCount: objectsToSave.length,
        applicationId,
        interviewId,
      });
      await saveWhiteboardToFirestore(
        currentUser.uid,
        applicationId,
        interviewId,
        objectsToSave,
        currentCanvasState
      );
      console.log('[SAVE] Successfully saved to Firestore');
    } catch (error) {
      console.error('[SAVE] Error saving whiteboard:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">Loading whiteboard...</div>
      </div>
    );
  }

  return (
    <>
      {/* Hidden button for external control */}
      <button
        ref={toggleButtonRef}
        data-whiteboard-toggle
        onClick={() => setIsFullscreen(prev => !prev)}
        className="hidden"
        aria-hidden="true"
      />
      <Whiteboard
        width={width}
        height={height}
        onSave={handleSave}
        initialObjects={objects}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />
    </>
  );
});

