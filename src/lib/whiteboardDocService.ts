import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { generateId } from './cvEditorUtils';
import {
  WhiteboardDocument,
  CreateWhiteboardParams,
  UpdateWhiteboardParams,
} from '../types/whiteboardDoc';

// Create a new whiteboard
export const createWhiteboard = async ({
  userId,
  title = 'Untitled Whiteboard',
  folderId,
  emoji = '🎨',
}: CreateWhiteboardParams): Promise<WhiteboardDocument> => {
  const whiteboardId = generateId();
  const whiteboardRef = doc(db, 'users', userId, 'whiteboards', whiteboardId);

  const whiteboardData = {
    id: whiteboardId,
    title,
    emoji,
    ...(folderId && { folderId }),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(whiteboardRef, whiteboardData);

  return {
    ...whiteboardData,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as WhiteboardDocument;
};

// Get a single whiteboard by ID
export const getWhiteboard = async (
  userId: string,
  whiteboardId: string
): Promise<WhiteboardDocument | null> => {
  const whiteboardRef = doc(db, 'users', userId, 'whiteboards', whiteboardId);
  const whiteboardSnap = await getDoc(whiteboardRef);

  if (!whiteboardSnap.exists()) {
    return null;
  }

  return {
    id: whiteboardSnap.id,
    ...whiteboardSnap.data(),
  } as WhiteboardDocument;
};

// Get all whiteboards for a user
export const getWhiteboards = async (userId: string): Promise<WhiteboardDocument[]> => {
  const whiteboardsRef = collection(db, 'users', userId, 'whiteboards');
  const q = query(whiteboardsRef, orderBy('updatedAt', 'desc'));
  const querySnapshot = await getDocs(q);

  const whiteboards: WhiteboardDocument[] = [];
  querySnapshot.forEach((docSnapshot) => {
    whiteboards.push({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    } as WhiteboardDocument);
  });

  return whiteboards;
};

// Update a whiteboard
export const updateWhiteboard = async ({
  userId,
  whiteboardId,
  updates,
}: UpdateWhiteboardParams): Promise<void> => {
  const whiteboardRef = doc(db, 'users', userId, 'whiteboards', whiteboardId);

  // Remove undefined values (Firestore doesn't support undefined)
  const cleanedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, v]) => v !== undefined)
  );

  await updateDoc(whiteboardRef, {
    ...cleanedUpdates,
    updatedAt: serverTimestamp(),
  });
};

// Delete a whiteboard
export const deleteWhiteboard = async (
  userId: string,
  whiteboardId: string
): Promise<void> => {
  const whiteboardRef = doc(db, 'users', userId, 'whiteboards', whiteboardId);
  await deleteDoc(whiteboardRef);
};

// Move whiteboard to folder
export const moveWhiteboardToFolder = async (
  userId: string,
  whiteboardId: string,
  folderId: string | null
): Promise<void> => {
  const whiteboardRef = doc(db, 'users', userId, 'whiteboards', whiteboardId);

  await updateDoc(whiteboardRef, {
    folderId: folderId || null,
    updatedAt: serverTimestamp(),
  });
};

// Save whiteboard snapshot (tldraw document)
export const saveWhiteboardSnapshot = async (
  userId: string,
  whiteboardId: string,
  snapshot: any
): Promise<void> => {
  const whiteboardRef = doc(db, 'users', userId, 'whiteboards', whiteboardId);

  await updateDoc(whiteboardRef, {
    snapshot: JSON.stringify(snapshot),
    updatedAt: serverTimestamp(),
  });
};

// Save whiteboard thumbnail
export const saveWhiteboardThumbnail = async (
  userId: string,
  whiteboardId: string,
  thumbnailUrl: string
): Promise<void> => {
  const whiteboardRef = doc(db, 'users', userId, 'whiteboards', whiteboardId);

  await updateDoc(whiteboardRef, {
    thumbnailUrl,
    updatedAt: serverTimestamp(),
  });
};

// Auto-save helper with debounce for whiteboard content
export const createWhiteboardAutoSaver = (
  userId: string,
  whiteboardId: string,
  debounceMs: number = 2000
) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingSnapshot: any = null;

  const save = async () => {
    if (pendingSnapshot !== null) {
      try {
        await saveWhiteboardSnapshot(userId, whiteboardId, pendingSnapshot);
        console.log('[WHITEBOARD] Auto-saved');
      } catch (error) {
        console.error('[WHITEBOARD] Auto-save failed:', error);
        throw error;
      }
    }
  };

  return {
    queueSave: (snapshot: any) => {
      pendingSnapshot = snapshot;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(save, debounceMs);
    },
    saveNow: async (snapshot?: any) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      const snapshotToSave = snapshot !== undefined ? snapshot : pendingSnapshot;

      if (snapshotToSave !== null) {
        try {
          await saveWhiteboardSnapshot(userId, whiteboardId, snapshotToSave);
          pendingSnapshot = null;
          console.log('[WHITEBOARD] Saved');
        } catch (error) {
          console.error('[WHITEBOARD] Save failed:', error);
          throw error;
        }
      }
    },
    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      pendingSnapshot = null;
    },
  };
};

