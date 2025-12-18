import type { UnsplashPhoto } from './unsplash';

/**
 * Fallback photo interface - compatible with UnsplashPhoto
 */
export interface FallbackPhoto {
  id: string;
  urls: {
    thumb: string;
    regular: string;
    full: string;
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

/**
 * Collection of high-quality fallback images for cover photos
 * These are free-to-use images from various sources (Pexels, Pixabay, etc.)
 * Format: landscape orientation, suitable for 4:1 cover photos
 */
const FALLBACK_IMAGES: FallbackPhoto[] = [
  // Abstract & Geometric
  {
    id: 'fallback-abstract-1',
    urls: {
      thumb: 'https://images.pexels.com/photos/255379/pexels-photo-255379.jpeg?auto=compress&cs=tinysrgb&w=400&h=100&fit=crop',
      regular: 'https://images.pexels.com/photos/255379/pexels-photo-255379.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300&fit=crop',
      full: 'https://images.pexels.com/photos/255379/pexels-photo-255379.jpeg?auto=compress&cs=tinysrgb&w=1920&h=480&fit=crop',
    },
    width: 1920,
    height: 480,
    description: 'Abstract geometric pattern',
    alt_description: 'Abstract geometric background',
    user: { name: 'Fallback', username: 'fallback' },
  },
  {
    id: 'fallback-abstract-2',
    urls: {
      thumb: 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=400&h=100&fit=crop',
      regular: 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300&fit=crop',
      full: 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=1920&h=480&fit=crop',
    },
    width: 1920,
    height: 480,
    description: 'Colorful abstract background',
    alt_description: 'Colorful abstract pattern',
    user: { name: 'Fallback', username: 'fallback' },
  },
  {
    id: 'fallback-abstract-3',
    urls: {
      thumb: 'https://images.pexels.com/photos/1939485/pexels-photo-1939485.jpeg?auto=compress&cs=tinysrgb&w=400&h=100&fit=crop',
      regular: 'https://images.pexels.com/photos/1939485/pexels-photo-1939485.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300&fit=crop',
      full: 'https://images.pexels.com/photos/1939485/pexels-photo-1939485.jpeg?auto=compress&cs=tinysrgb&w=1920&h=480&fit=crop',
    },
    width: 1920,
    height: 480,
    description: 'Modern abstract design',
    alt_description: 'Modern abstract background',
    user: { name: 'Fallback', username: 'fallback' },
  },
  {
    id: 'fallback-abstract-4',
    urls: {
      thumb: 'https://images.pexels.com/photos/1226398/pexels-photo-1226398.jpeg?auto=compress&cs=tinysrgb&w=400&h=100&fit=crop',
      regular: 'https://images.pexels.com/photos/1226398/pexels-photo-1226398.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300&fit=crop',
      full: 'https://images.pexels.com/photos/1226398/pexels-photo-1226398.jpeg?auto=compress&cs=tinysrgb&w=1920&h=480&fit=crop',
    },
    width: 1920,
    height: 480,
    description: 'Geometric shapes and patterns',
    alt_description: 'Geometric abstract design',
    user: { name: 'Fallback', username: 'fallback' },
  },
  
  // Nature & Landscape
  {
    id: 'fallback-nature-1',
    urls: {
      thumb: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=400&h=100&fit=crop',
      regular: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300&fit=crop',
      full: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1920&h=480&fit=crop',
    },
    width: 1920,
    height: 480,
    description: 'Mountain landscape at sunset',
    alt_description: 'Beautiful mountain landscape',
    user: { name: 'Fallback', username: 'fallback' },
  },
  {
    id: 'fallback-nature-2',
    urls: {
      thumb: 'https://images.pexels.com/photos/2387418/pexels-photo-2387418.jpeg?auto=compress&cs=tinysrgb&w=400&h=100&fit=crop',
      regular: 'https://images.pexels.com/photos/2387418/pexels-photo-2387418.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300&fit=crop',
      full: 'https://images.pexels.com/photos/2387418/pexels-photo-2387418.jpeg?auto=compress&cs=tinysrgb&w=1920&h=480&fit=crop',
    },
    width: 1920,
    height: 480,
    description: 'Forest landscape',
    alt_description: 'Green forest landscape',
    user: { name: 'Fallback', username: 'fallback' },
  },
  {
    id: 'fallback-nature-3',
    urls: {
      thumb: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=400&h=100&fit=crop',
      regular: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300&fit=crop',
      full: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1920&h=480&fit=crop',
    },
    width: 1920,
    height: 480,
    description: 'Ocean waves',
    alt_description: 'Ocean landscape',
    user: { name: 'Fallback', username: 'fallback' },
  },
  {
    id: 'fallback-nature-4',
    urls: {
      thumb: 'https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=400&h=100&fit=crop',
      regular: 'https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300&fit=crop',
      full: 'https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=1920&h=480&fit=crop',
    },
    width: 1920,
    height: 480,
    description: 'Desert landscape',
    alt_description: 'Desert dunes',
    user: { name: 'Fallback', username: 'fallback' },
  },
  
  // Architecture & Urban
  {
    id: 'fallback-arch-1',
    urls: {
      thumb: 'https://images.pexels.com/photos/323775/pexels-photo-323775.jpeg?auto=compress&cs=tinysrgb&w=400&h=100&fit=crop',
      regular: 'https://images.pexels.com/photos/323775/pexels-photo-323775.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300&fit=crop',
      full: 'https://images.pexels.com/photos/323775/pexels-photo-323775.jpeg?auto=compress&cs=tinysrgb&w=1920&h=480&fit=crop',
    },
    width: 1920,
    height: 480,
    description: 'Modern city skyline',
    alt_description: 'City architecture',
    user: { name: 'Fallback', username: 'fallback' },
  },
  {
    id: 'fallback-arch-2',
    urls: {
      thumb: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=400&h=100&fit=crop',
      regular: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300&fit=crop',
      full: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1920&h=480&fit=crop',
    },
    width: 1920,
    height: 480,
    description: 'Urban architecture',
    alt_description: 'Modern building',
    user: { name: 'Fallback', username: 'fallback' },
  },
  {
    id: 'fallback-arch-3',
    urls: {
      thumb: 'https://images.pexels.com/photos/323772/pexels-photo-323772.jpeg?auto=compress&cs=tinysrgb&w=400&h=100&fit=crop',
      regular: 'https://images.pexels.com/photos/323772/pexels-photo-323772.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300&fit=crop',
      full: 'https://images.pexels.com/photos/323772/pexels-photo-323772.jpeg?auto=compress&cs=tinysrgb&w=1920&h=480&fit=crop',
    },
    width: 1920,
    height: 480,
    description: 'Cityscape at night',
    alt_description: 'Urban nightscape',
    user: { name: 'Fallback', username: 'fallback' },
  },
  {
    id: 'fallback-arch-4',
    urls: {
      thumb: 'https://images.pexels.com/photos/323775/pexels-photo-323775.jpeg?auto=compress&cs=tinysrgb&w=400&h=100&fit=crop',
      regular: 'https://images.pexels.com/photos/323775/pexels-photo-323775.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300&fit=crop',
      full: 'https://images.pexels.com/photos/323775/pexels-photo-323775.jpeg?auto=compress&cs=tinysrgb&w=1920&h=480&fit=crop',
    },
    width: 1920,
    height: 480,
    description: 'Modern architecture',
    alt_description: 'Contemporary building design',
    user: { name: 'Fallback', username: 'fallback' },
  },
  
  // Additional variety
  {
    id: 'fallback-tech-1',
    urls: {
      thumb: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=400&h=100&fit=crop',
      regular: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300&fit=crop',
      full: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=1920&h=480&fit=crop',
    },
    width: 1920,
    height: 480,
    description: 'Technology background',
    alt_description: 'Tech workspace',
    user: { name: 'Fallback', username: 'fallback' },
  },
  {
    id: 'fallback-tech-2',
    urls: {
      thumb: 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=400&h=100&fit=crop',
      regular: 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300&fit=crop',
      full: 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=1920&h=480&fit=crop',
    },
    width: 1920,
    height: 480,
    description: 'Digital workspace',
    alt_description: 'Modern office',
    user: { name: 'Fallback', username: 'fallback' },
  },
  {
    id: 'fallback-gradient-1',
    urls: {
      thumb: 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=400&h=100&fit=crop',
      regular: 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300&fit=crop',
      full: 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=1920&h=480&fit=crop',
    },
    width: 1920,
    height: 480,
    description: 'Colorful gradient',
    alt_description: 'Gradient background',
    user: { name: 'Fallback', username: 'fallback' },
  },
  {
    id: 'fallback-gradient-2',
    urls: {
      thumb: 'https://images.pexels.com/photos/1226398/pexels-photo-1226398.jpeg?auto=compress&cs=tinysrgb&w=400&h=100&fit=crop',
      regular: 'https://images.pexels.com/photos/1226398/pexels-photo-1226398.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300&fit=crop',
      full: 'https://images.pexels.com/photos/1226398/pexels-photo-1226398.jpeg?auto=compress&cs=tinysrgb&w=1920&h=480&fit=crop',
    },
    width: 1920,
    height: 480,
    description: 'Abstract gradient',
    alt_description: 'Modern gradient design',
    user: { name: 'Fallback', username: 'fallback' },
  },
];

/**
 * Get random fallback photos
 * @param count Number of photos to return
 * @param query Optional search query to filter by category
 * @returns Array of fallback photos compatible with UnsplashPhoto
 */
export function getFallbackPhotos(count: number = 20, query?: string): FallbackPhoto[] {
  let filtered = FALLBACK_IMAGES;
  
  // Filter by query if provided
  if (query) {
    const lowerQuery = query.toLowerCase();
    filtered = FALLBACK_IMAGES.filter(photo => {
      const desc = (photo.description || '').toLowerCase();
      const alt = (photo.alt_description || '').toLowerCase();
      return desc.includes(lowerQuery) || alt.includes(lowerQuery);
    });
    
    // If no matches, return all images
    if (filtered.length === 0) {
      filtered = FALLBACK_IMAGES;
    }
  }
  
  // Shuffle and return requested count
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Search fallback photos by query
 * @param query Search query
 * @param page Page number (for compatibility with Unsplash API)
 * @param perPage Number of results per page
 * @returns Search response compatible with UnsplashSearchResponse
 */
export function searchFallbackPhotos(
  query: string,
  page: number = 1,
  perPage: number = 20
): { results: FallbackPhoto[]; total: number; total_pages: number } {
  const lowerQuery = query.toLowerCase();
  
  // Filter images by query
  const filtered = FALLBACK_IMAGES.filter(photo => {
    const desc = (photo.description || '').toLowerCase();
    const alt = (photo.alt_description || '').toLowerCase();
    return desc.includes(lowerQuery) || alt.includes(lowerQuery);
  });
  
  // Paginate results
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginated = filtered.slice(startIndex, endIndex);
  
  const totalPages = Math.ceil(filtered.length / perPage);
  
  return {
    results: paginated,
    total: filtered.length,
    total_pages: totalPages,
  };
}

/**
 * Convert FallbackPhoto to UnsplashPhoto format
 * This ensures compatibility with existing code
 */
export function fallbackToUnsplash(photo: FallbackPhoto): UnsplashPhoto {
  return {
    id: photo.id,
    urls: photo.urls,
    width: photo.width,
    height: photo.height,
    description: photo.description,
    alt_description: photo.alt_description,
    user: photo.user,
  };
}










