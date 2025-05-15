export const EMAIL_GOALS = {
  network: {
    label: 'Build Connection',
    examples: {
      en: 'Perfect for: reaching out to new contacts and strengthening professional relationships',
      fr: 'Parfait pour : contacter de nouvelles personnes et renforcer vos relations professionnelles'
    }
  },
  explore: {
    label: 'Explore Opportunities',
    examples: {
      en: 'Perfect for: inquiring about roles, expressing interest in specific companies',
      fr: 'Parfait pour : s\'informer sur des postes, exprimer un intérêt pour certaines entreprises'
    }
  },
  introduction: {
    label: 'Make Introduction',
    examples: {
      en: 'Perfect for: presenting yourself professionally, making a memorable first impression',
      fr: 'Parfait pour : vous présenter professionnellement, faire une première impression mémorable'
    }
  }
} as const;

export type EmailGoal = keyof typeof EMAIL_GOALS; 