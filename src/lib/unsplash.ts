import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Cache the API key to avoid repeated Firestore reads
let unsplashAccessKey: string | null = null;

export interface UnsplashPhoto {
  id: string;
  urls: {
    thumb: string;
    regular: string;
    full: string;
    raw: string;
  };
  width: number;
  height: number;
  description: string | null;
  alt_description: string | null;
  user: {
    name: string;
    username: string;
  };
}

export interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
  total: number;
  total_pages: number;
}

/**
 * Retrieves the Unsplash access key from Firestore
 */
export async function getUnsplashAccessKey(): Promise<string> {
  if (!unsplashAccessKey) {
    try {
      // Fetch API key from Firestore settings collection
      const settingsDoc = await getDoc(doc(db, 'settings', 'unsplash'));
      if (!settingsDoc.exists()) {
        throw new Error('Unsplash settings not found');
      }

      const data = settingsDoc.data();
      // Support both access_key and accessKey field names
      const key = data?.access_key || data?.accessKey;
      if (!key) {
        throw new Error('Unsplash access key not found');
      }

      unsplashAccessKey = key as string;
    } catch (error) {
      console.error('Error retrieving Unsplash access key:', error);
      throw new Error('Failed to initialize Unsplash API. Please try again later.');
    }
  }

  if (!unsplashAccessKey) {
    throw new Error('Failed to retrieve Unsplash access key');
  }

  return unsplashAccessKey;
}

/**
 * Search Unsplash photos by query
 */
export async function searchUnsplashPhotos(
  query: string,
  page: number = 1,
  perPage: number = 20
): Promise<UnsplashSearchResponse> {
  try {
    const accessKey = await getUnsplashAccessKey();

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${accessKey}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid Unsplash API credentials');
      }
      if (response.status === 403) {
        throw new Error('Unsplash API rate limit exceeded');
      }
      throw new Error(`Unsplash API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data as UnsplashSearchResponse;
  } catch (error) {
    console.error('Error searching Unsplash photos:', error);
    throw error;
  }
}

/**
 * Get random photos from Unsplash
 */
export async function getRandomUnsplashPhotos(
  count: number = 20,
  query?: string
): Promise<UnsplashPhoto[]> {
  try {
    const accessKey = await getUnsplashAccessKey();

    let url = `https://api.unsplash.com/photos/random?count=${count}&orientation=landscape`;
    if (query) {
      url += `&query=${encodeURIComponent(query)}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${accessKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid Unsplash API credentials');
      }
      if (response.status === 403) {
        throw new Error('Unsplash API rate limit exceeded');
      }
      throw new Error(`Unsplash API error: ${response.statusText}`);
    }

    const data = await response.json();
    // Unsplash returns a single object if count=1, array otherwise
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error('Error fetching random Unsplash photos:', error);
    throw error;
  }
}

/**
 * Get photo URL optimized for cover images (4:1 aspect ratio)
 * Returns the regular URL which is good quality and reasonable size
 */
export function getCoverPhotoUrl(photo: UnsplashPhoto): string {
  // Use regular URL for good quality without being too large
  // For 4:1 covers, we'll crop in the UI or use the full URL
  return photo.urls.regular;
}

/**
 * Fetch image from URL and convert to Blob
 */
export async function fetchImageAsBlob(url: string): Promise<Blob> {
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) {
    throw new Error('Failed to fetch image');
  }
  return response.blob();
}



