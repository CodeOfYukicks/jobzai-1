export const EMAIL_GOALS = {
  network: {
    label: 'Build Connection',
    examples: {
      en: 'Perfect for: expanding network, getting known in the company',
      fr: 'Parfait pour : développer son réseau, se faire connaître dans l\'entreprise'
    }
  },
  explore: {
    label: 'Explore Opportunities',
    examples: {
      en: 'Perfect for: targeted spontaneous application, active job search',
      fr: 'Parfait pour : candidature spontanée ciblée, recherche active'
    }
  },
  introduction: {
    label: 'Make Introduction',
    examples: {
      en: 'Perfect for: positioning for the future, staying on the radar',
      fr: 'Parfait pour : se positionner pour le futur, rester dans le radar'
    }
  }
} as const;

export type EmailGoal = keyof typeof EMAIL_GOALS; 