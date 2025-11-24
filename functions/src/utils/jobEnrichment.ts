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

    // CRM & Business Tools
    const crm = ['salesforce', 'hubspot', 'crm', 'zendesk', 'intercom', 'pipedrive'];
    crm.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) {
            technologies.push(tech);
        }
    });

    // ERP & Enterprise
    const erp = ['sap', 'oracle', 'erp', 'workday', 'servicenow'];
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
        'machine learning', 'deep learning', 'nlp', 'computer vision'];
    ai.forEach(tech => {
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

        // Keep existing fields for backwards compatibility
        type: employmentTypes[0] || 'full-time',
        remote: workLocations.includes('remote') ? 'remote' : workLocations[0] || 'on-site',
        seniority: experienceLevels[0] || 'mid',

        // Salary
        salaryRange: salaryRange || jobData.salaryRange || null,
        compensation: salaryRange || jobData.compensation || null,

        // Metadata
        enrichedAt: admin.firestore.FieldValue.serverTimestamp(),
        enrichedVersion: '2.2', // Version 2.2: word boundaries + priority system for accurate tagging
    };

    await jobRef.update(updates);
    console.log(`✅ Enriched job ${jobId}:`);
    console.log(`   ${jobData.title}`);
    console.log(`   📊 Industries: ${industries.join(', ') || 'none'}`);
    console.log(`   💻 Tech: ${technologies.slice(0, 5).join(', ')}${technologies.length > 5 ? '...' : ''}`);
    console.log(`   🎯 Skills: ${skills.join(', ') || 'none'}`);
    if (salaryRange) console.log(`   💰 Salary: ${salaryRange}`);
}

/**
 * Batch enrich all jobs (or a subset)
 */
export async function enrichAllJobs(batchSize: number = 100): Promise<void> {
    const db = admin.firestore();
    let processedCount = 0;
    let lastDoc: any = null;

    console.log('🚀 Starting job enrichment...\n');

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
        const promises: Promise<void>[] = [];

        snapshot.docs.forEach(doc => {
            const jobData = doc.data() as JobDoc;

            // Skip if already enriched recently (within last 24h)
            if (jobData.enrichedAt) {
                const enrichedTime = (jobData.enrichedAt as any).toDate();
                const hoursSince = (Date.now() - enrichedTime.getTime()) / (1000 * 60 * 60);
                if (hoursSince < 24) {
                    return;
                }
            }

            const experienceLevels = extractExperienceLevel(jobData);
            const employmentTypes = extractEmploymentType(jobData, experienceLevels);
            const workLocations = extractWorkLocation(jobData);
            const industries = extractIndustryTags(jobData);
            const technologies = extractTechnologyTags(jobData);
            const skills = extractSkillTags(jobData);

            const updates = {
                employmentTypes,
                workLocations,
                experienceLevels,
                industries,
                technologies,
                skills,
                type: employmentTypes[0] || 'full-time',
                remote: workLocations.includes('remote') ? 'remote' : workLocations[0] || 'on-site',
                seniority: experienceLevels[0] || 'mid',
                enrichedAt: admin.firestore.FieldValue.serverTimestamp(),
                enrichedVersion: '2.2',
            };

            batch.update(doc.ref, updates);
            processedCount++;
        });

        await batch.commit();
        console.log(`✅ Processed ${processedCount} jobs so far`);

        lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }

    console.log(`\n🎉 Job enrichment complete! Processed ${processedCount} jobs total.`);
}

// Export for use in Cloud Functions
export { JobDoc };
