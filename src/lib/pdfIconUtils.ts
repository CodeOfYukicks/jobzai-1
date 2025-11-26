// PDF-friendly icon replacements
// Using Unicode symbols instead of SVG icons for better PDF compatibility

export const PDF_ICONS = {
  mail: '✉',
  phone: '☎',
  mapPin: '📍',
  linkedin: '⚲',
  github: '⚙',
  globe: '🌐',
  briefcase: '💼',
  calendar: '📅',
  award: '🏆',
  code: '⚡',
  book: '📚',
  language: '🌍'
};

export type IconType = keyof typeof PDF_ICONS;

// Helper to get PDF icon
export function getPDFIcon(iconType: IconType): string {
  return PDF_ICONS[iconType] || '';
}

// Check if we're in PDF export mode
export function isPDFExportMode(): boolean {
  return document.body.classList.contains('pdf-export-mode');
}

// Prepare element for PDF export
export function prepareDOMForPDFExport(element: HTMLElement): void {
  element.classList.add('pdf-export-mode');
  
  // Replace Lucide icons with Unicode symbols
  const icons = element.querySelectorAll('[data-lucide], svg[class*="lucide"]');
  icons.forEach(icon => {
    const parent = icon.parentElement;
    if (parent) {
      const iconName = icon.getAttribute('data-lucide') || 
                       icon.getAttribute('data-icon-type') ||
                       guessIconType(icon);
      
      if (iconName && iconName in PDF_ICONS) {
        const span = document.createElement('span');
        span.className = 'pdf-icon';
        span.style.fontSize = '1em';
        span.style.lineHeight = '1';
        span.textContent = PDF_ICONS[iconName as IconType];
        icon.replaceWith(span);
      }
    }
  });
}

// Cleanup after PDF export
export function cleanupAfterPDFExport(element: HTMLElement): void {
  element.classList.remove('pdf-export-mode');
}

// Guess icon type from classes or attributes
function guessIconType(icon: Element): string {
  const classList = Array.from(icon.classList);
  
  if (classList.some(c => c.includes('mail'))) return 'mail';
  if (classList.some(c => c.includes('phone'))) return 'phone';
  if (classList.some(c => c.includes('map') || c.includes('pin') || c.includes('location'))) return 'mapPin';
  if (classList.some(c => c.includes('linkedin'))) return 'linkedin';
  if (classList.some(c => c.includes('github'))) return 'github';
  if (classList.some(c => c.includes('globe') || c.includes('web'))) return 'globe';
  if (classList.some(c => c.includes('briefcase') || c.includes('work'))) return 'briefcase';
  if (classList.some(c => c.includes('calendar') || c.includes('date'))) return 'calendar';
  if (classList.some(c => c.includes('award') || c.includes('trophy'))) return 'award';
  if (classList.some(c => c.includes('code'))) return 'code';
  if (classList.some(c => c.includes('book') || c.includes('education'))) return 'book';
  if (classList.some(c => c.includes('language'))) return 'language';
  
  return '';
}

