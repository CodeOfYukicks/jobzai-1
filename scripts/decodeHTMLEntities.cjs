/**
 * Decode HTML entities in job descriptions
 * Fixes &lt; &gt; &nbsp; etc. in descriptions
 * 
 * Run: node scripts/decodeHTMLEntities.cjs
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

function decodeHTMLEntities(text) {
    if (!text) return '';
    
    return text
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'");
}

function cleanDescription(desc) {
    if (!desc) return '';
    
    // Decode HTML entities first
    let decoded = decodeHTMLEntities(desc);
    
    // If no HTML tags after decoding, return as is
    if (!/<[^>]+>/.test(decoded)) {
        return decoded;
    }
    
    // Clean and convert to Markdown
    decoded = decoded
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '');
    
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
        
        let markdown = turndownService.turndown(decoded);
        
        markdown = markdown
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\[Apply now\]\(.*?\)/gi, '')
            .replace(/^\\- /gm, '- ')
            .replace(/^• /gm, '- ')
            .trim();
        
        return markdown;
    } catch (e) {
        // Fallback: strip HTML tags
        return decoded.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    }
}

async function fixDescriptions() {
    console.log('🔧 Decoding HTML entities and cleaning descriptions...\n');
    
    const BATCH_SIZE = 500;
    let processedCount = 0;
    let fixedCount = 0;
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
        let batchFixed = 0;

        for (const doc of snapshot.docs) {
            const job = doc.data();
            processedCount++;

            // Check if description has HTML entities
            if (job.description && (/&[a-z]+;/i.test(job.description) || /<[^>]+>/.test(job.description))) {
                const cleanedDesc = cleanDescription(job.description);
                
                if (cleanedDesc !== job.description) {
                    batch.update(doc.ref, { description: cleanedDesc });
                    batchFixed++;
                    fixedCount++;
                    
                    if (batchFixed <= 3) {
                        console.log(`   ✅ Fixed: ${job.company} - ${job.title?.substring(0, 50)}...`);
                    }
                }
            }
        }

        if (batchFixed > 0) {
            await batch.commit();
            console.log(`   ✅ Fixed ${batchFixed} descriptions`);
        }

        console.log(`📊 Progress: ${processedCount} processed, ${fixedCount} fixed total`);

        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎉 HTML Entity Decoding Complete!');
    console.log('='.repeat(70));
    console.log(`\n📊 Final Stats:`);
    console.log(`   Total processed: ${processedCount}`);
    console.log(`   Total fixed: ${fixedCount}`);
    console.log('\n✅ All descriptions are now clean!\n');
}

fixDescriptions().then(() => process.exit(0)).catch(error => {
    console.error('Error:', error);
    process.exit(1);
});

