import * as admin from 'firebase-admin';

/**
 * Cloud Function to enrich job posts with structured tags for filtering
 * This analyzes existing job descriptions and adds missing filter fields
 */

interface JobDoc {
    id: string;
    title?: string;
    description?: string;
    summary?: string;
    type?: string;
    employmentType?: string;
    remote?: string;
    remotePolicy?: string;
    seniority?: string;
    level?: string;
    location?: string;
    company?: string;
    enrichedAt?: admin.firestore.Timestamp | admin.firestore.FieldValue;
    enrichedVersion?: string;
    salaryRange?: string;
    compensation?: string;
}

// Role function type for job classification
type RoleFunction = 'engineering' | 'sales' | 'marketing' | 'operations' | 'hr' | 'finance' | 'design' | 'data' | 'product' | 'consulting' | 'support' | 'legal' | 'other';

/**
 * CRITICAL: Extract role function from job title
 * This determines the job family/department type
 */
function extractRoleFunction(job: JobDoc): RoleFunction {
    const title = (job.title || '').toLowerCase();
    const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();

    // SALES - Account Executives, BDRs, SDRs, Sales Managers
    if (/\b(account executive|ae\b|sales|bdr|sdr|business development representative|sales representative|sales manager|revenue|partnerships|account manager|client executive|commercial|quota)\b/i.test(title)) {
        return 'sales';
    }

    // ENGINEERING - Software Engineers, Developers, DevOps, SRE
    if (/\b(engineer|developer|développeur|swe\b|sre\b|devops|backend|frontend|full.?stack|software|programmer|coder|architect|platform|infrastructure)\b/i.test(title)) {
        return 'engineering';
    }

    // DATA - Data Scientists, Data Engineers, ML Engineers, Analysts
    if (/\b(data scientist|data engineer|data analyst|machine learning|ml engineer|ai engineer|analytics|bi\b|business intelligence|statistician|nlp|computer vision)\b/i.test(title)) {
        return 'data';
    }

    // PRODUCT - Product Managers, Product Owners
    if (/\b(product manager|product owner|product lead|pm\b|chief product|vp product|head of product)\b/i.test(title)) {
        return 'product';
    }

    // DESIGN - UX, UI, Graphic, Product Designers
    if (/\b(designer|design|ux|ui|creative|graphic|visual|brand designer|product designer)\b/i.test(title)) {
        return 'design';
    }

    // MARKETING - Marketing Managers, Growth, Content
    if (/\b(marketing|growth|content|seo|sem|brand|communications|pr\b|public relations|social media|demand gen|campaign)\b/i.test(title)) {
        return 'marketing';
    }

    // CONSULTING - Consultants, Advisors
    if (/\b(consultant|consulting|advisory|advisor|solution architect|implementation|functional consultant|technical consultant)\b/i.test(title)) {
        return 'consulting';
    }

    // HR - Human Resources, Recruiting, People
    if (/\b(hr\b|human resources|recruiter|recruiting|talent|people ops|people operations|hrbp|compensation|benefits|l&d|learning and development)\b/i.test(title)) {
        return 'hr';
    }

    // FINANCE - Financial Analysts, Controllers, Accountants
    if (/\b(finance|financial|accountant|accounting|controller|cfo|treasury|audit|tax|fp&a|financial planning)\b/i.test(title)) {
        return 'finance';
    }

    // OPERATIONS - Operations Managers, Supply Chain
    if (/\b(operations|ops\b|supply chain|logistics|warehouse|procurement|vendor|sourcing|fleet|delivery)\b/i.test(title)) {
        return 'operations';
    }

    // SUPPORT - Customer Support, Success, Service
    if (/\b(customer support|customer service|support specialist|customer success|cs\b|helpdesk|technical support|support engineer)\b/i.test(title)) {
        return 'support';
    }

    // LEGAL - Legal Counsel, Lawyers, Compliance
    if (/\b(legal|lawyer|attorney|counsel|paralegal|compliance|regulatory|contracts|privacy|gdpr)\b/i.test(title)) {
        return 'legal';
    }

    // If no match in title, check description for strong signals
    if (/\b(coding|programming|software development|api|backend|frontend|full.?stack)\b/i.test(text) && 
        !/\b(sales|marketing|account executive)\b/i.test(title)) {
        return 'engineering';
    }

    if (/\b(close deals|quota|pipeline|crm|revenue target|sales cycle|prospecting)\b/i.test(text)) {
        return 'sales';
    }

    return 'other';
}

/**
 * CRITICAL: Extract language requirements from title and description
 * Returns array of required languages (empty = no specific requirement)
 */
function extractLanguageRequirements(job: JobDoc): string[] {
    const title = (job.title || '').toLowerCase();
    const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();
    const languages: string[] = [];

    // Language patterns - check title first (highest priority)
    const languagePatterns: { pattern: RegExp; langs: string[] }[] = [
        // Scandinavian
        { pattern: /\b(scandinavian|nordic)\s*(speaker|speaking|language|fluent|native)/i, langs: ['swedish', 'norwegian', 'danish'] },
        { pattern: /\b(scandinavian|nordic)\b/i, langs: ['swedish', 'norwegian', 'danish'] },
        
        // Individual Nordic languages
        { pattern: /\b(swedish|svenska)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['swedish'] },
        { pattern: /\b(norwegian|norsk)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['norwegian'] },
        { pattern: /\b(danish|dansk)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['danish'] },
        { pattern: /\b(finnish|suomi)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['finnish'] },
        
        // Western European
        { pattern: /\b(german|deutsch|deutschsprachig)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['german'] },
        { pattern: /\b(french|français|francophone|francais)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['french'] },
        { pattern: /\b(dutch|nederlands|flemish)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['dutch'] },
        { pattern: /\b(italian|italiano)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['italian'] },
        { pattern: /\b(spanish|español|espanol)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['spanish'] },
        { pattern: /\b(portuguese|português|portugues)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['portuguese'] },
        
        // Eastern European
        { pattern: /\b(polish|polski)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['polish'] },
        { pattern: /\b(czech|čeština)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['czech'] },
        { pattern: /\b(russian|русский)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['russian'] },
        { pattern: /\b(ukrainian|українська)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['ukrainian'] },
        
        // Asian
        { pattern: /\b(japanese|日本語|nihongo)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['japanese'] },
        { pattern: /\b(korean|한국어|hangul)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['korean'] },
        { pattern: /\b(chinese|mandarin|普通话|中文|cantonese)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['chinese'] },
        
        // Other
        { pattern: /\b(arabic|العربية)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['arabic'] },
        { pattern: /\b(hebrew|עברית)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['hebrew'] },
        { pattern: /\b(turkish|türkçe)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['turkish'] },
    ];

    // First check title (most important - usually indicates hard requirement)
    for (const { pattern, langs } of languagePatterns) {
        if (pattern.test(title)) {
            languages.push(...langs);
        }
    }

    // If nothing in title, check description for explicit requirements
    if (languages.length === 0) {
        const requirementPatterns = [
            /fluency\s+in\s+(\w+)\s+(is\s+)?(required|mandatory|essential)/i,
            /(\w+)\s+language\s+(is\s+)?(required|mandatory|essential|must)/i,
            /must\s+speak\s+(\w+)/i,
            /native\s+(\w+)\s+speaker/i,
            /(\w+)\s+speaker\s+required/i,
        ];

        for (const pattern of requirementPatterns) {
            const match = text.match(pattern);
            if (match) {
                const langName = match[1]?.toLowerCase();
                // Map to standard language names
                const langMap: Record<string, string> = {
                    'german': 'german', 'deutsch': 'german',
                    'french': 'french', 'français': 'french',
                    'spanish': 'spanish', 'español': 'spanish',
                    'italian': 'italian', 'italiano': 'italian',
                    'dutch': 'dutch', 'swedish': 'swedish',
                    'norwegian': 'norwegian', 'danish': 'danish',
                    'finnish': 'finnish', 'polish': 'polish',
                    'portuguese': 'portuguese', 'russian': 'russian',
                    'japanese': 'japanese', 'korean': 'korean',
                    'chinese': 'chinese', 'mandarin': 'chinese',
                    'arabic': 'arabic', 'hebrew': 'hebrew',
                };
                if (langMap[langName]) {
                    languages.push(langMap[langName]);
                }
            }
        }
    }

    return [...new Set(languages)];
}

/**
 * Calculate enrichment quality score (0-100)
 * Jobs with low quality will be penalized in matching
 */
function calculateEnrichmentQuality(enrichedData: {
    technologies: string[];
    industries: string[];
    skills: string[];
    roleFunction: RoleFunction;
    experienceLevels: string[];
    workLocations: string[];
}): number {
    let quality = 0;

    // Technologies detected: +25 (most important for tech matching)
    if (enrichedData.technologies.length > 0) {
        quality += 25;
    }

    // Role function identified (not 'other'): +25 (critical for job family matching)
    if (enrichedData.roleFunction !== 'other') {
        quality += 25;
    }

    // Industries detected: +15
    if (enrichedData.industries.length > 0) {
        quality += 15;
    }

    // Skills detected: +15
    if (enrichedData.skills.length > 0) {
        quality += 15;
    }

    // Experience level detected (not default mid): +10
    if (enrichedData.experienceLevels.length > 0 && enrichedData.experienceLevels[0] !== 'mid') {
        quality += 10;
    }

    // Work location detected: +10
    if (enrichedData.workLocations.length > 0) {
        quality += 10;
    }

    return quality;
}

/**
 * Helper function to escape special regex characters
 */
function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract industry/sector tags
 */
function extractIndustryTags(job: JobDoc): string[] {
    const text = `${job.title || ''} ${job.description || ''} ${job.summary || ''} ${job.company || ''}`.toLowerCase();
    const industries: string[] = [];

    // Tech & Software (avoid matching "technician", "biotech" as main industry)
    if (/\b(software|tech(?!nician)|saas|startup|digital|platform|app(?!lication)|cloud|web|mobile|ai|machine learning|developer|engineer|programmer|coding)\b/i.test(text)) {
        industries.push('tech');
    }

    // Finance & Banking (avoid matching "bankrupt")
    if (/\b(bank(?!rupt)|finance|fintech|payment|insurance|trading|crypto|blockchain|investment)\b/i.test(text)) {
        industries.push('finance');
    }

    // E-commerce & Retail
    if (/\b(e-commerce|ecommerce|retail|marketplace|shop(?!ping)|store)\b/i.test(text)) {
        industries.push('ecommerce');
    }

    // Healthcare & Biotech (avoid matching "healthy")
    if (/\b(health(?!y)|medical|healthcare|biotech|pharma|hospital|clinic|patient)\b/i.test(text)) {
        industries.push('healthcare');
    }

    // Education & EdTech
    if (/\b(education|edtech|learning|university|school|training|course)\b/i.test(text)) {
        industries.push('education');
    }

    // Media & Entertainment
    if (/\b(media|entertainment|gaming|streaming|content|music|video|news|publisher)\b/i.test(text)) {
        industries.push('media');
    }

    // Marketing & Advertising
    if (/\b(marketing|advertising|agency|brand|social media|seo|sem)\b/i.test(text)) {
        industries.push('marketing');
    }

    // Consulting
    if (/\b(consulting|consultant|advisory|strategy)\b/i.test(text)) {
        industries.push('consulting');
    }

    // AI & Machine Learning (specific industry focus)
    if (/\b(llm|gpt|large language model|ai-first|generative ai|genai|artificial intelligence|ml platform|ai infrastructure)\b/i.test(text)) {
        industries.push('ai');
    }

    // Cybersecurity
    if (/\b(cybersecurity|cyber security|infosec|security analyst|soc|penetration test|pentest|compliance|gdpr|iso 27001|vulnerability|threat|firewall)\b/i.test(text)) {
        industries.push('cybersecurity');
    }

    // Climate Tech / Green Tech
    if (/\b(climate|sustainability|carbon|renewable|green energy|cleantech|clean tech|solar|wind energy|ev|electric vehicle|carbon neutral|net zero)\b/i.test(text)) {
        industries.push('climate-tech');
    }

    // Logistics & Supply Chain
    if (/\b(logistics|supply chain|warehouse|fulfillment|shipping|freight|delivery|fleet|distribution|inventory)\b/i.test(text)) {
        industries.push('logistics');
    }

    // Real Estate / PropTech
    if (/\b(real estate|proptech|property|housing|mortgage|rental|leasing|realty|commercial property)\b/i.test(text)) {
        industries.push('real-estate');
    }

    // HR Tech
    if (/\b(hrtech|hr tech|recruiting|talent acquisition|people ops|hris|applicant tracking|ats)\b/i.test(text)) {
        industries.push('hr-tech');
    }

    // Legal Tech
    if (/\b(legaltech|legal tech|law firm|legal services|contract management|legal ops)\b/i.test(text)) {
        industries.push('legal-tech');
    }

    return [...new Set(industries)]; // Remove duplicates
}

/**
 * Extract technology/tool tags
 */
function extractTechnologyTags(job: JobDoc): string[] {
    const text = `${job.title || ''} ${job.description || ''} ${job.summary || ''}`.toLowerCase();
    const technologies: string[] = [];

    // Programming Languages
    const languages = ['python', 'javascript', 'typescript', 'java', 'go', 'golang', 'rust',
        'c++', 'c#', 'php', 'ruby', 'swift', 'kotlin', 'scala', 'r', 'sql'];
    languages.forEach(lang => {
        if (new RegExp(`\\b${escapeRegExp(lang)}\\b`, 'i').test(text)) {
            technologies.push(lang);
        }
    });

    // Frontend
    const frontend = ['react', 'vue', 'angular', 'svelte', 'next.js', 'nextjs', 'nuxt',
        'tailwind', 'bootstrap', 'html', 'css', 'sass', 'webpack'];
    frontend.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) {
            // Normalize aliases
            if (tech === 'nextjs') technologies.push('next.js');
            else technologies.push(tech);
        }
    });

    // Backend & Frameworks
    const backend = ['node.js', 'nodejs', 'express', 'django', 'flask', 'fastapi',
        'spring', 'laravel', 'rails', '.net', 'dotnet', 'graphql', 'rest', 'api'];
    backend.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) {
            // Normalize aliases
            if (tech === 'nodejs') technologies.push('node.js');
            else if (tech === 'dotnet') technologies.push('.net');
            else technologies.push(tech);
        }
    });

    // Cloud & DevOps
    const cloud = ['aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s',
        'terraform', 'ansible', 'jenkins', 'gitlab', 'github', 'ci/cd', 'cicd'];
    cloud.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) {
            // Normalize k8s to kubernetes
            if (tech === 'k8s') technologies.push('kubernetes');
            else if (tech === 'cicd') technologies.push('ci/cd');
            else technologies.push(tech);
        }
    });

    // Databases
    const databases = ['postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch',
        'cassandra', 'dynamodb', 'firestore', 'firebase', 'supabase'];
    databases.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) {
            // Normalize postgres to postgresql
            if (tech === 'postgres') technologies.push('postgresql');
            else technologies.push(tech);
        }
    });

    // CRM & Business Tools - EXPANDED for sales/consulting roles
    const crm = [
        // Salesforce ecosystem
        'salesforce', 'sfdc', 'sales cloud', 'service cloud', 'marketing cloud', 
        'commerce cloud', 'salesforce cpq', 'apex', 'visualforce', 'lightning',
        'mulesoft', 'tableau crm', 'pardot',
        // Other CRMs
        'hubspot', 'zoho', 'dynamics 365', 'microsoft dynamics', 'pipedrive', 
        'freshsales', 'copper', 'close.io', 'outreach', 'salesloft', 'gong',
        // Support & Engagement
        'zendesk', 'intercom', 'freshdesk', 'drift', 'crisp', 'front',
        'helpscout', 'kustomer',
        // Marketing Automation
        'marketo', 'eloqua', 'mailchimp', 'klaviyo', 'braze', 'iterable',
        'customer.io', 'segment', 'amplitude', 'mixpanel',
    ];
    crm.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) {
            technologies.push(tech);
        }
    });

    // ERP & Enterprise - EXPANDED
    const erp = [
        // SAP ecosystem
        'sap', 'sap s/4hana', 's4hana', 'sap hana', 'sap erp', 'sap bw', 
        'sap fiori', 'abap', 'sap integration',
        // Oracle ecosystem
        'oracle', 'oracle erp', 'oracle cloud', 'netsuite', 'oracle fusion',
        'pl/sql', 'oracle database',
        // Other ERP
        'erp', 'workday', 'servicenow', 'odoo', 'sage', 'infor',
        // Business Intelligence
        'qlik', 'qlikview', 'qliksense', 'microstrategy', 'cognos', 'ssis', 'ssrs',
        // Collaboration & Productivity
        'jira', 'confluence', 'asana', 'monday.com', 'notion', 'airtable',
        'trello', 'linear', 'clickup', 'basecamp', 'smartsheet',
        // Finance & Accounting
        'quickbooks', 'xero', 'stripe', 'adyen', 'braintree', 'plaid',
    ];
    erp.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) {
            technologies.push(tech);
        }
    });

    // Design & Creative
    const design = ['figma', 'sketch', 'adobe', 'photoshop', 'illustrator', 'xd',
        'invision', 'framer', 'canva'];
    design.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) {
            technologies.push(tech);
        }
    });

    // Data & Analytics
    const data = ['tableau', 'powerbi', 'looker', 'databricks', 'snowflake', 'airflow',
        'spark', 'hadoop', 'pandas', 'numpy'];
    data.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) {
            technologies.push(tech);
        }
    });

    // AI & ML
    const ai = ['tensorflow', 'pytorch', 'scikit-learn', 'langchain', 'openai',
        'machine learning', 'deep learning', 'nlp', 'computer vision',
        'huggingface', 'transformers', 'mlops', 'mlflow', 'wandb', 'weights & biases',
        'llm', 'rag', 'vector database', 'pinecone', 'weaviate', 'qdrant',
        'anthropic', 'claude', 'gpt', 'chatgpt', 'llama', 'mistral'];
    ai.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) {
            // Normalize aliases
            if (tech === 'weights & biases') technologies.push('wandb');
            else technologies.push(tech);
        }
    });

    // Infrastructure & DevOps Extended
    const infra = ['pulumi', 'argocd', 'istio', 'envoy', 'prometheus', 'grafana',
        'datadog', 'newrelic', 'splunk', 'elk', 'logstash', 'kibana',
        'consul', 'vault', 'nomad', 'cloudformation', 'cdk', 'serverless'];
    infra.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) {
            technologies.push(tech);
        }
    });

    // Data Engineering & Modern Data Stack
    const dataEngineering = ['dbt', 'fivetran', 'airbyte', 'great expectations',
        'delta lake', 'iceberg', 'dagster', 'prefect', 'mage', 'metabase',
        'superset', 'redshift', 'bigquery', 'clickhouse', 'trino', 'presto', 'duckdb'];
    dataEngineering.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) {
            technologies.push(tech);
        }
    });

    // Mobile Development
    const mobile = ['flutter', 'react native', 'swiftui', 'jetpack compose',
        'ios', 'android', 'xcode', 'cocoapods', 'gradle', 'expo'];
    mobile.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) {
            technologies.push(tech);
        }
    });

    // Backend Extended
    const backendExtended = ['elixir', 'phoenix', 'nestjs', 'fastify', 'hono',
        'gin', 'echo', 'fiber', 'actix', 'rocket', 'axum', 'deno', 'bun'];
    backendExtended.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) {
            technologies.push(tech);
        }
    });

    // Testing & QA
    const testing = ['jest', 'cypress', 'playwright', 'selenium', 'pytest',
        'junit', 'mocha', 'chai', 'vitest', 'testing library', 'storybook'];
    testing.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) {
            technologies.push(tech);
        }
    });

    return [...new Set(technologies)]; // Remove duplicates
}

/**
 * Extract skill tags (business/soft skills)
 */
function extractSkillTags(job: JobDoc): string[] {
    const text = `${job.title || ''} ${job.description || ''} ${job.summary || ''}`.toLowerCase();
    const skills: string[] = [];

    // Marketing Skills
    if (/\bseo\b/i.test(text)) skills.push('seo');
    if (/\b(sem|ppc)\b/i.test(text)) skills.push('sem');
    if (/\bcontent marketing\b/i.test(text)) skills.push('content-marketing');
    if (/\bemail marketing\b/i.test(text)) skills.push('email-marketing');
    if (/\bsocial media\b/i.test(text)) skills.push('social-media');
    if (/\b(analytics|google analytics)\b/i.test(text)) skills.push('analytics');

    // Product & Project Management
    if (/\b(product management|product manager)\b/i.test(text)) skills.push('product-management');
    if (/\b(project management|pmp)\b/i.test(text)) skills.push('project-management');
    if (/\b(agile|scrum)\b/i.test(text)) skills.push('agile');

    // Business
    if (/\bsales\b/i.test(text)) skills.push('sales');
    if (/\b(business development|bd)\b/i.test(text)) skills.push('business-development');
    if (/\bcustomer success\b/i.test(text)) skills.push('customer-success');

    // Design
    if (/\b(ui\/ux|ux design)\b/i.test(text)) skills.push('ux-design');
    if (/\bui design\b/i.test(text)) skills.push('ui-design');
    if (/\bgraphic design\b/i.test(text)) skills.push('graphic-design');

    // Communication & Leadership
    if (/\b(communication|communication skills)\b/i.test(text)) skills.push('communication');
    if (/\b(leadership|team lead)\b/i.test(text)) skills.push('leadership');
    if (/\b(teamwork|collaboration)\b/i.test(text)) skills.push('teamwork');
    if (/\bproblem solving\b/i.test(text)) skills.push('problem-solving');

    // Strategic & Business Skills
    if (/\b(data.?driven|data driven)\b/i.test(text)) skills.push('data-driven');
    if (/\b(stakeholder management|stakeholder engagement)\b/i.test(text)) skills.push('stakeholder-management');
    if (/\b(cross.?functional|cross functional)\b/i.test(text)) skills.push('cross-functional');
    if (/\b(strategic thinking|strategic planning)\b/i.test(text)) skills.push('strategic-thinking');
    if (/\b(decision.?making|decision making)\b/i.test(text)) skills.push('decision-making');
    if (/\b(prioritization|prioritize)\b/i.test(text)) skills.push('prioritization');
    if (/\b(mentoring|mentor|coaching)\b/i.test(text)) skills.push('mentoring');
    if (/\b(presentation|public speaking)\b/i.test(text)) skills.push('presentation');
    if (/\b(negotiation|negotiate)\b/i.test(text)) skills.push('negotiation');
    if (/\b(critical thinking)\b/i.test(text)) skills.push('critical-thinking');
    if (/\b(time management)\b/i.test(text)) skills.push('time-management');
    if (/\b(client.?facing|client facing)\b/i.test(text)) skills.push('client-facing');
    if (/\b(remote.?first|remote first|async|asynchronous)\b/i.test(text)) skills.push('remote-work');
    if (/\b(documentation|technical writing)\b/i.test(text)) skills.push('documentation');

    return [...new Set(skills)];
}

/**
 * Analyze job title and description to extract employment type
 * Must be called AFTER extractExperienceLevel for proper conflict resolution
 */
function extractEmploymentType(job: JobDoc, experienceLevel?: string[]): string[] {
    const text = `${job.title || ''} ${job.description || ''} ${job.summary || ''}`.toLowerCase();
    const title = (job.title || '').toLowerCase();
    let types: string[] = [];

    // Use word boundaries to avoid false matches
    if (/\b(full.?time|permanent|cdi|fulltime)\b/i.test(text)) {
        types.push('full-time');
    }
    if (/\b(part.?time|temps partiel|parttime)\b/i.test(text)) {
        types.push('part-time');
    }
    if (/\b(contract(or)?|freelance|consultant|cdd|fixed.?term|temporary)\b/i.test(text)) {
        types.push('contract');
    }
    if (/\b(intern|internship|stage|alternance|apprenticeship|apprenti)\b/i.test(text)) {
        types.push('internship');
    }

    // ENHANCED CONFLICT RESOLUTION: Remove "internship" if it conflicts with seniority
    if (types.includes('internship')) {
        // Check title for senior/lead keywords
        if (/\b(senior|lead|principal|staff|director|manager|head of|vp|chief)\b/i.test(title)) {
            types = types.filter(t => t !== 'internship');
        }
        // CRITICAL: Also check experience level (if provided)
        if (experienceLevel && (experienceLevel.includes('senior') || experienceLevel.includes('lead'))) {
            types = types.filter(t => t !== 'internship');
        }
    }

    // Default to full-time if nothing detected
    if (types.length === 0) {
        types.push('full-time');
    }

    return [...new Set(types)];
}

/**
 * Extract work location type (remote, on-site, hybrid)
 */
function extractWorkLocation(job: JobDoc): string[] {
    const text = `${job.title || ''} ${job.description || ''} ${job.summary || ''} ${job.remote || ''} ${job.remotePolicy || ''} ${job.location || ''}`.toLowerCase();
    const locations: string[] = [];

    // Use word boundaries to avoid matching "remove", "remotely"
    if (/\b(remote|work from home|wfh|distributed|télétravail|telecommute)\b/i.test(text)) {
        locations.push('remote');
    }

    if (/\b(hybrid|flex)\b/i.test(text) || 
        (locations.includes('remote') && /\b(office|on.?site)\b/i.test(text))) {
        locations.push('hybrid');
    }

    if (/\b(on.?site|onsite|in.?office|au bureau|in.?person)\b/i.test(text) ||
        (!locations.includes('remote') && !locations.includes('hybrid') && job.location)) {
        locations.push('on-site');
    }

    // Default to on-site if nothing detected
    if (locations.length === 0) {
        locations.push('on-site');
    }

    return locations;
}

/**
 * Extract experience level
 */
/**
 * Extract salary range
 */
function extractSalary(job: JobDoc): string | null {
    const text = `${job.title || ''} ${job.description || ''} ${job.summary || ''}`;

    // Patterns to match:
    // $100k - $150k, $100k-$150k, $100,000 - $150,000
    // €50k - €70k
    // £40k - £60k
    // 100k-150k USD

    const patterns = [
        /([$€£]\d{2,3}k\s?-\s?[$€£]\d{2,3}k)/i, // $100k - $150k
        /([$€£]\d{1,3}[,.]\d{3}\s?-\s?[$€£]\d{1,3}[,.]\d{3})/i, // $100,000 - $150,000
        /(\d{2,3}k\s?-\s?\d{2,3}k\s?(?:USD|EUR|GBP|euros|dollars))/i, // 100k-150k USD
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return match[0];
    }

    return null;
}

/**
 * Extract experience level with STRICT PRIORITY SYSTEM
 * Returns immediately on first match to avoid conflicting tags
 */
function extractExperienceLevel(job: JobDoc): string[] {
    const text = `${job.title || ''} ${job.description || ''} ${job.summary || ''} ${job.seniority || ''} ${job.level || ''}`.toLowerCase();
    const title = (job.title || '').toLowerCase();

    // PRIORITY 1: Lead/Executive Level (highest seniority)
    if (/\b(lead|principal|staff engineer|staff software|staff developer|architect|director|vp|vice president|head of|chief|cto|ceo|cfo|coo|founding)\b/i.test(text)) {
        return ['lead'];
    }

    // PRIORITY 2: Senior Level
    // Be very strict: must have "senior" or "sr." explicitly in title OR with years requirement
    if (/\b(senior|sr\.|sr\s|expérimenté)\b/i.test(title) ||
        (/\b(senior|sr\.|sr\s)\b/i.test(text) && /\b(5\+|5-|6\+|7\+|8\+|10\+)\s*years?\b/i.test(text))) {
        return ['senior'];
    }

    // PRIORITY 3: Mid Level
    if (/\b(mid|mid-level|intermediate|confirmé|medior)\b/i.test(text) ||
        /\b(2-5|3-5|3-7|4-6)\s*years?\b/i.test(text)) {
        return ['mid'];
    }

    // PRIORITY 4: Entry/Junior Level
    if (/\b(entry|entry-level|junior|jr\.|jr\s|graduate|débutant|associate)\b/i.test(text) ||
        /\b(0-2|0-1|1-2|1-3)\s*years?\b/i.test(text)) {
        return ['entry'];
    }

    // PRIORITY 5: Internship (lowest priority, VERY strict)
    // Only match if explicitly in TITLE with word boundary OR very clear in description with student keywords
    if (/\b(intern|internship|stage|apprenti|alternance)\b/i.test(title) ||
        (/\b(intern|internship|stage)\b/i.test(text) && /\b(student|université|university|école|school)\b/i.test(text))) {
        return ['internship'];
    }

    // DEFAULT: Mid level (safest assumption for unmatched professional roles)
    return ['mid'];
}

/**
 * Main function to enrich a single job
 */
export async function enrichJob(jobId: string): Promise<void> {
    const db = admin.firestore();
    const jobRef = db.collection('jobs').doc(jobId);
    const jobSnap = await jobRef.get();

    if (!jobSnap.exists) {
        console.log(`Job ${jobId} not found`);
        return;
    }

    const jobData = jobSnap.data() as JobDoc;

    // Extract tags - ORDER MATTERS! Extract experience level first
    const experienceLevels = extractExperienceLevel(jobData);
    const employmentTypes = extractEmploymentType(jobData, experienceLevels); // Pass experience level for conflict resolution
    const workLocations = extractWorkLocation(jobData);
    const industries = extractIndustryTags(jobData);
    const technologies = extractTechnologyTags(jobData);
    const skills = extractSkillTags(jobData);
    const salaryRange = extractSalary(jobData);
    
    // NEW V4.0: Role function and language requirements
    const roleFunction = extractRoleFunction(jobData);
    const languageRequirements = extractLanguageRequirements(jobData);
    
    // Calculate enrichment quality
    const enrichmentQuality = calculateEnrichmentQuality({
        technologies,
        industries,
        skills,
        roleFunction,
        experienceLevels,
        workLocations,
    });

    // Prepare update
    const updates: any = {
        // Filter tags (arrays for multi-select)
        employmentTypes,  // ['full-time', 'part-time', 'contract', 'internship']
        workLocations,     // ['remote', 'on-site', 'hybrid']
        experienceLevels,  // ['internship', 'entry', 'mid', 'senior', 'lead']

        // NEW: Rich tags for advanced filtering
        industries,        // ['tech', 'finance', 'healthcare', ...]
        technologies,      // ['react', 'python', 'aws', 'salesforce', ...]
        skills,            // ['seo', 'product-management', 'agile', ...]

        // NEW V4.0: Critical fields for accurate matching
        roleFunction,          // 'engineering' | 'sales' | 'consulting' | etc.
        languageRequirements,  // ['german', 'french', 'swedish', ...]
        enrichmentQuality,     // 0-100 score

        // Keep existing fields for backwards compatibility
        type: employmentTypes[0] || 'full-time',
        remote: workLocations.includes('remote') ? 'remote' : workLocations[0] || 'on-site',
        seniority: experienceLevels[0] || 'mid',

        // Salary
        salaryRange: salaryRange || jobData.salaryRange || null,
        compensation: salaryRange || jobData.compensation || null,

        // Metadata
        enrichedAt: admin.firestore.FieldValue.serverTimestamp(),
        enrichedVersion: '4.0', // Version 4.0: Added roleFunction, languageRequirements, enrichmentQuality
    };

    await jobRef.update(updates);
    console.log(`✅ Enriched job ${jobId}:`);
    console.log(`   ${jobData.title}`);
    console.log(`   🎭 Role: ${roleFunction}`);
    console.log(`   🌍 Languages: ${languageRequirements.join(', ') || 'none required'}`);
    console.log(`   📊 Industries: ${industries.join(', ') || 'none'}`);
    console.log(`   💻 Tech: ${technologies.slice(0, 5).join(', ')}${technologies.length > 5 ? '...' : ''}`);
    console.log(`   🎯 Skills: ${skills.join(', ') || 'none'}`);
    console.log(`   📈 Quality: ${enrichmentQuality}%`);
    if (salaryRange) console.log(`   💰 Salary: ${salaryRange}`);
}

/**
 * Batch enrich all jobs (or a subset)
 * V4.0: Force re-enrichment of ALL jobs to add new fields
 */
export async function enrichAllJobs(batchSize: number = 100, forceReenrich: boolean = false): Promise<void> {
    const db = admin.firestore();
    let processedCount = 0;
    let skippedCount = 0;
    let lastDoc: any = null;

    console.log('🚀 Starting job enrichment V4.0...');
    console.log(`   Force re-enrich: ${forceReenrich}`);
    console.log('');

    while (true) {
        let query = db.collection('jobs')
            .orderBy('postedAt', 'desc')
            .limit(batchSize);

        if (lastDoc) {
            query = query.startAfter(lastDoc);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            break;
        }

        console.log(`📦 Processing batch of ${snapshot.size} jobs...`);

        const batch = db.batch();

        snapshot.docs.forEach(doc => {
            const jobData = doc.data() as JobDoc;

            // Skip if already enriched with V4.0 (unless force re-enrich)
            if (!forceReenrich && jobData.enrichedVersion === '4.0') {
                skippedCount++;
                return;
            }

            const experienceLevels = extractExperienceLevel(jobData);
            const employmentTypes = extractEmploymentType(jobData, experienceLevels);
            const workLocations = extractWorkLocation(jobData);
            const industries = extractIndustryTags(jobData);
            const technologies = extractTechnologyTags(jobData);
            const skills = extractSkillTags(jobData);
            
            // NEW V4.0: Critical fields
            const roleFunction = extractRoleFunction(jobData);
            const languageRequirements = extractLanguageRequirements(jobData);
            const enrichmentQuality = calculateEnrichmentQuality({
                technologies,
                industries,
                skills,
                roleFunction,
                experienceLevels,
                workLocations,
            });

            const updates = {
                employmentTypes,
                workLocations,
                experienceLevels,
                industries,
                technologies,
                skills,
                // NEW V4.0 fields
                roleFunction,
                languageRequirements,
                enrichmentQuality,
                // Backwards compatibility
                type: employmentTypes[0] || 'full-time',
                remote: workLocations.includes('remote') ? 'remote' : workLocations[0] || 'on-site',
                seniority: experienceLevels[0] || 'mid',
                enrichedAt: admin.firestore.FieldValue.serverTimestamp(),
                enrichedVersion: '4.0',
            };

            batch.update(doc.ref, updates);
            processedCount++;
        });

        await batch.commit();
        console.log(`✅ Processed ${processedCount} jobs, skipped ${skippedCount} (already V4.0)`);

        lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }

    console.log(`\n🎉 Job enrichment V4.0 complete!`);
    console.log(`   Processed: ${processedCount} jobs`);
    console.log(`   Skipped: ${skippedCount} jobs`);
}

// Export extraction functions for use in matching
export { 
    extractIndustryTags, 
    extractTechnologyTags, 
    extractSkillTags, 
    extractExperienceLevel, 
    extractWorkLocation, 
    extractEmploymentType,
    // NEW V4.0 exports
    extractRoleFunction,
    extractLanguageRequirements,
    calculateEnrichmentQuality,
};

// Export types
export { JobDoc, RoleFunction };
