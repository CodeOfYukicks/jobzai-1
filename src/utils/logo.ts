const KNOWN_COMPANY_DOMAIN_MAP: Record<string, string> = {
  'pwc': 'pwc.com',
  'pricewaterhousecoopers': 'pwc.com',
  'salesforce': 'salesforce.com',
  'datadog': 'datadoghq.com',
  'docuSign': 'docusign.com',
  'docusign': 'docusign.com',
  'microsoft': 'microsoft.com',
  'bcg': 'bcg.com',
  'boston consulting group': 'bcg.com',
  'alegria': 'alegria.group',
  'alegria.group': 'alegria.group',
  'aircall': 'aircall.io',
  'alma': 'getalma.eu',
  'google': 'google.com',
  'amazon': 'amazon.com',
  'meta': 'meta.com',
  'facebook': 'facebook.com',
  'apple': 'apple.com',
  'stripe': 'stripe.com',
  'notion': 'notion.so',
  'linear': 'linear.app',
  'superhuman': 'superhuman.com',
};

export function getCompanyDomain(companyName: string | undefined | null): string | null {
  if (!companyName) return null;
  const normalized = companyName.trim().toLowerCase();
  if (KNOWN_COMPANY_DOMAIN_MAP[normalized]) return KNOWN_COMPANY_DOMAIN_MAP[normalized];

  // Try to strip common suffixes or punctuation, then build a heuristic domain
  const cleaned = normalized.replace(/[^\p{L}\p{N}\s.]/gu, '').replace(/\s+/g, ' ').trim();
  if (KNOWN_COMPANY_DOMAIN_MAP[cleaned]) return KNOWN_COMPANY_DOMAIN_MAP[cleaned];

  // If it already looks like a domain-ish input, return it
  if (cleaned.includes('.')) return cleaned;

  // Heuristic: remove spaces -> .com
  const compact = cleaned.replace(/\s+/g, '');
  if (compact.length >= 3) {
    return `${compact}.com`;
  }

  return null;
}

export function getClearbitUrl(domain: string): string {
  return `https://logo.clearbit.com/${domain}`;
}

export function getGoogleFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}




