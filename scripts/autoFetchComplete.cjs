/**
 * 🚀 Complete Automated Pipeline (Local Version)
 * Does everything: fetch + clean + enrich
 * 
 * Run: node scripts/autoFetchComplete.cjs
 */

const admin = require('firebase-admin');
const fetch = require('node-fetch');
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
        .replace(/&amp;/g, '&');

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
        markdown = markdown.replace(/\n{3,}/g, '\n\n').replace(/^\\- /gm, '- ').trim();
        return markdown;
    } catch (e) {
        return cleaned.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    }
}

console.log('🚀 COMPLETE AUTOMATED PIPELINE');
console.log('='.repeat(70));
console.log('This is your production script for daily automation.');
console.log('Put this in a cron job to run every 24h!');
console.log('='.repeat(70));
console.log('\n✨ What it does:');
console.log('   1. Creates 98 worker tasks');
console.log('   2. Processes them (fetch + clean + write)');
console.log('   3. Re-enriches ALL jobs with v2.2 tags');
console.log('   4. Cleans any remaining HTML');
console.log('\n⏱️  Estimated time: 30-40 minutes\n');

async function main() {
    const startTime = Date.now();
    
    // Step 1: Trigger workers
    console.log('STEP 1/4: Creating worker tasks...');
    await require('./triggerWorkerSystem.cjs');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 2: Process tasks
    console.log('\n\nSTEP 2/4: Processing tasks...');
    await require('./processTasksManually.cjs');
    
    // Step 3: Re-enrich all
    console.log('\n\nSTEP 3/4: Enriching all jobs...');
    await require('./reEnrichAllJobs.cjs');
    
    // Step 4: Clean HTML
    console.log('\n\nSTEP 4/4: Cleaning HTML entities...');
    await require('./decodeHTMLEntities.cjs');
    
    const duration = Math.round((Date.now() - startTime) / 1000 / 60);
    
    console.log('\n' + '='.repeat(70));
    console.log('🎉 COMPLETE! ALL DONE!');
    console.log('='.repeat(70));
    console.log(`\n⏱️  Total time: ${duration} minutes`);
    console.log('\n✅ Jobs are ready on your JobBoard!\n');
}

main().catch(e => {
    console.error('Error:', e);
    process.exit(1);
});

