"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadCV = exports.searchJobs = exports.processStripeSession = exports.stripeWebhook = exports.createCheckoutSession = exports.sendHubSpotEventFunction = exports.syncUserToHubSpot = exports.syncUserToBrevo = exports.analyzeResumePremium = exports.analyzeCVVision = exports.updateCampaignEmails = exports.startCampaign = exports.testNewFunction = exports.matchJobsForUsers = exports.generateUserEmbedding = exports.generateJobEmbedding = exports.fetchJobsFromATS = void 0;
const admin = require("firebase-admin");
if (!admin.apps.length) {
    admin.initializeApp();
}
var fetchJobs_1 = require("./fetchJobs");
Object.defineProperty(exports, "fetchJobsFromATS", { enumerable: true, get: function () { return fetchJobs_1.fetchJobsFromATS; } });
var generateJobEmbedding_1 = require("./generateJobEmbedding");
Object.defineProperty(exports, "generateJobEmbedding", { enumerable: true, get: function () { return generateJobEmbedding_1.generateJobEmbedding; } });
var generateUserEmbedding_1 = require("./generateUserEmbedding");
Object.defineProperty(exports, "generateUserEmbedding", { enumerable: true, get: function () { return generateUserEmbedding_1.generateUserEmbedding; } });
var matchJobsForUsers_1 = require("./matchJobsForUsers");
Object.defineProperty(exports, "matchJobsForUsers", { enumerable: true, get: function () { return matchJobsForUsers_1.matchJobsForUsers; } });
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
const mailgun_js_1 = require("./lib/mailgun.js");
const openai_1 = require("openai");
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
// Initialize OpenAI client with Firestore API key
let openai = null;
const getOpenAIApiKey = async () => {
    var _a, _b;
    try {
        // Get API key from Firestore (settings/openai)
        console.log('🔑 Attempting to retrieve OpenAI API key from Firestore...');
        const settingsDoc = await admin.firestore().collection('settings').doc('openai').get();
        if (settingsDoc.exists) {
            const data = settingsDoc.data();
            console.log('   Document exists, fields:', Object.keys(data || {}));
            const apiKey = (data === null || data === void 0 ? void 0 : data.apiKey) || (data === null || data === void 0 ? void 0 : data.api_key);
            if (apiKey) {
                console.log('✅ OpenAI API key retrieved from Firestore (first 10 chars):', apiKey.substring(0, 10) + '...');
                return apiKey;
            }
            else {
                console.warn('⚠️  Document exists but apiKey field is missing. Available fields:', Object.keys(data || {}));
            }
        }
        else {
            console.warn('⚠️  Document settings/openai does not exist in Firestore');
        }
    }
    catch (error) {
        console.error('❌ Failed to retrieve API key from Firestore:', error);
        console.error('   Error message:', error === null || error === void 0 ? void 0 : error.message);
        console.error('   Error code:', error === null || error === void 0 ? void 0 : error.code);
    }
    // Fallback to environment variable
    if (process.env.OPENAI_API_KEY) {
        console.log('Using OpenAI API key from environment variable');
        return process.env.OPENAI_API_KEY;
    }
    // Fallback to Firebase config
    try {
        const config = functions.config();
        // Check both 'api_key' and 'key' for backwards compatibility
        const firebaseConfigKey = ((_a = config.openai) === null || _a === void 0 ? void 0 : _a.api_key) || ((_b = config.openai) === null || _b === void 0 ? void 0 : _b.key);
        if (firebaseConfigKey) {
            console.log('✅ Using OpenAI API key from Firebase config (first 10 chars):', firebaseConfigKey.substring(0, 10) + '...');
            return firebaseConfigKey;
        }
    }
    catch (e) {
        console.warn('Could not access Firebase config:', e);
    }
    throw new Error('OpenAI API key not found in Firestore (settings/openai), environment, or Firebase config');
};
// Initialize OpenAI client lazily
const getOpenAIClient = async () => {
    if (!openai) {
        const apiKey = await getOpenAIApiKey();
        openai = new openai_1.default({ apiKey });
    }
    return openai;
};
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
    var _a, _b, _c, _d, _e;
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
        const openaiClient = await getOpenAIClient();
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
        // Call OpenAI API with premium prompt
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
            max_tokens: 8000,
            temperature: 0.2,
        });
        console.log('✅ Premium analysis received from GPT-4o');
        const content = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        if (!content) {
            throw new Error('Empty response from GPT-4o');
        }
        let parsedAnalysis = JSON.parse(content);
        // Debug: Log the structure of parsed analysis
        console.log('📊 Parsed analysis structure:', {
            hasAnalysis: !!parsedAnalysis.analysis,
            hasCVRewrite: !!parsedAnalysis.cv_rewrite,
            cvRewriteKeys: parsedAnalysis.cv_rewrite ? Object.keys(parsedAnalysis.cv_rewrite) : [],
            analysisKeys: Object.keys(parsedAnalysis)
        });
        // Save to Firestore if userId and analysisId provided
        if (userId && analysisId) {
            // Extract CV text and CV rewrite from the analysis (cv_rewrite is inside analysis object)
            const cvRewrite = ((_c = parsedAnalysis.analysis) === null || _c === void 0 ? void 0 : _c.cv_rewrite) || null;
            const cvText = (cvRewrite === null || cvRewrite === void 0 ? void 0 : cvRewrite.extracted_text) ||
                (cvRewrite === null || cvRewrite === void 0 ? void 0 : cvRewrite.initial_cv) ||
                ((_d = cvRewrite === null || cvRewrite === void 0 ? void 0 : cvRewrite.analysis) === null || _d === void 0 ? void 0 : _d.extracted_text) ||
                '';
            console.log('💾 Preparing to save to Firestore:', {
                userId,
                analysisId,
                hasCVRewrite: !!cvRewrite,
                cvTextLength: cvText.length,
                hasJobDescription: !!jobContext.jobDescription,
                jobDescriptionLength: ((_e = jobContext.jobDescription) === null || _e === void 0 ? void 0 : _e.length) || 0,
                cvRewriteKeys: cvRewrite ? Object.keys(cvRewrite) : []
            });
            await admin.firestore()
                .collection('users')
                .doc(userId)
                .collection('analyses')
                .doc(analysisId)
                .set(Object.assign(Object.assign({}, parsedAnalysis.analysis), { id: analysisId, userId, jobTitle: jobContext.jobTitle, company: jobContext.company, jobDescription: jobContext.jobDescription, cvText: cvText, extractedText: cvText, date: admin.firestore.FieldValue.serverTimestamp(), status: 'completed', type: 'premium', matchScore: parsedAnalysis.analysis.match_scores.overall_score }), { merge: true });
            console.log('✅ Successfully saved to Firestore', {
                savedCVTextLength: cvText.length,
                savedCVRewrite: !!cvRewrite
            });
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
    timeoutSeconds: 300,
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
        const { model, messages, response_format, max_tokens, temperature } = req.body;
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
            openaiClient = await getOpenAIClient();
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
        // Call OpenAI API
        const completion = await openaiClient.chat.completions.create({
            model: model || 'gpt-4o',
            messages: messages,
            response_format: response_format || { type: 'json_object' },
            max_tokens: max_tokens || 6000,
            temperature: temperature || 0.1, // Lower temperature for more precise, consistent analysis
        });
        console.log('✅ GPT-4o Vision API response received');
        // Extract content
        const content = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        if (!content) {
            throw new Error('Empty response from GPT-4o Vision API');
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
    timeoutSeconds: 300,
    invoker: 'public',
}, async (req, res) => {
    var _a, _b, _c, _d, _e;
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
    try {
        console.log('🎯 Premium ATS analysis request received');
        const { resumeImages, jobContext, userId, analysisId } = req.body;
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
            openaiClient = await getOpenAIClient();
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
        // Call OpenAI API with premium prompt
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
            max_tokens: 8000,
            temperature: 0.2, // Low for consistency and precision
        });
        console.log('✅ Premium analysis received from GPT-4o');
        // Extract and parse content
        const content = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        if (!content) {
            throw new Error('Empty response from GPT-4o');
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
            await admin.firestore()
                .collection('users')
                .doc(userId)
                .collection('analyses')
                .doc(analysisId)
                .set(Object.assign(Object.assign({}, parsedAnalysis.analysis), { id: analysisId, userId, jobTitle: jobContext.jobTitle, company: jobContext.company, location: jobContext.location || null, jobUrl: jobContext.jobUrl || null, date: admin.firestore.FieldValue.serverTimestamp(), status: 'completed', type: 'premium', 
                // Store match score at top level for easy querying
                matchScore: parsedAnalysis.analysis.match_scores.overall_score, category: parsedAnalysis.analysis.match_scores.category, 
                // Store key data for list views
                keyFindings: parsedAnalysis.analysis.executive_summary, categoryScores: {
                    skills: parsedAnalysis.analysis.match_scores.skills_score,
                    experience: parsedAnalysis.analysis.match_scores.experience_score,
                    education: parsedAnalysis.analysis.match_scores.education_score,
                    industryFit: parsedAnalysis.analysis.match_scores.industry_fit_score,
                } }), { merge: true });
            console.log('✅ Premium analysis saved to Firestore');
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
        // Handle OpenAI API errors
        if (error.response) {
            const statusCode = error.response.status || 500;
            const errorMessage = ((_d = (_c = error.response.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || error.message || 'Unknown error';
            res.status(statusCode).json({
                status: 'error',
                message: `OpenAI API error: ${errorMessage}`,
                error: (_e = error.response.data) === null || _e === void 0 ? void 0 : _e.error
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
            let existingPrice = prices.data.find(p => p.unit_amount === priceInCents && !p.recurring);
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
        // Create Checkout Session
        const sessionParams = {
            mode: isSubscription ? 'subscription' : 'payment',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            customer_email: req.body.customerEmail,
            metadata: {
                userId,
                planId,
                planName,
                credits: credits.toString(),
                type: type || 'plan',
            },
            success_url: successUrl || `${req.headers.origin || 'https://jobzai.firebaseapp.com'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${req.headers.origin || 'https://jobzai.firebaseapp.com'}/payment/cancel`,
        };
        // For subscriptions, add subscription metadata
        if (isSubscription) {
            sessionParams.subscription_data = {
                metadata: {
                    userId,
                    planId,
                    planName,
                    credits: credits.toString(),
                },
            };
        }
        const session = await stripe.checkout.sessions.create(sessionParams);
        console.log('✅ Stripe Checkout Session created:', session.id);
        res.status(200).json({
            success: true,
            sessionId: session.id,
            url: session.url,
        });
    }
    catch (error) {
        console.error('❌ Error creating Stripe Checkout Session:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create checkout session',
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
        // Create invoice record
        await admin.firestore().collection('users').doc(userId).collection('invoices').add({
            stripeSessionId: session.id,
            amount: (session.amount_total || 0) / 100,
            currency: session.currency || 'eur',
            status: 'paid',
            planId,
            planName,
            type,
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
 * Global Job Search API
 * Endpoint: GET /api/jobs
 * Query params: keyword, location, remote, type, seniority, timePosted
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
        console.log('🔍 Job search request received');
        console.log('   Query params:', req.query);
        // Extract query parameters
        const keyword = req.query.keyword || '';
        const location = req.query.location || '';
        const remote = req.query.remote === 'true';
        const fullTime = req.query.fullTime === 'true';
        const senior = req.query.senior === 'true';
        const last24h = req.query.last24h === 'true';
        const experienceLevel = req.query.experienceLevel || '';
        const jobType = req.query.jobType || '';
        const limit = parseInt(req.query.limit || '200', 10);
        // Build optimized Firestore query
        // Start with base query - always order by postedAt
        let jobsQuery = admin.firestore()
            .collection('jobs');
        // Optimize: Use Firestore where() for filters that can be indexed
        // Note: We can only use one range filter (postedAt) with orderBy
        // So we prioritize last24h filter if present, otherwise use default limit
        if (last24h) {
            // Optimize: Filter by date at database level
            const oneDayAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
            jobsQuery = jobsQuery
                .where('postedAt', '>=', oneDayAgo)
                .orderBy('postedAt', 'desc')
                .limit(Math.min(limit, 1000));
            console.log(`   Using optimized query: last24h filter at database level`);
        }
        else {
            // Default: Get most recent jobs
            jobsQuery = jobsQuery
                .orderBy('postedAt', 'desc')
                .limit(Math.min(limit, 1000));
        }
        // Execute the optimized query
        const snapshot = await jobsQuery.get();
        console.log(`   Found ${snapshot.size} jobs in database (after Firestore filters)`);
        // Filter results in memory for text search
        let jobs = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // Apply keyword filter (search in title, description, and company)
        if (keyword) {
            const keywordLower = keyword.toLowerCase();
            console.log(`   Filtering by keyword: "${keyword}" (lowercase: "${keywordLower}")`);
            console.log(`   Total jobs before filter: ${jobs.length}`);
            // Log first 3 companies for debugging
            console.log(`   Sample companies:`, jobs.slice(0, 3).map(j => j.company || 'N/A'));
            jobs = jobs.filter(job => {
                const title = (job.title || '').toLowerCase();
                const description = (job.description || job.summary || '').toLowerCase();
                const company = (job.company || '').toLowerCase();
                const skills = Array.isArray(job.skills)
                    ? job.skills.join(' ').toLowerCase()
                    : '';
                const matches = title.includes(keywordLower) ||
                    description.includes(keywordLower) ||
                    company.includes(keywordLower) ||
                    skills.includes(keywordLower);
                // Log when we find a match with company name
                if (matches && company.includes(keywordLower)) {
                    console.log(`   ✓ Match found in company: "${job.company}"`);
                }
                return matches;
            });
            console.log(`   Jobs after keyword filter: ${jobs.length}`);
        }
        // Apply location filter
        if (location) {
            const locationLower = location.toLowerCase();
            jobs = jobs.filter(job => {
                const jobLocation = (job.location || '').toLowerCase();
                return jobLocation.includes(locationLower);
            });
        }
        // Apply remote filter
        if (remote) {
            jobs = jobs.filter(job => {
                const remotePolicy = (job.remote || job.remotePolicy || '').toLowerCase();
                return remotePolicy.includes('remote') ||
                    remotePolicy.includes('fully remote') ||
                    remotePolicy.includes('work from home');
            });
        }
        // Apply full-time filter
        if (fullTime) {
            jobs = jobs.filter(job => {
                const jobTypeStr = (job.type || job.employmentType || '').toLowerCase();
                return jobTypeStr.includes('full') ||
                    jobTypeStr.includes('full-time') ||
                    jobTypeStr.includes('fulltime');
            });
        }
        // Apply seniority filter (senior)
        if (senior) {
            jobs = jobs.filter(job => {
                const seniorityLevel = (job.seniority || job.level || '').toLowerCase();
                return seniorityLevel.includes('senior') ||
                    seniorityLevel.includes('sr') ||
                    seniorityLevel.includes('lead') ||
                    seniorityLevel.includes('principal');
            });
        }
        // Apply experience level filter (from dropdown)
        if (experienceLevel) {
            const levelLower = experienceLevel.toLowerCase();
            jobs = jobs.filter(job => {
                const jobLevel = (job.seniority || job.level || '').toLowerCase();
                return jobLevel.includes(levelLower);
            });
        }
        // Apply job type filter (from dropdown)
        if (jobType) {
            const typeLower = jobType.toLowerCase();
            jobs = jobs.filter(job => {
                const jobTypeStr = (job.type || job.employmentType || '').toLowerCase();
                return jobTypeStr.includes(typeLower);
            });
        }
        // Note: last24h filter is already applied at Firestore query level for optimization
        // No need to filter again in memory
        console.log(`   Returning ${jobs.length} filtered jobs`);
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
//# sourceMappingURL=index.js.map