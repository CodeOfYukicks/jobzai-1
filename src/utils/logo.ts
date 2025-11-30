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
  
  // French Business Schools
  'polytechnique': 'polytechnique.edu',
  'ecole polytechnique': 'polytechnique.edu',
  'x': 'polytechnique.edu',
  'hec': 'hec.edu',
  'hec paris': 'hec.edu',
  'essec': 'essec.edu',
  'essec business school': 'essec.edu',
  'escp': 'escp.eu',
  'escp business school': 'escp.eu',
  'edhec': 'edhec.edu',
  'edhec business school': 'edhec.edu',
  'em lyon': 'em-lyon.com',
  'emlyon': 'em-lyon.com',
  'emlyon business school': 'em-lyon.com',
  'em lyon business school': 'em-lyon.com',
  
  // KEDGE Business School
  'kedge': 'kedge.edu',
  'kedge business school': 'kedge.edu',
  'kedge bs': 'kedge.edu',
  
  // SKEMA Business School
  'skema': 'skema.edu',
  'skema business school': 'skema.edu',
  'skema bs': 'skema.edu',
  
  // Audencia
  'audencia': 'audencia.com',
  'audencia business school': 'audencia.com',
  'audencia nantes': 'audencia.com',
  
  // NEOMA Business School
  'neoma': 'neoma-bs.fr',
  'neoma business school': 'neoma-bs.fr',
  'neoma bs': 'neoma-bs.fr',
  
  // ICN Business School
  'icn': 'icn-artem.com',
  'icn business school': 'icn-artem.com',
  
  // Rennes School of Business
  'rennes sb': 'rennes-sb.com',
  'rennes school of business': 'rennes-sb.com',
  'esc rennes': 'rennes-sb.com',
  
  // Montpellier Business School
  'montpellier bs': 'montpellier-bs.com',
  'montpellier business school': 'montpellier-bs.com',
  'mbs': 'montpellier-bs.com',
  
  // Grenoble Ecole de Management
  'grenoble em': 'grenoble-em.com',
  'grenoble ecole de management': 'grenoble-em.com',
  'gem': 'grenoble-em.com',
  
  // ISC Paris
  'isc paris': 'iscparis.com',
  'isc': 'iscparis.com',
  
  // INSEEC
  'inseec': 'inseec.com',
  'inseec business school': 'inseec.com',
  
  // IESEG
  'ieseg': 'ieseg.fr',
  'ieseg school of management': 'ieseg.fr',
  'iéseg': 'ieseg.fr',
  
  // TBS (Toulouse Business School)
  'tbs': 'tbs-education.com',
  'tbs education': 'tbs-education.com',
  'toulouse business school': 'tbs-education.com',
  
  // BSB (Burgundy School of Business)
  'bsb': 'bsb-education.com',
  'burgundy school of business': 'bsb-education.com',
  'esc dijon': 'bsb-education.com',
  
  // EM Strasbourg
  'em strasbourg': 'em-strasbourg.com',
  'em strasbourg business school': 'em-strasbourg.com',
  
  // EM Normandie
  'em normandie': 'em-normandie.com',
  'em normandie business school': 'em-normandie.com',
  
  // ESSCA
  'essca': 'essca.fr',
  'essca school of management': 'essca.fr',
  
  // ESCE
  'esce': 'esce.fr',
  'esce international business school': 'esce.fr',
  
  // PSB Paris School of Business
  'psb': 'psbedu.paris',
  'psb paris school of business': 'psbedu.paris',
  'paris school of business': 'psbedu.paris',
  
  // IPAG Business School
  'ipag': 'ipag.edu',
  'ipag business school': 'ipag.edu',
  
  // EDC Paris Business School
  'edc': 'edcparis.edu',
  'edc paris': 'edcparis.edu',
  'edc paris business school': 'edcparis.edu',
  
  // ISG
  'isg': 'isg.fr',
  'isg international business school': 'isg.fr',
  
  // French Universities & Engineering Schools
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
  'université paris dauphine': 'dauphine.psl.eu',
  'insead': 'insead.edu',
  'epita': 'epita.fr',
  'epitech': 'epitech.eu',
  '42': '42.fr',
  'ecole 42': '42.fr',
  'supinfo': 'supinfo.com',
  
  // INSA
  'insa': 'insa-lyon.fr',
  'insa lyon': 'insa-lyon.fr',
  'insa toulouse': 'insa-toulouse.fr',
  'insa rennes': 'insa-rennes.fr',
  
  // Arts et Métiers
  'arts et metiers': 'artsetmetiers.fr',
  'arts et métiers': 'artsetmetiers.fr',
  'ensam': 'artsetmetiers.fr',
  
  // ENSTA
  'ensta': 'ensta-paris.fr',
  'ensta paris': 'ensta-paris.fr',
  
  // Ponts ParisTech
  'ponts': 'ecoledesponts.fr',
  'ponts paristech': 'ecoledesponts.fr',
  'ecole des ponts': 'ecoledesponts.fr',
  
  // AgroParisTech
  'agroparistech': 'agroparistech.fr',
  'agro paris tech': 'agroparistech.fr',
  
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

// Common suffixes to remove when extracting brand name
const SCHOOL_SUFFIXES = [
  'business school',
  'school of business',
  'school of management',
  'ecole de management',
  'école de management',
  'graduate school',
  'university',
  'université',
  'institute',
  'institut',
  'college',
  'school',
  'ecole',
  'école',
  'bs',
  'sb',
];

// Common prefixes to remove
const SCHOOL_PREFIXES = [
  'the',
  "l'",
  'le',
  'la',
  'université',
  'university',
  'ecole',
  'école',
  'institut',
  'institute',
];

/**
 * Extract the brand/significant name from an institution name
 * e.g., "KEDGE Business School" -> "kedge"
 * e.g., "EM Lyon Business School" -> "em lyon" or "emlyon"
 */
export function extractBrandName(institutionName: string): string {
  if (!institutionName) return '';
  
  let name = institutionName.trim().toLowerCase();
  
  // Remove suffixes (longest first to avoid partial matches)
  const sortedSuffixes = [...SCHOOL_SUFFIXES].sort((a, b) => b.length - a.length);
  for (const suffix of sortedSuffixes) {
    const pattern = new RegExp(`\\s*${suffix}\\s*$`, 'i');
    name = name.replace(pattern, '').trim();
  }
  
  // Remove prefixes
  for (const prefix of SCHOOL_PREFIXES) {
    const pattern = new RegExp(`^${prefix}\\s+`, 'i');
    name = name.replace(pattern, '').trim();
  }
  
  return name.trim();
}

/**
 * Generate multiple possible domains for a school name
 * Returns an array of domains to try in order
 */
export function getSchoolDomainVariants(institutionName: string | undefined | null): string[] {
  if (!institutionName) return [];
  
  const normalized = institutionName.trim().toLowerCase();
  const variants: string[] = [];
  
  // 1. Check direct match in known map
  if (KNOWN_SCHOOL_DOMAIN_MAP[normalized]) {
    variants.push(KNOWN_SCHOOL_DOMAIN_MAP[normalized]);
  }
  
  // 2. Try cleaned version
  const cleaned = normalized
    .replace(/[^\p{L}\p{N}\s.'-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned !== normalized && KNOWN_SCHOOL_DOMAIN_MAP[cleaned]) {
    variants.push(KNOWN_SCHOOL_DOMAIN_MAP[cleaned]);
  }
  
  // 3. Extract brand name and check
  const brandName = extractBrandName(institutionName);
  if (brandName && KNOWN_SCHOOL_DOMAIN_MAP[brandName]) {
    variants.push(KNOWN_SCHOOL_DOMAIN_MAP[brandName]);
  }
  
  // 4. If already a domain, add it
  if (cleaned.includes('.')) {
    variants.push(cleaned);
  }
  
  // 5. Generate heuristic domains from brand name
  if (brandName && brandName.length >= 2) {
    const compactBrand = brandName.replace(/\s+/g, '');
    const hyphenBrand = brandName.replace(/\s+/g, '-');
    
    // Try various extensions
    if (!variants.some(v => v.includes(compactBrand))) {
      variants.push(`${compactBrand}.edu`);
      variants.push(`${compactBrand}.fr`);
      variants.push(`${compactBrand}.com`);
      variants.push(`${hyphenBrand}.com`);
      variants.push(`${compactBrand}-bs.com`); // Business school pattern
      variants.push(`${compactBrand}-bs.fr`);
    }
  }
  
  // 6. Fallback: compact full name
  const compact = cleaned.replace(/\s+/g, '');
  if (compact.length >= 3 && !variants.some(v => v.startsWith(compact))) {
    variants.push(`${compact}.edu`);
  }
  
  // Remove duplicates while preserving order
  return [...new Set(variants)];
}

export function getSchoolDomain(institutionName: string | undefined | null): string | null {
  const variants = getSchoolDomainVariants(institutionName);
  return variants.length > 0 ? variants[0] : null;
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




