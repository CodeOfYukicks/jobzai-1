"use strict";
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendHubSpotEventFunction = exports.syncUserToHubSpot = exports.syncUserToBrevo = exports.analyzeCVVision = exports.updateCampaignEmails = exports.startCampaign = void 0;
const https_1 = require("firebase-functions/v2/https");
const https_2 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const mailgun_js_1 = require("./lib/mailgun.js");
const openai_1 = require("openai");
const functions = require("firebase-functions");
// Initialize Firebase Admin
admin.initializeApp();
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
    var _a;
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
        if ((_a = config.openai) === null || _a === void 0 ? void 0 : _a.api_key) {
            console.log('Using OpenAI API key from Firebase config');
            return config.openai.api_key;
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
exports.updateCampaignEmails = (0, https_2.onRequest)({
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
 * Analyze CV with GPT-4o Vision
 * Endpoint: POST /api/analyze-cv-vision
 */
exports.analyzeCVVision = (0, https_2.onRequest)({
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 300,
    invoker: 'public', // Allow public access (no authentication required)
}, async (req, res) => {
    var _a, _b, _c, _d, _e;
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
        const { model, messages, response_format, max_tokens, temperature } = req.body;
        // Validate request
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
exports.syncUserToBrevo = (0, https_2.onRequest)({
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
exports.syncUserToHubSpot = (0, https_2.onRequest)({
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
exports.sendHubSpotEventFunction = (0, https_2.onRequest)({
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
//# sourceMappingURL=index.js.map