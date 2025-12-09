import OpenAI from 'openai';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { notify } from '@/lib/notify';

let openaiInstance: OpenAI | null = null;

export async function getOpenAIInstance(): Promise<OpenAI> {
  if (!openaiInstance) {
    try {
      // Fetch API key from Firestore settings collection
      const settingsDoc = await getDoc(doc(db, 'settings', 'openai'));
      if (!settingsDoc.exists()) {
        throw new Error('OpenAI settings not found');
      }

      const { apiKey } = settingsDoc.data();
      if (!apiKey) {
        throw new Error('OpenAI API key not found');
      }

      openaiInstance = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true // Required for client-side usage
      });
    } catch (error) {
      console.error('Error initializing OpenAI:', error);
      throw new Error('Failed to initialize OpenAI. Please try again later.');
    }
  }
  return openaiInstance;
}
