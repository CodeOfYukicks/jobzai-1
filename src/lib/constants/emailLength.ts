export type EmailLength = 'short' | 'detailed';

export const EMAIL_LENGTHS = {
  short: {
    label: 'Short & Impactful',
    description: {
      en: '3-4 lines, perfect for first contact',
      fr: '3-4 lignes, parfait pour un premier contact'
    }
  },
  detailed: {
    label: 'Detailed & Comprehensive',
    description: {
      en: '6-8 lines, for a more detailed introduction',
      fr: '6-8 lignes, pour une introduction plus détaillée'
    }
  }
} as const; 