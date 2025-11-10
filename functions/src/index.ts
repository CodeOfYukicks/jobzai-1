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
import Stripe from 'stripe';

// Initialize Firebase Admin
admin.initializeApp();

// CORS helper function - robust solution for CORS handling
const handleCORS = (req: any, res: any, next: () => void) => {
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

// ==================== Brevo Integration ====================

/**
 * Get Brevo API Key from Firestore or environment
 */
const getBrevoApiKey = async (): Promise<string | null> => {
  try {
    // Try Firestore first
    const settingsDoc = await admin.firestore().collection('settings').doc('brevo').get();
    
    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      const apiKey = data?.apiKey || data?.api_key;
      if (apiKey) {
        console.log('✅ Brevo API key retrieved from Firestore');
        console.log(`   Key length: ${apiKey.length} characters`);
        console.log(`   Key starts with: ${apiKey.substring(0, 5)}...`);
        return apiKey;
      }
    }
  } catch (error: any) {
    console.warn('⚠️  Failed to retrieve Brevo API key from Firestore:', error?.message);
  }
  
  // Fallback to environment variable
  if (process.env.BREVO_API_KEY) {
    console.log('Using Brevo API key from environment variable');
    return process.env.BREVO_API_KEY;
  }
  
  // Fallback to Firebase config
  try {
    const config = functions.config();
    if (config.brevo?.api_key) {
      console.log('Using Brevo API key from Firebase config');
      return config.brevo.api_key;
    }
  } catch (e) {
    console.warn('Could not access Firebase config:', e);
  }
  
  console.warn('⚠️  Brevo API key not found. Brevo integration will be disabled.');
  return null;
};

/**
 * Create or update a contact in Brevo
 */
const createOrUpdateBrevoContact = async (
  apiKey: string,
  contact: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    company?: string;
    jobtitle?: string;
    website?: string;
    city?: string;
    state?: string;
    country?: string;
    [key: string]: any;
  }
): Promise<string | null> => {
  try {
    const brevoUrl = `https://api.brevo.com/v3/contacts`;
    
    // Prepare attributes for Brevo
    // Note: Brevo uses PRENOM and NOM (French) instead of FIRSTNAME and LASTNAME
    const attributes: Record<string, any> = {};
    
    if (contact.firstName) attributes.PRENOM = contact.firstName;
    if (contact.lastName) attributes.NOM = contact.lastName;
    if (contact.phone) attributes.SMS = contact.phone;
    if (contact.company) attributes.COMPANY = contact.company;
    if (contact.jobtitle) attributes.JOB_TITLE = contact.jobtitle; // Brevo uses JOB_TITLE with underscore
    if (contact.website) attributes.WEBSITE = contact.website;
    if (contact.city) attributes.CITY = contact.city;
    if (contact.state) attributes.STATE = contact.state;
    if (contact.country) attributes.COUNTRY = contact.country;
    
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
  } catch (error: any) {
    console.error('❌ Error creating/updating Brevo contact:', error);
    console.error('   Error message:', error?.message);
    console.error('   Error stack:', error?.stack);
    throw error;
  }
};

/**
 * Sync user to Brevo
 * Called from client or Firestore trigger
 * Using onRequest instead of onCall to fix CORS issues
 */
export const syncUserToBrevo = onRequest({
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
  } catch (error: any) {
    console.error('❌ Error syncing user to Brevo:', error);
    console.error('   Error message:', error?.message);
    console.error('   Error stack:', error?.stack);
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
const getHubSpotApiKey = async (): Promise<string | null> => {
  try {
    // Try Firestore first
    const settingsDoc = await admin.firestore().collection('settings').doc('hubspot').get();
    
    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      const apiKey = data?.apiKey || data?.api_key;
      if (apiKey) {
        console.log('✅ HubSpot API key retrieved from Firestore');
        return apiKey;
      }
    }
  } catch (error: any) {
    console.warn('⚠️  Failed to retrieve HubSpot API key from Firestore:', error?.message);
  }
  
  // Fallback to environment variable
  if (process.env.HUBSPOT_API_KEY) {
    console.log('Using HubSpot API key from environment variable');
    return process.env.HUBSPOT_API_KEY;
  }
  
  // Fallback to Firebase config
  try {
    const config = functions.config();
    if (config.hubspot?.api_key) {
      console.log('Using HubSpot API key from Firebase config');
      return config.hubspot.api_key;
    }
  } catch (e) {
    console.warn('Could not access Firebase config:', e);
  }
  
  console.warn('⚠️  HubSpot API key not found. HubSpot integration will be disabled.');
  return null;
};

/**
 * Create or update a contact in HubSpot
 */
const createOrUpdateHubSpotContact = async (
  apiKey: string,
  contact: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    company?: string;
    jobtitle?: string;
    website?: string;
    city?: string;
    state?: string;
    country?: string;
    [key: string]: any;
  }
): Promise<string | null> => {
  try {
    const hubspotUrl = `https://api.hubapi.com/crm/v3/objects/contacts`;
    
    // Prepare properties
    const properties: Record<string, any> = {
      email: contact.email,
    };
    
    if (contact.firstName) properties.firstname = contact.firstName;
    if (contact.lastName) properties.lastname = contact.lastName;
    if (contact.phone) properties.phone = contact.phone;
    if (contact.company) properties.company = contact.company;
    if (contact.jobtitle) properties.jobtitle = contact.jobtitle;
    if (contact.website) properties.website = contact.website;
    if (contact.city) properties.city = contact.city;
    if (contact.state) properties.state = contact.state;
    if (contact.country) properties.country = contact.country;
    
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
  } catch (error: any) {
    console.error('❌ Error creating/updating HubSpot contact:', error);
    console.error('   Error message:', error?.message);
    console.error('   Error stack:', error?.stack);
    throw error;
  }
};

/**
 * Update an existing contact in HubSpot
 */
const updateHubSpotContact = async (
  apiKey: string,
  contact: {
    email: string;
    [key: string]: any;
  }
): Promise<string | null> => {
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
    const properties: Record<string, any> = {};
    
    if (contact.firstName) properties.firstname = contact.firstName;
    if (contact.lastName) properties.lastname = contact.lastName;
    if (contact.phone) properties.phone = contact.phone;
    if (contact.company) properties.company = contact.company;
    if (contact.jobtitle) properties.jobtitle = contact.jobtitle;
    if (contact.website) properties.website = contact.website;
    if (contact.city) properties.city = contact.city;
    if (contact.state) properties.state = contact.state;
    if (contact.country) properties.country = contact.country;
    
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
  } catch (error: any) {
    console.error('❌ Error updating HubSpot contact:', error);
    throw error;
  }
};

/**
 * Send an event to HubSpot Timeline
 */
const sendHubSpotEvent = async (
  apiKey: string,
  email: string,
  eventName: string,
  properties?: Record<string, any>
): Promise<void> => {
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
    const eventData: any = {
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
  } catch (error: any) {
    console.error('❌ Error sending HubSpot event:', error);
    // Don't throw - events are not critical
  }
};

/**
 * Sync user to HubSpot
 * Called from client or Firestore trigger
 * Using onRequest instead of onCall to fix CORS issues
 */
export const syncUserToHubSpot = onRequest({
  region: 'us-central1',
  cors: true, // CRITICAL: This enables automatic CORS handling in Firebase Functions v2
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
    } else {
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
  } catch (error: any) {
    console.error('❌ Error syncing user to HubSpot:', error);
    console.error('   Error message:', error?.message);
    console.error('   Error stack:', error?.stack);
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
export const sendHubSpotEventFunction = onRequest({
  region: 'us-central1',
  maxInstances: 10,
  invoker: 'public',
}, async (req, res) => {
  // Handle CORS FIRST
  handleCORS(req, res, () => {});
  
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
  } catch (error: any) {
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
const getStripeApiKey = async (): Promise<string> => {
  try {
    // Try Firestore first
    const settingsDoc = await admin.firestore().collection('settings').doc('stripe').get();
    
    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      const apiKey = data?.secretKey || data?.secret_key || data?.apiKey || data?.api_key;
      if (apiKey) {
        console.log('✅ Stripe API key retrieved from Firestore');
        return apiKey;
      }
    }
  } catch (error: any) {
    console.warn('⚠️  Failed to retrieve Stripe API key from Firestore:', error?.message);
  }
  
  // Fallback to environment variable
  if (process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY) {
    console.log('Using Stripe API key from environment variable');
    return process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY || '';
  }
  
  // Fallback to Firebase config
  try {
    const config = functions.config();
    if (config.stripe?.secret_key || config.stripe?.api_key) {
      console.log('Using Stripe API key from Firebase config');
      return config.stripe.secret_key || config.stripe.api_key || '';
    }
  } catch (e) {
    console.warn('Could not access Firebase config:', e);
  }
  
  throw new Error('Stripe API key not found. Please configure it in Firestore (settings/stripe) or environment variables.');
};

/**
 * Initialize Stripe client
 */
const getStripeClient = async (): Promise<Stripe> => {
  const apiKey = await getStripeApiKey();
  return new Stripe(apiKey, {
    apiVersion: '2025-10-29.clover',
  });
};

/**
 * Create a Stripe Checkout Session
 * This endpoint creates a payment session for subscriptions or one-time payments
 */
export const createCheckoutSession = onRequest({
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
  } else {
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
    let priceId: string;
    
    if (isSubscription) {
      // For subscriptions, create a recurring price
      // First, check if a product already exists for this plan
      const products = await stripe.products.list({ limit: 100 });
      let product = products.data.find(p => p.metadata?.planId === planId);
      
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
      
      let existingPrice = prices.data.find(
        p => p.unit_amount === priceInCents && p.recurring?.interval === 'month'
      );
      
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
    } else {
      // For one-time payments (credit packages), create a one-time price
      const products = await stripe.products.list({ limit: 100 });
      let product = products.data.find(p => p.metadata?.type === 'credit_package' && p.metadata?.packageId === planId);
      
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
      
      let existingPrice = prices.data.find(
        p => p.unit_amount === priceInCents && !p.recurring
      );
      
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
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: isSubscription ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: req.body.customerEmail, // Optional: if you have user email
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
  } catch (error: any) {
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
export const stripeWebhook = onRequest({
  region: 'us-central1',
  maxInstances: 10,
  invoker: 'public',
}, async (req, res) => {
  // Stripe webhook signature verification
  const sig = req.headers['stripe-signature'] as string;
  
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
    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      webhookSecret
    );
    
    console.log('✅ Stripe webhook event received:', event.type);
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('❌ Error processing Stripe webhook:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

/**
 * Get Stripe Webhook Secret
 */
const getStripeWebhookSecret = async (): Promise<string> => {
  try {
    const settingsDoc = await admin.firestore().collection('settings').doc('stripe').get();
    
    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      const webhookSecret = data?.webhookSecret || data?.webhook_secret;
      if (webhookSecret) {
        return webhookSecret;
      }
    }
  } catch (error: any) {
    console.warn('⚠️  Failed to retrieve Stripe webhook secret from Firestore:', error?.message);
  }
  
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    return process.env.STRIPE_WEBHOOK_SECRET;
  }
  
  try {
    const config = functions.config();
    if (config.stripe?.webhook_secret) {
      return config.stripe.webhook_secret;
    }
  } catch (e) {
    console.warn('Could not access Firebase config:', e);
  }
  
  throw new Error('Stripe webhook secret not found');
};

/**
 * Handle checkout.session.completed event
 */
const handleCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
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
        stripeCustomerId: session.customer as string || null,
        stripeSubscriptionId: session.subscription as string || null,
        paymentStatus: 'active',
        lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Record credit history
      await admin.firestore().collection('users').doc(userId).collection('creditHistory').add({
        credits: creditsToAdd,
        change: creditsToAdd,
        reason: 'subscription_payment',
        planId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        stripeSessionId: session.id,
      });
      
      console.log(`✅ User ${userId} subscription activated: ${planName} (${credits} credits)`);
    } else if (type === 'credits') {
      // One-time credit purchase
      const creditsToAdd = parseInt(credits || '0', 10);
      const currentCredits = userDoc.data()?.credits || 0;
      
      await userRef.update({
        credits: currentCredits + creditsToAdd,
        lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Record credit history
      await admin.firestore().collection('users').doc(userId).collection('creditHistory').add({
        credits: currentCredits + creditsToAdd,
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
      amount: (session.amount_total || 0) / 100, // Convert from cents
      currency: session.currency || 'eur',
      status: 'paid',
      planId,
      planName,
      type,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error: any) {
    console.error('❌ Error handling checkout completed:', error);
    throw error;
  }
};

/**
 * Handle subscription update
 */
const handleSubscriptionUpdate = async (subscription: Stripe.Subscription) => {
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
  } catch (error: any) {
    console.error('❌ Error handling subscription update:', error);
  }
};

/**
 * Handle subscription cancellation
 */
const handleSubscriptionCancelled = async (subscription: Stripe.Subscription) => {
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
      credits: 25, // Free plan credits
      paymentStatus: 'cancelled',
      subscriptionStatus: 'cancelled',
      planSelectedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`✅ Subscription cancelled for user ${userId}, downgraded to free plan`);
  } catch (error: any) {
    console.error('❌ Error handling subscription cancellation:', error);
  }
};

/**
 * Handle successful invoice payment
 */
const handleInvoicePaymentSucceeded = async (invoice: Stripe.Invoice) => {
  try {
    // Invoice.subscription can be a string (ID) or a Subscription object
    const subscriptionId = typeof (invoice as any).subscription === 'string' 
      ? (invoice as any).subscription 
      : (invoice as any).subscription?.id;
    
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
      credits: creditsToAdd,
      change: creditsToAdd,
      reason: 'subscription_renewal',
      planId: planId || 'unknown',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      stripeInvoiceId: invoice.id,
    });
    
    console.log(`✅ Subscription renewed for user ${userId}: ${creditsToAdd} credits added`);
  } catch (error: any) {
    console.error('❌ Error handling invoice payment succeeded:', error);
  }
};

/**
 * Manual function to process a Stripe checkout session and add credits
 * This can be called manually if the webhook didn't fire
 */
export const processStripeSession = onRequest({
  region: 'us-central1',
  cors: true,
  maxInstances: 10,
  invoker: 'public',
}, async (req, res) => {
  // Set CORS headers
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
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
  } catch (error: any) {
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
const handleInvoicePaymentFailed = async (invoice: Stripe.Invoice) => {
  try {
    // Invoice.subscription can be a string (ID) or a Subscription object
    const subscriptionId = typeof (invoice as any).subscription === 'string' 
      ? (invoice as any).subscription 
      : (invoice as any).subscription?.id;
    
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
  } catch (error: any) {
    console.error('❌ Error handling invoice payment failed:', error);
  }
};
