/**
 * Standalone job enrichment script - all logic inline
 * Run: node scripts/enrichJobStandalone.cjs [test|JOB_ID|all]
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

    return types.length > 0 ? types : ['full-time']; // Default
}

function extractWorkLocations(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const locations = [];

    if (/remote|télétravail|work from home|wfh|distributed/i.test(text)) locations.push('remote');
    if (/(on.?site|office|in.?person|sur place)/i.test(text)) locations.push('on-site');
    if (/hybrid/i.test(text)) locations.push('hybrid');

    return locations.length > 0 ? locations : ['on-site']; // Default
}

function extractExperienceLevels(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const levels = [];

    if (/(intern|internship|stage)/i.test(text)) levels.push('internship');
    if (/(entry|junior|graduate|jr\.?)/i.test(text)) levels.push('entry');
    if (/(mid|intermediate|confirmed)/i.test(text)) levels.push('mid');
    if (/(senior|sr\.?|experienced)/i.test(text)) levels.push('senior');
    if (/(lead|principal|staff|architect|director)/i.test(text)) levels.push('lead');

    return levels.length > 0 ? levels : ['mid']; // Default
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

    // Frontend
    const frontend = ['react', 'vue', 'angular', 'svelte', 'next.js', 'nextjs', 'tailwind', 'bootstrap'];
    frontend.forEach(tech => {
        if (new RegExp(`\\b${tech}\\b`, 'i').test(text)) technologies.push(tech === 'nextjs' ? 'next.js' : tech);
    });

    // Backend
    const backend = ['node.js', 'nodejs', 'python', 'django', 'flask', 'fastapi', 'java', 'spring', 'php', 'laravel', 'ruby', 'rails'];
    backend.forEach(tech => {
        const searchTech = tech.replace('.', '\\.');
        if (new RegExp(`\\b${searchTech}\\b`, 'i').test(text)) {
            technologies.push(tech === 'nodejs' ? 'node.js' : tech);
        }
    });

    // Cloud
    const cloud = ['aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'terraform', 'ansible'];
    cloud.forEach(tech => {
        if (new RegExp(`\\b${tech}\\b`, 'i').test(text)) {
            if (tech === 'k8s') technologies.push('kubernetes');
            else technologies.push(tech);
        }
    });

    // Databases
    const databases = ['postgresql', 'postgres', 'mongodb', 'mysql', 'redis', 'elasticsearch', 'dynamodb', 'firestore'];
    databases.forEach(tech => {
        if (new RegExp(`\\b${tech}\\b`, 'i').test(text)) {
            technologies.push(tech === 'postgres' ? 'postgresql' : tech);
        }
    });

    // CRM/Business
    const crm = ['salesforce', 'hubspot', 'zendesk', 'intercom', 'pipedrive'];
    crm.forEach(tech => {
        if (new RegExp(`\\b${tech}\\b`, 'i').test(text)) technologies.push(tech);
    });

    // ERP
    const erp = ['sap', 'oracle', 'workday', 'servicenow'];
    erp.forEach(tech => {
        if (new RegExp(`\\b${tech}\\b`, 'i').test(text)) technologies.push(tech);
    });

    // Design
    const design = ['figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator'];
    design.forEach(tech => {
        if (new RegExp(`\\b${tech}\\b`, 'i').test(text)) technologies.push(tech);
    });

    return [...new Set(technologies)]; // Remove duplicates
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

// ===== MAIN ENRICHMENT FUNCTION =====

async function enrichJobDoc(jobId) {
    console.log(`  Processing job: ${jobId}`);

    const jobRef = db.collection('jobs').doc(jobId);
    const jobSnap = await jobRef.get();

    if (!jobSnap.exists) {
        console.log(`  ❌ Job not found: ${jobId}`);
        return;
    }

    const data = jobSnap.data();
    const title = data.title || '';
    const description = data.description || '';
    const company = data.company || '';

    const enrichedData = {
        employmentTypes: extractEmploymentTypes(title, description),
        workLocations: extractWorkLocations(title, description),
        experienceLevels: extractExperienceLevels(title, description),
        industries: extractIndustries(title, description, company),
        technologies: extractTechnologies(title, description),
        skills: extractSkills(title, description),
        enrichedAt: admin.firestore.Timestamp.now(),
        enrichedVersion: '2.0'
    };

    await jobRef.update(enrichedData);

    console.log(`  ✓ Enriched with:`);
    console.log(`    - ${enrichedData.industries.length} industries`);
    console.log(`    - ${enrichedData.technologies.length} technologies`);
    console.log(`    - ${enrichedData.skills.length} skills`);
}

// ===== CLI =====

async function main() {
    const arg = process.argv[2] || 'test';

    console.log('🚀 Job Enrichment Tool\n');

    try {
        if (arg === 'test') {
            console.log('🧪 Test mode: Enriching first job...\n');
            const snapshot = await db.collection('jobs').orderBy('postedAt', 'desc').limit(1).get();

            if (snapshot.empty) {
                console.log('❌ No jobs found');
                process.exit(1);
            }

            const job = snapshot.docs[0];
            console.log(`📝 Found: ${job.data().title} @ ${job.data().company}\n`);

            await enrichJobDoc(job.id);

            console.log(`\n✅ Done! Check: https://console.firebase.google.com/project/jobzai/firestore/data/jobs/${job.id}`);

        } else if (arg === 'all') {
            const batchSize = parseInt(process.argv[3]) || 100;
            console.log(`📦 Enriching all jobs (batch: ${batchSize})...\n`);

            const snapshot = await db.collection('jobs').limit(batchSize).get();
            console.log(`Found ${snapshot.size} jobs\n`);

            for (const doc of snapshot.docs) {
                await enrichJobDoc(doc.id);
            }

            console.log('\n🎉 All done!');

        } else {
            // Specific job ID
            console.log(`📝 Enriching job: ${arg}\n`);
            await enrichJobDoc(arg);
            console.log('\n✅ Done!');
        }

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

main();
