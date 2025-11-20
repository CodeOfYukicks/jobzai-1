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
  'airbnb': 'airbnb.com',
  'brex': 'brex.com',
  'zapier': 'zapier.com',
  'monday': 'monday.com',
  'monday.com': 'monday.com',
  'rippling': 'rippling.com',
  'intuit': 'intuit.com',
  'devoteam': 'devoteam.com',
  'vestiaire collective': 'vestiaire-collective.com',
  'netflix': 'netflix.com',
  'spotify': 'spotify.com',
  'uber': 'uber.com',
  'lyft': 'lyft.com',
  'tesla': 'tesla.com',
  'spacex': 'spacex.com',
  'twitter': 'twitter.com',
  'x': 'twitter.com',
  'linkedin': 'linkedin.com',
  'slack': 'slack.com',
  'zoom': 'zoom.us',
  'dropbox': 'dropbox.com',
  'box': 'box.com',
  'atlassian': 'atlassian.com',
  'figma': 'figma.com',
  'canva': 'canva.com',
  'shopify': 'shopify.com',
  'square': 'squareup.com',
  'paypal': 'paypal.com',
  'nvidia': 'nvidia.com',
  'intel': 'intel.com',
  'amd': 'amd.com',
  'ibm': 'ibm.com',
  'oracle': 'oracle.com',
  'sap': 'sap.com',
  'adobe': 'adobe.com',
  'vmware': 'vmware.com',
  'snowflake': 'snowflake.com',
  'databricks': 'databricks.com',
  'palantir': 'palantir.com',
  'coinbase': 'coinbase.com',
  'robinhood': 'robinhood.com',
  'plaid': 'plaid.com',
  'chime': 'chime.com',
  'revolut': 'revolut.com',
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

export function getCompanyInitials(companyName: string): string {
  if (!companyName) return '??';
  
  const cleaned = companyName.trim();
  const parts = cleaned.split(/\s+/);
  
  if (parts.length === 1) {
    // Si un seul mot, prendre les 2 premières lettres
    return cleaned.slice(0, 2).toUpperCase();
  }
  
  // Si plusieurs mots, prendre la première lettre du premier et dernier mot
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}




