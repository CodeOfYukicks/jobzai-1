/**
 * Enrich ALL jobs in database (V2 - Improved Metadata & Salary)
 * Run: node scripts/enrichAllJobsV2.cjs
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
    projectId: 'jobzai'
});

const db = admin.firestore();

// ===== TAG EXTRACTION FUNCTIONS =====

function extractEmploymentTypes(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    let types = [];

    // Use word boundaries to avoid false matches
    if (/\b(full.?time|permanent|cdi|fulltime)\b/i.test(text)) types.push('full-time');
    if (/\b(part.?time|temps partiel|parttime)\b/i.test(text)) types.push('part-time');
    if (/\b(contract(or)?|freelance|consultant|cdd|fixed.?term|temporary)\b/i.test(text)) types.push('contract');
    if (/\b(intern|internship|stage|alternance|apprenticeship|apprenti)\b/i.test(text)) types.push('internship');

    // If internship is detected with other types, it's likely a false positive (e.g., "internal")
    // Remove internship if we have Senior/Lead in title or other employment types
    if (types.length > 1 && types.includes('internship')) {
        if (/\b(senior|lead|principal|staff|director|manager)\b/i.test(title)) {
            types = types.filter(t => t !== 'internship');
        }
    }

    // Default to full-time if nothing detected
    if (types.length === 0) {
        types.push('full-time');
    }

    return [...new Set(types)];
}

function extractWorkLocations(title, description, locationField) {
    const text = `${title} ${description} ${locationField || ''}`.toLowerCase();
    const locations = [];

    if (/remote|télétravail|work from home|wfh|distributed/i.test(text)) locations.push('remote');
    if (/(on.?site|office|in.?person|sur place|au bureau)/i.test(text)) locations.push('on-site');
    if (/hybrid|flex/i.test(text)) locations.push('hybrid');

    // If location field explicitly says remote
    if (locationField && /remote/i.test(locationField)) {
        if (!locations.includes('remote')) locations.push('remote');
    }

    return locations.length > 0 ? locations : ['on-site'];
}

function extractExperienceLevels(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const titleLower = title.toLowerCase();

    // STRICT PRIORITY SYSTEM: Check from highest to lowest seniority
    // Return immediately when a match is found to avoid conflicts

    // Lead/Executive Level (highest priority)
    if (/\b(lead|principal|staff engineer|staff software|staff developer|architect|director|vp|vice president|head of|chief|c-level|cto|ceo|founding)\b/i.test(text)) {
        return ['lead'];
    }

    // Senior Level
    // Be very strict: must have "senior" or "sr." explicitly
    if (/\b(senior|sr\.|sr\s|expérimenté)\b/i.test(title) ||
        (/\b(senior|sr\.|sr\s)\b/i.test(text) && /\b(5\+|5-|6\+|7\+|8\+|10\+)\s*years?\b/i.test(text))) {
        return ['senior'];
    }

    // Mid Level
    if (/\b(mid|mid-level|intermediate|confirmé|medior)\b/i.test(text) ||
        /\b(2-5|3-5|3-7|4-6)\s*years?\b/i.test(text)) {
        return ['mid'];
    }

    // Entry/Junior Level
    if (/\b(entry|entry-level|junior|jr\.|jr\s|graduate|débutant|associate)\b/i.test(text) ||
        /\b(0-2|0-1|1-2|1-3)\s*years?\b/i.test(text)) {
        return ['entry'];
    }

    // Internship (lowest priority, very strict)
    // Only match if explicitly in title or very clear in description
    if (/\b(intern|internship|stage|apprenti|alternance)\b/i.test(titleLower) ||
        (/\b(intern|internship|stage)\b/i.test(text) && /\b(student|université|university|école)\b/i.test(text))) {
        return ['internship'];
    }

    // Default: Mid level (safest assumption for unmatched professional roles)
    return ['mid'];
}

function extractSalary(title, description) {
    const text = `${title} ${description}`;

    // Patterns to match:
    // $100k - $150k, $100k-$150k, $100,000 - $150,000
    // €50k - €70k
    // £40k - £60k
    // 100k-150k USD

    const patterns = [
        /([$€£]\d{2,3}k\s?-\s?[$€£]\d{2,3}k)/i, // $100k - $150k
        /([$€£]\d{1,3}[,.]\d{3}\s?-\s?[$€£]\d{1,3}[,.]\d{3})/i, // $100,000 - $150,000
        /(\d{2,3}k\s?-\s?\d{2,3}k\s?(?:USD|EUR|GBP|euros|dollars))/i, // 100k-150k USD
        /(\d{2,3},\d{3}\s?-\s?\d{2,3},\d{3}\s?(?:USD|EUR|GBP|euros|dollars))/i, // 100,000 - 150,000 USD
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return match[0];
    }

    return null;
}

function extractIndustries(title, description, company) {
    const text = `${title} ${description} ${company}`.toLowerCase();
    const industries = [];

    if (/(software|tech|developer|engineer|programmer|coding|saas|startup|digital|platform|app|cloud|web|mobile|ai|machine learning)/i.test(text)) industries.push('tech');
    if (/(finance|bank|trading|investment|fintech|payment|insurance|crypto|blockchain)/i.test(text)) industries.push('finance');
    if (/(health|medical|pharma|biotech|hospital|clinic|patient)/i.test(text)) industries.push('healthcare');
    if (/(ecommerce|retail|shop|store|marketplace)/i.test(text)) industries.push('ecommerce');
    if (/(education|university|school|learning|edtech|training|course)/i.test(text)) industries.push('education');
    if (/(media|content|publisher|news|entertainment|gaming|streaming|music|video)/i.test(text)) industries.push('media');
    if (/(marketing|advertising|seo|sem|agency|brand|social media)/i.test(text)) industries.push('marketing');
    if (/(consulting|strategy|advisory|consultant)/i.test(text)) industries.push('consulting');

    return [...new Set(industries)];
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractTechnologies(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const technologies = [];

    const frontend = ['react', 'vue', 'angular', 'svelte', 'next.js', 'nextjs', 'nuxt', 'tailwind', 'bootstrap', 'html', 'css', 'sass', 'webpack'];
    frontend.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) technologies.push(tech === 'nextjs' ? 'next.js' : tech);
    });

    const backend = ['node.js', 'nodejs', 'express', 'python', 'django', 'flask', 'fastapi', 'java', 'spring', 'go', 'golang', 'rust', 'c++', 'c#', 'php', 'laravel', 'ruby', 'rails', '.net', 'dotnet', 'graphql', 'rest', 'api'];
    backend.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) {
            technologies.push(tech === 'nodejs' ? 'node.js' : tech);
        }
    });

    const cloud = ['aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'jenkins', 'gitlab', 'github', 'ci/cd', 'cicd'];
    cloud.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) {
            if (tech === 'k8s') technologies.push('kubernetes');
            else technologies.push(tech);
        }
    });

    const databases = ['postgresql', 'postgres', 'mongodb', 'mysql', 'redis', 'elasticsearch', 'dynamodb', 'firestore', 'firebase', 'supabase', 'cassandra'];
    databases.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) {
            technologies.push(tech === 'postgres' ? 'postgresql' : tech);
        }
    });

    const crm = ['salesforce', 'hubspot', 'zendesk', 'intercom', 'pipedrive', 'crm'];
    crm.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) technologies.push(tech);
    });

    const erp = ['sap', 'oracle', 'workday', 'servicenow', 'erp'];
    erp.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) technologies.push(tech);
    });

    const design = ['figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'invision', 'framer', 'canva'];
    design.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) technologies.push(tech);
    });

    const data = ['tableau', 'powerbi', 'looker', 'databricks', 'snowflake', 'airflow', 'spark', 'hadoop', 'pandas', 'numpy'];
    data.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) technologies.push(tech);
    });

    const ai = ['tensorflow', 'pytorch', 'scikit-learn', 'langchain', 'openai', 'machine learning', 'deep learning', 'nlp', 'computer vision'];
    ai.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) technologies.push(tech);
    });

    return [...new Set(technologies)];
}

function extractSkills(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const skills = [];

    const skillList = [
        'seo', 'sem', 'ppc', 'content marketing', 'email marketing', 'social media', 'analytics', 'google analytics',
        'product management', 'product manager', 'project management', 'pmp', 'agile', 'scrum',
        'sales', 'business development', 'bd', 'customer success',
        'ui/ux', 'ux design', 'ui design', 'graphic design',
        'communication', 'leadership', 'teamwork', 'problem solving'
    ];

    skillList.forEach(skill => {
        if (new RegExp(`\\b${escapeRegExp(skill)}\\b`, 'i').test(text)) {
            skills.push(skill.replace(/ /g, '-'));
        }
    });

    return [...new Set(skills)];
}

// ===== MAIN ENRICHMENT =====

async function enrichAllJobsInBatches() {
    console.log('🚀 Enriching ALL Jobs (V2 - Improved Metadata & Salary)\n');
    console.log('=====================================================\n');

    let totalProcessed = 0;
    let totalSalaryFound = 0;
    let lastDoc = null;
    const batchSize = 500;

    while (true) {
        console.log(`\n📦 Fetching batch ${Math.floor(totalProcessed / batchSize) + 1}...\n`);

        let query = db.collection('jobs').orderBy('postedAt', 'desc').limit(batchSize);

        if (lastDoc) {
            query = query.startAfter(lastDoc);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            console.log('\n✅ No more jobs to process');
            break;
        }

        console.log(`Found ${snapshot.size} jobs in this batch\n`);

        const batch = db.batch();
        let batchCount = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const title = data.title || '';
            const description = data.description || '';
            const company = data.company || '';
            const location = data.location || '';

            const industries = extractIndustries(title, description, company);
            const technologies = extractTechnologies(title, description);
            const skills = extractSkills(title, description);

            const employmentTypes = extractEmploymentTypes(title, description);
            const workLocations = extractWorkLocations(title, description, location);
            const experienceLevels = extractExperienceLevels(title, description);
            const salaryRange = extractSalary(title, description);

            const enrichedData = {
                employmentTypes,
                workLocations,
                experienceLevels,
                industries,
                technologies,
                skills,

                // Backwards compatibility
                type: employmentTypes[0] || 'full-time',
                remote: workLocations.includes('remote') ? 'remote' : workLocations[0] || 'on-site',
                seniority: experienceLevels[0] || 'mid',

                // Salary
                salaryRange: salaryRange || data.salaryRange || null,
                compensation: salaryRange || data.compensation || null,

                enrichedAt: admin.firestore.Timestamp.now(),
                enrichedVersion: '2.1'
            };

            batch.update(doc.ref, enrichedData);

            totalProcessed++;
            if (salaryRange) totalSalaryFound++;
            batchCount++;

            if (batchCount >= 400) { // Commit batch every 400 writes (limit is 500)
                await batch.commit();
                batchCount = 0;
                // Re-create batch? No, batch object is single use.
                // Actually in a loop like this, we need a new batch.
                // But here I am iterating inside a loop.
                // I should probably just do one batch per outer loop iteration (500 docs).
                // But Firestore batch limit is 500.
                // So I'll just use the outer loop batch.
            }
        }

        // Commit remaining
        if (batchCount > 0) {
            // Wait, I can't reuse 'batch' variable if I committed it?
            // Actually, the batch object in Firestore Node SDK accumulates operations.
            // But if I commit it, I need a new one.
            // My logic above is flawed.
            // I should just create a new batch for each chunk of 500.
            // Since my query limit is 500, I can just use one batch per query result.
        }

        // Correct approach:
        // Create batch outside loop.
        // Loop docs.
        // batch.update(...)
        // await batch.commit() after loop.
    }
}

// Re-write the main loop properly
async function enrichAllJobsInBatchesCorrected() {
    console.log('🚀 Enriching ALL Jobs (V2 - Improved Metadata & Salary)\n');
    console.log('=====================================================\n');

    let totalProcessed = 0;
    let totalSalaryFound = 0;
    let lastDoc = null;
    const batchSize = 400; // Safe limit for batch

    while (true) {
        console.log(`\n📦 Fetching batch...\n`);

        let query = db.collection('jobs').orderBy('postedAt', 'desc').limit(batchSize);

        if (lastDoc) {
            query = query.startAfter(lastDoc);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            console.log('\n✅ No more jobs to process');
            break;
        }

        console.log(`Found ${snapshot.size} jobs in this batch\n`);

        const batch = db.batch();

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const title = data.title || '';
            const description = data.description || '';
            const company = data.company || '';
            const location = data.location || '';

            const industries = extractIndustries(title, description, company);
            const technologies = extractTechnologies(title, description);
            const skills = extractSkills(title, description);

            const employmentTypes = extractEmploymentTypes(title, description);
            const workLocations = extractWorkLocations(title, description, location);
            const experienceLevels = extractExperienceLevels(title, description);
            const salaryRange = extractSalary(title, description);

            const enrichedData = {
                employmentTypes,
                workLocations,
                experienceLevels,
                industries,
                technologies,
                skills,

                // Backwards compatibility
                type: employmentTypes[0] || 'full-time',
                remote: workLocations.includes('remote') ? 'remote' : workLocations[0] || 'on-site',
                seniority: experienceLevels[0] || 'mid',

                // Salary
                salaryRange: salaryRange || data.salaryRange || null,
                compensation: salaryRange || data.compensation || null,

                enrichedAt: admin.firestore.Timestamp.now(),
                enrichedVersion: '2.1'
            };

            batch.update(doc.ref, enrichedData);

            totalProcessed++;
            if (salaryRange) totalSalaryFound++;
        }

        await batch.commit();
        lastDoc = snapshot.docs[snapshot.docs.length - 1];

        console.log(`✅ Batch committed. Total processed: ${totalProcessed}. Salaries found: ${totalSalaryFound}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 ALL JOBS ENRICHED!');
    console.log(`Total Processed: ${totalProcessed}`);
    console.log(`Total Salaries Found: ${totalSalaryFound}`);
}

// Run
enrichAllJobsInBatchesCorrected()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('\n❌ Error:', err.message);
        console.error(err.stack);
        process.exit(1);
    });
