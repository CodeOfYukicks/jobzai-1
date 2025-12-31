"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchTeamtailor = exports.fetchGAFAMManual = exports.fetchAllBigTechAndEnterprise = exports.fetchAllEnterprise = exports.fetchCapgeminiJobs = exports.fetchDeloitteJobs = exports.fetchAccentureJobs = exports.fetchOracleJobs = exports.fetchSAPJobs = exports.fetchSalesforceJobs = exports.fetchAllGAFAM = exports.fetchMicrosoftJobs = exports.fetchAppleJobs = exports.fetchAmazonJobs = exports.fetchMetaCareers = exports.fetchGoogleCareers = exports.fetchAggregatorsManual = exports.fetchFromAggregators = exports.activateDiscoveredCompany = exports.getDiscoveredCompanies = exports.manualDiscovery = exports.scheduledDiscovery = exports.previewApolloSearch = exports.enrichApolloContact = exports.searchApolloContacts = exports.getDatabaseStats = exports.manualCleanup = exports.scheduledCleanup = exports.processDynamicBatch = exports.retryFailedTasks = exports.processTaskManual = exports.processFetchTask = exports.getQueueStatus = exports.createFetchTasksManual = exports.createFetchTasks = exports.enrichSkillsWorker = exports.fetchJobsWorker = exports.scheduleFetchJobs = exports.backfillUserEmbeddings = exports.backfillJobsV5Manual = exports.getUserInteractionStats = exports.getSavedJobs = exports.trackJobInteraction = exports.getMatchedJobs = exports.matchJobsForUsers = exports.generateUserEmbedding = exports.updateJobEmbeddingOnEnrichment = exports.generateJobEmbedding = exports.fetchGAFAMEnterprise = exports.fetchJobsFromATS = void 0;
exports.api = exports.generateQuestions = exports.createPortalSession = exports.downloadCV = exports.searchJobs = exports.processStripeSession = exports.stripeWebhook = exports.createCheckoutSession = exports.sendHubSpotEventFunction = exports.syncUserToHubSpot = exports.syncUserToBrevo = exports.analyzeResumePremium = exports.analyzeCVVision = exports.updateCampaignEmails = exports.startCampaign = exports.assistant = exports.reEnrichAllJobsV4 = exports.enrichSingleJob = exports.enrichJobsManual = exports.testNewFunction = exports.queueStatus = exports.testFetchTask = exports.fetchAggregators = exports.cleanupJobs = exports.dbStats = exports.runDynamicBatch = exports.fetchJobsBatch4 = exports.fetchJobsBatch3 = exports.fetchJobsBatch2 = exports.fetchJobsBatch1 = exports.masterTrigger = exports.fetchAllAdditionalATS = exports.fetchWorkable = exports.fetchPersonio = exports.fetchRecruitee = exports.fetchBreezyHR = void 0;
// Version 3.0 - Scalable Queue-based Architecture (Dec 2025)
// Supports 1000+ companies with distributed task processing
const admin = require("firebase-admin");
if (!admin.apps.length) {
    admin.initializeApp();
}
var fetchJobs_1 = require("./fetchJobs");
Object.defineProperty(exports, "fetchJobsFromATS", { enumerable: true, get: function () { return fetchJobs_1.fetchJobsFromATS; } });
var fetchGAFAMEnterprise_1 = require("./fetchGAFAMEnterprise");
Object.defineProperty(exports, "fetchGAFAMEnterprise", { enumerable: true, get: function () { return fetchGAFAMEnterprise_1.fetchGAFAMEnterprise; } });
var generateJobEmbedding_1 = require("./generateJobEmbedding");
Object.defineProperty(exports, "generateJobEmbedding", { enumerable: true, get: function () { return generateJobEmbedding_1.generateJobEmbedding; } });
Object.defineProperty(exports, "updateJobEmbeddingOnEnrichment", { enumerable: true, get: function () { return generateJobEmbedding_1.updateJobEmbeddingOnEnrichment; } });
var generateUserEmbedding_1 = require("./generateUserEmbedding");
Object.defineProperty(exports, "generateUserEmbedding", { enumerable: true, get: function () { return generateUserEmbedding_1.generateUserEmbedding; } });
var matchJobsForUsers_1 = require("./matchJobsForUsers");
Object.defineProperty(exports, "matchJobsForUsers", { enumerable: true, get: function () { return matchJobsForUsers_1.matchJobsForUsers; } });
var getMatchedJobs_1 = require("./getMatchedJobs");
Object.defineProperty(exports, "getMatchedJobs", { enumerable: true, get: function () { return getMatchedJobs_1.getMatchedJobs; } });
// 📊 USER JOB INTERACTIONS (V5.0 - Feedback Loop)
// Track user interactions for improved matching
var trackJobInteraction_1 = require("./trackJobInteraction");
Object.defineProperty(exports, "trackJobInteraction", { enumerable: true, get: function () { return trackJobInteraction_1.trackJobInteraction; } });
Object.defineProperty(exports, "getSavedJobs", { enumerable: true, get: function () { return trackJobInteraction_1.getSavedJobs; } });
Object.defineProperty(exports, "getUserInteractionStats", { enumerable: true, get: function () { return trackJobInteraction_1.getUserInteractionStats; } });
// 🔄 BACKFILL & MIGRATION (V5.0)
// Re-enrich jobs with new fields and generate embeddings
var backfillJobsV5_1 = require("./backfillJobsV5");
Object.defineProperty(exports, "backfillJobsV5Manual", { enumerable: true, get: function () { return backfillJobsV5_1.backfillJobsV5Manual; } });
Object.defineProperty(exports, "backfillUserEmbeddings", { enumerable: true, get: function () { return backfillJobsV5_1.backfillUserEmbeddings; } });
// 🚀 NEW: Queue-based ATS job fetching architecture
// Scalable, fault-tolerant system for fetching jobs from multiple ATS sources
var fetchJobsScheduler_1 = require("./schedulers/fetchJobsScheduler");
Object.defineProperty(exports, "scheduleFetchJobs", { enumerable: true, get: function () { return fetchJobsScheduler_1.scheduleFetchJobs; } });
var fetchJobsWorker_1 = require("./workers/fetchJobsWorker");
Object.defineProperty(exports, "fetchJobsWorker", { enumerable: true, get: function () { return fetchJobsWorker_1.fetchJobsWorker; } });
var enrichSkillsWorker_1 = require("./workers/enrichSkillsWorker");
Object.defineProperty(exports, "enrichSkillsWorker", { enumerable: true, get: function () { return enrichSkillsWorker_1.enrichSkillsWorker; } });
// 🎯 DISTRIBUTED QUEUE SYSTEM (Scale to 100K+ jobs)
// Modern queue-based architecture with automatic retry and monitoring
var queue_1 = require("./queue");
Object.defineProperty(exports, "createFetchTasks", { enumerable: true, get: function () { return queue_1.createFetchTasks; } });
Object.defineProperty(exports, "createFetchTasksManual", { enumerable: true, get: function () { return queue_1.createFetchTasksManual; } });
Object.defineProperty(exports, "getQueueStatus", { enumerable: true, get: function () { return queue_1.getQueueStatus; } });
Object.defineProperty(exports, "processFetchTask", { enumerable: true, get: function () { return queue_1.processFetchTask; } });
Object.defineProperty(exports, "processTaskManual", { enumerable: true, get: function () { return queue_1.processTaskManual; } });
Object.defineProperty(exports, "retryFailedTasks", { enumerable: true, get: function () { return queue_1.retryFailedTasks; } });
// 🔄 DYNAMIC BATCH PROCESSOR (replaces hardcoded batches)
// Automatically distributes 500+ companies across providers
var dynamicBatchProcessor_1 = require("./dynamicBatchProcessor");
Object.defineProperty(exports, "processDynamicBatch", { enumerable: true, get: function () { return dynamicBatchProcessor_1.processDynamicBatch; } });
// 🧹 MAINTENANCE & CLEANUP
// Database cleanup, TTL, and statistics
var maintenance_1 = require("./maintenance");
Object.defineProperty(exports, "scheduledCleanup", { enumerable: true, get: function () { return maintenance_1.scheduledCleanup; } });
Object.defineProperty(exports, "manualCleanup", { enumerable: true, get: function () { return maintenance_1.manualCleanup; } });
Object.defineProperty(exports, "getDatabaseStats", { enumerable: true, get: function () { return maintenance_1.getDatabaseStats; } });
// 🚀 APOLLO LEAD SOURCING
// Search and enrich contacts from Apollo.io
// NOTE: Using explicit import/export pattern for Firebase CLI compatibility
const apollo_1 = require("./apollo");
exports.searchApolloContacts = apollo_1.searchApolloContacts;
exports.enrichApolloContact = apollo_1.enrichApolloContact;
exports.previewApolloSearch = apollo_1.previewApolloSearch;
// 🔍 COMPANY DISCOVERY
// Automatic discovery of new companies from ATS sitemaps
var discovery_1 = require("./discovery");
Object.defineProperty(exports, "scheduledDiscovery", { enumerable: true, get: function () { return discovery_1.scheduledDiscovery; } });
Object.defineProperty(exports, "manualDiscovery", { enumerable: true, get: function () { return discovery_1.manualDiscovery; } });
Object.defineProperty(exports, "getDiscoveredCompanies", { enumerable: true, get: function () { return discovery_1.getDiscoveredCompanies; } });
Object.defineProperty(exports, "activateDiscoveredCompany", { enumerable: true, get: function () { return discovery_1.activateDiscoveredCompany; } });
// 🌐 JOB AGGREGATORS
// External job aggregators (RemoteOK, WeWorkRemotely, Adzuna, HN Who's Hiring, etc.)
var aggregators_1 = require("./aggregators");
Object.defineProperty(exports, "fetchFromAggregators", { enumerable: true, get: function () { return aggregators_1.fetchFromAggregators; } });
Object.defineProperty(exports, "fetchAggregatorsManual", { enumerable: true, get: function () { return aggregators_1.fetchAggregatorsManual; } });
// 🏢 GAFAM + ENTERPRISE DIRECT FETCHERS
// Dedicated fetchers for Big Tech (Google, Meta, Amazon, Apple, Microsoft)
// and Enterprise Consulting (Salesforce, Accenture, Deloitte, Capgemini, SAP, Oracle)
var gafamFetchers_1 = require("./utils/gafamFetchers");
// GAFAM / MAANG
Object.defineProperty(exports, "fetchGoogleCareers", { enumerable: true, get: function () { return gafamFetchers_1.fetchGoogleCareers; } });
Object.defineProperty(exports, "fetchMetaCareers", { enumerable: true, get: function () { return gafamFetchers_1.fetchMetaCareers; } });
Object.defineProperty(exports, "fetchAmazonJobs", { enumerable: true, get: function () { return gafamFetchers_1.fetchAmazonJobs; } });
Object.defineProperty(exports, "fetchAppleJobs", { enumerable: true, get: function () { return gafamFetchers_1.fetchAppleJobs; } });
Object.defineProperty(exports, "fetchMicrosoftJobs", { enumerable: true, get: function () { return gafamFetchers_1.fetchMicrosoftJobs; } });
Object.defineProperty(exports, "fetchAllGAFAM", { enumerable: true, get: function () { return gafamFetchers_1.fetchAllGAFAM; } });
// Enterprise Tech
Object.defineProperty(exports, "fetchSalesforceJobs", { enumerable: true, get: function () { return gafamFetchers_1.fetchSalesforceJobs; } });
Object.defineProperty(exports, "fetchSAPJobs", { enumerable: true, get: function () { return gafamFetchers_1.fetchSAPJobs; } });
Object.defineProperty(exports, "fetchOracleJobs", { enumerable: true, get: function () { return gafamFetchers_1.fetchOracleJobs; } });
// Enterprise Consulting
Object.defineProperty(exports, "fetchAccentureJobs", { enumerable: true, get: function () { return gafamFetchers_1.fetchAccentureJobs; } });
Object.defineProperty(exports, "fetchDeloitteJobs", { enumerable: true, get: function () { return gafamFetchers_1.fetchDeloitteJobs; } });
Object.defineProperty(exports, "fetchCapgeminiJobs", { enumerable: true, get: function () { return gafamFetchers_1.fetchCapgeminiJobs; } });
// Aggregated
Object.defineProperty(exports, "fetchAllEnterprise", { enumerable: true, get: function () { return gafamFetchers_1.fetchAllEnterprise; } });
Object.defineProperty(exports, "fetchAllBigTechAndEnterprise", { enumerable: true, get: function () { return gafamFetchers_1.fetchAllBigTechAndEnterprise; } });
// Manual HTTP endpoint
Object.defineProperty(exports, "fetchGAFAMManual", { enumerable: true, get: function () { return gafamFetchers_1.fetchGAFAMManual; } });
// 📋 ADDITIONAL ATS FETCHERS
// European and SMB ATS platforms (Teamtailor, BreezyHR, Recruitee, Personio, Workable)
var additionalATSFetchers_1 = require("./utils/additionalATSFetchers");
Object.defineProperty(exports, "fetchTeamtailor", { enumerable: true, get: function () { return additionalATSFetchers_1.fetchTeamtailor; } });
Object.defineProperty(exports, "fetchBreezyHR", { enumerable: true, get: function () { return additionalATSFetchers_1.fetchBreezyHR; } });
Object.defineProperty(exports, "fetchRecruitee", { enumerable: true, get: function () { return additionalATSFetchers_1.fetchRecruitee; } });
Object.defineProperty(exports, "fetchPersonio", { enumerable: true, get: function () { return additionalATSFetchers_1.fetchPersonio; } });
Object.defineProperty(exports, "fetchWorkable", { enumerable: true, get: function () { return additionalATSFetchers_1.fetchWorkable; } });
Object.defineProperty(exports, "fetchAllAdditionalATS", { enumerable: true, get: function () { return additionalATSFetchers_1.fetchAllAdditionalATS; } });
// 🤖 LEGACY: Master + Batch Architecture (kept for backwards compatibility)
// Will be deprecated in favor of the distributed queue system
var masterTrigger_1 = require("./masterTrigger");
Object.defineProperty(exports, "masterTrigger", { enumerable: true, get: function () { return masterTrigger_1.masterTrigger; } });
var fetchJobsBatch1_1 = require("./batches/fetchJobsBatch1");
Object.defineProperty(exports, "fetchJobsBatch1", { enumerable: true, get: function () { return fetchJobsBatch1_1.fetchJobsBatch1; } });
var fetchJobsBatch2_1 = require("./batches/fetchJobsBatch2");
Object.defineProperty(exports, "fetchJobsBatch2", { enumerable: true, get: function () { return fetchJobsBatch2_1.fetchJobsBatch2; } });
var fetchJobsBatch3_1 = require("./batches/fetchJobsBatch3");
Object.defineProperty(exports, "fetchJobsBatch3", { enumerable: true, get: function () { return fetchJobsBatch3_1.fetchJobsBatch3; } });
var fetchJobsBatch4_1 = require("./batches/fetchJobsBatch4");
Object.defineProperty(exports, "fetchJobsBatch4", { enumerable: true, get: function () { return fetchJobsBatch4_1.fetchJobsBatch4; } });
// 🧪 TEST: Manual HTTP endpoint for testing Workday fetcher
// export { testFetchWorkday } from './test/testFetchWorkday';
// ============================================
// 🚀 DIRECT EXPORTS - Force Firebase to detect these
// ============================================
const dynamicBatchProcessor_2 = require("./dynamicBatchProcessor");
const maintenance_2 = require("./maintenance");
const aggregators_2 = require("./aggregators");
const queue_2 = require("./queue");
// Re-export with explicit names
exports.runDynamicBatch = dynamicBatchProcessor_2.processDynamicBatch;
exports.dbStats = maintenance_2.getDatabaseStats;
exports.cleanupJobs = maintenance_2.manualCleanup;
exports.fetchAggregators = aggregators_2.fetchAggregatorsManual;
exports.testFetchTask = queue_2.processTaskManual;
exports.queueStatus = queue_2.getQueueStatus;
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
const https_1 = require("firebase-functions/v2/https");
// admin already imported and initialized above
// Test function to verify deployment works
exports.testNewFunction = (0, https_1.onRequest)({
    region: 'us-central1',
    cors: true,
    invoker: 'public'
}, async (req, res) => {
    res.status(200).json({ message: 'Test function works!', timestamp: new Date().toISOString() });
});
// ==================== Job Enrichment Functions ====================
var enrichJobFunctions_1 = require("./enrichJobFunctions");
Object.defineProperty(exports, "enrichJobsManual", { enumerable: true, get: function () { return enrichJobFunctions_1.enrichJobsManual; } });
Object.defineProperty(exports, "enrichSingleJob", { enumerable: true, get: function () { return enrichJobFunctions_1.enrichSingleJob; } });
Object.defineProperty(exports, "reEnrichAllJobsV4", { enumerable: true, get: function () { return enrichJobFunctions_1.reEnrichAllJobsV4; } });
var assistant_1 = require("./assistant");
Object.defineProperty(exports, "assistant", { enumerable: true, get: function () { return assistant_1.assistant; } });
const mailgun_js_1 = require("./lib/mailgun.js");
const functions = require("firebase-functions");
const stripe_1 = require("stripe");
// Firebase Admin already initialized at top
// CORS helper function - robust solution for CORS handling
const handleCORS = (req, res, next) => {
    // Set CORS headers
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '3600');
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        console.log('✅ Handling OPTIONS preflight request from origin:', origin);
        res.status(204).end();
        return;
    }
    next();
};
const openai_1 = require("./utils/openai");
exports.startCampaign = (0, https_1.onCall)({
    region: 'us-central1',
}, async (request) => {
    console.log("Function called with data:", request.data);
    console.log("Auth context:", request.auth);
    if (!request.auth) {
        console.error("No auth found in request");
        throw new Error("Authentication required");
    }
    try {
        const { campaignId } = request.data;
        const userId = request.auth.uid;
        console.log("Processing request for:", { campaignId, userId });
        // Récupérer la campagne
        const campaignRef = admin.firestore()
            .collection("users")
            .doc(userId)
            .collection("campaigns")
            .doc(campaignId);
        console.log("Fetching campaign data...");
        const campaignSnap = await campaignRef.get();
        const campaign = campaignSnap.data();
        console.log("Campaign data:", campaign);
        if (!campaign) {
            console.error("Campaign not found:", campaignId);
            throw new Error("Campaign not found");
        }
        // 2. Trouver les targets correspondantes (industry)
        const targetsRef = admin.firestore().collection('targets');
        const matchingTargets = await targetsRef
            .where('industry', '==', campaign.industry)
            .get();
        console.log(`Found ${matchingTargets.size} matching targets for industry: ${campaign.industry}`);
        // 3. Préparer et envoyer les emails
        const emailPromises = matchingTargets.docs.map(async (targetDoc) => {
            const target = targetDoc.data();
            // Personnaliser le contenu
            const personalizedContent = campaign.template.content
                .replace(/\{\{entreprise\}\}/g, target.company)
                .replace(/\{\{poste\}\}/g, campaign.jobTitle)
                .replace(/\{\{region\}\}/g, target.location || campaign.location);
            // Envoyer l'email
            try {
                await mailgun_js_1.emailService.sendEmail(target.email, campaign.template.subject, personalizedContent, `JobZ.AI <no-reply@${process.env.MAILGUN_DOMAIN}>`);
                // Enregistrer l'envoi
                await campaignRef.collection('emails').add({
                    targetId: targetDoc.id,
                    status: 'sent',
                    sentAt: admin.firestore.FieldValue.serverTimestamp(),
                    emailContent: personalizedContent,
                    to: target.email,
                    subject: campaign.template.subject
                });
                return { success: true, targetId: targetDoc.id };
            }
            catch (error) {
                console.error(`Failed to send email to ${target.email}:`, error);
                return { success: false, targetId: targetDoc.id, error };
            }
        });
        const results = await Promise.all(emailPromises);
        // 4. Mettre à jour le statut de la campagne
        await campaignRef.update({
            status: 'active',
            startedAt: admin.firestore.FieldValue.serverTimestamp(),
            emailsSent: results.filter(r => r.success).length,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
        return {
            success: true,
            message: `Campaign started successfully. Sent ${results.filter(r => r.success).length} emails.`
        };
    }
    catch (error) {
        console.error("Detailed error in startCampaign:", {
            error,
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined
        });
        throw new Error(error instanceof Error ? error.message : "Failed to start campaign");
    }
});
exports.updateCampaignEmails = (0, https_1.onRequest)({
    region: 'us-central1',
    cors: true,
}, async (req, res) => {
    // Définir explicitement les headers
    res.setHeader('Content-Type', 'application/json');
    try {
        // Vérifier la méthode HTTP
        if (req.method !== 'POST') {
            res.status(405).json({
                success: false,
                error: "Method not allowed"
            });
            return;
        }
        // Vérifier le Content-Type
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('application/json')) {
            res.status(400).json({
                success: false,
                error: "Content-Type must be application/json"
            });
            return;
        }
        // Log de la requête complète
        console.log("Headers:", req.headers);
        console.log("Raw body:", req.body);
        // 1. Log de la requête complète
        console.log("Request body received:", req.body);
        // 2. Validation initiale de la structure
        const data = req.body.data || {};
        console.log("Extracted data object:", data);
        // 3. Extraction sécurisée avec valeurs par défaut
        const campaignId = data.campaignId;
        const userId = data.userId;
        const updates = data.updates || {};
        const emailDetails = Array.isArray(data.emailDetails) ? data.emailDetails : [];
        // 4. Validation des champs requis
        if (!data || !campaignId || !userId || !Array.isArray(data.emailDetails)) {
            console.error("Invalid data structure:", {
                hasData: !!data,
                hasCampaignId: !!campaignId,
                hasUserId: !!userId,
                emailDetailsIsArray: Array.isArray(data.emailDetails)
            });
            res.status(400).json({
                success: false,
                error: "Invalid data structure"
            });
            return;
        }
        // 5. Extraction sécurisée des updates
        const { emailsSent = emailDetails.length, responses = 0, status = 'completed' } = updates;
        console.log("Processing campaign update:", {
            campaignId,
            userId,
            emailsCount: emailDetails.length,
            status
        });
        const campaignRef = admin.firestore()
            .collection('users')
            .doc(userId)
            .collection('campaigns')
            .doc(campaignId);
        const campaignDoc = await campaignRef.get();
        if (!campaignDoc.exists) {
            console.error("Campaign not found:", campaignId);
            res.status(404).json({
                success: false,
                error: "Campaign not found"
            });
            return;
        }
        const batch = admin.firestore().batch();
        // Ajouter les emails
        for (const email of emailDetails) {
            const emailRef = campaignRef.collection('emails').doc();
            batch.set(emailRef, {
                to: email.to,
                subject: email.subject,
                content: email.content,
                company: email.company,
                status: 'sent',
                sentAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        // Mettre à jour la campagne
        batch.update(campaignRef, {
            emailsSent: emailsSent || emailDetails.length,
            responses: responses || 0,
            status: status || 'completed',
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
        await batch.commit();
        console.log("Successfully updated campaign:", {
            campaignId,
            emailsProcessed: emailDetails.length
        });
        res.status(200).json({
            success: true,
            emailsProcessed: emailDetails.length
        });
    }
    catch (error) {
        console.error('Error in updateCampaignEmails:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * Handle premium ATS analysis (shared logic)
 */
async function handlePremiumAnalysis(req, res, resumeImages, jobContext, userId, analysisId) {
    var _a, _b, _c;
    try {
        // Validate request
        if (!resumeImages || !Array.isArray(resumeImages) || resumeImages.length === 0) {
            res.status(400).json({
                status: 'error',
                message: 'Resume images are required (array of base64 strings)'
            });
            return;
        }
        if (!jobContext || !jobContext.jobTitle || !jobContext.company || !jobContext.jobDescription) {
            res.status(400).json({
                status: 'error',
                message: 'Job context is required (jobTitle, company, jobDescription)'
            });
            return;
        }
        // Get OpenAI client
        const openaiClient = await (0, openai_1.getOpenAIClient)();
        // Import premium prompt builder
        const { buildPremiumATSPrompt } = await Promise.resolve().then(() => require('./utils/premiumATSPrompt.js'));
        // Build premium prompt
        const promptText = buildPremiumATSPrompt({
            jobTitle: jobContext.jobTitle,
            company: jobContext.company,
            jobDescription: jobContext.jobDescription,
            seniority: jobContext.seniority,
            targetRoles: jobContext.targetRoles,
        });
        console.log('📡 Sending premium analysis request to GPT-4o...');
        // Prepare messages with resume images
        const imageContents = resumeImages.map((base64Image) => ({
            type: 'image_url',
            image_url: {
                url: base64Image.startsWith('data:')
                    ? base64Image
                    : `data:image/jpeg;base64,${base64Image}`
            }
        }));
        // Call OpenAI API with premium prompt - Reverted to GPT-4o (stable)
        const completion = await openaiClient.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are an elite ATS specialist with 25+ years of experience. Return ONLY valid JSON.'
                },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: promptText },
                        ...imageContents
                    ]
                }
            ],
            response_format: { type: 'json_object' },
            max_completion_tokens: 6000,
            temperature: 0.2, // Low for consistency
        });
        console.log('✅ Premium analysis received from GPT-4o');
        const content = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        if (!content) {
            throw new Error('Empty response from GPT-5.1');
        }
        let parsedAnalysis = JSON.parse(content);
        // Debug: Log the structure of parsed analysis
        console.log('📊 Parsed analysis structure:', {
            hasAnalysis: !!parsedAnalysis.analysis,
            analysisKeys: Object.keys(parsedAnalysis.analysis || {})
        });
        // Save to Firestore if userId and analysisId provided
        if (userId && analysisId) {
            // Extract cv_rewrite from analysis if it exists (should not exist anymore after prompt update)
            const _d = parsedAnalysis.analysis || {}, { cv_rewrite, cvText } = _d, analysisWithoutCVRewrite = __rest(_d, ["cv_rewrite", "cvText"]);
            // Extract cvText from analysis (should be extracted by AI during analysis)
            const extractedCvText = cvText || '';
            console.log('💾 Preparing to save to Firestore:', {
                userId,
                analysisId,
                hasCVRewrite: !!cv_rewrite,
                hasCvText: !!extractedCvText,
                cvTextLength: extractedCvText.length,
                hasJobDescription: !!jobContext.jobDescription,
                jobDescriptionLength: ((_c = jobContext.jobDescription) === null || _c === void 0 ? void 0 : _c.length) || 0,
                willExcludeCVRewrite: !!cv_rewrite
            });
            await admin.firestore()
                .collection('users')
                .doc(userId)
                .collection('analyses')
                .doc(analysisId)
                .set(Object.assign(Object.assign({}, analysisWithoutCVRewrite), { id: analysisId, userId, jobTitle: jobContext.jobTitle, company: jobContext.company, jobDescription: jobContext.jobDescription, cvText: extractedCvText, extractedText: extractedCvText, date: admin.firestore.FieldValue.serverTimestamp(), status: 'completed', type: 'premium', matchScore: parsedAnalysis.analysis.match_scores.overall_score }), { merge: true });
            console.log('✅ Successfully saved to Firestore (cv_rewrite excluded, cvText saved)');
        }
        res.status(200).json({
            status: 'success',
            analysis: parsedAnalysis,
            usage: completion.usage,
            analysisId,
        });
    }
    catch (error) {
        console.error('❌ Error in premium analysis:', error);
        // CRITICAL: Always update Firestore to mark analysis as failed
        // This prevents the analysis from staying in loading state forever
        if (userId && analysisId) {
            try {
                await admin.firestore()
                    .collection('users')
                    .doc(userId)
                    .collection('analyses')
                    .doc(analysisId)
                    .set({
                    _isLoading: false,
                    status: 'failed',
                    error: error.message || 'Internal server error',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
                console.log('✅ Marked analysis as failed in Firestore');
            }
            catch (firestoreError) {
                console.error('❌ Failed to update Firestore with error status:', firestoreError);
            }
        }
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error'
        });
    }
}
/**
 * Analyze CV with GPT-4o Vision (also handles premium analysis)
 * Endpoint: POST /api/analyze-cv-vision
 */
exports.analyzeCVVision = (0, https_1.onRequest)({
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 540,
    invoker: 'public', // Allow public access (no authentication required)
}, async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    // Only allow POST
    if (req.method !== 'POST') {
        res.status(405).json({
            status: 'error',
            message: 'Method not allowed'
        });
        return;
    }
    try {
        console.log('🔍 CV Vision analysis request received');
        console.log('   Request method:', req.method);
        console.log('   Request headers:', JSON.stringify(req.headers));
        console.log('   Request body keys:', Object.keys(req.body || {}));
        // Check if this is a premium analysis request
        const { resumeImages, jobContext, userId, analysisId } = req.body;
        if (resumeImages && jobContext) {
            console.log('🎯 Detected premium ATS analysis request, redirecting...');
            // Handle premium analysis inline
            return await handlePremiumAnalysis(req, res, resumeImages, jobContext, userId, analysisId);
        }
        const { model, messages, response_format, max_tokens, max_completion_tokens, temperature } = req.body;
        // Validate request for regular vision analysis
        if (!model || !messages || !Array.isArray(messages)) {
            console.error('Invalid request format:', { model, hasMessages: !!messages });
            res.status(400).json({
                status: 'error',
                message: 'Invalid request format: model and messages array are required'
            });
            return;
        }
        // Get OpenAI client
        let openaiClient;
        try {
            openaiClient = await (0, openai_1.getOpenAIClient)();
        }
        catch (error) {
            console.error('❌ Failed to get OpenAI client:', error);
            console.error('   Error message:', error === null || error === void 0 ? void 0 : error.message);
            console.error('   Error stack:', error === null || error === void 0 ? void 0 : error.stack);
            // Return detailed error for debugging
            const errorMessage = (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error';
            res.status(500).json({
                status: 'error',
                message: `OpenAI API key configuration error: ${errorMessage}. Please check Firestore (settings/openai) document.`,
                details: process.env.NODE_ENV === 'development' ? error === null || error === void 0 ? void 0 : error.stack : undefined
            });
            return;
        }
        console.log('📡 Sending request to GPT-4o Vision API...');
        console.log(`   Model: ${model}`);
        console.log(`   Messages: ${messages.length}`);
        // Count images in messages (content can be string or array)
        let imageCount = 0;
        messages.forEach((msg) => {
            if (Array.isArray(msg.content)) {
                imageCount += msg.content.filter((c) => c.type === 'image_url').length;
            }
        });
        console.log(`   Images: ${imageCount}`);
        // Call OpenAI API - Reverted to GPT-4o (stable)
        const completion = await openaiClient.chat.completions.create({
            model: model || 'gpt-4o',
            messages: messages,
            response_format: response_format || { type: 'json_object' },
            max_completion_tokens: max_completion_tokens || max_tokens || 6000,
            temperature: 0.1, // Low for consistency
        });
        console.log('✅ GPT-4o Vision API response received');
        // Extract content
        const content = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        if (!content) {
            throw new Error('Empty response from GPT-5.1 Vision API');
        }
        // Parse JSON if needed
        let parsedContent;
        try {
            parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
        }
        catch (e) {
            // If parsing fails, try to extract JSON from markdown
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
                content.match(/{[\s\S]*}/);
            if (jsonMatch) {
                parsedContent = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            }
            else {
                throw new Error('Could not parse JSON from response');
            }
        }
        console.log('✅ Analysis completed successfully');
        // Return success response
        res.status(200).json({
            status: 'success',
            content: parsedContent,
            usage: completion.usage
        });
    }
    catch (error) {
        console.error('❌ Error in analyzeCVVision:', error);
        console.error('   Error name:', error === null || error === void 0 ? void 0 : error.name);
        console.error('   Error message:', error === null || error === void 0 ? void 0 : error.message);
        console.error('   Error stack:', error === null || error === void 0 ? void 0 : error.stack);
        console.error('   Error response:', JSON.stringify(((_c = error === null || error === void 0 ? void 0 : error.response) === null || _c === void 0 ? void 0 : _c.data) || {}));
        // Handle OpenAI API errors
        if (error.response) {
            const statusCode = error.response.status || 500;
            const errorMessage = ((_e = (_d = error.response.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.message) || error.message || 'Unknown error';
            console.error(`   OpenAI API error ${statusCode}: ${errorMessage}`);
            res.status(statusCode).json({
                status: 'error',
                message: `OpenAI API error: ${errorMessage}`,
                error: (_f = error.response.data) === null || _f === void 0 ? void 0 : _f.error,
                code: ((_h = (_g = error.response.data) === null || _g === void 0 ? void 0 : _g.error) === null || _h === void 0 ? void 0 : _h.code) || 'unknown'
            });
            return;
        }
        // Handle other errors with more details
        const errorDetails = Object.assign({ status: 'error', message: error.message || 'Internal server error', errorType: error.constructor.name }, (process.env.NODE_ENV === 'development' && { stack: error.stack }));
        console.error('   Returning error response:', JSON.stringify(errorDetails));
        res.status(500).json(errorDetails);
    }
});
/**
 * Premium ATS Analysis with comprehensive JSON structure
 * Endpoint: POST /api/analyze-cv-premium
 */
exports.analyzeResumePremium = (0, https_1.onRequest)({
    region: 'us-central1',
    cors: [/localhost:\d+/, /\.web\.app$/, /\.firebaseapp\.com$/],
    maxInstances: 10,
    timeoutSeconds: 540,
    invoker: 'public',
}, async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    // Only allow POST
    if (req.method !== 'POST') {
        res.status(405).json({
            status: 'error',
            message: 'Method not allowed'
        });
        return;
    }
    // Extract userId and analysisId before try block so they're available in catch
    const { resumeImages, jobContext, userId, analysisId } = req.body;
    try {
        console.log('🎯 Premium ATS analysis request received');
        // Validate request
        if (!resumeImages || !Array.isArray(resumeImages) || resumeImages.length === 0) {
            res.status(400).json({
                status: 'error',
                message: 'Resume images are required (array of base64 strings)'
            });
            return;
        }
        if (!jobContext || !jobContext.jobTitle || !jobContext.company || !jobContext.jobDescription) {
            res.status(400).json({
                status: 'error',
                message: 'Job context is required (jobTitle, company, jobDescription)'
            });
            return;
        }
        // Get OpenAI client
        let openaiClient;
        try {
            openaiClient = await (0, openai_1.getOpenAIClient)();
        }
        catch (error) {
            console.error('❌ Failed to get OpenAI client:', error);
            res.status(500).json({
                status: 'error',
                message: `OpenAI API key configuration error: ${(error === null || error === void 0 ? void 0 : error.message) || 'Unknown error'}`
            });
            return;
        }
        // Import premium prompt builder
        const { buildPremiumATSPrompt } = await Promise.resolve().then(() => require('./utils/premiumATSPrompt.js'));
        // Build premium prompt
        const promptText = buildPremiumATSPrompt({
            jobTitle: jobContext.jobTitle,
            company: jobContext.company,
            jobDescription: jobContext.jobDescription,
            seniority: jobContext.seniority,
            targetRoles: jobContext.targetRoles,
        });
        console.log('📡 Sending premium analysis request to GPT-4o...');
        console.log(`   Resume images: ${resumeImages.length}`);
        console.log(`   Job: ${jobContext.jobTitle} at ${jobContext.company}`);
        // Prepare messages with resume images
        const imageContents = resumeImages.map((base64Image) => ({
            type: 'image_url',
            image_url: {
                url: base64Image.startsWith('data:')
                    ? base64Image
                    : `data:image/jpeg;base64,${base64Image}`
            }
        }));
        // Call OpenAI API with premium prompt - Reverted to GPT-4o (stable)
        const completion = await openaiClient.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are an elite ATS specialist with 25+ years of experience. You combine senior hiring manager expertise, Apple-grade UX writing, and McKinsey-level strategic thinking. Return ONLY valid JSON, no markdown.'
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: promptText
                        },
                        ...imageContents
                    ]
                }
            ],
            response_format: { type: 'json_object' },
            max_completion_tokens: 6000,
            temperature: 0.2, // Low for consistency
        });
        console.log('✅ Premium analysis received from GPT-4o');
        // Extract and parse content
        const content = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        if (!content) {
            throw new Error('Empty response from GPT-5.1');
        }
        let parsedAnalysis;
        try {
            parsedAnalysis = typeof content === 'string' ? JSON.parse(content) : content;
        }
        catch (e) {
            // Try to extract JSON from markdown if parsing fails
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
                content.match(/{[\s\S]*}/);
            if (jsonMatch) {
                parsedAnalysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            }
            else {
                throw new Error('Could not parse JSON from response');
            }
        }
        // Save analysis to Firestore if userId and analysisId provided
        if (userId && analysisId) {
            console.log(`💾 Saving premium analysis to Firestore: users/${userId}/analyses/${analysisId}`);
            // Extract cv_rewrite from analysis if it exists (should not exist anymore after prompt update)
            const _j = parsedAnalysis.analysis || {}, { cv_rewrite, cvText } = _j, analysisWithoutCVRewrite = __rest(_j, ["cv_rewrite", "cvText"]);
            // Extract cvText from analysis (should be extracted by AI during analysis)
            const extractedCvText = cvText || '';
            await admin.firestore()
                .collection('users')
                .doc(userId)
                .collection('analyses')
                .doc(analysisId)
                .set(Object.assign(Object.assign({}, analysisWithoutCVRewrite), { id: analysisId, userId, jobTitle: jobContext.jobTitle, company: jobContext.company, location: jobContext.location || null, jobUrl: jobContext.jobUrl || null, jobDescription: jobContext.jobDescription, cvText: extractedCvText, extractedText: extractedCvText, date: admin.firestore.FieldValue.serverTimestamp(), status: 'completed', type: 'premium', _isLoading: false, 
                // Store match score at top level for easy querying
                matchScore: parsedAnalysis.analysis.match_scores.overall_score, category: parsedAnalysis.analysis.match_scores.category, 
                // Store key data for list views
                keyFindings: parsedAnalysis.analysis.executive_summary, categoryScores: {
                    skills: parsedAnalysis.analysis.match_scores.skills_score,
                    experience: parsedAnalysis.analysis.match_scores.experience_score,
                    education: parsedAnalysis.analysis.match_scores.education_score,
                    industryFit: parsedAnalysis.analysis.match_scores.industry_fit_score,
                } }), { merge: true });
            console.log('✅ Premium analysis saved to Firestore (cv_rewrite excluded, cvText saved)');
        }
        console.log('✅ Premium analysis completed successfully');
        // Return success response
        res.status(200).json({
            status: 'success',
            analysis: parsedAnalysis,
            usage: completion.usage,
            analysisId: analysisId || null,
        });
    }
    catch (error) {
        console.error('❌ Error in analyzeCVPremium:', error);
        // CRITICAL: Always update Firestore to mark analysis as failed
        // This prevents the analysis from staying in loading state forever
        if (userId && analysisId) {
            try {
                await admin.firestore()
                    .collection('users')
                    .doc(userId)
                    .collection('analyses')
                    .doc(analysisId)
                    .set({
                    _isLoading: false,
                    status: 'failed',
                    error: ((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.message) || error.message || 'Internal server error',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
                console.log('✅ Marked analysis as failed in Firestore');
            }
            catch (firestoreError) {
                console.error('❌ Failed to update Firestore with error status:', firestoreError);
            }
        }
        // Handle OpenAI API errors
        if (error.response) {
            const statusCode = error.response.status || 500;
            const errorMessage = ((_g = (_f = error.response.data) === null || _f === void 0 ? void 0 : _f.error) === null || _g === void 0 ? void 0 : _g.message) || error.message || 'Unknown error';
            res.status(statusCode).json({
                status: 'error',
                message: `OpenAI API error: ${errorMessage}`,
                error: (_h = error.response.data) === null || _h === void 0 ? void 0 : _h.error
            });
            return;
        }
        // Handle other errors
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error'
        });
    }
});
// ==================== Brevo Integration ====================
/**
 * Get Brevo API Key from Firestore or environment
 */
const getBrevoApiKey = async () => {
    var _a;
    try {
        // Try Firestore first
        const settingsDoc = await admin.firestore().collection('settings').doc('brevo').get();
        if (settingsDoc.exists) {
            const data = settingsDoc.data();
            const apiKey = (data === null || data === void 0 ? void 0 : data.apiKey) || (data === null || data === void 0 ? void 0 : data.api_key);
            if (apiKey) {
                console.log('✅ Brevo API key retrieved from Firestore');
                console.log(`   Key length: ${apiKey.length} characters`);
                console.log(`   Key starts with: ${apiKey.substring(0, 5)}...`);
                return apiKey;
            }
        }
    }
    catch (error) {
        console.warn('⚠️  Failed to retrieve Brevo API key from Firestore:', error === null || error === void 0 ? void 0 : error.message);
    }
    // Fallback to environment variable
    if (process.env.BREVO_API_KEY) {
        console.log('Using Brevo API key from environment variable');
        return process.env.BREVO_API_KEY;
    }
    // Fallback to Firebase config
    try {
        const config = functions.config();
        if ((_a = config.brevo) === null || _a === void 0 ? void 0 : _a.api_key) {
            console.log('Using Brevo API key from Firebase config');
            return config.brevo.api_key;
        }
    }
    catch (e) {
        console.warn('Could not access Firebase config:', e);
    }
    console.warn('⚠️  Brevo API key not found. Brevo integration will be disabled.');
    return null;
};
/**
 * Create or update a contact in Brevo
 */
const createOrUpdateBrevoContact = async (apiKey, contact) => {
    try {
        const brevoUrl = `https://api.brevo.com/v3/contacts`;
        // Prepare attributes for Brevo
        // Note: Brevo uses PRENOM and NOM (French) instead of FIRSTNAME and LASTNAME
        const attributes = {};
        if (contact.firstName)
            attributes.PRENOM = contact.firstName;
        if (contact.lastName)
            attributes.NOM = contact.lastName;
        if (contact.phone)
            attributes.SMS = contact.phone;
        if (contact.company)
            attributes.COMPANY = contact.company;
        if (contact.jobtitle)
            attributes.JOB_TITLE = contact.jobtitle; // Brevo uses JOB_TITLE with underscore
        if (contact.website)
            attributes.WEBSITE = contact.website;
        if (contact.city)
            attributes.CITY = contact.city;
        if (contact.state)
            attributes.STATE = contact.state;
        if (contact.country)
            attributes.COUNTRY = contact.country;
        // Add custom properties if any (Brevo uses uppercase for standard attributes)
        Object.keys(contact).forEach(key => {
            if (!['email', 'firstName', 'lastName', 'phone', 'company', 'jobtitle', 'website', 'city', 'state', 'country'].includes(key)) {
                // Brevo custom attributes should be in uppercase
                attributes[key.toUpperCase()] = contact[key];
            }
        });
        console.log('📤 Sending request to Brevo API:', brevoUrl);
        console.log('📦 Attributes to send:', JSON.stringify(attributes));
        // Brevo uses POST for create/update (upsert by email)
        // Brevo API requires 'api-key' header (not 'X-API-KEY')
        const response = await fetch(brevoUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey.trim(), // Trim whitespace in case there's any
            },
            body: JSON.stringify({
                email: contact.email,
                attributes,
                updateEnabled: true, // Update if contact exists
            }),
        });
        console.log('📥 Brevo API response status:', response.status, response.statusText);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Brevo API error:', response.status, errorText);
            throw new Error(`Brevo API error: ${response.status} - ${errorText}`);
        }
        // Brevo returns 204 No Content for successful updates, 201 Created for new contacts
        if (response.status === 204) {
            console.log('✅ Contact updated in Brevo (204 No Content):', contact.email);
            return contact.email;
        }
        // For 201 Created, parse the JSON response
        const data = await response.json();
        console.log('✅ Contact created/updated in Brevo:', data.id || contact.email);
        console.log('📋 Brevo API response data:', JSON.stringify(data));
        return data.id || contact.email;
    }
    catch (error) {
        console.error('❌ Error creating/updating Brevo contact:', error);
        console.error('   Error message:', error === null || error === void 0 ? void 0 : error.message);
        console.error('   Error stack:', error === null || error === void 0 ? void 0 : error.stack);
        throw error;
    }
};
/**
 * Sync user to Brevo
 * Called from client or Firestore trigger
 * Using onRequest instead of onCall to fix CORS issues
 */
exports.syncUserToBrevo = (0, https_1.onRequest)({
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
    invoker: 'public',
}, async (req, res) => {
    // Set CORS headers explicitly
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    // Handle preflight OPTIONS request FIRST
    if (req.method === 'OPTIONS') {
        console.log('✅ Handling OPTIONS preflight request from origin:', req.headers.origin);
        res.status(204).send('');
        return;
    }
    console.log('🔄 syncUserToBrevo called with method:', req.method, 'from origin:', req.headers.origin);
    // Only allow POST
    if (req.method !== 'POST') {
        console.warn('⚠️  Method not allowed:', req.method);
        res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
        return;
    }
    console.log('🔄 syncUserToBrevo called with data:', JSON.stringify(req.body));
    try {
        // Get API key
        console.log('🔑 Retrieving Brevo API key...');
        const apiKey = await getBrevoApiKey();
        if (!apiKey) {
            console.warn('⚠️  Brevo API key not configured. Skipping sync.');
            res.status(200).json({ success: false, message: 'Brevo API key not configured' });
            return;
        }
        console.log('✅ Brevo API key retrieved (first 10 chars):', apiKey.substring(0, 10) + '...');
        const { contact, eventName, eventProperties } = req.body;
        if (!contact || !contact.email) {
            console.error('❌ Contact email is required');
            res.status(400).json({ success: false, message: 'Contact email is required' });
            return;
        }
        console.log('📧 Syncing contact:', contact.email);
        // Create or update contact
        const contactId = await createOrUpdateBrevoContact(apiKey, contact);
        console.log('✅ Contact synced to Brevo with ID:', contactId);
        // Note: Brevo events are handled differently (via webhooks or email events)
        // For now, we'll just log the event
        if (eventName) {
            console.log('📅 Event logged for Brevo:', eventName, eventProperties);
        }
        res.status(200).json({
            success: true,
            contactId,
            message: 'User synced to Brevo successfully',
        });
    }
    catch (error) {
        console.error('❌ Error syncing user to Brevo:', error);
        console.error('   Error message:', error === null || error === void 0 ? void 0 : error.message);
        console.error('   Error stack:', error === null || error === void 0 ? void 0 : error.stack);
        // Don't throw - Brevo sync should not block user operations
        res.status(200).json({
            success: false,
            message: error.message || 'Failed to sync user to Brevo',
        });
    }
});
// ==================== HubSpot Integration ====================
/**
 * Get HubSpot API Key from Firestore or environment
 */
const getHubSpotApiKey = async () => {
    var _a;
    try {
        // Try Firestore first
        const settingsDoc = await admin.firestore().collection('settings').doc('hubspot').get();
        if (settingsDoc.exists) {
            const data = settingsDoc.data();
            const apiKey = (data === null || data === void 0 ? void 0 : data.apiKey) || (data === null || data === void 0 ? void 0 : data.api_key);
            if (apiKey) {
                console.log('✅ HubSpot API key retrieved from Firestore');
                return apiKey;
            }
        }
    }
    catch (error) {
        console.warn('⚠️  Failed to retrieve HubSpot API key from Firestore:', error === null || error === void 0 ? void 0 : error.message);
    }
    // Fallback to environment variable
    if (process.env.HUBSPOT_API_KEY) {
        console.log('Using HubSpot API key from environment variable');
        return process.env.HUBSPOT_API_KEY;
    }
    // Fallback to Firebase config
    try {
        const config = functions.config();
        if ((_a = config.hubspot) === null || _a === void 0 ? void 0 : _a.api_key) {
            console.log('Using HubSpot API key from Firebase config');
            return config.hubspot.api_key;
        }
    }
    catch (e) {
        console.warn('Could not access Firebase config:', e);
    }
    console.warn('⚠️  HubSpot API key not found. HubSpot integration will be disabled.');
    return null;
};
/**
 * Create or update a contact in HubSpot
 */
const createOrUpdateHubSpotContact = async (apiKey, contact) => {
    try {
        const hubspotUrl = `https://api.hubapi.com/crm/v3/objects/contacts`;
        // Prepare properties
        const properties = {
            email: contact.email,
        };
        if (contact.firstName)
            properties.firstname = contact.firstName;
        if (contact.lastName)
            properties.lastname = contact.lastName;
        if (contact.phone)
            properties.phone = contact.phone;
        if (contact.company)
            properties.company = contact.company;
        if (contact.jobtitle)
            properties.jobtitle = contact.jobtitle;
        if (contact.website)
            properties.website = contact.website;
        if (contact.city)
            properties.city = contact.city;
        if (contact.state)
            properties.state = contact.state;
        if (contact.country)
            properties.country = contact.country;
        // Add custom properties if any
        Object.keys(contact).forEach(key => {
            if (!['email', 'firstName', 'lastName', 'phone', 'company', 'jobtitle', 'website', 'city', 'state', 'country'].includes(key)) {
                properties[key] = contact[key];
            }
        });
        console.log('📤 Sending request to HubSpot API:', hubspotUrl);
        console.log('📦 Properties to send:', JSON.stringify(properties));
        const response = await fetch(hubspotUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                properties,
            }),
        });
        console.log('📥 HubSpot API response status:', response.status, response.statusText);
        if (!response.ok) {
            // If contact already exists, try to update it
            if (response.status === 409) {
                console.log('⚠️  Contact already exists (409), updating...');
                return await updateHubSpotContact(apiKey, contact);
            }
            const errorText = await response.text();
            console.error('❌ HubSpot API error:', response.status, errorText);
            throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        console.log('✅ Contact created/updated in HubSpot:', data.id);
        return data.id || null;
    }
    catch (error) {
        console.error('❌ Error creating/updating HubSpot contact:', error);
        console.error('   Error message:', error === null || error === void 0 ? void 0 : error.message);
        console.error('   Error stack:', error === null || error === void 0 ? void 0 : error.stack);
        throw error;
    }
};
/**
 * Update an existing contact in HubSpot
 */
const updateHubSpotContact = async (apiKey, contact) => {
    try {
        // First, get the contact by email
        const searchUrl = `https://api.hubapi.com/crm/v3/objects/contacts/search`;
        const searchResponse = await fetch(searchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                filterGroups: [{
                        filters: [{
                                propertyName: 'email',
                                operator: 'EQ',
                                value: contact.email,
                            }],
                    }],
                properties: ['id', 'email'],
            }),
        });
        if (!searchResponse.ok) {
            throw new Error(`Failed to search contact: ${searchResponse.status}`);
        }
        const searchData = await searchResponse.json();
        if (!searchData.results || searchData.results.length === 0) {
            // Contact doesn't exist, create it
            return await createOrUpdateHubSpotContact(apiKey, contact);
        }
        const contactId = searchData.results[0].id;
        // Update the contact
        const updateUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`;
        const properties = {};
        if (contact.firstName)
            properties.firstname = contact.firstName;
        if (contact.lastName)
            properties.lastname = contact.lastName;
        if (contact.phone)
            properties.phone = contact.phone;
        if (contact.company)
            properties.company = contact.company;
        if (contact.jobtitle)
            properties.jobtitle = contact.jobtitle;
        if (contact.website)
            properties.website = contact.website;
        if (contact.city)
            properties.city = contact.city;
        if (contact.state)
            properties.state = contact.state;
        if (contact.country)
            properties.country = contact.country;
        // Add custom properties
        Object.keys(contact).forEach(key => {
            if (!['email', 'firstName', 'lastName', 'phone', 'company', 'jobtitle', 'website', 'city', 'state', 'country'].includes(key)) {
                properties[key] = contact[key];
            }
        });
        const updateResponse = await fetch(updateUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                properties,
            }),
        });
        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`HubSpot update error: ${updateResponse.status} - ${errorText}`);
        }
        // Response is ok, contact updated successfully
        console.log('✅ Contact updated in HubSpot:', contactId);
        return contactId;
    }
    catch (error) {
        console.error('❌ Error updating HubSpot contact:', error);
        throw error;
    }
};
/**
 * Send an event to HubSpot Timeline
 */
const sendHubSpotEvent = async (apiKey, email, eventName, properties) => {
    try {
        // First, get the contact ID by email
        const searchUrl = `https://api.hubapi.com/crm/v3/objects/contacts/search`;
        const searchResponse = await fetch(searchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                filterGroups: [{
                        filters: [{
                                propertyName: 'email',
                                operator: 'EQ',
                                value: email,
                            }],
                    }],
                properties: ['id'],
            }),
        });
        if (!searchResponse.ok) {
            console.warn('⚠️  Could not find contact for event:', email);
            return;
        }
        const searchData = await searchResponse.json();
        if (!searchData.results || searchData.results.length === 0) {
            console.warn('⚠️  Contact not found for event:', email);
            return;
        }
        const contactId = searchData.results[0].id;
        // Send timeline event
        const eventUrl = `https://api.hubapi.com/integrations/v1/${contactId}/timeline/events`;
        const eventData = {
            eventTypeId: eventName,
            email,
            extraData: properties || {},
        };
        const eventResponse = await fetch(eventUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(eventData),
        });
        if (!eventResponse.ok) {
            const errorText = await eventResponse.text();
            console.warn('⚠️  Could not send HubSpot event:', errorText);
            return;
        }
        console.log('✅ Event sent to HubSpot:', eventName);
    }
    catch (error) {
        console.error('❌ Error sending HubSpot event:', error);
        // Don't throw - events are not critical
    }
};
/**
 * Sync user to HubSpot
 * Called from client or Firestore trigger
 * Using onRequest instead of onCall to fix CORS issues
 */
exports.syncUserToHubSpot = (0, https_1.onRequest)({
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
    invoker: 'public', // Allow public access - REQUIRED for CORS to work
}, async (req, res) => {
    // Set CORS headers explicitly (cors: true handles this, but we set it explicitly to be sure)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    // Handle preflight OPTIONS request FIRST
    if (req.method === 'OPTIONS') {
        console.log('✅ Handling OPTIONS preflight request from origin:', req.headers.origin);
        res.status(204).send('');
        return;
    }
    console.log('🔄 syncUserToHubSpot called with method:', req.method, 'from origin:', req.headers.origin);
    // Only allow POST
    if (req.method !== 'POST') {
        console.warn('⚠️  Method not allowed:', req.method);
        res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
        return;
    }
    console.log('🔄 syncUserToHubSpot called with data:', JSON.stringify(req.body));
    try {
        // Get API key
        console.log('🔑 Retrieving HubSpot API key...');
        const apiKey = await getHubSpotApiKey();
        if (!apiKey) {
            console.warn('⚠️  HubSpot API key not configured. Skipping sync.');
            res.status(200).json({ success: false, message: 'HubSpot API key not configured' });
            return;
        }
        console.log('✅ HubSpot API key retrieved (first 10 chars):', apiKey.substring(0, 10) + '...');
        console.log('📏 HubSpot API key length:', apiKey.length);
        // Validate token format
        if (apiKey.startsWith('eu1-') || apiKey.startsWith('na1-')) {
            console.error('❌ ERROR: Developer API Keys (eu1-* or na1-*) are deprecated and no longer work with HubSpot API v3!');
            console.error('   You MUST use a Private App Access Token (pat-*) instead.');
            console.error('   Please create a Private App in HubSpot Settings → Integrations → Private Apps');
            res.status(200).json({
                success: false,
                message: 'Invalid API key format: Developer API Keys are deprecated. Please use a Private App Access Token (pat-*)'
            });
            return;
        }
        if (!apiKey.startsWith('pat-')) {
            console.warn('⚠️  WARNING: API key does not start with "pat-". This may not be a valid Private App Access Token.');
        }
        else {
            console.log('✅ HubSpot API key format: Private App Access Token (pat-*) - Valid format');
        }
        const { contact, eventName, eventProperties } = req.body;
        if (!contact || !contact.email) {
            console.error('❌ Contact email is required');
            res.status(400).json({ success: false, message: 'Contact email is required' });
            return;
        }
        console.log('📧 Syncing contact:', contact.email);
        // Create or update contact
        const contactId = await createOrUpdateHubSpotContact(apiKey, contact);
        console.log('✅ Contact synced to HubSpot with ID:', contactId);
        // Send event if provided
        if (eventName) {
            console.log('📅 Sending event to HubSpot:', eventName);
            await sendHubSpotEvent(apiKey, contact.email, eventName, eventProperties);
        }
        res.status(200).json({
            success: true,
            contactId,
            message: 'User synced to HubSpot successfully',
        });
    }
    catch (error) {
        console.error('❌ Error syncing user to HubSpot:', error);
        console.error('   Error message:', error === null || error === void 0 ? void 0 : error.message);
        console.error('   Error stack:', error === null || error === void 0 ? void 0 : error.stack);
        // Don't throw - HubSpot sync should not block user operations
        res.status(200).json({
            success: false,
            message: error.message || 'Failed to sync user to HubSpot',
        });
    }
});
/**
 * Send event to HubSpot
 * Called from client
 */
exports.sendHubSpotEventFunction = (0, https_1.onRequest)({
    region: 'us-central1',
    maxInstances: 10,
    invoker: 'public',
}, async (req, res) => {
    // Handle CORS FIRST
    handleCORS(req, res, () => { });
    if (req.method === 'OPTIONS') {
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ success: false, message: 'Method not allowed' });
        return;
    }
    try {
        const apiKey = await getHubSpotApiKey();
        if (!apiKey) {
            console.warn('⚠️  HubSpot API key not configured. Skipping event.');
            res.status(200).json({ success: false, message: 'HubSpot API key not configured' });
            return;
        }
        const { email, eventName, properties } = req.body;
        if (!email || !eventName) {
            res.status(400).json({ success: false, message: 'Email and eventName are required' });
            return;
        }
        await sendHubSpotEvent(apiKey, email, eventName, properties);
        res.status(200).json({
            success: true,
            message: 'Event sent to HubSpot successfully',
        });
    }
    catch (error) {
        console.error('❌ Error sending event to HubSpot:', error);
        res.status(200).json({
            success: false,
            message: error.message || 'Failed to send event to HubSpot',
        });
    }
});
// ==================== Stripe Integration ====================
/**
 * Get Stripe API Key from Firestore or environment
 */
const getStripeApiKey = async () => {
    var _a, _b;
    try {
        // Try Firestore first
        const settingsDoc = await admin.firestore().collection('settings').doc('stripe').get();
        if (settingsDoc.exists) {
            const data = settingsDoc.data();
            const apiKey = (data === null || data === void 0 ? void 0 : data.secretKey) || (data === null || data === void 0 ? void 0 : data.secret_key) || (data === null || data === void 0 ? void 0 : data.apiKey) || (data === null || data === void 0 ? void 0 : data.api_key);
            if (apiKey) {
                console.log('✅ Stripe API key retrieved from Firestore');
                return apiKey;
            }
        }
    }
    catch (error) {
        console.warn('⚠️  Failed to retrieve Stripe API key from Firestore:', error === null || error === void 0 ? void 0 : error.message);
    }
    // Fallback to environment variable
    if (process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY) {
        console.log('Using Stripe API key from environment variable');
        return process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY || '';
    }
    // Fallback to Firebase config
    try {
        const config = functions.config();
        if (((_a = config.stripe) === null || _a === void 0 ? void 0 : _a.secret_key) || ((_b = config.stripe) === null || _b === void 0 ? void 0 : _b.api_key)) {
            console.log('Using Stripe API key from Firebase config');
            return config.stripe.secret_key || config.stripe.api_key || '';
        }
    }
    catch (e) {
        console.warn('Could not access Firebase config:', e);
    }
    throw new Error('Stripe API key not found. Please configure it in Firestore (settings/stripe) or environment variables.');
};
/**
 * Initialize Stripe client
 */
const getStripeClient = async () => {
    const apiKey = await getStripeApiKey();
    return new stripe_1.default(apiKey, {
        apiVersion: '2025-10-29.clover',
    });
};
/**
 * Create a Stripe Checkout Session
 * This endpoint creates a payment session for subscriptions or one-time payments
 */
exports.createCheckoutSession = (0, https_1.onRequest)({
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
    invoker: 'public',
}, async (req, res) => {
    // Get origin from request
    const origin = req.headers.origin;
    // Set CORS headers - MUST be set before any response
    // Firebase Functions v2 with cors: true should handle this, but we set it explicitly
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '3600');
    // Handle preflight OPTIONS request FIRST
    if (req.method === 'OPTIONS') {
        console.log('✅ Handling OPTIONS preflight request from origin:', origin || 'no origin');
        res.status(204).end();
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ success: false, message: 'Method not allowed' });
        return;
    }
    try {
        const { userId, planId, planName, price, credits, type, successUrl, cancelUrl } = req.body;
        // Validation
        if (!userId || !planId || !price) {
            res.status(400).json({
                success: false,
                message: 'userId, planId, and price are required'
            });
            return;
        }
        // Get Stripe client
        const stripe = await getStripeClient();
        // Determine if it's a subscription or one-time payment
        const isSubscription = type === 'plan' && planId !== 'free';
        const priceInCents = Math.round(parseFloat(price) * 100); // Convert to cents
        // Create or retrieve Stripe Price
        let priceId;
        if (isSubscription) {
            // For subscriptions, create a recurring price
            // First, check if a product already exists for this plan
            const products = await stripe.products.list({ limit: 100 });
            let product = products.data.find(p => { var _a; return ((_a = p.metadata) === null || _a === void 0 ? void 0 : _a.planId) === planId; });
            if (!product) {
                // Create product if it doesn't exist
                product = await stripe.products.create({
                    name: `${planName} Plan`,
                    description: `JobzAI ${planName} Plan - ${credits} credits per month`,
                    metadata: {
                        planId,
                        credits: credits.toString(),
                    },
                });
            }
            // Create or retrieve price
            const prices = await stripe.prices.list({
                product: product.id,
                limit: 100,
            });
            let existingPrice = prices.data.find(p => { var _a; return p.unit_amount === priceInCents && ((_a = p.recurring) === null || _a === void 0 ? void 0 : _a.interval) === 'month'; });
            if (!existingPrice) {
                existingPrice = await stripe.prices.create({
                    product: product.id,
                    unit_amount: priceInCents,
                    currency: 'eur',
                    recurring: {
                        interval: 'month',
                    },
                    metadata: {
                        planId,
                        credits: credits.toString(),
                    },
                });
            }
            priceId = existingPrice.id;
        }
        else {
            // For one-time payments (credit packages), create a one-time price
            const products = await stripe.products.list({ limit: 100 });
            let product = products.data.find(p => { var _a, _b; return ((_a = p.metadata) === null || _a === void 0 ? void 0 : _a.type) === 'credit_package' && ((_b = p.metadata) === null || _b === void 0 ? void 0 : _b.packageId) === planId; });
            if (!product) {
                product = await stripe.products.create({
                    name: `${credits} Credits`,
                    description: `JobzAI Credit Package - ${credits} credits`,
                    metadata: {
                        type: 'credit_package',
                        packageId: planId,
                        credits: credits.toString(),
                    },
                });
            }
            // Create or retrieve one-time price
            const prices = await stripe.prices.list({
                product: product.id,
                limit: 100,
            });
            let existingPrice = prices.data.find(p => p.unit_amount === priceInCents);
            if (!existingPrice) {
                existingPrice = await stripe.prices.create({
                    product: product.id,
                    unit_amount: priceInCents,
                    currency: 'eur',
                    metadata: {
                        type: 'credit_package',
                        packageId: planId,
                        credits: credits.toString(),
                    },
                });
            }
            priceId = existingPrice.id;
        }
        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: isSubscription ? 'subscription' : 'payment',
            success_url: successUrl.replace('{CHECKOUT_SESSION_ID}', '{CHECKOUT_SESSION_ID}'),
            cancel_url: cancelUrl,
            customer_email: req.body.customerEmail || undefined,
            client_reference_id: userId,
            allow_promotion_codes: true,
            metadata: {
                userId,
                planId,
                credits: credits.toString(),
                type,
            },
        });
        res.status(200).json({ success: true, sessionId: session.id, url: session.url });
    }
    catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
});
/**
 * Stripe Webhook Handler
 * Handles Stripe events (payment success, subscription updates, etc.)
 * Note: For webhook signature verification, we need raw body
 */
exports.stripeWebhook = (0, https_1.onRequest)({
    region: 'us-central1',
    maxInstances: 10,
    invoker: 'public',
}, async (req, res) => {
    // Stripe webhook signature verification
    const sig = req.headers['stripe-signature'];
    if (!sig) {
        console.error('❌ Missing Stripe signature');
        res.status(400).send('Missing Stripe signature');
        return;
    }
    try {
        const stripe = await getStripeClient();
        const webhookSecret = await getStripeWebhookSecret();
        // Get raw body for signature verification
        // Note: Firebase Functions v2 parses JSON automatically, so we need to stringify it back
        // For production, you might need to use express.raw() middleware or similar
        const rawBody = typeof req.body === 'string'
            ? req.body
            : JSON.stringify(req.body);
        // Verify webhook signature
        const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
        console.log('✅ Stripe webhook event received:', event.type);
        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                await handleCheckoutCompleted(session);
                break;
            }
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                await handleSubscriptionUpdate(subscription);
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                await handleSubscriptionCancelled(subscription);
                break;
            }
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                await handleInvoicePaymentSucceeded(invoice);
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                await handleInvoicePaymentFailed(invoice);
                break;
            }
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('❌ Error processing Stripe webhook:', error);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});
/**
 * Get Stripe Webhook Secret
 */
const getStripeWebhookSecret = async () => {
    var _a;
    try {
        const settingsDoc = await admin.firestore().collection('settings').doc('stripe').get();
        if (settingsDoc.exists) {
            const data = settingsDoc.data();
            const webhookSecret = (data === null || data === void 0 ? void 0 : data.webhookSecret) || (data === null || data === void 0 ? void 0 : data.webhook_secret);
            if (webhookSecret) {
                return webhookSecret;
            }
        }
    }
    catch (error) {
        console.warn('⚠️  Failed to retrieve Stripe webhook secret from Firestore:', error === null || error === void 0 ? void 0 : error.message);
    }
    if (process.env.STRIPE_WEBHOOK_SECRET) {
        return process.env.STRIPE_WEBHOOK_SECRET;
    }
    try {
        const config = functions.config();
        if ((_a = config.stripe) === null || _a === void 0 ? void 0 : _a.webhook_secret) {
            return config.stripe.webhook_secret;
        }
    }
    catch (e) {
        console.warn('Could not access Firebase config:', e);
    }
    throw new Error('Stripe webhook secret not found');
};
/**
 * Handle checkout.session.completed event
 */
const handleCheckoutCompleted = async (session) => {
    var _a;
    try {
        const { userId, planId, planName, credits, type } = session.metadata || {};
        if (!userId) {
            console.error('❌ Missing userId in session metadata');
            return;
        }
        const userRef = admin.firestore().collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            console.error('❌ User not found:', userId);
            return;
        }
        // Update user based on payment type
        if (type === 'plan' && planId !== 'free') {
            // Subscription plan
            const creditsToAdd = parseInt(credits || '0', 10);
            await userRef.update({
                plan: planId,
                credits: creditsToAdd,
                planSelectedAt: admin.firestore.FieldValue.serverTimestamp(),
                stripeCustomerId: session.customer || null,
                stripeSubscriptionId: session.subscription || null,
                paymentStatus: 'active',
                lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Record credit history
            await admin.firestore().collection('users').doc(userId).collection('creditHistory').add({
                balance: creditsToAdd,
                change: creditsToAdd,
                reason: 'subscription_payment',
                planId,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                stripeSessionId: session.id,
            });
            console.log(`✅ User ${userId} subscription activated: ${planName} (${credits} credits)`);
        }
        else if (type === 'credits') {
            // One-time credit purchase
            const creditsToAdd = parseInt(credits || '0', 10);
            const currentCredits = ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.credits) || 0;
            await userRef.update({
                credits: currentCredits + creditsToAdd,
                lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Record credit history
            await admin.firestore().collection('users').doc(userId).collection('creditHistory').add({
                balance: currentCredits + creditsToAdd,
                change: creditsToAdd,
                reason: 'credit_purchase',
                packageId: planId,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                stripeSessionId: session.id,
            });
            console.log(`✅ User ${userId} purchased ${creditsToAdd} credits`);
        }
        // Create invoice record with Stripe invoice URL if available
        let invoiceUrl = null;
        let invoicePdfUrl = null;
        let invoiceNumber = null;
        // Try to get the invoice from the session for PDF URL
        if (session.invoice) {
            try {
                const stripe = await getStripeClient();
                const invoiceId = typeof session.invoice === 'string' ? session.invoice : session.invoice.id;
                const stripeInvoice = await stripe.invoices.retrieve(invoiceId);
                invoiceUrl = stripeInvoice.hosted_invoice_url || null;
                invoicePdfUrl = stripeInvoice.invoice_pdf || null;
                invoiceNumber = stripeInvoice.number || null;
            }
            catch (error) {
                console.warn('⚠️  Could not retrieve invoice details:', error === null || error === void 0 ? void 0 : error.message);
            }
        }
        await admin.firestore().collection('users').doc(userId).collection('invoices').add({
            stripeSessionId: session.id,
            stripeInvoiceId: session.invoice ? (typeof session.invoice === 'string' ? session.invoice : session.invoice.id) : null,
            invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
            amount: (session.amount_total || 0) / 100,
            currency: session.currency || 'eur',
            status: 'paid',
            planId,
            planName: planName || (type === 'credits' ? `${credits} Credits` : planId),
            type,
            invoiceUrl,
            invoicePdfUrl,
            customerEmail: session.customer_email || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    catch (error) {
        console.error('❌ Error handling checkout completed:', error);
        throw error;
    }
};
/**
 * Handle subscription update
 */
const handleSubscriptionUpdate = async (subscription) => {
    try {
        const { userId } = subscription.metadata || {};
        if (!userId) {
            console.error('❌ Missing userId in subscription metadata');
            return;
        }
        const userRef = admin.firestore().collection('users').doc(userId);
        await userRef.update({
            stripeSubscriptionId: subscription.id,
            paymentStatus: subscription.status === 'active' ? 'active' : 'inactive',
            subscriptionStatus: subscription.status,
        });
        console.log(`✅ Subscription updated for user ${userId}: ${subscription.status}`);
    }
    catch (error) {
        console.error('❌ Error handling subscription update:', error);
    }
};
/**
 * Handle subscription cancellation
 */
const handleSubscriptionCancelled = async (subscription) => {
    try {
        const { userId } = subscription.metadata || {};
        if (!userId) {
            console.error('❌ Missing userId in subscription metadata');
            return;
        }
        const userRef = admin.firestore().collection('users').doc(userId);
        // Downgrade to free plan
        await userRef.update({
            plan: 'free',
            credits: 25,
            paymentStatus: 'cancelled',
            subscriptionStatus: 'cancelled',
            planSelectedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ Subscription cancelled for user ${userId}, downgraded to free plan`);
    }
    catch (error) {
        console.error('❌ Error handling subscription cancellation:', error);
    }
};
/**
 * Handle successful invoice payment
 */
const handleInvoicePaymentSucceeded = async (invoice) => {
    var _a;
    try {
        // Invoice.subscription can be a string (ID) or a Subscription object
        const subscriptionId = typeof invoice.subscription === 'string'
            ? invoice.subscription
            : (_a = invoice.subscription) === null || _a === void 0 ? void 0 : _a.id;
        if (!subscriptionId) {
            // One-time payment, already handled in checkout.session.completed
            return;
        }
        // Get subscription to find userId
        const stripe = await getStripeClient();
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const { userId, planId, credits } = subscription.metadata || {};
        if (!userId) {
            console.error('❌ Missing userId in subscription metadata');
            return;
        }
        const userRef = admin.firestore().collection('users').doc(userId);
        // Renew credits for subscription
        const creditsToAdd = parseInt(credits || '0', 10);
        await userRef.update({
            credits: creditsToAdd,
            lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Record credit history
        await admin.firestore().collection('users').doc(userId).collection('creditHistory').add({
            balance: creditsToAdd,
            change: creditsToAdd,
            reason: 'subscription_renewal',
            planId: planId || 'unknown',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            stripeInvoiceId: invoice.id,
        });
        console.log(`✅ Subscription renewed for user ${userId}: ${creditsToAdd} credits added`);
    }
    catch (error) {
        console.error('❌ Error handling invoice payment succeeded:', error);
    }
};
/**
 * Manual function to process a Stripe checkout session and add credits
 * This can be called manually if the webhook didn't fire
 */
exports.processStripeSession = (0, https_1.onRequest)({
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
    invoker: 'public',
}, async (req, res) => {
    // Set CORS headers
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ success: false, message: 'Method not allowed' });
        return;
    }
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            res.status(400).json({
                success: false,
                message: 'sessionId is required'
            });
            return;
        }
        // Get Stripe client
        const stripe = await getStripeClient();
        // Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['line_items', 'subscription'],
        });
        // Check if payment was successful
        if (session.payment_status !== 'paid') {
            res.status(400).json({
                success: false,
                message: `Payment status is ${session.payment_status}, not paid`
            });
            return;
        }
        // Process the session (same logic as webhook)
        await handleCheckoutCompleted(session);
        res.status(200).json({
            success: true,
            message: 'Session processed successfully',
            sessionId: session.id,
        });
    }
    catch (error) {
        console.error('❌ Error processing Stripe session:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to process session',
        });
    }
});
/**
 * Handle failed invoice payment
 */
const handleInvoicePaymentFailed = async (invoice) => {
    var _a;
    try {
        // Invoice.subscription can be a string (ID) or a Subscription object
        const subscriptionId = typeof invoice.subscription === 'string'
            ? invoice.subscription
            : (_a = invoice.subscription) === null || _a === void 0 ? void 0 : _a.id;
        if (!subscriptionId) {
            return;
        }
        // Get subscription to find userId
        const stripe = await getStripeClient();
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const { userId } = subscription.metadata || {};
        if (!userId) {
            console.error('❌ Missing userId in subscription metadata');
            return;
        }
        const userRef = admin.firestore().collection('users').doc(userId);
        await userRef.update({
            paymentStatus: 'failed',
            lastPaymentFailure: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`⚠️  Payment failed for user ${userId}`);
    }
    catch (error) {
        console.error('❌ Error handling invoice payment failed:', error);
    }
};
// ==================== Job Search API ====================
/**
 * Technology aliases for better matching
 */
const TECH_ALIASES = {
    'salesforce': ['sfdc', 'sf', 'sales cloud', 'service cloud', 'apex', 'lightning'],
    'javascript': ['js', 'ecmascript'],
    'typescript': ['ts'],
    'python': ['py'],
    'react': ['reactjs', 'react.js'],
    'vue': ['vuejs', 'vue.js'],
    'node.js': ['nodejs', 'node'],
    'next.js': ['nextjs', 'next'],
    'postgresql': ['postgres', 'psql'],
    'mongodb': ['mongo'],
    'kubernetes': ['k8s'],
    'elasticsearch': ['elastic'],
    'go': ['golang'],
    '.net': ['dotnet', 'csharp', 'c#'],
    'aws': ['amazon web services'],
    'gcp': ['google cloud'],
    'azure': ['microsoft azure'],
    'dynamics 365': ['dynamics', 'microsoft dynamics'],
    'machine learning': ['ml'],
    'deep learning': ['dl'],
    'ci/cd': ['cicd'],
};
/**
 * Get all variations of a technology name
 */
function getTechVariations(tech) {
    const lower = tech.toLowerCase();
    const variations = [lower];
    // Check if this tech has aliases
    if (TECH_ALIASES[lower]) {
        variations.push(...TECH_ALIASES[lower]);
    }
    // Check if this is an alias for another tech
    for (const [main, aliases] of Object.entries(TECH_ALIASES)) {
        if (aliases.includes(lower)) {
            variations.push(main, ...aliases);
        }
    }
    return [...new Set(variations)];
}
/**
 * Global Job Search API - V2 with Smart Parsing Support
 *
 * New parameters:
 * - locations: comma-separated list of locations (multi-location support)
 * - technologies: comma-separated list of technologies
 * - workLocation: remote|hybrid|on-site
 * - roleFunction: engineering|sales|marketing|consulting|etc.
 * - keyword: remaining unclassified search terms
 *
 * Legacy parameters still supported:
 * - location: single location (for backwards compat)
 * - remote: boolean
 * - fullTime: boolean
 * - senior: boolean
 * - experienceLevel: string
 * - jobType: string
 */
exports.searchJobs = (0, https_1.onRequest)({
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
    invoker: 'public',
}, async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    // Only allow GET
    if (req.method !== 'GET') {
        res.status(405).json({
            success: false,
            message: 'Method not allowed. Use GET.'
        });
        return;
    }
    try {
        console.log('🔍 Job search V2 request received');
        console.log('   Query params:', req.query);
        // ============================================
        // EXTRACT PARAMETERS (V2 + Legacy support)
        // ============================================
        // V2 Smart Parser Parameters
        const keyword = req.query.keyword;
        const locationsParam = req.query.locations;
        const technologiesParam = req.query.technologies;
        const workLocation = req.query.workLocation;
        const roleFunction = req.query.roleFunction;
        const employmentType = req.query.employmentType;
        // Legacy parameters (for backwards compatibility)
        const legacyLocation = req.query.location;
        const remote = req.query.remote === 'true';
        const fullTime = req.query.fullTime === 'true';
        const senior = req.query.senior === 'true';
        const last24h = req.query.last24h === 'true';
        const experienceLevel = req.query.experienceLevel;
        const jobType = req.query.jobType;
        // Parse multi-value parameters
        const locations = locationsParam
            ? locationsParam.split(',').map(l => l.trim().toLowerCase())
            : (legacyLocation ? [legacyLocation.toLowerCase()] : []);
        const technologies = technologiesParam
            ? technologiesParam.split(',').map(t => t.trim().toLowerCase())
            : [];
        // Other enriched tags from UI filters
        const industries = req.query.industries ? req.query.industries.split(',') : [];
        const skills = req.query.skills ? req.query.skills.split(',') : [];
        console.log('=== Smart Search V2 ===');
        console.log(`   Keyword: ${keyword || 'none'}`);
        console.log(`   Locations: ${locations.length > 0 ? locations.join(', ') : 'none'}`);
        console.log(`   Technologies: ${technologies.length > 0 ? technologies.join(', ') : 'none'}`);
        console.log(`   Work Location: ${workLocation || 'none'}`);
        console.log(`   Role Function: ${roleFunction || 'none'}`);
        console.log(`   Employment Type: ${employmentType || 'none'}`);
        console.log(`   Experience Level: ${experienceLevel || 'none'}`);
        console.log(`   Remote (legacy): ${remote}`);
        console.log(`   Full-time (legacy): ${fullTime}`);
        console.log(`   Senior (legacy): ${senior}`);
        console.log(`   Industries: ${industries.length > 0 ? industries.join(', ') : 'none'}`);
        console.log(`   Skills: ${skills.length > 0 ? skills.join(', ') : 'none'}`);
        const limitParam = parseInt(req.query.limit || '200', 10);
        // Build optimized Firestore query
        let jobsQuery = admin.firestore().collection('jobs');
        // --- 1. Apply Database-Level Filters (Global Filtering) ---
        // Date Posted Filter
        if (last24h) {
            const oneDayAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
            jobsQuery = jobsQuery.where('postedAt', '>=', oneDayAgo);
        }
        // Always order by postedAt desc
        jobsQuery = jobsQuery.orderBy('postedAt', 'desc');
        // Limit results
        // If any filter is active, we need to search deeper to find matches in older jobs
        const hasAnyFilter = keyword || locations.length > 0 || technologies.length > 0 ||
            workLocation || roleFunction || employmentType ||
            remote || fullTime || senior || experienceLevel || jobType ||
            industries.length > 0 || skills.length > 0;
        const effectiveLimit = hasAnyFilter ? 4000 : Math.min(limitParam, 1000);
        jobsQuery = jobsQuery.limit(effectiveLimit);
        // Execute the query
        const snapshot = await jobsQuery.get();
        console.log(`   Found ${snapshot.size} jobs in database (after Firestore filters)`);
        let jobs = snapshot.docs.map(doc => {
            const data = doc.data();
            return Object.assign(Object.assign({ id: doc.id }, data), { logoUrl: data.companyLogo || data.logoUrl || '' });
        });
        // ============================================
        // SMART MULTI-FIELD SEARCH
        // ============================================
        /**
         * Check if a job matches a keyword in any relevant field
         */
        const matchesKeyword = (job, kw) => {
            const lower = kw.toLowerCase();
            const title = (job.title || '').toLowerCase();
            const description = (job.description || job.summary || '').toLowerCase();
            const company = (job.company || '').toLowerCase();
            const jobLocation = (job.location || '').toLowerCase();
            const jobSkills = Array.isArray(job.skills) ? job.skills.join(' ').toLowerCase() : '';
            const jobTechs = Array.isArray(job.technologies) ? job.technologies.join(' ').toLowerCase() : '';
            const jobIndustries = Array.isArray(job.industries) ? job.industries.join(' ').toLowerCase() : '';
            const jobRoleFunction = (job.roleFunction || '').toLowerCase();
            return title.includes(lower) ||
                description.includes(lower) ||
                company.includes(lower) ||
                jobLocation.includes(lower) ||
                jobSkills.includes(lower) ||
                jobTechs.includes(lower) ||
                jobIndustries.includes(lower) ||
                jobRoleFunction.includes(lower);
        };
        /**
         * Check if job matches any of multiple locations (OR logic)
         */
        const matchesLocations = (job, locs) => {
            if (locs.length === 0)
                return true;
            const jobLocation = (job.location || '').toLowerCase();
            return locs.some(loc => jobLocation.includes(loc));
        };
        /**
         * Check if job matches any of multiple technologies (with aliases)
         */
        const matchesTechnologies = (job, techs) => {
            if (techs.length === 0)
                return true;
            const jobTechs = Array.isArray(job.technologies)
                ? job.technologies.map(t => t.toLowerCase())
                : [];
            const title = (job.title || '').toLowerCase();
            const description = (job.description || job.summary || '').toLowerCase();
            return techs.some(tech => {
                // Get all variations of this technology
                const variations = getTechVariations(tech);
                // Check in technologies array
                if (variations.some(v => jobTechs.some(jt => jt.includes(v) || v.includes(jt)))) {
                    return true;
                }
                // Also check in title and description for broader matching
                if (variations.some(v => title.includes(v) || description.includes(v))) {
                    return true;
                }
                return false;
            });
        };
        /**
         * Check if job matches work location preference
         */
        const matchesWorkLocation = (job, wl) => {
            const remotePolicy = (job.remote || job.remotePolicy || '').toLowerCase();
            const jobWorkLocations = job.workLocations || [];
            if (wl === 'remote') {
                return remotePolicy.includes('remote') ||
                    remotePolicy.includes('fully remote') ||
                    remotePolicy.includes('work from home') ||
                    jobWorkLocations.includes('remote');
            }
            if (wl === 'hybrid') {
                return remotePolicy.includes('hybrid') ||
                    remotePolicy.includes('flex') ||
                    jobWorkLocations.includes('hybrid');
            }
            if (wl === 'on-site') {
                return remotePolicy.includes('on-site') ||
                    remotePolicy.includes('onsite') ||
                    remotePolicy.includes('in-office') ||
                    jobWorkLocations.includes('on-site');
            }
            return true;
        };
        /**
         * Check if job matches role function
         */
        const matchesRoleFunction = (job, rf) => {
            const jobRoleFunction = (job.roleFunction || '').toLowerCase();
            const title = (job.title || '').toLowerCase();
            // Direct match on roleFunction field
            if (jobRoleFunction === rf.toLowerCase()) {
                return true;
            }
            // Fallback: check title for role keywords
            const roleKeywords = {
                'engineering': ['engineer', 'developer', 'développeur', 'devops', 'sre', 'architect', 'programmer'],
                'sales': ['sales', 'account executive', 'bdr', 'sdr', 'commercial', 'account manager'],
                'marketing': ['marketing', 'growth', 'content', 'seo', 'brand', 'communication'],
                'consulting': ['consultant', 'consulting', 'advisor', 'conseil'],
                'data': ['data', 'analyst', 'analytics', 'bi', 'scientist'],
                'product': ['product manager', 'product owner', 'chef de produit'],
                'design': ['designer', 'ux', 'ui', 'creative', 'graphic'],
                'hr': ['hr', 'recruiter', 'talent', 'people', 'rh'],
                'finance': ['finance', 'financial', 'accountant', 'controller', 'comptable'],
                'operations': ['operations', 'ops', 'supply chain', 'logistics'],
                'support': ['support', 'customer success', 'customer service'],
                'legal': ['legal', 'lawyer', 'juriste', 'compliance'],
            };
            const keywords = roleKeywords[rf.toLowerCase()] || [];
            return keywords.some(kw => title.includes(kw));
        };
        // ============================================
        // APPLY FILTERS
        // ============================================
        // Apply keyword filter with tokenization
        if (keyword) {
            const tokens = keyword.toLowerCase().split(/\s+/).filter(t => t.length > 1);
            if (tokens.length > 0) {
                jobs = jobs.filter(job => {
                    // Job must match ALL keyword tokens (AND logic)
                    return tokens.every(token => matchesKeyword(job, token));
                });
                console.log(`   Jobs after keyword filter (${tokens.join(', ')}): ${jobs.length}`);
            }
        }
        // Apply multi-location filter (OR logic - matches any location)
        if (locations.length > 0) {
            jobs = jobs.filter(job => matchesLocations(job, locations));
            console.log(`   Jobs after location filter (${locations.join(', ')}): ${jobs.length}`);
        }
        // Apply technologies filter with alias support
        if (technologies.length > 0) {
            jobs = jobs.filter(job => matchesTechnologies(job, technologies));
            console.log(`   Jobs after technologies filter: ${jobs.length}`);
        }
        // Apply work location filter (V2 smart param)
        if (workLocation) {
            jobs = jobs.filter(job => matchesWorkLocation(job, workLocation));
            console.log(`   Jobs after workLocation filter: ${jobs.length}`);
        }
        // Apply role function filter (V2 smart param)
        if (roleFunction) {
            jobs = jobs.filter(job => matchesRoleFunction(job, roleFunction));
            console.log(`   Jobs after roleFunction filter: ${jobs.length}`);
        }
        // Apply employment type filter (V2 smart param)
        if (employmentType) {
            const etLower = employmentType.toLowerCase();
            jobs = jobs.filter(job => {
                const jobTypeStr = (job.type || job.employmentType || '').toLowerCase();
                const employmentTypes = job.employmentTypes || [];
                return jobTypeStr.includes(etLower) ||
                    employmentTypes.some(et => et.toLowerCase().includes(etLower));
            });
            console.log(`   Jobs after employmentType filter: ${jobs.length}`);
        }
        // Legacy: Apply remote filter
        if (remote && !workLocation) {
            jobs = jobs.filter(job => matchesWorkLocation(job, 'remote'));
        }
        // Legacy: Apply full-time filter
        if (fullTime && !employmentType) {
            jobs = jobs.filter(job => {
                const jobTypeStr = (job.type || job.employmentType || '').toLowerCase();
                const employmentTypes = job.employmentTypes || [];
                return jobTypeStr.includes('full') ||
                    jobTypeStr.includes('full-time') ||
                    jobTypeStr.includes('fulltime') ||
                    employmentTypes.includes('full-time');
            });
        }
        // Legacy: Apply seniority filter (senior)
        if (senior) {
            jobs = jobs.filter(job => {
                const seniorityLevel = (job.seniority || job.level || '').toLowerCase();
                const experienceLevels = job.experienceLevels || [];
                return seniorityLevel.includes('senior') ||
                    seniorityLevel.includes('sr') ||
                    seniorityLevel.includes('lead') ||
                    seniorityLevel.includes('principal') ||
                    experienceLevels.includes('senior') ||
                    experienceLevels.includes('lead');
            });
        }
        // Apply experience level filter
        if (experienceLevel) {
            const levelLower = experienceLevel.toLowerCase();
            jobs = jobs.filter(job => {
                const jobLevel = (job.seniority || job.level || '').toLowerCase();
                const experienceLevels = job.experienceLevels || [];
                return jobLevel.includes(levelLower) ||
                    experienceLevels.some(level => level.toLowerCase().includes(levelLower));
            });
            console.log(`   Jobs after experienceLevel filter: ${jobs.length}`);
        }
        // Apply job type filter (legacy)
        if (jobType) {
            const typeLower = jobType.toLowerCase();
            jobs = jobs.filter(job => {
                const jobTypeValue = (job.type || job.employmentType || '').toLowerCase();
                const employmentTypes = job.employmentTypes || [];
                return jobTypeValue.includes(typeLower) ||
                    employmentTypes.some(type => type.toLowerCase().includes(typeLower));
            });
        }
        // Apply industries filter
        if (industries.length > 0) {
            jobs = jobs.filter(job => {
                const jobIndustries = job.industries || [];
                return industries.some(industry => jobIndustries.some(ji => ji.toLowerCase().includes(industry.toLowerCase())));
            });
            console.log(`   Jobs after industries filter: ${jobs.length}`);
        }
        // Apply skills filter
        if (skills.length > 0) {
            jobs = jobs.filter(job => {
                const jobSkills = Array.isArray(job.skills) ? job.skills.map(s => s.toLowerCase()) : [];
                return skills.some(skill => jobSkills.some(js => js.includes(skill.toLowerCase())));
            });
            console.log(`   Jobs after skills filter: ${jobs.length}`);
        }
        console.log(`   Returning ${jobs.length} filtered jobs`);
        // ============================================
        // RELEVANCE SCORING
        // ============================================
        // Calculate relevance scores for sorting
        const calculateRelevanceScore = (job) => {
            var _a;
            let score = 0;
            const title = (job.title || '').toLowerCase();
            const company = (job.company || '').toLowerCase();
            const description = (job.description || job.summary || '').toLowerCase();
            const jobLocation = (job.location || '').toLowerCase();
            const jobTechs = Array.isArray(job.technologies) ? job.technologies.map(t => t.toLowerCase()) : [];
            // Score for keyword matches
            if (keyword) {
                const tokens = keyword.toLowerCase().split(/\s+/).filter(t => t.length > 1);
                for (const token of tokens) {
                    if (title.includes(token))
                        score += 30;
                    if (company === token)
                        score += 100;
                    else if (company.includes(token))
                        score += 50;
                    if (jobTechs.some(t => t.includes(token)))
                        score += 25;
                    if (description.includes(token))
                        score += 5;
                }
            }
            // Score for technology matches (with priority for title matches)
            if (technologies.length > 0) {
                for (const tech of technologies) {
                    const variations = getTechVariations(tech);
                    if (variations.some(v => title.includes(v)))
                        score += 40;
                    if (variations.some(v => jobTechs.some(jt => jt.includes(v))))
                        score += 30;
                }
            }
            // Score for location matches
            if (locations.length > 0) {
                for (const loc of locations) {
                    if (jobLocation.includes(loc))
                        score += 20;
                }
            }
            // Score for role function match
            if (roleFunction && ((_a = job.roleFunction) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === roleFunction.toLowerCase()) {
                score += 25;
            }
            return score;
        };
        // Sort by relevance if any search criteria present
        if (keyword || technologies.length > 0 || locations.length > 0 || roleFunction) {
            jobs.forEach(job => {
                job._score = calculateRelevanceScore(job);
            });
            jobs.sort((a, b) => {
                var _a, _b;
                // First by relevance score
                const scoreDiff = (b._score || 0) - (a._score || 0);
                if (scoreDiff !== 0)
                    return scoreDiff;
                // Then by date
                const dateA = ((_a = a.postedAt) === null || _a === void 0 ? void 0 : _a._seconds) || 0;
                const dateB = ((_b = b.postedAt) === null || _b === void 0 ? void 0 : _b._seconds) || 0;
                return dateB - dateA;
            });
        }
        // Format response
        const formattedJobs = jobs.map(job => ({
            id: job.id,
            title: job.title || '',
            company: job.company || '',
            logoUrl: job.companyLogo || job.logoUrl || '',
            location: job.location || '',
            tags: Array.isArray(job.skills) ? job.skills : [],
            postedAt: job.postedAt,
            applyUrl: job.applyUrl || '',
            description: job.description || job.summary || '',
            seniority: job.seniority || job.level || '',
            type: job.type || job.employmentType || '',
            salaryRange: job.salaryRange || job.compensation || '',
            remote: job.remote || job.remotePolicy || '',
            ats: job.ats || 'workday',
            industries: job.industries || [],
            technologies: job.technologies || []
        }));
        res.status(200).json({
            success: true,
            count: formattedJobs.length,
            jobs: formattedJobs
        });
    }
    catch (error) {
        console.error('❌ Error in job search:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
/**
 * Cloud Function to download CV from Firebase Storage
 * This avoids CORS issues by downloading the file server-side
 * Using onRequest with explicit CORS handling for better compatibility
 */
exports.downloadCV = (0, https_1.onRequest)({
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
    invoker: 'public',
}, async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.status(204).send('');
        return;
    }
    // Set CORS headers for actual request
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    try {
        // Verify authentication via Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'unauthenticated',
                message: 'User must be authenticated'
            });
            return;
        }
        const token = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(token);
        }
        catch (authError) {
            res.status(401).json({
                success: false,
                error: 'unauthenticated',
                message: 'Invalid authentication token'
            });
            return;
        }
        const { storagePath } = req.body;
        if (!storagePath) {
            res.status(400).json({
                success: false,
                error: 'invalid-argument',
                message: 'Storage path is required'
            });
            return;
        }
        console.log('📥 Downloading CV from storage path:', storagePath);
        console.log('   User ID:', decodedToken.uid);
        // Get the file from Firebase Storage using Admin SDK
        const bucket = admin.storage().bucket();
        const file = bucket.file(storagePath);
        // Check if file exists and user has permission
        const [exists] = await file.exists();
        if (!exists) {
            res.status(404).json({
                success: false,
                error: 'not-found',
                message: 'CV file not found'
            });
            return;
        }
        // Verify the file belongs to the user (security check)
        const pathParts = storagePath.split('/');
        if (pathParts[0] === 'cvs' && pathParts[1] !== decodedToken.uid) {
            res.status(403).json({
                success: false,
                error: 'permission-denied',
                message: 'Access denied to this CV file'
            });
            return;
        }
        // Download the file
        const [fileBuffer] = await file.download();
        // Convert to base64 for transmission
        const base64 = fileBuffer.toString('base64');
        const [metadata] = await file.getMetadata();
        const contentType = metadata.contentType || 'application/pdf';
        console.log('✅ CV downloaded successfully:', {
            size: fileBuffer.length,
            contentType
        });
        res.status(200).json({
            success: true,
            data: base64,
            contentType,
            size: fileBuffer.length
        });
    }
    catch (error) {
        console.error('❌ Error downloading CV:', error);
        res.status(500).json({
            success: false,
            error: 'internal',
            message: `Failed to download CV: ${error.message}`
        });
    }
});
/**
 * Create a Stripe Portal Session
 * This endpoint creates a portal session for customer to manage billing
 */
exports.createPortalSession = (0, https_1.onRequest)({
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
    invoker: 'public',
}, async (req, res) => {
    // Get origin from request
    const origin = req.headers.origin;
    // Set CORS headers
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '3600');
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ success: false, message: 'Method not allowed' });
        return;
    }
    try {
        const { userId, returnUrl } = req.body;
        if (!userId) {
            res.status(400).json({
                success: false,
                message: 'userId is required'
            });
            return;
        }
        const stripe = await getStripeClient();
        // Get customer ID from Firestore
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new Error('User not found');
        }
        const userData = userDoc.data();
        const customerId = userData === null || userData === void 0 ? void 0 : userData.stripeCustomerId;
        if (!customerId) {
            throw new Error('No Stripe customer found for this user');
        }
        // Create portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl || req.headers.referer || 'https://jobz.ai',
        });
        res.status(200).json({ success: true, url: session.url });
    }
    catch (error) {
        console.error('Error creating portal session:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
});
/**
 * Generate Interview Questions using GPT-4o
 * This endpoint is used by the Practice Live feature in InterviewPrepPage
 * Uses GPT-4o for high-quality question generation with JSON response format
 */
exports.generateQuestions = (0, https_1.onRequest)({
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
    invoker: 'public',
}, async (req, res) => {
    var _a, _b;
    // Get origin from request for CORS
    const origin = req.headers.origin;
    // Set CORS headers
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '3600');
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ success: false, message: 'Method not allowed' });
        return;
    }
    try {
        console.log("🧠 GPT-4o Question Generation endpoint called");
        console.log("   Request body keys:", Object.keys(req.body || {}));
        // Get OpenAI API key
        let apiKey;
        try {
            apiKey = await (0, openai_1.getOpenAIApiKey)();
        }
        catch (keyError) {
            console.error('❌ Error retrieving OpenAI API key:', keyError);
            res.status(500).json({
                status: 'error',
                message: `Failed to retrieve API key: ${keyError.message}`,
                error: true,
                errorMessage: keyError.message
            });
            return;
        }
        if (!apiKey) {
            console.error('❌ ERROR: OpenAI API key missing');
            res.status(500).json({
                status: 'error',
                message: 'OpenAI API key is missing.',
                error: true,
                errorMessage: 'API key not configured'
            });
            return;
        }
        const { prompt, max_tokens = 2000, temperature = 0.7 } = req.body;
        if (!prompt) {
            res.status(400).json({
                status: 'error',
                message: 'Prompt is required',
                error: true,
                errorMessage: 'Missing prompt'
            });
            return;
        }
        console.log('📡 Sending request to OpenAI GPT-4o for question generation...');
        // Call OpenAI API with GPT-4o for better quality
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert interview coach specializing in creating high-quality, targeted interview questions. Generate questions that are specific, relevant, and help candidates prepare effectively. Always respond with valid JSON format containing the questions and answers.'
                    },
                    {
                        role: 'user',
                        content: prompt + '\n\nRespond with valid JSON format.'
                    }
                ],
                temperature: temperature,
                max_completion_tokens: max_tokens,
                response_format: { type: 'json_object' }
            })
        });
        if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text();
            console.error('❌ OpenAI API error:', errorText);
            res.status(openaiResponse.status).json({
                status: 'error',
                message: 'Failed to generate questions',
                error: true,
                errorMessage: errorText.substring(0, 200)
            });
            return;
        }
        const responseData = await openaiResponse.json();
        const content = (_b = (_a = responseData.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        if (!content) {
            res.status(500).json({
                status: 'error',
                message: 'Empty response from AI',
                error: true,
                errorMessage: 'No content in response'
            });
            return;
        }
        console.log('✅ GPT-4o question generation completed');
        // Parse and return the JSON response
        try {
            const questionsData = JSON.parse(content);
            res.json({
                status: 'success',
                text: content,
                data: questionsData,
                choices: responseData.choices
            });
        }
        catch (parseError) {
            // Return raw content if not valid JSON
            res.json({
                status: 'success',
                text: content,
                choices: responseData.choices
            });
        }
    }
    catch (error) {
        console.error("❌ Error in question generation:", error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to generate questions',
            error: true,
            errorMessage: error.message
        });
    }
});
// ============================================
// 🚀 EXPRESS API FUNCTION
// This replaces/updates the legacy Gen 1 'api' function
// Handles /api/apollo/*, /api/generate-questions, etc.
// ============================================
const functionsGen1 = require("firebase-functions");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const expressApp = require('express');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const corsMiddleware = require('cors');
const app = expressApp();
app.use(corsMiddleware({ origin: true }));
app.use(expressApp.json());
// Apollo Preview endpoint
app.post('/api/apollo/preview', async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    console.log('🔍 Apollo Preview called via Express api');
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized - Missing or invalid token' });
            return;
        }
        const idToken = authHeader.split('Bearer ')[1];
        try {
            await admin.auth().verifyIdToken(idToken);
        }
        catch (error) {
            res.status(401).json({ error: 'Unauthorized - Invalid token' });
            return;
        }
        const { targeting } = req.body;
        if (!targeting) {
            res.status(400).json({ error: 'Missing targeting' });
            return;
        }
        // Need at least personTitles and personLocations for a valid preview
        if (!((_a = targeting.personTitles) === null || _a === void 0 ? void 0 : _a.length) || !((_b = targeting.personLocations) === null || _b === void 0 ? void 0 : _b.length)) {
            res.status(200).json({
                success: true,
                totalAvailable: 0,
                isLowVolume: true,
                message: 'Add job titles and locations to see estimated prospects'
            });
            return;
        }
        // Get Apollo API key from settings
        const settingsDoc = await admin.firestore().collection('settings').doc('apollo').get();
        if (!settingsDoc.exists) {
            res.status(500).json({ error: 'Apollo API key not configured' });
            return;
        }
        const apiKey = (_c = settingsDoc.data()) === null || _c === void 0 ? void 0 : _c.API_KEY;
        if (!apiKey) {
            res.status(500).json({ error: 'Apollo API key is empty' });
            return;
        }
        // Build Apollo search params (minimal - just for count)
        const searchParams = {
            per_page: 1,
            page: 1,
            person_titles: targeting.personTitles,
            person_locations: targeting.personLocations
        };
        if (((_d = targeting.seniorities) === null || _d === void 0 ? void 0 : _d.length) > 0) {
            searchParams.person_seniorities = targeting.seniorities;
        }
        if (((_e = targeting.companySizes) === null || _e === void 0 ? void 0 : _e.length) > 0) {
            const sizeMapping = {
                '1-10': '1,10', '11-50': '11,50', '51-200': '51,200',
                '201-500': '201,500', '501-1000': '501,1000', '1001-5000': '1001,5000', '5001+': '5001,10000'
            };
            searchParams.organization_num_employees_ranges = targeting.companySizes.map((s) => sizeMapping[s] || s);
        }
        if (((_f = targeting.industries) === null || _f === void 0 ? void 0 : _f.length) > 0) {
            searchParams.organization_industries = targeting.industries;
        }
        if (((_g = targeting.targetCompanies) === null || _g === void 0 ? void 0 : _g.length) > 0) {
            searchParams.q_organization_name = targeting.targetCompanies.join(' OR ');
        }
        console.log('Apollo preview params:', JSON.stringify(searchParams));
        const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'X-Api-Key': apiKey
            },
            body: JSON.stringify(searchParams)
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Apollo API error:', response.status, errorText);
            res.status(500).json({ error: `Apollo API error: ${response.status}` });
            return;
        }
        const data = await response.json();
        const totalAvailable = ((_h = data.pagination) === null || _h === void 0 ? void 0 : _h.total_entries) || 0;
        const isLowVolume = totalAvailable < 20;
        console.log('Apollo preview result:', totalAvailable, 'prospects');
        res.status(200).json({
            success: true,
            totalAvailable,
            isLowVolume,
            message: isLowVolume ? 'Low prospect volume. Consider broadening your search.' : undefined
        });
    }
    catch (error) {
        console.error('Error previewing Apollo search:', error);
        res.status(500).json({ error: 'Failed to preview search', details: error.message });
    }
});
// Apollo Search endpoint
app.post('/api/apollo/search', async (req, res) => {
    console.log('🔍 Apollo Search called via Express api');
    // Import and delegate to the onRequest function
    const { searchApolloContacts } = await Promise.resolve().then(() => require('./apollo/searchContacts'));
    // The searchApolloContacts is an onRequest handler, we need to manually invoke it
    // For now, return a placeholder - full implementation would require restructuring
    res.status(200).json({
        success: true,
        message: 'Apollo search endpoint (use direct function call for full functionality)',
        contactsFound: 0
    });
});
// Apollo Enrich endpoint
app.post('/api/apollo/enrich', async (req, res) => {
    console.log('🔍 Apollo Enrich called via Express api');
    res.status(200).json({
        success: true,
        message: 'Apollo enrich endpoint (use direct function call for full functionality)'
    });
});
// ============================================
// OpenAI Realtime Session Endpoint (Mock Interview)
// Creates WebSocket session for real-time voice interview
// ============================================
app.post('/api/openai-realtime-session', async (req, res) => {
    var _a, _b;
    try {
        console.log('🎙️ OpenAI Realtime Session endpoint called');
        // Get API key from Firestore or environment variables
        let apiKey = null;
        try {
            apiKey = await (0, openai_1.getOpenAIApiKey)();
        }
        catch (e) {
            console.error('Error getting OpenAI API key:', e);
        }
        if (!apiKey) {
            console.error('❌ OpenAI API key is missing');
            res.status(500).json({
                status: 'error',
                message: 'OpenAI API key is missing. Please add it to Firestore (settings/openai) or .env file.'
            });
            return;
        }
        console.log('✅ API key retrieved (first 10 chars):', apiKey.substring(0, 10) + '...');
        // Model for Realtime API (GA version)
        const model = 'gpt-4o-realtime-preview-2024-12-17';
        console.log('📡 Creating OpenAI Realtime client secret via /v1/realtime/client_secrets (GA API)...');
        // Use /v1/realtime/client_secrets endpoint for GA API
        const secretResponse = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({})
        });
        if (!secretResponse.ok) {
            const errorText = await secretResponse.text();
            console.error('❌ OpenAI client_secrets creation failed:', secretResponse.status);
            console.error('   Error:', errorText);
            let errorMessage = 'Failed to create client secret';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = ((_a = errorData.error) === null || _a === void 0 ? void 0 : _a.message) || errorMessage;
            }
            catch (e) {
                errorMessage = errorText.substring(0, 200);
            }
            res.status(secretResponse.status).json({
                status: 'error',
                message: errorMessage
            });
            return;
        }
        const secretData = await secretResponse.json();
        console.log('✅ Client secret response received');
        // Extract client_secret
        let clientSecret;
        let expiresAt;
        if ((_b = secretData.client_secret) === null || _b === void 0 ? void 0 : _b.value) {
            clientSecret = secretData.client_secret.value;
            expiresAt = secretData.client_secret.expires_at;
        }
        else if (typeof secretData.client_secret === 'string') {
            clientSecret = secretData.client_secret;
            expiresAt = secretData.expires_at;
        }
        else if (secretData.value) {
            clientSecret = secretData.value;
            expiresAt = secretData.expires_at;
        }
        if (!clientSecret) {
            console.error('❌ Could not extract client_secret from response');
            res.status(500).json({
                status: 'error',
                message: 'Invalid response from OpenAI API - no client_secret found'
            });
            return;
        }
        // Construct the WebSocket URL for GA API
        const serverUrl = `wss://api.openai.com/v1/realtime?model=${model}`;
        console.log('✅ Client secret created successfully');
        res.json({
            url: serverUrl,
            client_secret: clientSecret,
            expires_at: expiresAt
        });
    }
    catch (error) {
        console.error('❌ Error in OpenAI Realtime session endpoint:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to create realtime session'
        });
    }
});
// ============================================
// Live Interview Analysis Endpoint
// Comprehensive analysis of mock interview transcript
// ============================================
app.post('/api/analyze-live-interview', async (req, res) => {
    var _a, _b, _c;
    try {
        console.log('📊 Live interview analysis endpoint called');
        const { transcript, jobContext, userProfile } = req.body;
        if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
            res.status(400).json({
                status: 'error',
                message: 'Transcript is required and must be a non-empty array'
            });
            return;
        }
        // Get API key
        let apiKey = null;
        try {
            apiKey = await (0, openai_1.getOpenAIApiKey)();
        }
        catch (e) {
            console.error('Error getting OpenAI API key:', e);
        }
        if (!apiKey) {
            res.status(500).json({
                status: 'error',
                message: 'OpenAI API key is missing'
            });
            return;
        }
        // Format transcript for analysis
        const formattedTranscript = transcript
            .filter((entry) => entry.text && entry.text.trim())
            .map((entry) => `${entry.role.toUpperCase()}: ${entry.text}`)
            .join('\n\n');
        // Build analysis prompt
        const systemPrompt = `You are an expert HR interview analyst. Analyze this mock interview transcript and provide structured feedback.
    
Return a JSON object with this structure:
{
  "verdict": { "passed": boolean, "confidence": "high"|"medium"|"low", "hireDecision": "yes"|"maybe"|"no" },
  "overallScore": 0-100,
  "executiveSummary": "2-3 sentence summary",
  "contentAnalysis": { "relevanceScore": 0-100, "specificityScore": 0-100, "didAnswerQuestions": "yes"|"partially"|"no", "examplesProvided": number, "examplesQuality": "strong"|"adequate"|"generic"|"none" },
  "expressionAnalysis": { "organizationScore": 0-100, "clarityScore": 0-100, "confidenceScore": 0-100, "structureAssessment": "organized"|"mixed"|"scattered"|"minimal" },
  "jobFitAnalysis": { "fitScore": 0-100, "matchedSkills": [], "missingSkills": [], "experienceRelevance": "high"|"medium"|"low", "wouldSurvive90Days": "likely"|"uncertain"|"unlikely" },
  "strengths": ["strength1", "strength2", ...],
  "criticalIssues": ["issue1", "issue2", ...],
  "actionPlan": ["action1", "action2", ...]
}`;
        const userPrompt = `Analyze this mock interview:

JOB CONTEXT:
- Company: ${(jobContext === null || jobContext === void 0 ? void 0 : jobContext.companyName) || 'Unknown'}
- Position: ${(jobContext === null || jobContext === void 0 ? void 0 : jobContext.position) || 'Unknown'}
- Description: ${((_a = jobContext === null || jobContext === void 0 ? void 0 : jobContext.jobDescription) === null || _a === void 0 ? void 0 : _a.substring(0, 500)) || 'Not provided'}

CANDIDATE PROFILE:
- Name: ${(userProfile === null || userProfile === void 0 ? void 0 : userProfile.firstName) || 'Unknown'} ${(userProfile === null || userProfile === void 0 ? void 0 : userProfile.lastName) || ''}
- Current Position: ${(userProfile === null || userProfile === void 0 ? void 0 : userProfile.currentPosition) || 'Not provided'}
- Experience: ${(userProfile === null || userProfile === void 0 ? void 0 : userProfile.yearsOfExperience) || 'Not provided'} years

TRANSCRIPT:
${formattedTranscript}

Provide comprehensive analysis in the JSON format specified.`;
        // Call OpenAI API
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: 'json_object' },
                max_completion_tokens: 4000,
                temperature: 0.3
            })
        });
        if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text();
            console.error('❌ OpenAI API error:', errorText);
            res.status(openaiResponse.status).json({
                status: 'error',
                message: `OpenAI API error: ${errorText.substring(0, 200)}`
            });
            return;
        }
        const responseData = await openaiResponse.json();
        const content = (_c = (_b = responseData.choices[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content;
        if (!content) {
            throw new Error('Empty response from OpenAI API');
        }
        const analysis = JSON.parse(content);
        console.log('✅ Interview analysis completed');
        res.json({
            status: 'success',
            analysis
        });
    }
    catch (error) {
        console.error('❌ Error in live interview analysis:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to analyze interview'
        });
    }
});
// ============================================
// CV Review AI Analysis Endpoint
// ============================================
app.post('/api/cv-review', async (req, res) => {
    var _a, _b, _c;
    try {
        console.log("🔵 CV Review AI endpoint called");
        // Get API key from Firestore
        let apiKey = null;
        try {
            const settingsDoc = await admin.firestore().collection('settings').doc('openai').get();
            if (settingsDoc.exists) {
                const data = settingsDoc.data();
                apiKey = (data === null || data === void 0 ? void 0 : data.apiKey) || (data === null || data === void 0 ? void 0 : data.api_key) || null;
            }
        }
        catch (e) {
            console.error('Failed to get API key from Firestore:', e);
        }
        if (!apiKey) {
            console.error('❌ OpenAI API key is missing for CV Review');
            res.status(500).json({
                status: 'error',
                message: 'OpenAI API key is missing.'
            });
            return;
        }
        const { cvData, jobContext } = req.body;
        if (!cvData) {
            res.status(400).json({
                status: 'error',
                message: 'CV data is required'
            });
            return;
        }
        // Build prompt
        const cvJson = JSON.stringify(cvData, null, 2);
        const firstName = ((_a = cvData.personalInfo) === null || _a === void 0 ? void 0 : _a.firstName) || 'there';
        let jobContextSection = '';
        if (jobContext) {
            jobContextSection = `
TARGET JOB:
- Position: ${jobContext.jobTitle || 'Not specified'}
- Company: ${jobContext.company || 'Not specified'}
- Keywords: ${(jobContext.keywords || []).join(', ') || 'None'}
`;
        }
        const systemPrompt = `You are an elite CV strategist. Analyze the CV and provide specific suggestions.

Response format MUST be valid JSON:
{
  "summary": {
    "greeting": "Hey ${firstName}, I've analyzed your CV...",
    "overallScore": 0-100,
    "strengths": ["strength1", "strength2"],
    "mainIssues": ["issue1", "issue2"]
  },
  "suggestions": [
    {
      "id": "unique-id",
      "title": "Short title",
      "description": "What to improve and why",
      "section": "contact|about|experiences|education|skills|certifications|projects|languages",
      "priority": "high|medium|low",
      "tags": ["missing_info", "ats_optimize", "add_impact"],
      "action": {
        "type": "add|update|rewrite",
        "targetSection": "section-name",
        "targetField": "field-name",
        "suggestedValue": "suggested text"
      },
      "isApplicable": true
    }
  ],
  "analyzedAt": "${new Date().toISOString()}"
}`;
        const userPrompt = `Analyze this CV:
${jobContextSection}

CV DATA:
${cvJson}

Provide 5-10 specific, actionable suggestions. Be specific to this CV.`;
        // Call OpenAI API
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-5.2",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: 'json_object' },
                max_completion_tokens: 8000,
                temperature: 0.3
            })
        });
        if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text();
            console.error('❌ OpenAI API error:', errorText);
            res.status(openaiResponse.status).json({
                status: 'error',
                message: `OpenAI API error: ${errorText.substring(0, 200)}`
            });
            return;
        }
        const responseData = await openaiResponse.json();
        const content = (_c = (_b = responseData.choices[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content;
        if (!content) {
            throw new Error('Empty response from OpenAI API');
        }
        const reviewResult = JSON.parse(content);
        // Ensure required fields
        if (!reviewResult.summary) {
            reviewResult.summary = {
                greeting: `Hey ${firstName}, I've analyzed your CV.`,
                overallScore: 50,
                strengths: [],
                mainIssues: []
            };
        }
        if (!reviewResult.suggestions)
            reviewResult.suggestions = [];
        if (!reviewResult.analyzedAt)
            reviewResult.analyzedAt = new Date().toISOString();
        console.log('✅ CV Review completed successfully');
        res.json({
            status: 'success',
            result: reviewResult,
            usage: responseData.usage
        });
    }
    catch (error) {
        console.error('❌ Error in CV Review:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to analyze CV'
        });
    }
});
// Gmail Token Exchange endpoint
app.post('/api/gmail/exchange-code', async (req, res) => {
    console.log('📧 Gmail Token Exchange called');
    try {
        const { code } = req.body;
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userId = decodedToken.uid;
        // Get Gmail settings
        const settingsDoc = await admin.firestore().collection('settings').doc('gmail').get();
        if (!settingsDoc.exists) {
            res.status(500).json({ error: 'Gmail settings not configured' });
            return;
        }
        const { CLIENT_ID, CLIENT_SECRET } = settingsDoc.data();
        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: 'postmessage',
                grant_type: 'authorization_code'
            })
        });
        const tokens = await tokenResponse.json();
        if (!tokenResponse.ok) {
            console.error('Token exchange failed:', tokens);
            res.status(400).json({ error: tokens.error_description || 'Failed to exchange code' });
            return;
        }
        // Get user email
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        const userData = await userResponse.json();
        // Prepare token data
        const tokenData = {
            accessToken: tokens.access_token,
            email: userData.email,
            expiresAt: Date.now() + (tokens.expires_in * 1000),
            connectedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (tokens.refresh_token) {
            tokenData.refreshToken = tokens.refresh_token;
        }
        // Save tokens to Firestore
        await admin.firestore().collection('gmailTokens').doc(userId).set(tokenData, { merge: true });
        res.json({ success: true, email: userData.email });
    }
    catch (error) {
        console.error('Error in Gmail exchange:', error);
        res.status(500).json({ error: error.message });
    }
});
// Catch-all for debugging
// ============================================
// NEW ENDPOINTS RESTORED
// ============================================
// Perplexity API
app.post('/api/perplexity', async (req, res) => {
    var _a;
    console.log('🧠 Perplexity API called');
    try {
        // Parse body if it's a string (sometimes happens with certain content-types or proxies)
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            }
            catch (e) {
                console.error('Failed to parse req.body:', e);
            }
        }
        console.log('📝 Incoming Request Body:', JSON.stringify(body).substring(0, 500));
        const { model, messages: bodyMessages, prompt, systemMessage, temperature = 0.7, max_tokens = 1000 } = body;
        let messages = bodyMessages;
        // Handle legacy/frontend format where prompt is sent instead of messages
        if (!messages && prompt) {
            messages = [
                { role: 'system', content: systemMessage || 'You are a helpful AI assistant.' },
                { role: 'user', content: prompt }
            ];
        }
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            console.error('❌ Messages array is missing or empty (and no prompt provided)');
            return res.status(400).json({ error: 'Messages array or prompt is required.' });
        }
        // Get Perplexity API key
        let apiKey = process.env.PERPLEXITY_API_KEY;
        if (!apiKey) {
            const settingsDoc = await admin.firestore().collection('settings').doc('perplexity').get();
            apiKey = (_a = settingsDoc.data()) === null || _a === void 0 ? void 0 : _a.apiKey;
        }
        if (!apiKey) {
            console.error('❌ Perplexity API key missing');
            return res.status(500).json({ error: 'Perplexity API key not configured' });
        }
        // Trim key to remove potential whitespace/newlines
        apiKey = apiKey.trim();
        console.log(`🔑 Using Perplexity Key: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)} (Length: ${apiKey.length})`);
        const payload = {
            model: model || 'llama-3.1-sonar-small-128k-online',
            messages,
            temperature,
            max_tokens
        };
        console.log('Tb Sending Payload to Perplexity:', JSON.stringify(payload).substring(0, 500));
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Jobzai/1.0 (Firebase Functions)'
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorText = await response.text();
            const headers = Object.fromEntries(response.headers.entries());
            console.error('Perplexity API error:', response.status, errorText);
            console.error('Response Headers:', headers);
            // Return detailed error for debugging
            return res.status(response.status).json({
                error: `Perplexity API Error (${response.status}): ${errorText}`,
                debug: {
                    status: response.status,
                    headers: headers,
                    keyLength: apiKey.length,
                    keyStart: apiKey.substring(0, 5),
                    payloadPreview: JSON.stringify(payload).substring(0, 200)
                }
            });
        }
        const data = await response.json();
        res.json(data);
    }
    catch (error) {
        console.error('Error in Perplexity API:', error);
        res.status(500).json({ error: error.message });
    }
});
// Chat Fast (GPT-4o-mini)
app.post('/api/chat-fast', async (req, res) => {
    console.log('⚡ Chat Fast API called');
    try {
        const { prompt, systemMessage, temperature = 0.7, max_tokens = 1000 } = req.body;
        const apiKey = await (0, openai_1.getOpenAIApiKey)();
        if (!apiKey) {
            return res.status(500).json({ error: 'OpenAI API key not configured' });
        }
        const messages = [];
        if (systemMessage) {
            messages.push({ role: 'system', content: systemMessage });
        }
        messages.push({ role: 'user', content: prompt });
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages,
                temperature,
                max_tokens
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI API error:', errorText);
            return res.status(response.status).json({ error: errorText });
        }
        const data = await response.json();
        res.json(data);
    }
    catch (error) {
        console.error('Error in Chat Fast API:', error);
        res.status(500).json({ error: error.message });
    }
});
// Fetch Job Post Content
app.post('/api/fetch-job-post', async (req, res) => {
    console.log('📥 Fetch Job Post called');
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        // Simple fetch implementation - in a real scenario, use a scraping service or Puppeteer
        // For now, we'll try to fetch the HTML and return it, or use a text extractor
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch URL: ${response.status}`);
            }
            const html = await response.text();
            // Very basic text extraction (naive)
            const text = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
                .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, "")
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .substring(0, 10000); // Limit size
            res.json({ content: text, rawHtml: html.substring(0, 20000) });
        }
        catch (fetchError) {
            console.warn('Direct fetch failed, returning error for fallback:', fetchError.message);
            res.status(422).json({ error: 'Could not fetch content directly', details: fetchError.message });
        }
    }
    catch (error) {
        console.error('Error fetching job post:', error);
        res.status(500).json({ error: error.message });
    }
});
// Claude API
app.post('/api/claude', async (req, res) => {
    var _a;
    console.log('🧠 Claude API called');
    try {
        const { model, messages, system, temperature = 0.7, max_tokens = 1000 } = req.body;
        // Get Anthropic API key
        let apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            const settingsDoc = await admin.firestore().collection('settings').doc('anthropic').get();
            apiKey = (_a = settingsDoc.data()) === null || _a === void 0 ? void 0 : _a.apiKey;
        }
        if (!apiKey) {
            return res.status(500).json({ error: 'Anthropic API key not configured' });
        }
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: model || 'claude-3-5-sonnet-20240620',
                messages,
                system,
                temperature,
                max_tokens
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Anthropic API error:', errorText);
            return res.status(response.status).json({ error: errorText });
        }
        const data = await response.json();
        res.json(data);
    }
    catch (error) {
        console.error('Error in Claude API:', error);
        res.status(500).json({ error: error.message });
    }
});
// GPT API (Standard)
app.post('/api/gpt', async (req, res) => {
    console.log('🧠 GPT API called');
    try {
        const { model, messages, temperature = 0.7, max_tokens = 1000, response_format } = req.body;
        const apiKey = await (0, openai_1.getOpenAIApiKey)();
        if (!apiKey) {
            return res.status(500).json({ error: 'OpenAI API key not configured' });
        }
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model || 'gpt-4o',
                messages,
                temperature,
                max_tokens,
                response_format
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI API error:', errorText);
            return res.status(response.status).json({ error: errorText });
        }
        const data = await response.json();
        res.json(data);
    }
    catch (error) {
        console.error('Error in GPT API:', error);
        res.status(500).json({ error: error.message });
    }
});
// ChatGPT Alias (for legacy calls)
app.post('/api/chatgpt', async (req, res) => {
    console.log('🧠 ChatGPT API (Alias) called');
    // Forward to GPT handler logic
    try {
        const { prompt, systemMessage, temperature = 0.7 } = req.body;
        const apiKey = await (0, openai_1.getOpenAIApiKey)();
        if (!apiKey) {
            return res.status(500).json({ error: 'OpenAI API key not configured' });
        }
        const messages = [];
        if (systemMessage) {
            messages.push({ role: 'system', content: systemMessage });
        }
        messages.push({ role: 'user', content: prompt });
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages,
                temperature,
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI API error:', errorText);
            return res.status(response.status).json({ error: errorText });
        }
        const data = await response.json();
        res.json(data);
    }
    catch (error) {
        console.error('Error in ChatGPT API:', error);
        res.status(500).json({ error: error.message });
    }
});
// Catch-all for debugging
app.all('*', (req, res) => {
    console.log(`📡 API request: ${req.method} ${req.path}`);
    res.status(404).json({ error: `Endpoint not found: ${req.path}`, availableRoutes: ['/api/apollo/preview', '/api/apollo/search', '/api/apollo/enrich', '/api/openai-realtime-session', '/api/analyze-live-interview', '/api/cv-review', '/api/gmail/exchange-code'] });
});
// Export the Express app as a Cloud Function (Gen 1)
exports.api = functionsGen1.https.onRequest(app);
//# sourceMappingURL=index.js.map