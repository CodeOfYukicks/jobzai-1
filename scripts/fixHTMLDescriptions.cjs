/**
 * Fix HTML descriptions in jobs from new companies
 * Targets jobs from companies added today (Stripe, Coinbase, etc.)
 * 
 * Run: node scripts/fixHTMLDescriptions.cjs
 */

const admin = require('firebase-admin');
const TurndownService = require('turndown');

admin.initializeApp({
    projectId: 'jobzai'
});

const db = admin.firestore();

const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
});

turndownService.remove(['script', 'style', 'iframe', 'object', 'embed', 'link', 'head']);

// Add rule for bold headers
turndownService.addRule('boldHeader', {
    filter: ['strong', 'b'],
    replacement: function (content, node) {
        if (node.parentNode && node.parentNode.childNodes.length === 1) {
            return '\n\n### ' + content + '\n\n';
        }
        return '**' + content + '**';
    }
});

function cleanDescription(htmlOrText) {
    if (!htmlOrText) return '';
    
    // If it doesn't look like HTML, return as is
    if (!/<[^>]+>/.test(htmlOrText)) {
        return htmlOrText;
    }

    let cleaned = htmlOrText
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/<span[^>]*font-weight:\s*700[^>]*>(.*?)<\/span>/gi, '<strong>$1</strong>')
        .replace(/<span[^>]*font-weight:\s*bold[^>]*>(.*?)<\/span>/gi, '<strong>$1</strong>');

    try {
        let markdown = turndownService.turndown(cleaned);

        markdown = markdown
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\[Apply now\]\(.*?\)/gi, '')
            .replace(/^\\- /gm, '- ')
            .replace(/^• /gm, '- ')
            .trim();

        return markdown;
    } catch (e) {
        console.warn('Turndown failed, stripping tags manually');
        // Fallback: strip all HTML tags
        return cleaned.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    }
}

// New companies added today
const NEW_COMPANIES = [
    'Stripe', 'Coinbase', 'GitLab', 'Figma', 'Discord', 'Robinhood', 'Databricks',
    'Cloudflare', 'MongoDB', 'Elastic', 'Warby Parker', 'Datadog', 'Peloton',
    'Lyft', 'Pinterest', 'Asana', 'Reddit', 'Intercom', 'Dropbox', 'Instacart',
    'Flexport', 'Affirm', 'Postman', 'Grammarly', 'Udemy', 'Coursera', 'Brex',
    'Amplitude', 'Benchling', 'Gusto', 'Chime', 'Airtable', 'Vercel', 'Duolingo',
    'Twitch', 'CockroachLabs', 'Retool', 'Netlify', 'PlanetScale', 'Fastly',
    'Strava', 'Sweetgreen', 'Glossier', 'Allbirds', 'Calm', 'Squarespace',
    // SmartRecruiters
    'Devoteam', 'Deezer', 'Dataiku', 'BlaBlaCar',
    // Ashby
    'Linear', 'Temporal'
];

async function fixHTMLDescriptions() {
    console.log('🧹 Fixing HTML descriptions in new jobs...\n');
    console.log(`🎯 Target companies: ${NEW_COMPANIES.length} companies\n`);
    
    let totalProcessed = 0;
    let totalCleaned = 0;
    
    // Process each company
    for (const company of NEW_COMPANIES) {
        console.log(`\n📋 Processing ${company}...`);
        
        const jobsSnapshot = await db.collection('jobs')
            .where('company', '==', company)
            .get();
        
        if (jobsSnapshot.empty) {
            console.log(`   ⏭️  No jobs found`);
            continue;
        }
        
        console.log(`   Found ${jobsSnapshot.size} jobs`);
        
        const batch = db.batch();
        let batchCleaned = 0;
        
        for (const doc of jobsSnapshot.docs) {
            const job = doc.data();
            totalProcessed++;
            
            if (job.description && /<[^>]+>/.test(job.description)) {
                const cleanedDesc = cleanDescription(job.description);
                batch.update(doc.ref, { description: cleanedDesc });
                batchCleaned++;
                totalCleaned++;
            }
        }
        
        if (batchCleaned > 0) {
            await batch.commit();
            console.log(`   ✅ Cleaned ${batchCleaned}/${jobsSnapshot.size} descriptions`);
        } else {
            console.log(`   ✅ All descriptions already clean`);
        }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('🎉 HTML Cleanup Complete!');
    console.log('='.repeat(70));
    console.log(`\n📊 Final Stats:`);
    console.log(`   Total jobs processed: ${totalProcessed}`);
    console.log(`   Total descriptions cleaned: ${totalCleaned}`);
    console.log('\n✅ All descriptions are now in clean Markdown!\n');
}

fixHTMLDescriptions().then(() => process.exit(0)).catch(error => {
    console.error('Error:', error);
    process.exit(1);
});

