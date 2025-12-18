/**
 * Backfill Jobs V5.0 - Migration Script
 * 
 * Re-enriches existing jobs with:
 * - V5.0 role function classification (with GPT fallback)
 * - Embeddings generation for semantic matching
 * - Updated enrichment quality scoring
 * 
 * Run with: firebase functions:call backfillJobsV5Manual --data '{"batchSize": 100}'
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { generateEmbedding } from './utils/embeddings';
import { 
    extractRoleFunctionSmart,
    extractLanguageRequirements,
    extractTechnologyTags,
    extractIndustryTags,
    extractSkillTags,
    extractExperienceLevel,
    extractWorkLocation,
    extractEmploymentType,
    calculateEnrichmentQuality,
    JobDoc
} from './utils/jobEnrichment';

const REGION = 'us-central1';

interface BackfillStats {
    processed: number;
    enriched: number;
    embeddingsGenerated: number;
    errors: number;
    skipped: number;
}

/**
 * Build text for job embedding (same as in generateJobEmbedding.ts)
 */
function buildJobTextForEmbedding(job: any): string {
    const parts: string[] = [];
    
    parts.push(`Job Title: ${job.title || 'Unknown'}`);
    parts.push(`Company: ${job.company || 'Unknown'}`);
    
    if (job.roleFunction && job.roleFunction !== 'other') {
        parts.push(`Function: ${job.roleFunction}`);
    }
    if (job.seniority) {
        parts.push(`Level: ${job.seniority}`);
    }
    if (job.location) {
        parts.push(`Location: ${job.location}`);
    }
    if (job.technologies?.length) {
        parts.push(`Technologies: ${job.technologies.slice(0, 20).join(', ')}`);
    }
    if (job.skills?.length) {
        parts.push(`Skills Required: ${job.skills.slice(0, 15).join(', ')}`);
    }
    if (job.industries?.length) {
        parts.push(`Industries: ${job.industries.join(', ')}`);
    }
    if (job.description) {
        const cleanDesc = job.description
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 3000);
        parts.push(`Description:\n${cleanDesc}`);
    }
    
    return parts.join('\n\n');
}

/**
 * Process a single job for V5.0 enrichment
 */
async function processJobV5(
    jobRef: admin.firestore.DocumentReference,
    jobData: any,
    stats: BackfillStats,
    generateEmbeddings: boolean = true
): Promise<void> {
    try {
        const updates: Record<string, any> = {};
        
        // Extract V5.0 role function (with GPT fallback)
        const roleFunction = await extractRoleFunctionSmart(jobData as JobDoc);
        updates.roleFunction = roleFunction;
        
        // Extract other enrichment data
        const experienceLevels = extractExperienceLevel(jobData);
        const employmentTypes = extractEmploymentType(jobData, experienceLevels);
        const workLocations = extractWorkLocation(jobData);
        const industries = extractIndustryTags(jobData);
        const technologies = extractTechnologyTags(jobData);
        const skills = extractSkillTags(jobData);
        const languageRequirements = extractLanguageRequirements(jobData);
        
        // Calculate enrichment quality
        const enrichmentQuality = calculateEnrichmentQuality({
            technologies,
            industries,
            skills,
            roleFunction,
            experienceLevels,
            workLocations,
        });
        
        // Update all fields
        updates.experienceLevels = experienceLevels;
        updates.employmentTypes = employmentTypes;
        updates.workLocations = workLocations;
        updates.industries = industries;
        updates.technologies = technologies;
        updates.skills = skills;
        updates.languageRequirements = languageRequirements;
        updates.enrichmentQuality = enrichmentQuality;
        
        // Backwards compatibility
        updates.type = employmentTypes[0] || 'full-time';
        updates.remote = workLocations.includes('remote') ? 'remote' : workLocations[0] || 'on-site';
        updates.seniority = experienceLevels[0] || 'mid';
        
        // Generate embedding if requested and not exists
        if (generateEmbeddings && (!jobData.embedding || jobData.embedding.length === 0)) {
            try {
                const text = buildJobTextForEmbedding({ ...jobData, ...updates });
                const embedding = await generateEmbedding(text);
                updates.embedding = embedding;
                updates.jobEmbeddingUpdatedAt = new Date().toISOString();
                stats.embeddingsGenerated++;
            } catch (embedError) {
                console.error(`Failed to generate embedding for ${jobRef.id}:`, embedError);
            }
        }
        
        // Mark as V5.0 enriched
        updates.enrichedAt = admin.firestore.FieldValue.serverTimestamp();
        updates.enrichedVersion = '5.0';
        
        await jobRef.update(updates);
        stats.enriched++;
        
        console.log(`✅ Enriched job ${jobRef.id}: ${jobData.title} (${roleFunction})`);
        
    } catch (error) {
        console.error(`❌ Error processing job ${jobRef.id}:`, error);
        stats.errors++;
    }
}

/**
 * Manual trigger for backfill
 */
export const backfillJobsV5Manual = onRequest({
    region: REGION,
    cors: true,
    timeoutSeconds: 540, // 9 minutes max
    memory: '1GiB',
    invoker: 'public',
}, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    
    const db = admin.firestore();
    const batchSize = parseInt(req.query.batchSize as string || req.body?.batchSize || '100');
    const generateEmbeddings = req.query.embeddings !== 'false' && req.body?.embeddings !== false;
    const forceReenrich = req.query.force === 'true' || req.body?.force === true;
    const daysBack = parseInt(req.query.daysBack as string || req.body?.daysBack || '30');
    
    console.log('🚀 Starting V5.0 Job Backfill...');
    console.log(`   Batch size: ${batchSize}`);
    console.log(`   Generate embeddings: ${generateEmbeddings}`);
    console.log(`   Force re-enrich: ${forceReenrich}`);
    console.log(`   Days back: ${daysBack}`);
    
    const stats: BackfillStats = {
        processed: 0,
        enriched: 0,
        embeddingsGenerated: 0,
        errors: 0,
        skipped: 0,
    };
    
    try {
        // Get jobs from the last N days
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);
        
        let query = db.collection('jobs')
            .where('postedAt', '>=', cutoffDate)
            .orderBy('postedAt', 'desc')
            .limit(batchSize);
        
        // If not forcing, only get jobs not yet enriched with V5.0
        if (!forceReenrich) {
            query = db.collection('jobs')
                .where('postedAt', '>=', cutoffDate)
                .where('enrichedVersion', '!=', '5.0')
                .orderBy('enrichedVersion')
                .orderBy('postedAt', 'desc')
                .limit(batchSize);
        }
        
        const snapshot = await db.collection('jobs')
            .where('postedAt', '>=', cutoffDate)
            .orderBy('postedAt', 'desc')
            .limit(batchSize)
            .get();
        
        console.log(`📦 Found ${snapshot.size} jobs to process`);
        
        for (const doc of snapshot.docs) {
            const jobData = doc.data();
            stats.processed++;
            
            // Skip if already V5.0 enriched (unless forcing)
            if (!forceReenrich && jobData.enrichedVersion === '5.0') {
                stats.skipped++;
                continue;
            }
            
            await processJobV5(doc.ref, jobData, stats, generateEmbeddings);
            
            // Rate limit to avoid OpenAI throttling
            if (generateEmbeddings && stats.embeddingsGenerated % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        console.log('\n🎉 V5.0 Backfill Complete!');
        console.log(`   Processed: ${stats.processed}`);
        console.log(`   Enriched: ${stats.enriched}`);
        console.log(`   Embeddings generated: ${stats.embeddingsGenerated}`);
        console.log(`   Skipped: ${stats.skipped}`);
        console.log(`   Errors: ${stats.errors}`);
        
        res.status(200).json({
            success: true,
            message: 'V5.0 Backfill complete',
            stats
        });
        
    } catch (error: any) {
        console.error('❌ Backfill failed:', error);
        res.status(500).json({
            success: false,
            message: 'Backfill failed',
            error: error.message,
            stats
        });
    }
});

/**
 * Backfill user embeddings
 */
export const backfillUserEmbeddings = onRequest({
    region: REGION,
    cors: true,
    timeoutSeconds: 540,
    memory: '1GiB',
    invoker: 'public',
}, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    
    const db = admin.firestore();
    const batchSize = parseInt(req.query.batchSize as string || req.body?.batchSize || '50');
    
    console.log('🚀 Starting User Embeddings Backfill...');
    
    const stats = {
        processed: 0,
        generated: 0,
        skipped: 0,
        errors: 0,
    };
    
    try {
        // Get users without embeddings who have profile data
        const usersSnapshot = await db.collection('users')
            .limit(batchSize)
            .get();
        
        console.log(`📦 Found ${usersSnapshot.size} users to process`);
        
        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();
            stats.processed++;
            
            // Skip if already has embedding
            if (userData.embedding && userData.embedding.length > 0) {
                stats.skipped++;
                continue;
            }
            
            // Skip if insufficient profile data
            const hasData = 
                (userData.skills?.length || 0) > 0 ||
                (userData.tools?.length || 0) > 0 ||
                (userData.professionalHistory?.length || 0) > 0 ||
                userData.targetPosition;
            
            if (!hasData) {
                stats.skipped++;
                continue;
            }
            
            try {
                // Build profile text
                const parts: string[] = [];
                if (userData.targetPosition) parts.push(`Target: ${userData.targetPosition}`);
                if (userData.skills?.length) parts.push(`Skills: ${userData.skills.join(', ')}`);
                if (userData.tools?.length) parts.push(`Tools: ${userData.tools.join(', ')}`);
                if (userData.professionalHistory?.length) {
                    const historyText = userData.professionalHistory.slice(0, 3).map((exp: any) => 
                        `${exp.title} at ${exp.company}`
                    ).join('; ');
                    parts.push(`Experience: ${historyText}`);
                }
                if (userData.targetSectors?.length) parts.push(`Sectors: ${userData.targetSectors.join(', ')}`);
                
                const text = parts.join('\n');
                const embedding = await generateEmbedding(text);
                
                await doc.ref.update({
                    embedding,
                    profileEmbeddingUpdatedAt: new Date().toISOString()
                });
                
                stats.generated++;
                console.log(`✅ Generated embedding for user ${doc.id}`);
                
            } catch (error) {
                console.error(`❌ Error processing user ${doc.id}:`, error);
                stats.errors++;
            }
            
            // Rate limit
            if (stats.generated % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        console.log('\n🎉 User Embeddings Backfill Complete!');
        console.log(`   Processed: ${stats.processed}`);
        console.log(`   Generated: ${stats.generated}`);
        console.log(`   Skipped: ${stats.skipped}`);
        console.log(`   Errors: ${stats.errors}`);
        
        res.status(200).json({
            success: true,
            message: 'User embeddings backfill complete',
            stats
        });
        
    } catch (error: any) {
        console.error('❌ Backfill failed:', error);
        res.status(500).json({
            success: false,
            message: 'Backfill failed',
            error: error.message
        });
    }
});











