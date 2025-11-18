import { BoardObject, CanvasState } from '../../../types/whiteboard';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export interface WhiteboardData {
  objects: BoardObject[];
  canvasState: CanvasState;
  lastSaved: any; // Firestore Timestamp
}

/**
 * Save whiteboard data to Firestore
 * Note: Interviews are stored as an array in the jobApplication document, not as a subcollection
 */
export async function saveWhiteboardToFirestore(
  userId: string,
  applicationId: string,
  interviewId: string,
  objects: BoardObject[],
  canvasState: CanvasState
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
      whiteboardData: {
        objects,
        canvasState,
        lastSaved: new Date(),
      },
    };

    await updateDoc(applicationRef, {
      interviews: updatedInterviews,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving whiteboard to Firestore:', error);
    throw error;
  }
}

/**
 * Load whiteboard data from Firestore
 * Note: Interviews are stored as an array in the jobApplication document
 */
export async function loadWhiteboardFromFirestore(
  userId: string,
  applicationId: string,
  interviewId: string
): Promise<WhiteboardData | null> {
  try {
    const applicationRef = doc(db, 'users', userId, 'jobApplications', applicationId);
    const applicationDoc = await getDoc(applicationRef);
    
    if (!applicationDoc.exists()) {
      return null;
    }

    const applicationData = applicationDoc.data();
    const interviews = applicationData.interviews || [];
    const interview = interviews.find((i: any) => i.id === interviewId);

    if (!interview) {
      return null;
    }

    return interview.whiteboardData || null;
  } catch (error) {
    console.error('Error loading whiteboard from Firestore:', error);
    throw error;
  }
}

/**
 * Migrate old Note[] format to BoardObject[] format
 */
export function migrateNotesToBoardObjects(
  notes: Array<{
    id: string;
    title: string;
    content: string;
    color: string;
    createdAt: number;
    updatedAt: number;
    position?: { x: number; y: number };
    width?: number;
    height?: number;
  }>,
  connections?: Array<{
    id: string;
    start: string;
    end: string;
  }>
): BoardObject[] {
  const boardObjects: BoardObject[] = notes.map((note, index) => ({
    id: note.id,
    type: 'sticky',
    x: note.position?.x || 100 + index * 20,
    y: note.position?.y || 100 + index * 20,
    width: note.width || 250,
    height: note.height || 200,
    rotation: 0,
    zIndex: index,
    style: {
      backgroundColor: note.color || '#ffeb3b',
      color: '#000',
    },
    data: {
      title: note.title,
      content: note.content,
    },
  }));

  // Add connectors for connections
  if (connections) {
    connections.forEach((conn, index) => {
      boardObjects.push({
        id: `connector-${conn.id}`,
        type: 'connector',
        x: 0, // Will be calculated from start/end objects
        y: 0,
        width: 0,
        height: 0,
        rotation: 0,
        zIndex: -1, // Connectors should be behind other objects
        style: {
          color: '#6366f1',
          strokeWidth: 2,
        },
        data: {
          startId: conn.start,
          endId: conn.end,
        },
      });
    });
  }

  return boardObjects;
}

/**
 * Convert BoardObject[] back to Note[] format (for backward compatibility)
 */
export function convertBoardObjectsToNotes(
  objects: BoardObject[]
): Array<{
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: number;
  updatedAt: number;
  position: { x: number; y: number };
  width: number;
  height: number;
}> {
  const stickyNotes = objects.filter((obj) => obj.type === 'sticky');
  const now = Date.now();

  return stickyNotes.map((obj) => ({
    id: obj.id,
    title: obj.data.title || 'Untitled Note',
    content: obj.data.content || '',
    color: obj.style.backgroundColor || '#ffeb3b',
    createdAt: now,
    updatedAt: now,
    position: { x: obj.x, y: obj.y },
    width: obj.width,
    height: obj.height,
  }));
}

