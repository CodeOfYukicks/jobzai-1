export type EmailLength = 'short' | 'medium' | 'detailed';

export const EMAIL_LENGTHS = {
  short: {
    label: 'Short & Impactful',
    description: {
      en: '3-4 lines, perfect for initial outreach',
      fr: '3-4 lignes, idéal pour une première approche'
    }
  },
  medium: {
    label: 'Balanced & Professional',
    description: {
      en: '5-7 lines, good balance of conciseness and detail',
      fr: '5-7 lignes, bon équilibre entre concision et détail'
    }
  },
  detailed: {
    label: 'Detailed & Comprehensive',
    description: {
      en: '8-12 lines, for a thorough introduction',
      fr: '8-12 lignes, pour une présentation complète'
    }
  }
} as const; 