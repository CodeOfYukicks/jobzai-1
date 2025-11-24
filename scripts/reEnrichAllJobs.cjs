/**
 * Re-enrich ALL jobs with improved tagging logic (v2.2)
 * 
 * This script fixes existing jobs that were incorrectly tagged, especially:
 * - Senior positions tagged as "internship" (due to "international", "internal" matches)
 * - Tech jobs over-matching due to simple .includes()
 * - Other false positives from weak string matching
 * 
 * Run: node scripts/reEnrichAllJobs.cjs
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
    projectId: 'jobzai'
});

const db = admin.firestore();

/**
 * Helper function to escape special regex characters
 */
function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract industry/sector tags (IMPROVED with word boundaries)
 */
function extractIndustryTags(title, description, summary, company) {
    const text = `${title || ''} ${description || ''} ${summary || ''} ${company || ''}`.toLowerCase();
    const industries = [];

    if (/\b(software|tech(?!nician)|saas|startup|digital|platform|app(?!lication)|cloud|web|mobile|ai|machine learning|developer|engineer|programmer|coding)\b/i.test(text)) {
        industries.push('tech');
    }
    if (/\b(bank(?!rupt)|finance|fintech|payment|insurance|trading|crypto|blockchain|investment)\b/i.test(text)) {
        industries.push('finance');
    }
    if (/\b(e-commerce|ecommerce|retail|marketplace|shop(?!ping)|store)\b/i.test(text)) {
        industries.push('ecommerce');
    }
    if (/\b(health(?!y)|medical|healthcare|biotech|pharma|hospital|clinic|patient)\b/i.test(text)) {
        industries.push('healthcare');
    }
    if (/\b(education|edtech|learning|university|school|training|course)\b/i.test(text)) {
        industries.push('education');
    }
    if (/\b(media|entertainment|gaming|streaming|content|music|video|news|publisher)\b/i.test(text)) {
        industries.push('media');
    }
    if (/\b(marketing|advertising|agency|brand|social media|seo|sem)\b/i.test(text)) {
        industries.push('marketing');
    }
    if (/\b(consulting|consultant|advisory|strategy)\b/i.test(text)) {
        industries.push('consulting');
    }

    return [...new Set(industries)];
}

/**
 * Extract technology/tool tags (IMPROVED with word boundaries)
 */
function extractTechnologyTags(title, description, summary) {
    const text = `${title || ''} ${description || ''} ${summary || ''}`.toLowerCase();
    const technologies = [];

    const allTechs = [
        // Languages
        'python', 'javascript', 'typescript', 'java', 'go', 'golang', 'rust',
        'c++', 'c#', 'php', 'ruby', 'swift', 'kotlin', 'scala', 'r', 'sql',
        // Frontend
        'react', 'vue', 'angular', 'svelte', 'next.js', 'nextjs', 'nuxt',
        'tailwind', 'bootstrap', 'html', 'css', 'sass', 'webpack',
        // Backend
        'node.js', 'nodejs', 'express', 'django', 'flask', 'fastapi',
        'spring', 'laravel', 'rails', '.net', 'dotnet', 'graphql', 'rest', 'api',
        // Cloud
        'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s',
        'terraform', 'ansible', 'jenkins', 'gitlab', 'github', 'ci/cd', 'cicd',
        // Databases
        'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch',
        'cassandra', 'dynamodb', 'firestore', 'firebase', 'supabase',
        // CRM
        'salesforce', 'hubspot', 'crm', 'zendesk', 'intercom', 'pipedrive',
        // ERP
        'sap', 'oracle', 'erp', 'workday', 'servicenow',
        // Design
        'figma', 'sketch', 'adobe', 'photoshop', 'illustrator', 'xd',
        'invision', 'framer', 'canva',
        // Data
        'tableau', 'powerbi', 'looker', 'databricks', 'snowflake', 'airflow',
        'spark', 'hadoop', 'pandas', 'numpy',
        // AI
        'tensorflow', 'pytorch', 'scikit-learn', 'langchain', 'openai',
        'machine learning', 'deep learning', 'nlp', 'computer vision'
    ];

    allTechs.forEach(tech => {
        if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) {
            // Normalize aliases
            if (tech === 'nextjs') technologies.push('next.js');
            else if (tech === 'nodejs') technologies.push('node.js');
            else if (tech === 'dotnet') technologies.push('.net');
            else if (tech === 'k8s') technologies.push('kubernetes');
            else if (tech === 'cicd') technologies.push('ci/cd');
            else if (tech === 'postgres') technologies.push('postgresql');
            else technologies.push(tech);
        }
    });

    return [...new Set(technologies)];
}

/**
 * Extract skill tags (IMPROVED with word boundaries)
 */
function extractSkillTags(title, description, summary) {
    const text = `${title || ''} ${description || ''} ${summary || ''}`.toLowerCase();
    const skills = [];

    if (/\bseo\b/i.test(text)) skills.push('seo');
    if (/\b(sem|ppc)\b/i.test(text)) skills.push('sem');
    if (/\bcontent marketing\b/i.test(text)) skills.push('content-marketing');
    if (/\bemail marketing\b/i.test(text)) skills.push('email-marketing');
    if (/\bsocial media\b/i.test(text)) skills.push('social-media');
    if (/\b(analytics|google analytics)\b/i.test(text)) skills.push('analytics');
    if (/\b(product management|product manager)\b/i.test(text)) skills.push('product-management');
    if (/\b(project management|pmp)\b/i.test(text)) skills.push('project-management');
    if (/\b(agile|scrum)\b/i.test(text)) skills.push('agile');
    if (/\bsales\b/i.test(text)) skills.push('sales');
    if (/\b(business development|bd)\b/i.test(text)) skills.push('business-development');
    if (/\bcustomer success\b/i.test(text)) skills.push('customer-success');
    if (/\b(ui\/ux|ux design)\b/i.test(text)) skills.push('ux-design');
    if (/\bui design\b/i.test(text)) skills.push('ui-design');
    if (/\bgraphic design\b/i.test(text)) skills.push('graphic-design');
    if (/\b(communication|communication skills)\b/i.test(text)) skills.push('communication');
    if (/\b(leadership|team lead)\b/i.test(text)) skills.push('leadership');
    if (/\b(teamwork|collaboration)\b/i.test(text)) skills.push('teamwork');
    if (/\bproblem solving\b/i.test(text)) skills.push('problem-solving');

    return [...new Set(skills)];
}

/**
 * Extract employment type (IMPROVED with experience-level-aware conflict resolution)
 */
function extractEmploymentType(title, description, summary, experienceLevel) {
    const text = `${title || ''} ${description || ''} ${summary || ''}`.toLowerCase();
    const titleLower = (title || '').toLowerCase();
    let types = [];

    if (/\b(full.?time|permanent|cdi|fulltime)\b/i.test(text)) types.push('full-time');
    if (/\b(part.?time|temps partiel|parttime)\b/i.test(text)) types.push('part-time');
    if (/\b(contract(or)?|freelance|consultant|cdd|fixed.?term|temporary)\b/i.test(text)) types.push('contract');
    if (/\b(intern|internship|stage|alternance|apprenticeship|apprenti)\b/i.test(text)) types.push('internship');

    // ENHANCED CONFLICT RESOLUTION: Remove internship if it conflicts with seniority
    if (types.includes('internship')) {
        // Check title for senior/lead keywords
        if (/\b(senior|lead|principal|staff|director|manager|head of|vp|chief)\b/i.test(titleLower)) {
            types = types.filter(t => t !== 'internship');
        }
        // CRITICAL: Also check experience level
        if (experienceLevel && (experienceLevel.includes('senior') || experienceLevel.includes('lead'))) {
            types = types.filter(t => t !== 'internship');
        }
    }

    if (types.length === 0) types.push('full-time');

    return [...new Set(types)];
}

/**
 * Extract work location (IMPROVED with word boundaries)
 */
function extractWorkLocation(title, description, summary, remote, remotePolicy, location) {
    const text = `${title || ''} ${description || ''} ${summary || ''} ${remote || ''} ${remotePolicy || ''} ${location || ''}`.toLowerCase();
    const locations = [];

    if (/\b(remote|work from home|wfh|distributed|télétravail|telecommute)\b/i.test(text)) {
        locations.push('remote');
    }
    if (/\b(hybrid|flex)\b/i.test(text) || 
        (locations.includes('remote') && /\b(office|on.?site)\b/i.test(text))) {
        locations.push('hybrid');
    }
    if (/\b(on.?site|onsite|in.?office|au bureau|in.?person)\b/i.test(text) ||
        (!locations.includes('remote') && !locations.includes('hybrid') && location)) {
        locations.push('on-site');
    }

    if (locations.length === 0) locations.push('on-site');

    return locations;
}

/**
 * Extract experience level with STRICT PRIORITY SYSTEM (CRITICAL FIX)
 */
function extractExperienceLevel(title, description, summary, seniority, level) {
    const text = `${title || ''} ${description || ''} ${summary || ''} ${seniority || ''} ${level || ''}`.toLowerCase();
    const titleLower = (title || '').toLowerCase();

    // PRIORITY 1: Lead/Executive
    if (/\b(lead|principal|staff engineer|staff software|staff developer|architect|director|vp|vice president|head of|chief|cto|ceo|cfo|coo|founding)\b/i.test(text)) {
        return ['lead'];
    }

    // PRIORITY 2: Senior
    if (/\b(senior|sr\.|sr\s|expérimenté)\b/i.test(titleLower) ||
        (/\b(senior|sr\.|sr\s)\b/i.test(text) && /\b(5\+|5-|6\+|7\+|8\+|10\+)\s*years?\b/i.test(text))) {
        return ['senior'];
    }

    // PRIORITY 3: Mid
    if (/\b(mid|mid-level|intermediate|confirmé|medior)\b/i.test(text) ||
        /\b(2-5|3-5|3-7|4-6)\s*years?\b/i.test(text)) {
        return ['mid'];
    }

    // PRIORITY 4: Entry
    if (/\b(entry|entry-level|junior|jr\.|jr\s|graduate|débutant|associate)\b/i.test(text) ||
        /\b(0-2|0-1|1-2|1-3)\s*years?\b/i.test(text)) {
        return ['entry'];
    }

    // PRIORITY 5: Internship (VERY STRICT - only if explicitly in title or with student keywords)
    if (/\b(intern|internship|stage|apprenti|alternance)\b/i.test(titleLower) ||
        (/\b(intern|internship|stage)\b/i.test(text) && /\b(student|université|university|école|school)\b/i.test(text))) {
        return ['internship'];
    }

    // DEFAULT
    return ['mid'];
}

/**
 * Main enrichment function
 */
async function reEnrichAllJobs() {
    console.log('🚀 Starting comprehensive job re-enrichment with v2.2 logic...\n');

    const BATCH_SIZE = 500;
    let processedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    let lastDoc = null;

    // Track specific fixes
    let internshipFixed = 0;
    let seniorFixed = 0;

    try {
        while (true) {
            let jobsQuery = db.collection('jobs')
                .orderBy('postedAt', 'desc')
                .limit(BATCH_SIZE);

            if (lastDoc) {
                jobsQuery = jobsQuery.startAfter(lastDoc);
            }

            const snapshot = await jobsQuery.get();

            if (snapshot.empty) {
                break;
            }

            console.log(`\n📦 Processing batch of ${snapshot.size} jobs...`);

            const batch = db.batch();
            let batchCount = 0;

            for (const doc of snapshot.docs) {
                try {
                    const job = doc.data();
                    processedCount++;

                    // Track before state
                    const oldExperienceLevels = job.experienceLevels || [];
                    const oldEmploymentTypes = job.employmentTypes || [];

                    // Extract with improved logic - ORDER MATTERS!
                    const experienceLevels = extractExperienceLevel(job.title, job.description, job.summary, job.seniority, job.level);
                    const employmentTypes = extractEmploymentType(job.title, job.description, job.summary, experienceLevels); // Pass experienceLevel!
                    const workLocations = extractWorkLocation(job.title, job.description, job.summary, job.remote, job.remotePolicy, job.location);
                    const industries = extractIndustryTags(job.title, job.description, job.summary, job.company);
                    const technologies = extractTechnologyTags(job.title, job.description, job.summary);
                    const skills = extractSkillTags(job.title, job.description, job.summary);

                    // Track specific fixes
                    if (oldExperienceLevels.includes('internship') && !experienceLevels.includes('internship')) {
                        internshipFixed++;
                        console.log(`   ✅ Fixed: "${job.title}" - removed incorrect internship tag`);
                    }
                    if (!oldExperienceLevels.includes('senior') && experienceLevels.includes('senior')) {
                        seniorFixed++;
                    }

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
                    batchCount++;
                    updatedCount++;
                } catch (e) {
                    errorCount++;
                    console.error(`   ❌ Error processing job ${doc.id}:`, e.message);
                }
            }

            await batch.commit();
            console.log(`✅ Updated ${batchCount} jobs in this batch`);
            console.log(`📊 Progress: ${processedCount} processed, ${updatedCount} updated, ${errorCount} errors`);
            console.log(`🎯 Fixes: ${internshipFixed} internship tags removed, ${seniorFixed} senior tags added`);

            lastDoc = snapshot.docs[snapshot.docs.length - 1];

            // Small delay to avoid overwhelming Firestore
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('\n🎉 Re-enrichment complete!');
        console.log(`📊 Final Stats:`);
        console.log(`   Total processed: ${processedCount}`);
        console.log(`   Total updated: ${updatedCount}`);
        console.log(`   Total errors: ${errorCount}`);
        console.log(`   Internship tags fixed: ${internshipFixed}`);
        console.log(`   Senior tags added: ${seniorFixed}`);
        console.log(`\n✅ All jobs now use v2.2 enrichment logic with word boundaries and priority system`);

    } catch (error) {
        console.error('\n❌ Fatal error during re-enrichment:', error);
        process.exit(1);
    }

    process.exit(0);
}

// Run the script
reEnrichAllJobs();

