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
exports.updateCampaignEmails = exports.startCampaign = void 0;
const https_1 = require("firebase-functions/v2/https");
const https_2 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const mailgun_js_1 = require("./lib/mailgun.js");
// Initialize Firebase Admin
admin.initializeApp();
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
    cors: true
}, async (req, res) => {
    try {
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
//# sourceMappingURL=index.js.map