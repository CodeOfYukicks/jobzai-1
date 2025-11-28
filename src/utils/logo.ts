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

// School/University domain mapping
const KNOWN_SCHOOL_DOMAIN_MAP: Record<string, string> = {
  // US Universities
  'harvard': 'harvard.edu',
  'harvard university': 'harvard.edu',
  'mit': 'mit.edu',
  'massachusetts institute of technology': 'mit.edu',
  'stanford': 'stanford.edu',
  'stanford university': 'stanford.edu',
  'yale': 'yale.edu',
  'yale university': 'yale.edu',
  'princeton': 'princeton.edu',
  'princeton university': 'princeton.edu',
  'columbia': 'columbia.edu',
  'columbia university': 'columbia.edu',
  'berkeley': 'berkeley.edu',
  'uc berkeley': 'berkeley.edu',
  'ucla': 'ucla.edu',
  'usc': 'usc.edu',
  'nyu': 'nyu.edu',
  'new york university': 'nyu.edu',
  'cornell': 'cornell.edu',
  'cornell university': 'cornell.edu',
  'upenn': 'upenn.edu',
  'university of pennsylvania': 'upenn.edu',
  'duke': 'duke.edu',
  'duke university': 'duke.edu',
  'northwestern': 'northwestern.edu',
  'northwestern university': 'northwestern.edu',
  'caltech': 'caltech.edu',
  'carnegie mellon': 'cmu.edu',
  'cmu': 'cmu.edu',
  'georgia tech': 'gatech.edu',
  'university of michigan': 'umich.edu',
  'university of texas': 'utexas.edu',
  'ut austin': 'utexas.edu',
  
  // French Schools
  'polytechnique': 'polytechnique.edu',
  'ecole polytechnique': 'polytechnique.edu',
  'x': 'polytechnique.edu',
  'hec': 'hec.edu',
  'hec paris': 'hec.edu',
  'essec': 'essec.edu',
  'escp': 'escp.eu',
  'escp business school': 'escp.eu',
  'edhec': 'edhec.edu',
  'em lyon': 'em-lyon.com',
  'emlyon': 'em-lyon.com',
  'sciences po': 'sciencespo.fr',
  'sciences po paris': 'sciencespo.fr',
  'iep paris': 'sciencespo.fr',
  'sorbonne': 'sorbonne-universite.fr',
  'sorbonne université': 'sorbonne-universite.fr',
  'sorbonne universite': 'sorbonne-universite.fr',
  'paris-sorbonne': 'sorbonne-universite.fr',
  'université paris-saclay': 'universite-paris-saclay.fr',
  'paris saclay': 'universite-paris-saclay.fr',
  'centrale paris': 'centralesupelec.fr',
  'centralesupelec': 'centralesupelec.fr',
  'centrale supelec': 'centralesupelec.fr',
  'mines paris': 'minesparis.psl.eu',
  'mines paristech': 'minesparis.psl.eu',
  'telecom paris': 'telecom-paris.fr',
  'ens': 'ens.psl.eu',
  'ecole normale superieure': 'ens.psl.eu',
  'dauphine': 'dauphine.psl.eu',
  'paris dauphine': 'dauphine.psl.eu',
  'insead': 'insead.edu',
  'epita': 'epita.fr',
  'epitech': 'epitech.eu',
  '42': '42.fr',
  'ecole 42': '42.fr',
  'supinfo': 'supinfo.com',
  
  // UK Universities
  'oxford': 'ox.ac.uk',
  'university of oxford': 'ox.ac.uk',
  'cambridge': 'cam.ac.uk',
  'university of cambridge': 'cam.ac.uk',
  'imperial': 'imperial.ac.uk',
  'imperial college': 'imperial.ac.uk',
  'imperial college london': 'imperial.ac.uk',
  'lse': 'lse.ac.uk',
  'london school of economics': 'lse.ac.uk',
  'ucl': 'ucl.ac.uk',
  'university college london': 'ucl.ac.uk',
  'kings college london': 'kcl.ac.uk',
  "king's college london": 'kcl.ac.uk',
  'edinburgh': 'ed.ac.uk',
  'university of edinburgh': 'ed.ac.uk',
  'manchester': 'manchester.ac.uk',
  'university of manchester': 'manchester.ac.uk',
  'warwick': 'warwick.ac.uk',
  'university of warwick': 'warwick.ac.uk',
  'london business school': 'london.edu',
  'lbs': 'london.edu',
  
  // German Universities
  'tu munich': 'tum.de',
  'technical university of munich': 'tum.de',
  'tum': 'tum.de',
  'rwth aachen': 'rwth-aachen.de',
  'heidelberg': 'uni-heidelberg.de',
  'university of heidelberg': 'uni-heidelberg.de',
  'lmu munich': 'lmu.de',
  'humboldt': 'hu-berlin.de',
  'humboldt university': 'hu-berlin.de',
  
  // Other European
  'eth zurich': 'ethz.ch',
  'eth': 'ethz.ch',
  'epfl': 'epfl.ch',
  'tu delft': 'tudelft.nl',
  'delft': 'tudelft.nl',
  'bocconi': 'unibocconi.it',
  'ie business school': 'ie.edu',
  'iese': 'iese.edu',
  
  // Asian Universities
  'tsinghua': 'tsinghua.edu.cn',
  'tsinghua university': 'tsinghua.edu.cn',
  'peking university': 'pku.edu.cn',
  'tokyo university': 'u-tokyo.ac.jp',
  'university of tokyo': 'u-tokyo.ac.jp',
  'nus': 'nus.edu.sg',
  'national university of singapore': 'nus.edu.sg',
  'kaist': 'kaist.ac.kr',
  'seoul national university': 'snu.ac.kr',
  'iit': 'iitb.ac.in',
  'iit bombay': 'iitb.ac.in',
  'iit delhi': 'iitd.ac.in',
  
  // Canadian Universities
  'mcgill': 'mcgill.ca',
  'mcgill university': 'mcgill.ca',
  'university of toronto': 'utoronto.ca',
  'uoft': 'utoronto.ca',
  'ubc': 'ubc.ca',
  'university of british columbia': 'ubc.ca',
  'waterloo': 'uwaterloo.ca',
  'university of waterloo': 'uwaterloo.ca',
  
  // Australian Universities
  'university of melbourne': 'unimelb.edu.au',
  'melbourne university': 'unimelb.edu.au',
  'university of sydney': 'sydney.edu.au',
  'unsw': 'unsw.edu.au',
  'anu': 'anu.edu.au',
  'australian national university': 'anu.edu.au',
};

export function getSchoolDomain(institutionName: string | undefined | null): string | null {
  if (!institutionName) return null;
  const normalized = institutionName.trim().toLowerCase();
  
  // Check direct match
  if (KNOWN_SCHOOL_DOMAIN_MAP[normalized]) return KNOWN_SCHOOL_DOMAIN_MAP[normalized];

  // Try to strip common suffixes and variations
  const cleaned = normalized
    .replace(/[^\p{L}\p{N}\s.'-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (KNOWN_SCHOOL_DOMAIN_MAP[cleaned]) return KNOWN_SCHOOL_DOMAIN_MAP[cleaned];

  // Try without common prefixes/suffixes
  const withoutPrefix = cleaned
    .replace(/^(the|l'|le|la|université|university|ecole|école|institut|institute)\s+/i, '')
    .trim();
  if (KNOWN_SCHOOL_DOMAIN_MAP[withoutPrefix]) return KNOWN_SCHOOL_DOMAIN_MAP[withoutPrefix];

  // If it already looks like a domain, return it
  if (cleaned.includes('.')) return cleaned;

  // Heuristic for universities: try .edu domain
  const compact = cleaned.replace(/\s+/g, '');
  if (compact.length >= 3) {
    // Try common patterns
    return `${compact}.edu`;
  }

  return null;
}

export function getSchoolInitials(institutionName: string): string {
  if (!institutionName) return '??';
  
  const cleaned = institutionName.trim();
  
  // Handle acronyms (all caps, 2-5 letters)
  if (/^[A-Z]{2,5}$/.test(cleaned)) {
    return cleaned;
  }
  
  const parts = cleaned.split(/\s+/);
  
  // Filter out common words
  const significantParts = parts.filter(p => 
    !['of', 'the', 'and', 'de', 'la', 'le', 'du', 'des', 'university', 'université', 'college', 'school', 'institute', 'institut', 'ecole', 'école'].includes(p.toLowerCase())
  );
  
  if (significantParts.length === 0) {
    // Fall back to first letters of first two words
    return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }
  
  if (significantParts.length === 1) {
    return significantParts[0].slice(0, 2).toUpperCase();
  }
  
  // Take first letter of first two significant words
  return significantParts.slice(0, 2).map(p => p[0]).join('').toUpperCase();
}




