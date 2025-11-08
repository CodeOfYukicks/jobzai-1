/**
 * Theme management utility
 * Handles loading and applying theme from localStorage and Firestore
 */

export type Theme = 'light' | 'dark' | 'system';

/**
 * Apply theme to the document
 */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  
  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.classList.toggle('dark', systemTheme === 'dark');
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
  
  // Save to localStorage for persistence
  localStorage.setItem('theme', theme);
}

/**
 * Load theme from localStorage
 * This is called immediately on page load to prevent flash
 */
export function loadThemeFromStorage(): Theme {
  const savedTheme = localStorage.getItem('theme') as Theme | null;
  if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
    return savedTheme;
  }
  return 'system'; // Default to system
}

/**
 * Initialize theme on page load
 * This should be called BEFORE React renders to prevent flash
 */
export function initializeTheme() {
  const theme = loadThemeFromStorage();
  applyTheme(theme);
}

/**
 * Force light mode (remove dark class)
 * Used for public pages like landing, login, signup
 */
export function forceLightMode() {
  const root = document.documentElement;
  root.classList.remove('dark');
}

