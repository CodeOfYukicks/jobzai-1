/**
 * V4.0 Job Re-Enrichment Script
 * 
 * Run with: node scripts/reEnrichJobsV4.js
 * 
 * This script re-enriches ALL jobs with the new V4.0 fields:
 * - roleFunction (engineering, sales, consulting, etc.)
 * - languageRequirements (required languages from title/description)
 * - enrichmentQuality (0-100 score for matching penalty)
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized with service account');
} catch (error) {
    // Fallback to default credentials (for GCP environments)
    try {
        admin.initializeApp();
        console.log('✅ Firebase Admin initialized with default credentials');
    } catch (initError) {
        console.error('❌ Failed to initialize Firebase Admin:', initError.message);
        console.log('\n📝 To run this script locally, you need a service account key.');
        console.log('   1. Go to Firebase Console → Project Settings → Service Accounts');
        console.log('   2. Generate a new private key');
        console.log('   3. Save it as functions/serviceAccountKey.json');
        process.exit(1);
    }
}

const db = admin.firestore();

// =============================================================================
// ENRICHMENT FUNCTIONS (copied from jobEnrichment.ts)
// =============================================================================

function extractRoleFunction(job) {
    const title = (job.title || '').toLowerCase();
    const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();

    // SALES
    if (/\b(account executive|ae\b|sales|bdr|sdr|business development representative|sales representative|sales manager|revenue|partnerships|account manager|client executive|commercial|quota)\b/i.test(title)) {
        return 'sales';
    }

    // ENGINEERING
    if (/\b(engineer|developer|développeur|swe\b|sre\b|devops|backend|frontend|full.?stack|software|programmer|coder|architect|platform|infrastructure)\b/i.test(title)) {
        return 'engineering';
    }

    // DATA
    if (/\b(data scientist|data engineer|data analyst|machine learning|ml engineer|ai engineer|analytics|bi\b|business intelligence|statistician|nlp|computer vision)\b/i.test(title)) {
        return 'data';
    }

    // PRODUCT
    if (/\b(product manager|product owner|product lead|pm\b|chief product|vp product|head of product)\b/i.test(title)) {
        return 'product';
    }

    // DESIGN
    if (/\b(designer|design|ux|ui|creative|graphic|visual|brand designer|product designer)\b/i.test(title)) {
        return 'design';
    }

    // MARKETING
    if (/\b(marketing|growth|content|seo|sem|brand|communications|pr\b|public relations|social media|demand gen|campaign)\b/i.test(title)) {
        return 'marketing';
    }

    // CONSULTING
    if (/\b(consultant|consulting|advisory|advisor|solution architect|implementation|functional consultant|technical consultant)\b/i.test(title)) {
        return 'consulting';
    }

    // HR
    if (/\b(hr\b|human resources|recruiter|recruiting|talent|people ops|people operations|hrbp|compensation|benefits|l&d|learning and development)\b/i.test(title)) {
        return 'hr';
    }

    // FINANCE
    if (/\b(finance|financial|accountant|accounting|controller|cfo|treasury|audit|tax|fp&a|financial planning)\b/i.test(title)) {
        return 'finance';
    }

    // OPERATIONS
    if (/\b(operations|ops\b|supply chain|logistics|warehouse|procurement|vendor|sourcing|fleet|delivery)\b/i.test(title)) {
        return 'operations';
    }

    // SUPPORT
    if (/\b(customer support|customer service|support specialist|customer success|cs\b|helpdesk|technical support|support engineer)\b/i.test(title)) {
        return 'support';
    }

    // LEGAL
    if (/\b(legal|lawyer|attorney|counsel|paralegal|compliance|regulatory|contracts|privacy|gdpr)\b/i.test(title)) {
        return 'legal';
    }

    // Fallback checks
    if (/\b(coding|programming|software development|api|backend|frontend|full.?stack)\b/i.test(text) && 
        !/\b(sales|marketing|account executive)\b/i.test(title)) {
        return 'engineering';
    }

    if (/\b(close deals|quota|pipeline|crm|revenue target|sales cycle|prospecting)\b/i.test(text)) {
        return 'sales';
    }

    return 'other';
}

function extractLanguageRequirements(job) {
    const title = (job.title || '').toLowerCase();
    const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();
    const languages = [];

    const languagePatterns = [
        { pattern: /\b(scandinavian|nordic)\s*(speaker|speaking|language|fluent|native)?/i, langs: ['swedish', 'norwegian', 'danish'] },
        { pattern: /\b(swedish|svenska)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['swedish'] },
        { pattern: /\b(norwegian|norsk)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['norwegian'] },
        { pattern: /\b(danish|dansk)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['danish'] },
        { pattern: /\b(finnish|suomi)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['finnish'] },
        { pattern: /\b(german|deutsch|deutschsprachig)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['german'] },
        { pattern: /\b(french|français|francophone|francais)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['french'] },
        { pattern: /\b(dutch|nederlands|flemish)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['dutch'] },
        { pattern: /\b(italian|italiano)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['italian'] },
        { pattern: /\b(spanish|español|espanol)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['spanish'] },
        { pattern: /\b(portuguese|português|portugues)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['portuguese'] },
        { pattern: /\b(polish|polski)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['polish'] },
        { pattern: /\b(japanese|日本語|nihongo)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['japanese'] },
        { pattern: /\b(korean|한국어|hangul)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['korean'] },
        { pattern: /\b(chinese|mandarin|普通话|中文|cantonese)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['chinese'] },
        { pattern: /\b(arabic|العربية)\s*(speaker|speaking|language|fluent|native|required)?/i, langs: ['arabic'] },
    ];

    // Check title first (most important)
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
        ];

        for (const pattern of requirementPatterns) {
            const match = text.match(pattern);
            if (match) {
                const langName = match[1]?.toLowerCase();
                const langMap = {
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
                    'arabic': 'arabic',
                };
                if (langMap[langName]) {
                    languages.push(langMap[langName]);
                }
            }
        }
    }

    return [...new Set(languages)];
}

function calculateEnrichmentQuality(enrichedData) {
    let quality = 0;

    if ((enrichedData.technologies || []).length > 0) quality += 25;
    if (enrichedData.roleFunction !== 'other') quality += 25;
    if ((enrichedData.industries || []).length > 0) quality += 15;
    if ((enrichedData.skills || []).length > 0) quality += 15;
    if ((enrichedData.experienceLevels || []).length > 0 && enrichedData.experienceLevels[0] !== 'mid') quality += 10;
    if ((enrichedData.workLocations || []).length > 0) quality += 10;

    return quality;
}

// =============================================================================
// MAIN RE-ENRICHMENT LOGIC
// =============================================================================

async function reEnrichAllJobs(batchSize = 100) {
    let processedCount = 0;
    let skippedCount = 0;
    let lastDoc = null;
    let totalJobs = 0;

    console.log('\n🚀 Starting V4.0 Job Re-Enrichment...');
    console.log('   Batch size:', batchSize);
    console.log('');

    // First, count total jobs
    const countSnapshot = await db.collection('jobs').count().get();
    totalJobs = countSnapshot.data().count;
    console.log(`📊 Total jobs in database: ${totalJobs}`);
    console.log('');

    const startTime = Date.now();

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
        let batchUpdates = 0;

        for (const doc of snapshot.docs) {
            const jobData = doc.data();

            // Skip if already V4.0 enriched
            if (jobData.enrichedVersion === '4.0') {
                skippedCount++;
                continue;
            }

            // Extract new V4.0 fields
            const roleFunction = extractRoleFunction(jobData);
            const languageRequirements = extractLanguageRequirements(jobData);
            const enrichmentQuality = calculateEnrichmentQuality({
                technologies: jobData.technologies || [],
                industries: jobData.industries || [],
                skills: jobData.skills || [],
                roleFunction,
                experienceLevels: jobData.experienceLevels || [],
                workLocations: jobData.workLocations || [],
            });

            // Update document
            const updates = {
                roleFunction,
                languageRequirements,
                enrichmentQuality,
                enrichedAt: admin.firestore.FieldValue.serverTimestamp(),
                enrichedVersion: '4.0',
            };

            batch.update(doc.ref, updates);
            batchUpdates++;
            processedCount++;

            // Log interesting findings
            if (languageRequirements.length > 0) {
                console.log(`   🌍 ${jobData.title?.slice(0, 50)}... → Languages: ${languageRequirements.join(', ')}`);
            }
        }

        if (batchUpdates > 0) {
            await batch.commit();
        }

        const progress = Math.round(((processedCount + skippedCount) / totalJobs) * 100);
        console.log(`✅ Progress: ${progress}% | Processed: ${processedCount} | Skipped: ${skippedCount}`);

        lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log('\n🎉 V4.0 Re-Enrichment Complete!');
    console.log('=====================================');
    console.log(`   Total processed: ${processedCount} jobs`);
    console.log(`   Skipped (already V4.0): ${skippedCount} jobs`);
    console.log(`   Duration: ${duration} seconds`);
    console.log('');
    console.log('   New fields added:');
    console.log('   - roleFunction: engineering, sales, consulting, etc.');
    console.log('   - languageRequirements: detected from title/description');
    console.log('   - enrichmentQuality: 0-100 score');
    console.log('=====================================');
}

// Run the script
reEnrichAllJobs(200)
    .then(() => {
        console.log('\n✅ Script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });





