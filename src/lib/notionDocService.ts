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
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { generateId } from './cvEditorUtils';

export interface NotionDocument {
  id: string;
  title: string;
  content: any; // Tiptap JSON content
  folderId?: string;
  emoji?: string;
  coverImage?: string;
  createdAt: Timestamp | Date | any;
  updatedAt: Timestamp | Date | any;
}

export interface CreateNoteParams {
  userId: string;
  title?: string;
  content?: any;
  folderId?: string;
  emoji?: string;
}

export interface UpdateNoteParams {
  userId: string;
  noteId: string;
  updates: Partial<Omit<NotionDocument, 'id' | 'createdAt'>>;
}

// Create a new note
export const createNote = async ({
  userId,
  title = 'Untitled',
  content,
  folderId,
  emoji = '📝',
}: CreateNoteParams): Promise<NotionDocument> => {
  const noteId = generateId();
  const noteRef = doc(db, 'users', userId, 'notes', noteId);

  const defaultContent = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
      },
    ],
  };

  const noteData = {
    id: noteId,
    title,
    content: content || defaultContent,
    emoji,
    ...(folderId && { folderId }),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(noteRef, noteData);

  return {
    ...noteData,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as NotionDocument;
};

// Get a single note by ID
export const getNote = async (
  userId: string,
  noteId: string
): Promise<NotionDocument | null> => {
  const noteRef = doc(db, 'users', userId, 'notes', noteId);
  const noteSnap = await getDoc(noteRef);

  if (!noteSnap.exists()) {
    return null;
  }

  return {
    id: noteSnap.id,
    ...noteSnap.data(),
  } as NotionDocument;
};

// Get all notes for a user
export const getNotes = async (userId: string): Promise<NotionDocument[]> => {
  const notesRef = collection(db, 'users', userId, 'notes');
  const q = query(notesRef, orderBy('updatedAt', 'desc'));
  const querySnapshot = await getDocs(q);

  const notes: NotionDocument[] = [];
  querySnapshot.forEach((docSnapshot) => {
    notes.push({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    } as NotionDocument);
  });

  return notes;
};

// Update a note
export const updateNote = async ({
  userId,
  noteId,
  updates,
}: UpdateNoteParams): Promise<void> => {
  const noteRef = doc(db, 'users', userId, 'notes', noteId);

  await updateDoc(noteRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// Delete a note
export const deleteNote = async (
  userId: string,
  noteId: string
): Promise<void> => {
  const noteRef = doc(db, 'users', userId, 'notes', noteId);
  await deleteDoc(noteRef);
};

// Move note to folder
export const moveNoteToFolder = async (
  userId: string,
  noteId: string,
  folderId: string | null
): Promise<void> => {
  const noteRef = doc(db, 'users', userId, 'notes', noteId);

  await updateDoc(noteRef, {
    folderId: folderId || null,
    updatedAt: serverTimestamp(),
  });
};

// Auto-save helper with debounce
export const createAutoSaver = (
  userId: string,
  noteId: string,
  debounceMs: number = 2000
) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingContent: any = null;

  const save = async () => {
    if (pendingContent !== null) {
      try {
        await updateNote({
          userId,
          noteId,
          updates: { content: pendingContent },
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
        throw error;
      }
    }
  };

  return {
    queueSave: (content: any) => {
      pendingContent = content;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(save, debounceMs);
    },
    saveNow: async () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      await save();
    },
    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      pendingContent = null;
    },
  };
};

// Extract plain text preview from Tiptap JSON content
export const extractTextPreview = (content: any, maxLength: number = 150): string => {
  if (!content || !content.content) {
    return '';
  }

  let text = '';

  const extractText = (node: any) => {
    if (text.length >= maxLength) return;

    if (node.type === 'text') {
      text += node.text || '';
    }

    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        extractText(child);
        if (text.length >= maxLength) break;
      }
    }
  };

  for (const node of content.content) {
    extractText(node);
    if (text.length >= maxLength) break;
    text += ' ';
  }

  text = text.trim();
  if (text.length > maxLength) {
    text = text.substring(0, maxLength - 3) + '...';
  }

  return text;
};

// Get word count from Tiptap JSON content
export const getWordCount = (content: any): number => {
  const text = extractTextPreview(content, Infinity);
  return text.split(/\s+/).filter((word) => word.length > 0).length;
};


