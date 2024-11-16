import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function toggleTemplateFavorite(
  userId: string,
  templateId: string,
  currentLiked: boolean
): Promise<void> {
  try {
    const templateRef = doc(db, 'users', userId, 'emailTemplates', templateId);
    await updateDoc(templateRef, {
      liked: !currentLiked
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
} 