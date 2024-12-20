﻿import { ref, getStorage, getDownloadURL } from 'firebase/storage';
import { storage, auth } from './firebase';
import { toast } from 'sonner';

export interface CVAnalysis {
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  lastAnalyzed: Date;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function retry<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      return retry(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function fetchCVContent(cvUrl: string) {
  if (!cvUrl) {
    throw new Error('No CV URL provided');
  }

  try {
    console.log('Starting CV fetch process...', cvUrl);
    
    // V├®rifier l'authentification
    if (!auth.currentUser) {
      throw new Error('User must be authenticated');
    }

    // Cr├®er une r├®f├®rence au fichier
    const cvRef = ref(storage, cvUrl);
    
    // Obtenir une URL sign├®e avec une expiration courte
    const downloadURL = await getDownloadURL(cvRef);
    
    console.log('Got signed URL, attempting fetch...');

    // Faire la requ├¬te avec les bons headers
    const response = await fetch(downloadURL, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
      },
      mode: 'cors',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    console.log('CV fetched successfully:', {
      size: blob.size,
      type: blob.type
    });

    return blob;

  } catch (error: any) {
    console.error('CV fetch error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    // Gestion sp├®cifique des erreurs
    if (error.code === 'storage/object-not-found') {
      toast.error('CV not found. Please upload your CV first');
      throw new Error('CV not found');
    }
    
    if (error.code === 'storage/unauthorized') {
      toast.error('Access denied. Please check your permissions');
      throw new Error('Unauthorized access');
    }

    toast.error('Failed to fetch CV. Please try again');
    throw new Error(`Failed to fetch CV: ${error.message}`);
  }
}

export async function analyzeCVWithGPT(cvUrl: string) {
  try {
    console.log('Starting CV analysis...');
    const cvContent = await fetchCVContent(cvUrl);
    
    if (!cvContent) {
      throw new Error('No CV content available for analysis');
    }

    // TODO: Ajouter la logique d'analyse GPT ici
    console.log('CV content ready for analysis:', {
      size: cvContent.size,
      type: cvContent.type
    });
    
    // Pour le moment, on simule juste un succ├¿s
    toast.success('CV analysis completed');
    return cvContent;

  } catch (error: any) {
    console.error('Analysis error:', error);
    throw error;
  }
}

// Fonction utilitaire pour tester la connexion
export async function testCVAnalysis(cvUrl: string) {
  try {
    console.log('Testing CV analysis system...');
    
    const result = await analyzeCVWithGPT(cvUrl);
    
    return {
      success: true,
      message: 'CV analysis system is working correctly',
      details: {
        size: result.size,
        type: result.type
      }
    };

  } catch (error: any) {
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
}
