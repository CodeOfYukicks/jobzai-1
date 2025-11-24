/**
 * Clean HTML descriptions in newly added jobs
 * Converts HTML to clean Markdown
 * 
 * Run: node scripts/cleanNewJobDescriptions.cjs
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

function cleanDescription(htmlOrText) {
    if (!htmlOrText) return '';

    // Basic cleanup
    let cleaned = htmlOrText
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<span[^>]*font-weight:\s*700[^>]*>(.*?)<\/span>/gi, '<strong>$1</strong>')
        .replace(/<span[^>]*font-weight:\s*bold[^>]*>(.*?)<\/span>/gi, '<strong>$1</strong>')
        .replace(/<p>\s*[•-]\s*/gi, '<p><li>')
        .replace(/<br\s*\/?>\s*[•-]\s*/gi, '</li><li>');

    try {
        turndownService.addRule('boldHeader', {
            filter: ['strong', 'b'],
            replacement: function (content, node) {
                if (node.parentNode && node.parentNode.childNodes.length === 1) {
                    return '\n\n### ' + content + '\n\n';
                }
                return '**' + content + '**';
            }
        });

        let markdown = turndownService.turndown(cleaned);

        markdown = markdown
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\[Apply now\]\(.*?\)/gi, '')
            .replace(/^\\- /gm, '- ')
            .replace(/^• /gm, '- ')
            .trim();

        return markdown;
    } catch (e) {
        console.warn('Failed to convert, returning original');
        return htmlOrText;
    }
}

async function cleanNewJobs() {
    console.log('🧹 Cleaning HTML descriptions in new jobs...\n');
    
    const BATCH_SIZE = 500;
    let processedCount = 0;
    let cleanedCount = 0;
    let lastDoc = null;

    while (true) {
        let query = db.collection('jobs')
            .orderBy('postedAt', 'desc')
            .limit(BATCH_SIZE);

        if (lastDoc) {
            query = query.startAfter(lastDoc);
        }

        const snapshot = await query.get();

        if (snapshot.empty) break;

        console.log(`📦 Processing batch of ${snapshot.size} jobs...`);

        const batch = db.batch();
        let batchCleaned = 0;

        for (const doc of snapshot.docs) {
            const job = doc.data();
            processedCount++;

            // Check if description has HTML tags
            if (job.description && /<[^>]+>/.test(job.description)) {
                const cleanedDesc = cleanDescription(job.description);
                
                if (cleanedDesc !== job.description) {
                    batch.update(doc.ref, { description: cleanedDesc });
                    batchCleaned++;
                    cleanedCount++;
                }
            }
        }

        if (batchCleaned > 0) {
            await batch.commit();
            console.log(`   ✅ Cleaned ${batchCleaned} descriptions in this batch`);
        } else {
            console.log(`   ⏭️  No HTML found in this batch, skipping...`);
        }

        console.log(`📊 Progress: ${processedCount} processed, ${cleanedCount} cleaned`);

        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n🎉 Description cleaning complete!');
    console.log(`📊 Final Stats:`);
    console.log(`   Total processed: ${processedCount}`);
    console.log(`   Total cleaned: ${cleanedCount}`);
    console.log('\n✅ All descriptions are now in clean Markdown format!\n');
}

cleanNewJobs().then(() => process.exit(0)).catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
