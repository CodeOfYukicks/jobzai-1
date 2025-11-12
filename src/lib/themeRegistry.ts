export type ThemeKind = 'react' | 'html' | 'jsonresume-theme';

export interface ThemeEntry {
  id: string;
  name: string;
  kind: ThemeKind;
  source: string; // 'local:HarvardTemplate' or npm package name or path to html
  license?: string;
  thumbnailUrl?: string;
  recommended?: boolean;
}

// Minimal registry: keep our two local templates + placeholders for future JSON Resume themes
export const themeRegistry: ThemeEntry[] = [
  { id: 'harvard', name: 'Harvard', kind: 'react', source: 'local:HarvardTemplate', recommended: true },
  { id: 'modern', name: 'Modern', kind: 'react', source: 'local:ModernTemplate' },
  // Examples (to be wired when server-side HTML render or client renderer is ready)
  { id: 'elegant', name: 'Elegant (JSON Resume)', kind: 'jsonresume-theme', source: 'jsonresume-theme-elegant', license: 'MIT' },
  { id: 'stackoverflow', name: 'Stack Overflow (JSON Resume)', kind: 'jsonresume-theme', source: 'jsonresume-theme-stackoverflow', license: 'MIT' }
];



