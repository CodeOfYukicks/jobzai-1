/**
 * Design System - Couleurs cohérentes pour l'application
 * Utilisé pour maintenir une cohérence visuelle à travers tous les composants
 */

export const colors = {
  // Dark mode backgrounds
  dark: {
    primary: '#0a0a0a',
    card: '#1a1a1a',
    hover: '#2b2a2c',
    border: 'rgba(255, 255, 255, 0.08)',
  },
  
  // Accent vert (remplace violet/purple pour les CTA)
  accent: {
    primary: '#b7e219',
    hover: '#a5cb17',
    border: '#9fc015',
    light: 'rgba(183, 226, 25, 0.1)',
    text: '#b7e219',
  },
  
  // Status colors
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
} as const;

export const darkModeClasses = {
  // Backgrounds
  bgPrimary: 'dark:bg-[#0a0a0a]',
  bgCard: 'dark:bg-[#1a1a1a]',
  bgHover: 'dark:hover:bg-[#2b2a2c]',
  
  // Borders
  border: 'dark:border-white/[0.08]',
  borderHover: 'dark:hover:border-white/[0.12]',
  
  // Text
  textPrimary: 'dark:text-white',
  textSecondary: 'dark:text-white/60',
  textMuted: 'dark:text-white/40',
  
  // Accent (vert)
  accentBg: 'bg-[#b7e219]',
  accentHover: 'hover:bg-[#a5cb17]',
  accentBorder: 'border-[#9fc015]',
  accentText: 'text-[#b7e219]',
} as const;

/**
 * Classes Tailwind pour les boutons CTA principaux
 */
export const buttonClasses = {
  primary: `
    bg-[#b7e219] text-gray-900 
    hover:bg-[#a5cb17] hover:shadow-md 
    border border-[#9fc015]
    dark:bg-[#b7e219] dark:text-gray-900
    dark:hover:bg-[#a5cb17]
    font-semibold rounded-lg shadow-sm
    transition-all duration-200
  `.trim().replace(/\s+/g, ' '),
  
  secondary: `
    bg-white dark:bg-[#2b2a2c] 
    text-gray-700 dark:text-gray-200
    border border-gray-200 dark:border-white/[0.08]
    hover:bg-gray-50 dark:hover:bg-[#3d3c3e]
    rounded-lg transition-colors
  `.trim().replace(/\s+/g, ' '),
  
  ghost: `
    text-gray-700 dark:text-gray-300
    hover:bg-gray-100 dark:hover:bg-white/[0.06]
    rounded-lg transition-colors
  `.trim().replace(/\s+/g, ' '),
} as const;

