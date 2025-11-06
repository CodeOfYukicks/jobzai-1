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
import OpenAI from 'openai';
import * as functions from 'firebase-functions';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize OpenAI client with Firestore API key
let openai: OpenAI | null = null;

const getOpenAIApiKey = async (): Promise<string> => {
  try {
    // Get API key from Firestore (settings/openai)
    console.log('🔑 Attempting to retrieve OpenAI API key from Firestore...');
    const settingsDoc = await admin.firestore().collection('settings').doc('openai').get();
    
    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      console.log('   Document exists, fields:', Object.keys(data || {}));
      const apiKey = data?.apiKey || data?.api_key;
      if (apiKey) {
        console.log('✅ OpenAI API key retrieved from Firestore (first 10 chars):', apiKey.substring(0, 10) + '...');
        return apiKey;
      } else {
        console.warn('⚠️  Document exists but apiKey field is missing. Available fields:', Object.keys(data || {}));
      }
    } else {
      console.warn('⚠️  Document settings/openai does not exist in Firestore');
    }
  } catch (error: any) {
    console.error('❌ Failed to retrieve API key from Firestore:', error);
    console.error('   Error message:', error?.message);
    console.error('   Error code:', error?.code);
  }
  
  // Fallback to environment variable
  if (process.env.OPENAI_API_KEY) {
    console.log('Using OpenAI API key from environment variable');
    return process.env.OPENAI_API_KEY;
  }
  
  // Fallback to Firebase config
  try {
    const config = functions.config();
    if (config.openai?.api_key) {
      console.log('Using OpenAI API key from Firebase config');
      return config.openai.api_key;
    }
  } catch (e) {
    console.warn('Could not access Firebase config:', e);
  }
  
  throw new Error('OpenAI API key not found in Firestore (settings/openai), environment, or Firebase config');
};

// Initialize OpenAI client lazily
const getOpenAIClient = async (): Promise<OpenAI> => {
  if (!openai) {
    const apiKey = await getOpenAIApiKey();
    openai = new OpenAI({ apiKey });
  }
  return openai;
};

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
    const {
      emailsSent = emailDetails.length,
      responses = 0,
      status = 'completed'
    } = updates;

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

  } catch (error) {
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
export const analyzeCVVision = onRequest({
  region: 'us-central1',
  cors: true,
  maxInstances: 10,
  timeoutSeconds: 300, // 5 minutes timeout for large PDFs
  invoker: 'public', // Allow public access (no authentication required)
}, async (req, res) => {
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
    let openaiClient: OpenAI;
    try {
      openaiClient = await getOpenAIClient();
    } catch (error: any) {
      console.error('❌ Failed to get OpenAI client:', error);
      console.error('   Error message:', error?.message);
      console.error('   Error stack:', error?.stack);
      
      // Return detailed error for debugging
      const errorMessage = error?.message || 'Unknown error';
      res.status(500).json({
        status: 'error',
        message: `OpenAI API key configuration error: ${errorMessage}. Please check Firestore (settings/openai) document.`,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      });
      return;
    }

    console.log('📡 Sending request to GPT-4o Vision API...');
    console.log(`   Model: ${model}`);
    console.log(`   Messages: ${messages.length}`);
    // Count images in messages (content can be string or array)
    let imageCount = 0;
    messages.forEach((msg: any) => {
      if (Array.isArray(msg.content)) {
        imageCount += msg.content.filter((c: any) => c.type === 'image_url').length;
      }
    });
    console.log(`   Images: ${imageCount}`);
    
    // Call OpenAI API
    const completion = await openaiClient.chat.completions.create({
      model: model || 'gpt-4o',
      messages: messages,
      response_format: response_format || { type: 'json_object' },
      max_tokens: max_tokens || 6000, // Increased for more detailed analysis
      temperature: temperature || 0.1, // Lower temperature for more precise, consistent analysis
    });

    console.log('✅ GPT-4o Vision API response received');
    
    // Extract content
    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Empty response from GPT-4o Vision API');
    }

    // Parse JSON if needed
    let parsedContent;
    try {
      parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
    } catch (e) {
      // If parsing fails, try to extract JSON from markdown
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                        content.match(/{[\s\S]*}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
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

  } catch (error: any) {
    console.error('❌ Error in analyzeCVVision:', error);
    
    // Handle OpenAI API errors
    if (error.response) {
      const statusCode = error.response.status || 500;
      const errorMessage = error.response.data?.error?.message || error.message || 'Unknown error';
      
      res.status(statusCode).json({
        status: 'error',
        message: `OpenAI API error: ${errorMessage}`,
        error: error.response.data?.error
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
