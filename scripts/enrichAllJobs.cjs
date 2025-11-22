/**
 * Enrich ALL jobs in database (no limit)
 * Run: node scripts/enrichAllJobs.cjs
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
    const types = [];

    if (/(full.?time|permanent|cdi)/i.test(text)) types.push('full-time');
    if (/(part.?time|temps partiel)/i.test(text)) types.push('part-time');
    if (/(contract|freelance|consultant|cdd)/i.test(text)) types.push('contract');
    if (/(intern|internship|stage)/i.test(text)) types.push('internship');

    return types.length > 0 ? types : ['full-time'];
}

function extractWorkLocations(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const locations = [];

    if (/remote|télétravail|work from home|wfh|distributed/i.test(text)) locations.push('remote');
    if (/(on.?site|office|in.?person|sur place)/i.test(text)) locations.push('on-site');
    if (/hybrid/i.test(text)) locations.push('hybrid');

    return locations.length > 0 ? locations : ['on-site'];
}

function extractExperienceLevels(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const levels = [];

    if (/(intern|internship|stage)/i.test(text)) levels.push('internship');
    if (/(entry|junior|graduate|jr\.?)/i.test(text)) levels.push('entry');
    if (/(mid|intermediate|confirmed)/i.test(text)) levels.push('mid');
    if (/(senior|sr\.?|experienced)/i.test(text)) levels.push('senior');
    if (/(lead|principal|staff|architect|director)/i.test(text)) levels.push('lead');

    return levels.length > 0 ? levels : ['mid'];
}

function extractIndustries(title, description, company) {
    const text = `${title} ${description} ${company}`.toLowerCase();
    const industries = [];

    if (/(software|tech|developer|engineer|programmer|coding)/i.test(text)) industries.push('tech');
    if (/(finance|bank|trading|investment|fintech)/i.test(text)) industries.push('finance');
    if (/(health|medical|pharma|biotech)/i.test(text)) industries.push('healthcare');
    if (/(ecommerce|retail|shop|store)/i.test(text)) industries.push('ecommerce');
    if (/(education|university|school|learning)/i.test(text)) industries.push('education');
    if (/(media|content|publisher|news)/i.test(text)) industries.push('media');
    if (/(marketing|advertising|seo|sem)/i.test(text)) industries.push('marketing');
    if (/(consulting|strategy|advisory)/i.test(text)) industries.push('consulting');

    return industries;
}

function extractTechnologies(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const technologies = [];

    const frontend = ['react', 'vue', 'angular', 'svelte', 'next.js', 'nextjs', 'tailwind', 'bootstrap'];
    frontend.forEach(tech => {
        if (new RegExp(`\\b${tech}\\b`, 'i').test(text)) technologies.push(tech === 'nextjs' ? 'next.js' : tech);
    });

    const backend = ['node.js', 'nodejs', 'python', 'django', 'flask', 'fastapi', 'java', 'spring', 'php', 'laravel', 'ruby', 'rails'];
    backend.forEach(tech => {
        const searchTech = tech.replace('.', '\\.');
        if (new RegExp(`\\b${searchTech}\\b`, 'i').test(text)) {
            technologies.push(tech === 'nodejs' ? 'node.js' : tech);
        }
    });

    const cloud = ['aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'terraform', 'ansible'];
    cloud.forEach(tech => {
        if (new RegExp(`\\b${tech}\\b`, 'i').test(text)) {
            if (tech === 'k8s') technologies.push('kubernetes');
            else technologies.push(tech);
        }
    });

    const databases = ['postgresql', 'postgres', 'mongodb', 'mysql', 'redis', 'elasticsearch', 'dynamodb', 'firestore'];
    databases.forEach(tech => {
        if (new RegExp(`\\b${tech}\\b`, 'i').test(text)) {
            technologies.push(tech === 'postgres' ? 'postgresql' : tech);
        }
    });

    const crm = ['salesforce', 'hubspot', 'zendesk', 'intercom', 'pipedrive'];
    crm.forEach(tech => {
        if (new RegExp(`\\b${tech}\\b`, 'i').test(text)) technologies.push(tech);
    });

    const erp = ['sap', 'oracle', 'workday', 'servicenow'];
    erp.forEach(tech => {
        if (new RegExp(`\\b${tech}\\b`, 'i').test(text)) technologies.push(tech);
    });

    const design = ['figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator'];
    design.forEach(tech => {
        if (new RegExp(`\\b${tech}\\b`, 'i').test(text)) technologies.push(tech);
    });

    return [...new Set(technologies)];
}

function extractSkills(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const skills = [];

    const skillList = ['seo', 'sem', 'product management', 'project management', 'agile', 'scrum', 'ux design', 'ui design', 'analytics', 'data analysis'];
    skillList.forEach(skill => {
        if (new RegExp(`\\b${skill}\\b`, 'i').test(text)) {
            skills.push(skill.replace(/ /g, '-'));
        }
    });

    return skills;
}

// ===== MAIN ENRICHMENT =====

async function enrichAllJobsInBatches() {
    console.log('🚀 Enriching ALL Jobs (No Limit)\n');
    console.log('================================\n');

    let totalProcessed = 0;
    let totalIndustries = 0;
    let totalTechnologies = 0;
    let totalSkills = 0;
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

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const title = data.title || '';
            const description = data.description || '';
            const company = data.company || '';

            const industries = extractIndustries(title, description, company);
            const technologies = extractTechnologies(title, description);
            const skills = extractSkills(title, description);

            const enrichedData = {
                employmentTypes: extractEmploymentTypes(title, description),
                workLocations: extractWorkLocations(title, description),
                experienceLevels: extractExperienceLevels(title, description),
                industries,
                technologies,
                skills,
                enrichedAt: admin.firestore.Timestamp.now(),
                enrichedVersion: '2.0'
            };

            await doc.ref.update(enrichedData);

            totalProcessed++;
            totalIndustries += industries.length;
            totalTechnologies += technologies.length;
            totalSkills += skills.length;

            if (totalProcessed % 50 === 0) {
                console.log(`  ✓ Processed ${totalProcessed} jobs...`);
            }
        }

        lastDoc = snapshot.docs[snapshot.docs.length - 1];

        console.log(`\n✅ Batch complete! Total processed: ${totalProcessed}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 ALL JOBS ENRICHED!');
    console.log('='.repeat(50));
    console.log(`\n📊 Statistics:`);
    console.log(`   Total jobs: ${totalProcessed}`);
    console.log(`   Total industries: ${totalIndustries}`);
    console.log(`   Total technologies: ${totalTechnologies}`);
    console.log(`   Total skills: ${totalSkills}`);
    console.log(`\n   Averages per job:`);
    console.log(`   - ${(totalIndustries / totalProcessed).toFixed(1)} industries`);
    console.log(`   - ${(totalTechnologies / totalProcessed).toFixed(1)} technologies`);
    console.log(`   - ${(totalSkills / totalProcessed).toFixed(1)} skills`);
    console.log('\n✅ Done! All jobs now have enriched tags.');
}

// Run
enrichAllJobsInBatches()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('\n❌ Error:', err.message);
        console.error(err.stack);
        process.exit(1);
    });
