/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onCall} from "firebase-functions/v2/https";
import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { emailService } from './lib/mailgun.js';

// Initialize Firebase Admin
admin.initializeApp();

export const startCampaign = onCall({
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
        await emailService.sendEmail(
          target.email,
          campaign.template.subject,
          personalizedContent,
          `JobZ.AI <no-reply@${process.env.MAILGUN_DOMAIN}>`
        );

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
      } catch (error) {
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

  } catch (error) {
    console.error("Detailed error in startCampaign:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error(error instanceof Error ? error.message : "Failed to start campaign");
  }
});

export const updateCampaignEmails = onRequest({
  region: 'us-central1',
  cors: true
}, async (req, res) => {
  try {
    // Vérifier la méthode
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { userId, campaignId, emails } = req.body;
    console.log("Received update request for campaign:", { userId, campaignId, emailsCount: emails?.length });

    // Validation des données
    if (!userId || !campaignId || !Array.isArray(emails)) {
      console.error("Invalid request data:", { userId, campaignId, emails });
      res.status(400).send('Invalid request data');
      return;
    }

    const campaignRef = admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('campaigns')
      .doc(campaignId);

    const campaignDoc = await campaignRef.get();
    if (!campaignDoc.exists) {
      console.error("Campaign not found:", campaignId);
      res.status(404).send('Campaign not found');
      return;
    }

    const batch = admin.firestore().batch();

    // Ajouter les emails
    for (const email of emails) {
      const emailRef = campaignRef.collection('emails').doc();
      batch.set(emailRef, {
        to: email.to,
        subject: email.subject,
        content: email.content,
        status: 'sent',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: email.metadata || {}
      });
    }

    // Mettre à jour la campagne
    batch.update(campaignRef, {
      emailsSent: admin.firestore.FieldValue.increment(emails.length),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      status: 'completed'
    });

    await batch.commit();
    console.log("Successfully updated campaign:", { campaignId, emailsProcessed: emails.length });

    res.status(200).json({
      success: true,
      emailsProcessed: emails.length
    });

  } catch (error) {
    console.error('Error in updateCampaignEmails:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
