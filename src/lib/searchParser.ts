/**
 * Smart Search Query Parser
 * Intelligently parses natural language job search queries
 * 
 * Examples:
 * - "marketing paris" → keywords=["marketing"], locations=["paris"]
 * - "salesforce france suisse" → technologies=["salesforce"], locations=["france", "suisse"]
 * - "consultant salesforce paris remote" → roles=["consultant"], technologies=["salesforce"], locations=["paris"], workLocation="remote"
 */

// ============================================
// DICTIONARIES
// ============================================

/**
 * Known cities - lowercase for matching
 */
const KNOWN_CITIES: Record<string, string> = {
  // France
  'paris': 'Paris',
  'lyon': 'Lyon',
  'marseille': 'Marseille',
  'toulouse': 'Toulouse',
  'bordeaux': 'Bordeaux',
  'lille': 'Lille',
  'nantes': 'Nantes',
  'strasbourg': 'Strasbourg',
  'montpellier': 'Montpellier',
  'nice': 'Nice',
  'rennes': 'Rennes',
  'grenoble': 'Grenoble',
  
  // Switzerland
  'zurich': 'Zurich',
  'zürich': 'Zurich',
  'geneva': 'Geneva',
  'geneve': 'Geneva',
  'genève': 'Geneva',
  'bern': 'Bern',
  'berne': 'Bern',
  'lausanne': 'Lausanne',
  'basel': 'Basel',
  'bâle': 'Basel',
  
  // Germany
  'berlin': 'Berlin',
  'munich': 'Munich',
  'münchen': 'Munich',
  'frankfurt': 'Frankfurt',
  'hamburg': 'Hamburg',
  'cologne': 'Cologne',
  'köln': 'Cologne',
  'düsseldorf': 'Düsseldorf',
  'dusseldorf': 'Düsseldorf',
  'stuttgart': 'Stuttgart',
  
  // UK
  'london': 'London',
  'manchester': 'Manchester',
  'birmingham': 'Birmingham',
  'edinburgh': 'Edinburgh',
  'glasgow': 'Glasgow',
  'bristol': 'Bristol',
  'cambridge': 'Cambridge',
  'oxford': 'Oxford',
  
  // USA
  'new york': 'New York',
  'nyc': 'New York',
  'san francisco': 'San Francisco',
  'sf': 'San Francisco',
  'los angeles': 'Los Angeles',
  'la': 'Los Angeles',
  'chicago': 'Chicago',
  'seattle': 'Seattle',
  'boston': 'Boston',
  'austin': 'Austin',
  'denver': 'Denver',
  'miami': 'Miami',
  'atlanta': 'Atlanta',
  'washington': 'Washington',
  'dc': 'Washington',
  
  // Other Europe
  'amsterdam': 'Amsterdam',
  'rotterdam': 'Rotterdam',
  'brussels': 'Brussels',
  'bruxelles': 'Brussels',
  'madrid': 'Madrid',
  'barcelona': 'Barcelona',
  'milan': 'Milan',
  'milano': 'Milan',
  'rome': 'Rome',
  'roma': 'Rome',
  'dublin': 'Dublin',
  'lisbon': 'Lisbon',
  'lisboa': 'Lisbon',
  'vienna': 'Vienna',
  'wien': 'Vienna',
  'prague': 'Prague',
  'warsaw': 'Warsaw',
  'stockholm': 'Stockholm',
  'copenhagen': 'Copenhagen',
  'oslo': 'Oslo',
  'helsinki': 'Helsinki',
  
  // Canada
  'toronto': 'Toronto',
  'vancouver': 'Vancouver',
  'montreal': 'Montreal',
  'montréal': 'Montreal',
  
  // Asia-Pacific
  'singapore': 'Singapore',
  'hong kong': 'Hong Kong',
  'tokyo': 'Tokyo',
  'sydney': 'Sydney',
  'melbourne': 'Melbourne',
  'dubai': 'Dubai',
  'bangalore': 'Bangalore',
  'mumbai': 'Mumbai',
};

/**
 * Known countries - lowercase for matching
 */
const KNOWN_COUNTRIES: Record<string, string> = {
  'france': 'France',
  'french': 'France',
  'suisse': 'Switzerland',
  'switzerland': 'Switzerland',
  'swiss': 'Switzerland',
  'allemagne': 'Germany',
  'germany': 'Germany',
  'german': 'Germany',
  'uk': 'United Kingdom',
  'united kingdom': 'United Kingdom',
  'england': 'United Kingdom',
  'britain': 'United Kingdom',
  'usa': 'United States',
  'us': 'United States',
  'united states': 'United States',
  'america': 'United States',
  'italie': 'Italy',
  'italy': 'Italy',
  'italian': 'Italy',
  'espagne': 'Spain',
  'spain': 'Spain',
  'spanish': 'Spain',
  'belgique': 'Belgium',
  'belgium': 'Belgium',
  'netherlands': 'Netherlands',
  'holland': 'Netherlands',
  'pays-bas': 'Netherlands',
  'canada': 'Canada',
  'canadian': 'Canada',
  'ireland': 'Ireland',
  'irlande': 'Ireland',
  'portugal': 'Portugal',
  'austria': 'Austria',
  'autriche': 'Austria',
  'sweden': 'Sweden',
  'suède': 'Sweden',
  'norway': 'Norway',
  'norvège': 'Norway',
  'denmark': 'Denmark',
  'danemark': 'Denmark',
  'finland': 'Finland',
  'finlande': 'Finland',
  'poland': 'Poland',
  'pologne': 'Poland',
  'czech': 'Czech Republic',
  'czechia': 'Czech Republic',
  'singapore': 'Singapore',
  'australia': 'Australia',
  'japan': 'Japan',
  'japon': 'Japan',
  'india': 'India',
  'inde': 'India',
  'china': 'China',
  'chine': 'China',
  'brazil': 'Brazil',
  'brésil': 'Brazil',
  'mexico': 'Mexico',
  'mexique': 'Mexico',
  'luxembourg': 'Luxembourg',
  'monaco': 'Monaco',
};

/**
 * Known technologies/tools - lowercase keys map to normalized names
 */
const KNOWN_TECHNOLOGIES: Record<string, string> = {
  // CRM & Sales
  'salesforce': 'salesforce',
  'sfdc': 'salesforce',
  'sf': 'salesforce',
  'sales cloud': 'salesforce',
  'service cloud': 'salesforce',
  'marketing cloud': 'salesforce',
  'hubspot': 'hubspot',
  'dynamics': 'dynamics 365',
  'dynamics 365': 'dynamics 365',
  'microsoft dynamics': 'dynamics 365',
  'pipedrive': 'pipedrive',
  'zoho': 'zoho',
  'zendesk': 'zendesk',
  'intercom': 'intercom',
  
  // ERP
  'sap': 'sap',
  's4hana': 'sap',
  's/4hana': 'sap',
  'oracle': 'oracle',
  'netsuite': 'netsuite',
  'workday': 'workday',
  'servicenow': 'servicenow',
  
  // Programming Languages
  'python': 'python',
  'javascript': 'javascript',
  'js': 'javascript',
  'typescript': 'typescript',
  'ts': 'typescript',
  'java': 'java',
  'go': 'go',
  'golang': 'go',
  'rust': 'rust',
  'c++': 'c++',
  'cpp': 'c++',
  'c#': 'c#',
  'csharp': 'c#',
  'php': 'php',
  'ruby': 'ruby',
  'swift': 'swift',
  'kotlin': 'kotlin',
  'scala': 'scala',
  'sql': 'sql',
  'r': 'r',
  
  // Frontend
  'react': 'react',
  'reactjs': 'react',
  'react.js': 'react',
  'vue': 'vue',
  'vuejs': 'vue',
  'vue.js': 'vue',
  'angular': 'angular',
  'svelte': 'svelte',
  'nextjs': 'next.js',
  'next.js': 'next.js',
  'next': 'next.js',
  'nuxt': 'nuxt',
  'nuxtjs': 'nuxt',
  'tailwind': 'tailwind',
  'tailwindcss': 'tailwind',
  
  // Backend
  'node': 'node.js',
  'nodejs': 'node.js',
  'node.js': 'node.js',
  'express': 'express',
  'expressjs': 'express',
  'django': 'django',
  'flask': 'flask',
  'fastapi': 'fastapi',
  'spring': 'spring',
  'springboot': 'spring',
  'laravel': 'laravel',
  'rails': 'rails',
  'ruby on rails': 'rails',
  '.net': '.net',
  'dotnet': '.net',
  'graphql': 'graphql',
  
  // Cloud & DevOps
  'aws': 'aws',
  'amazon web services': 'aws',
  'azure': 'azure',
  'microsoft azure': 'azure',
  'gcp': 'gcp',
  'google cloud': 'gcp',
  'docker': 'docker',
  'kubernetes': 'kubernetes',
  'k8s': 'kubernetes',
  'terraform': 'terraform',
  'ansible': 'ansible',
  'jenkins': 'jenkins',
  'gitlab': 'gitlab',
  'github': 'github',
  'ci/cd': 'ci/cd',
  'cicd': 'ci/cd',
  
  // Databases
  'postgresql': 'postgresql',
  'postgres': 'postgresql',
  'mysql': 'mysql',
  'mongodb': 'mongodb',
  'mongo': 'mongodb',
  'redis': 'redis',
  'elasticsearch': 'elasticsearch',
  'elastic': 'elasticsearch',
  'cassandra': 'cassandra',
  'dynamodb': 'dynamodb',
  'firestore': 'firestore',
  'firebase': 'firebase',
  'supabase': 'supabase',
  'snowflake': 'snowflake',
  'bigquery': 'bigquery',
  'redshift': 'redshift',
  
  // Data & Analytics
  'tableau': 'tableau',
  'powerbi': 'powerbi',
  'power bi': 'powerbi',
  'looker': 'looker',
  'databricks': 'databricks',
  'spark': 'spark',
  'apache spark': 'spark',
  'hadoop': 'hadoop',
  'airflow': 'airflow',
  'dbt': 'dbt',
  
  // AI & ML
  'tensorflow': 'tensorflow',
  'pytorch': 'pytorch',
  'scikit-learn': 'scikit-learn',
  'sklearn': 'scikit-learn',
  'langchain': 'langchain',
  'openai': 'openai',
  'gpt': 'gpt',
  'chatgpt': 'gpt',
  'llm': 'llm',
  'machine learning': 'machine learning',
  'ml': 'machine learning',
  'deep learning': 'deep learning',
  'nlp': 'nlp',
  'computer vision': 'computer vision',
  
  // Design
  'figma': 'figma',
  'sketch': 'sketch',
  'adobe': 'adobe',
  'photoshop': 'photoshop',
  'illustrator': 'illustrator',
  'xd': 'xd',
  'invision': 'invision',
  'framer': 'framer',
  
  // Project Management
  'jira': 'jira',
  'confluence': 'confluence',
  'asana': 'asana',
  'monday': 'monday.com',
  'monday.com': 'monday.com',
  'notion': 'notion',
  'trello': 'trello',
  'linear': 'linear',
  'clickup': 'clickup',
  
  // Marketing
  'marketo': 'marketo',
  'mailchimp': 'mailchimp',
  'klaviyo': 'klaviyo',
  'braze': 'braze',
  'segment': 'segment',
  'amplitude': 'amplitude',
  'mixpanel': 'mixpanel',
  'google analytics': 'google analytics',
  'ga4': 'google analytics',
};

/**
 * Work location keywords
 */
const WORK_LOCATIONS: Record<string, string> = {
  'remote': 'remote',
  'télétravail': 'remote',
  'teletravail': 'remote',
  'wfh': 'remote',
  'work from home': 'remote',
  'distributed': 'remote',
  'hybrid': 'hybrid',
  'hybride': 'hybrid',
  'flex': 'hybrid',
  'flexible': 'hybrid',
  'onsite': 'on-site',
  'on-site': 'on-site',
  'on site': 'on-site',
  'in-office': 'on-site',
  'in office': 'on-site',
  'présentiel': 'on-site',
  'presentiel': 'on-site',
};

/**
 * Employment type keywords - French and English
 */
const EMPLOYMENT_TYPES: Record<string, string> = {
  // Full-time
  'cdi': 'full-time',
  'full-time': 'full-time',
  'fulltime': 'full-time',
  'full time': 'full-time',
  'permanent': 'full-time',
  'temps plein': 'full-time',
  
  // Contract
  'cdd': 'contract',
  'contract': 'contract',
  'contractor': 'contract',
  'freelance': 'contract',
  'freelancer': 'contract',
  'indépendant': 'contract',
  'independant': 'contract',
  'consultant': 'contract', // Often implies contract
  'interim': 'contract',
  'intérim': 'contract',
  'temporary': 'contract',
  'fixed-term': 'contract',
  
  // Part-time
  'part-time': 'part-time',
  'parttime': 'part-time',
  'part time': 'part-time',
  'temps partiel': 'part-time',
  'mi-temps': 'part-time',
  
  // Internship
  'stage': 'internship',
  'stagiaire': 'internship',
  'intern': 'internship',
  'internship': 'internship',
  'alternance': 'internship',
  'alternant': 'internship',
  'apprenti': 'internship',
  'apprentice': 'internship',
  'apprenticeship': 'internship',
};

/**
 * Role function keywords
 */
const ROLE_FUNCTIONS: Record<string, string> = {
  // Engineering
  'developer': 'engineering',
  'développeur': 'engineering',
  'developpeur': 'engineering',
  'engineer': 'engineering',
  'ingénieur': 'engineering',
  'ingenieur': 'engineering',
  'programmer': 'engineering',
  'coder': 'engineering',
  'swe': 'engineering',
  'software': 'engineering',
  'backend': 'engineering',
  'frontend': 'engineering',
  'fullstack': 'engineering',
  'full-stack': 'engineering',
  'devops': 'engineering',
  'sre': 'engineering',
  'architect': 'engineering',
  
  // Data
  'data scientist': 'data',
  'data engineer': 'data',
  'data analyst': 'data',
  'analyst': 'data',
  'analytics': 'data',
  'bi': 'data',
  'business intelligence': 'data',
  'statistician': 'data',
  
  // Product
  'product manager': 'product',
  'product owner': 'product',
  'pm': 'product',
  'chef de produit': 'product',
  
  // Design
  'designer': 'design',
  'ux': 'design',
  'ui': 'design',
  'ui/ux': 'design',
  'ux/ui': 'design',
  'graphic': 'design',
  'creative': 'design',
  
  // Sales
  'sales': 'sales',
  'commercial': 'sales',
  'account executive': 'sales',
  'ae': 'sales',
  'bdr': 'sales',
  'sdr': 'sales',
  'business development': 'sales',
  'account manager': 'sales',
  
  // Marketing
  'marketing': 'marketing',
  'growth': 'marketing',
  'content': 'marketing',
  'seo': 'marketing',
  'sem': 'marketing',
  'brand': 'marketing',
  'digital marketing': 'marketing',
  'social media': 'marketing',
  'communication': 'marketing',
  
  // Consulting
  'consultant': 'consulting',
  'consulting': 'consulting',
  'advisory': 'consulting',
  'advisor': 'consulting',
  'conseil': 'consulting',
  
  // HR
  'hr': 'hr',
  'human resources': 'hr',
  'recruiter': 'hr',
  'recruiting': 'hr',
  'talent': 'hr',
  'people': 'hr',
  'rh': 'hr',
  
  // Finance
  'finance': 'finance',
  'financial': 'finance',
  'accountant': 'finance',
  'accounting': 'finance',
  'comptable': 'finance',
  'controller': 'finance',
  'treasury': 'finance',
  'audit': 'finance',
  'tax': 'finance',
  
  // Operations
  'operations': 'operations',
  'ops': 'operations',
  'supply chain': 'operations',
  'logistics': 'operations',
  'logistique': 'operations',
  'procurement': 'operations',
  
  // Support
  'support': 'support',
  'customer support': 'support',
  'customer service': 'support',
  'customer success': 'support',
  'cs': 'support',
  'helpdesk': 'support',
  
  // Legal
  'legal': 'legal',
  'lawyer': 'legal',
  'attorney': 'legal',
  'juriste': 'legal',
  'avocat': 'legal',
  'compliance': 'legal',
  'paralegal': 'legal',
};

/**
 * Experience level keywords
 */
const EXPERIENCE_LEVELS: Record<string, string> = {
  'junior': 'entry',
  'jr': 'entry',
  'entry': 'entry',
  'entry-level': 'entry',
  'débutant': 'entry',
  'debutant': 'entry',
  'graduate': 'entry',
  
  'mid': 'mid',
  'mid-level': 'mid',
  'confirmé': 'mid',
  'confirme': 'mid',
  'intermediate': 'mid',
  
  'senior': 'senior',
  'sr': 'senior',
  'expérimenté': 'senior',
  'experimente': 'senior',
  
  'lead': 'lead',
  'principal': 'lead',
  'staff': 'lead',
  'manager': 'lead',
  'head': 'lead',
  'director': 'lead',
  'vp': 'lead',
  'chief': 'lead',
};

// ============================================
// PARSING TYPES
// ============================================

export interface ParsedSearchQuery {
  // Raw tokens that couldn't be classified
  keywords: string[];
  
  // Classified tokens
  locations: string[];
  technologies: string[];
  workLocations: string[];  // remote, hybrid, on-site
  employmentTypes: string[];  // full-time, contract, internship
  roleFunctions: string[];  // engineering, sales, marketing, etc.
  experienceLevels: string[];  // entry, mid, senior, lead
  
  // Original query for reference
  originalQuery: string;
}

export interface SearchAPIParams {
  keyword?: string;
  locations?: string;
  technologies?: string;
  workLocation?: string;
  employmentType?: string;
  roleFunction?: string;
  experienceLevel?: string;
}

// ============================================
// TOKENIZATION & CLASSIFICATION
// ============================================

/**
 * Smart tokenizer that handles multi-word terms
 */
function tokenize(query: string): string[] {
  // Normalize the query
  let normalized = query.toLowerCase().trim();
  
  // Remove common separators and normalize spaces
  normalized = normalized
    .replace(/[,;|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Handle multi-word terms first (greedy matching)
  const multiWordTerms = [
    // Cities
    'new york', 'san francisco', 'los angeles', 'hong kong', 
    'ruby on rails', 'machine learning', 'deep learning',
    'computer vision', 'full time', 'part time', 'full-time', 'part-time',
    'work from home', 'on site', 'on-site', 'in office', 'in-office',
    'temps plein', 'temps partiel', 'mi-temps',
    'data scientist', 'data engineer', 'data analyst',
    'product manager', 'product owner', 'account executive',
    'customer support', 'customer service', 'customer success',
    'business development', 'business intelligence',
    'human resources', 'supply chain', 'social media',
    'digital marketing', 'google analytics', 'google cloud',
    'amazon web services', 'microsoft azure', 'microsoft dynamics',
    'power bi', 'sales cloud', 'service cloud', 'marketing cloud',
    'chef de produit', 'entry level', 'entry-level', 'mid-level',
    'apple', 'ruby on rails', 'next.js', 'node.js', 'vue.js', 'react.js',
  ];
  
  const tokens: string[] = [];
  let remaining = normalized;
  
  // Extract multi-word terms first
  for (const term of multiWordTerms) {
    const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(remaining)) {
      tokens.push(term);
      remaining = remaining.replace(regex, ' ').replace(/\s+/g, ' ').trim();
    }
  }
  
  // Split remaining by spaces
  const singleWords = remaining.split(/\s+/).filter(w => w.length > 0);
  tokens.push(...singleWords);
  
  return tokens;
}

/**
 * Classify a single token
 */
function classifyToken(token: string): {
  type: 'location' | 'technology' | 'workLocation' | 'employmentType' | 'roleFunction' | 'experienceLevel' | 'keyword';
  value: string;
  normalized: string;
} {
  const lower = token.toLowerCase();
  
  // Check cities first (most specific)
  if (KNOWN_CITIES[lower]) {
    return { type: 'location', value: token, normalized: KNOWN_CITIES[lower] };
  }
  
  // Check countries
  if (KNOWN_COUNTRIES[lower]) {
    return { type: 'location', value: token, normalized: KNOWN_COUNTRIES[lower] };
  }
  
  // Check technologies
  if (KNOWN_TECHNOLOGIES[lower]) {
    return { type: 'technology', value: token, normalized: KNOWN_TECHNOLOGIES[lower] };
  }
  
  // Check work locations
  if (WORK_LOCATIONS[lower]) {
    return { type: 'workLocation', value: token, normalized: WORK_LOCATIONS[lower] };
  }
  
  // Check employment types
  if (EMPLOYMENT_TYPES[lower]) {
    return { type: 'employmentType', value: token, normalized: EMPLOYMENT_TYPES[lower] };
  }
  
  // Check experience levels
  if (EXPERIENCE_LEVELS[lower]) {
    return { type: 'experienceLevel', value: token, normalized: EXPERIENCE_LEVELS[lower] };
  }
  
  // Check role functions
  if (ROLE_FUNCTIONS[lower]) {
    return { type: 'roleFunction', value: token, normalized: ROLE_FUNCTIONS[lower] };
  }
  
  // Default to keyword
  return { type: 'keyword', value: token, normalized: token };
}

// ============================================
// MAIN PARSER
// ============================================

/**
 * Parse a natural language search query into structured search parameters
 * 
 * @example
 * parseSearchQuery("marketing paris")
 * // Returns: { keywords: [], locations: ["Paris"], roleFunctions: ["marketing"], ... }
 * 
 * @example
 * parseSearchQuery("salesforce consultant france suisse remote")
 * // Returns: { technologies: ["salesforce"], roleFunctions: ["consulting"], 
 * //           locations: ["France", "Switzerland"], workLocations: ["remote"], ... }
 */
export function parseSearchQuery(query: string): ParsedSearchQuery {
  if (!query || query.trim().length === 0) {
    return {
      keywords: [],
      locations: [],
      technologies: [],
      workLocations: [],
      employmentTypes: [],
      roleFunctions: [],
      experienceLevels: [],
      originalQuery: query,
    };
  }
  
  // Remove "in", "at", "@" connectors for cleaner parsing
  const cleanedQuery = query
    .replace(/\b(in|at|@|à|en|dans)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const tokens = tokenize(cleanedQuery);
  
  const result: ParsedSearchQuery = {
    keywords: [],
    locations: [],
    technologies: [],
    workLocations: [],
    employmentTypes: [],
    roleFunctions: [],
    experienceLevels: [],
    originalQuery: query,
  };
  
  // Classify each token
  for (const token of tokens) {
    const classified = classifyToken(token);
    
    switch (classified.type) {
      case 'location':
        if (!result.locations.includes(classified.normalized)) {
          result.locations.push(classified.normalized);
        }
        break;
      case 'technology':
        if (!result.technologies.includes(classified.normalized)) {
          result.technologies.push(classified.normalized);
        }
        break;
      case 'workLocation':
        if (!result.workLocations.includes(classified.normalized)) {
          result.workLocations.push(classified.normalized);
        }
        break;
      case 'employmentType':
        if (!result.employmentTypes.includes(classified.normalized)) {
          result.employmentTypes.push(classified.normalized);
        }
        break;
      case 'roleFunction':
        if (!result.roleFunctions.includes(classified.normalized)) {
          result.roleFunctions.push(classified.normalized);
        }
        break;
      case 'experienceLevel':
        if (!result.experienceLevels.includes(classified.normalized)) {
          result.experienceLevels.push(classified.normalized);
        }
        break;
      case 'keyword':
        // Skip very short words that are likely noise
        if (token.length > 1 && !result.keywords.includes(token)) {
          result.keywords.push(token);
        }
        break;
    }
  }
  
  return result;
}

/**
 * Convert parsed query to API parameters
 */
export function toSearchAPIParams(parsed: ParsedSearchQuery): SearchAPIParams {
  const params: SearchAPIParams = {};
  
  // Combine keywords with unclassified terms
  if (parsed.keywords.length > 0) {
    params.keyword = parsed.keywords.join(' ');
  }
  
  // Locations (comma-separated for multi-location support)
  if (parsed.locations.length > 0) {
    params.locations = parsed.locations.join(',');
  }
  
  // Technologies
  if (parsed.technologies.length > 0) {
    params.technologies = parsed.technologies.join(',');
  }
  
  // Work location (take first if multiple)
  if (parsed.workLocations.length > 0) {
    params.workLocation = parsed.workLocations[0];
  }
  
  // Employment type (take first if multiple)
  if (parsed.employmentTypes.length > 0) {
    params.employmentType = parsed.employmentTypes[0];
  }
  
  // Role function (take first if multiple)
  if (parsed.roleFunctions.length > 0) {
    params.roleFunction = parsed.roleFunctions[0];
  }
  
  // Experience level (take first if multiple)
  if (parsed.experienceLevels.length > 0) {
    params.experienceLevel = parsed.experienceLevels[0];
  }
  
  return params;
}

/**
 * Debug helper - shows how a query was parsed
 */
export function debugParseQuery(query: string): void {
  const parsed = parseSearchQuery(query);
  console.group(`🔍 Parse: "${query}"`);
  console.log('Keywords:', parsed.keywords);
  console.log('Locations:', parsed.locations);
  console.log('Technologies:', parsed.technologies);
  console.log('Work Locations:', parsed.workLocations);
  console.log('Employment Types:', parsed.employmentTypes);
  console.log('Role Functions:', parsed.roleFunctions);
  console.log('Experience Levels:', parsed.experienceLevels);
  console.groupEnd();
}

// Export dictionaries for use in backend
export {
  KNOWN_CITIES,
  KNOWN_COUNTRIES,
  KNOWN_TECHNOLOGIES,
  WORK_LOCATIONS,
  EMPLOYMENT_TYPES,
  ROLE_FUNCTIONS,
  EXPERIENCE_LEVELS,
};

