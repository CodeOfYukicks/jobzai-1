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
 * Extract industry/sector tags
 */
function extractIndustryTags(job: JobDoc): string[] {
    const text = `${job.title || ''} ${job.description || ''} ${job.summary || ''} ${job.company || ''}`.toLowerCase();
    const industries: string[] = [];

    // Tech & Software
    if (
        text.includes('software') || text.includes('tech') || text.includes('saas') ||
        text.includes('startup') || text.includes('digital') || text.includes('platform') ||
        text.includes('app') || text.includes('cloud') || text.includes('web') ||
        text.includes('mobile') || text.includes('ai') || text.includes('machine learning')
    ) {
        industries.push('tech');
    }

    // Finance & Banking
    if (
        text.includes('bank') || text.includes('finance') || text.includes('fintech') ||
        text.includes('payment') || text.includes('insurance') || text.includes('trading') ||
        text.includes('crypto') || text.includes('blockchain') || text.includes('investment')
    ) {
        industries.push('finance');
    }

    // E-commerce & Retail
    if (
        text.includes('e-commerce') || text.includes('ecommerce') || text.includes('retail') ||
        text.includes('marketplace') || text.includes('shop') || text.includes('store')
    ) {
        industries.push('ecommerce');
    }

    // Healthcare & Biotech
    if (
        text.includes('health') || text.includes('medical') || text.includes('healthcare') ||
        text.includes('biotech') || text.includes('pharma') || text.includes('hospital') ||
        text.includes('clinic') || text.includes('patient')
    ) {
        industries.push('healthcare');
    }

    // Education & EdTech
    if (
        text.includes('education') || text.includes('edtech') || text.includes('learning') ||
        text.includes('university') || text.includes('school') || text.includes('training') ||
        text.includes('course')
    ) {
        industries.push('education');
    }

    // Media & Entertainment
    if (
        text.includes('media') || text.includes('entertainment') || text.includes('gaming') ||
        text.includes('streaming') || text.includes('content') || text.includes('music') ||
        text.includes('video') || text.includes('news')
    ) {
        industries.push('media');
    }

    // Marketing & Advertising
    if (
        text.includes('marketing') || text.includes('advertising') || text.includes('agency') ||
        text.includes('brand') || text.includes('social media')
    ) {
        industries.push('marketing');
    }

    // Consulting
    if (
        text.includes('consulting') || text.includes('consultant') || text.includes('advisory')
    ) {
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
        if (text.includes(lang)) technologies.push(lang);
    });

    // Frontend
    const frontend = ['react', 'vue', 'angular', 'svelte', 'next.js', 'nextjs', 'nuxt',
        'tailwind', 'bootstrap', 'html', 'css', 'sass', 'webpack'];
    frontend.forEach(tech => {
        if (text.includes(tech)) technologies.push(tech);
    });

    // Backend & Frameworks
    const backend = ['node.js', 'nodejs', 'express', 'django', 'flask', 'fastapi',
        'spring', 'laravel', 'rails', '.net', 'dotnet', 'graphql', 'rest', 'api'];
    backend.forEach(tech => {
        if (text.includes(tech)) technologies.push(tech);
    });

    // Cloud & DevOps
    const cloud = ['aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s',
        'terraform', 'ansible', 'jenkins', 'gitlab', 'github', 'ci/cd', 'cicd'];
    cloud.forEach(tech => {
        if (text.includes(tech)) technologies.push(tech);
    });

    // Databases
    const databases = ['postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch',
        'cassandra', 'dynamodb', 'firestore', 'firebase', 'supabase'];
    databases.forEach(tech => {
        if (text.includes(tech)) technologies.push(tech);
    });

    // CRM & Business Tools
    const crm = ['salesforce', 'hubspot', 'crm', 'zendesk', 'intercom', 'pipedrive'];
    crm.forEach(tech => {
        if (text.includes(tech)) technologies.push(tech);
    });

    // ERP & Enterprise
    const erp = ['sap', 'oracle', 'erp', 'workday', 'servicenow'];
    erp.forEach(tech => {
        if (text.includes(tech)) technologies.push(tech);
    });

    // Design & Creative
    const design = ['figma', 'sketch', 'adobe', 'photoshop', 'illustrator', 'xd',
        'invision', 'framer', 'canva'];
    design.forEach(tech => {
        if (text.includes(tech)) technologies.push(tech);
    });

    // Data & Analytics
    const data = ['tableau', 'powerbi', 'looker', 'databricks', 'snowflake', 'airflow',
        'spark', 'hadoop', 'pandas', 'numpy'];
    data.forEach(tech => {
        if (text.includes(tech)) technologies.push(tech);
    });

    // AI & ML
    const ai = ['tensorflow', 'pytorch', 'scikit-learn', 'langchain', 'openai',
        'machine learning', 'deep learning', 'nlp', 'computer vision'];
    ai.forEach(tech => {
        if (text.includes(tech)) technologies.push(tech);
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
    if (text.includes('seo')) skills.push('seo');
    if (text.includes('sem') || text.includes('ppc')) skills.push('sem');
    if (text.includes('content marketing')) skills.push('content-marketing');
    if (text.includes('email marketing')) skills.push('email-marketing');
    if (text.includes('social media')) skills.push('social-media');
    if (text.includes('analytics') || text.includes('google analytics')) skills.push('analytics');

    // Product & Project Management
    if (text.includes('product management') || text.includes('product manager')) skills.push('product-management');
    if (text.includes('project management') || text.includes('pmp')) skills.push('project-management');
    if (text.includes('agile') || text.includes('scrum')) skills.push('agile');

    // Business
    if (text.includes('sales')) skills.push('sales');
    if (text.includes('business development') || text.includes('bd')) skills.push('business-development');
    if (text.includes('customer success')) skills.push('customer-success');

    // Design
    if (text.includes('ui/ux') || text.includes('ux design')) skills.push('ux-design');
    if (text.includes('ui design')) skills.push('ui-design');
    if (text.includes('graphic design')) skills.push('graphic-design');

    return [...new Set(skills)];
}

/**
 * Analyze job title and description to extract employment type
 */
function extractEmploymentType(job: JobDoc): string[] {
    const text = `${job.title || ''} ${job.description || ''} ${job.summary || ''}`.toLowerCase();
    const types: string[] = [];

    if (text.includes('full-time') || text.includes('full time') || text.includes('fulltime') || text.includes('cdi') || text.includes('permanent')) {
        types.push('full-time');
    }
    if (text.includes('part-time') || text.includes('part time') || text.includes('parttime')) {
        types.push('part-time');
    }
    if (text.includes('contract') || text.includes('contractor') || text.includes('freelance') || text.includes('cdd') || text.includes('fixed-term') || text.includes('temporary')) {
        types.push('contract');
    }
    if (text.includes('intern') || text.includes('internship') || text.includes('stage') || text.includes('alternance') || text.includes('apprenticeship')) {
        types.push('internship');
    }

    // Default to full-time if nothing detected and not internship
    if (types.length === 0 && !text.includes('intern')) {
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

    if (
        text.includes('remote') ||
        text.includes('work from home') ||
        text.includes('wfh') ||
        text.includes('distributed') ||
        text.includes('télétravail')
    ) {
        locations.push('remote');
    }

    if (
        text.includes('hybrid') ||
        (text.includes('remote') && text.includes('office')) ||
        text.includes('flex')
    ) {
        locations.push('hybrid');
    }

    if (
        text.includes('on-site') ||
        text.includes('onsite') ||
        text.includes('in-office') ||
        text.includes('au bureau') ||
        (!locations.includes('remote') && !locations.includes('hybrid') && job.location)
    ) {
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
 * Extract experience level
 */
function extractExperienceLevel(job: JobDoc): string[] {
    const text = `${job.title || ''} ${job.description || ''} ${job.summary || ''} ${job.seniority || ''} ${job.level || ''}`.toLowerCase();
    const levels: string[] = [];

    if (text.includes('intern') || text.includes('stage') || text.includes('apprenti') || text.includes('alternance')) {
        levels.push('internship');
    }
    if (
        text.includes('entry') ||
        text.includes('junior') ||
        text.includes('graduate') ||
        text.includes('débutant') ||
        text.includes('associate') ||
        text.includes('0-2 years') ||
        text.includes('0-2 ans')
    ) {
        levels.push('entry');
    }
    if (
        text.includes('mid') ||
        text.includes('intermediate') ||
        text.includes('2-5 years') ||
        text.includes('2-5 ans') ||
        text.includes('confirmé') ||
        text.includes('medior')
    ) {
        levels.push('mid');
    }
    if (
        text.includes('senior') ||
        text.includes('sr.') ||
        text.includes('5+ years') ||
        text.includes('expérimenté') ||
        text.includes('expert') ||
        text.includes('lead') // Often overlaps
    ) {
        levels.push('senior');
    }
    if (
        text.includes('lead') ||
        text.includes('principal') ||
        text.includes('staff') ||
        text.includes('architect') ||
        text.includes('head of') ||
        text.includes('director') ||
        text.includes('vp') ||
        text.includes('chief') ||
        text.includes('c-level') ||
        text.includes('founding')
    ) {
        levels.push('lead');
    }

    // Default to mid if nothing specific detected
    if (levels.length === 0 && !text.includes('intern')) {
        levels.push('mid');
    }

    return [...new Set(levels)];
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

    // Extract tags
    const employmentTypes = extractEmploymentType(jobData);
    const workLocations = extractWorkLocation(jobData);
    const experienceLevels = extractExperienceLevel(jobData);
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
        enrichedVersion: '2.1', // Version 2.1 includes salary and improved extraction
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

            const employmentTypes = extractEmploymentType(jobData);
            const workLocations = extractWorkLocation(jobData);
            const experienceLevels = extractExperienceLevel(jobData);
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
                enrichedVersion: '2.0',
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
