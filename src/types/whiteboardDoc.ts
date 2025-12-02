import { Timestamp } from 'firebase/firestore';
import { TLStoreSnapshot } from 'tldraw';

export interface WhiteboardDocument {
  id: string;
  title: string;
  snapshot?: string; // JSON stringified tldraw document
  thumbnailUrl?: string; // Screenshot for preview card
  folderId?: string;
  emoji?: string;
  createdAt: Timestamp | Date | any;
  updatedAt: Timestamp | Date | any;
}

export interface CreateWhiteboardParams {
  userId: string;
  title?: string;
  folderId?: string;
  emoji?: string;
}

export interface UpdateWhiteboardParams {
  userId: string;
  whiteboardId: string;
  updates: Partial<Omit<WhiteboardDocument, 'id' | 'createdAt'>>;
}

