const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const serverlessFunctions = require('./lib/index.js');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Function to get OpenAI API key from Firestore or environment
async function getOpenAIApiKey() {
  try {
    console.log('🔑 Attempting to retrieve OpenAI API key from Firestore...');
    const settingsDoc = await admin.firestore().collection('settings').doc('openai').get();

    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      const apiKey = data?.apiKey || data?.api_key;
      if (apiKey) {
        console.log('✅ OpenAI API key retrieved from Firestore');
        return apiKey;
      }
    }
  } catch (error) {
    console.error('❌ Failed to retrieve API key from Firestore:', error.message);
  }

  // Fallback to environment variable
  if (process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY) {
    console.log('Using OpenAI API key from environment variable');
    return process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
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

  return null;
}

// Créer l'application Express
const app = express();

// Activer CORS avec une configuration permissive pour l'API
app.use(cors({ origin: true }));

// Parser les corps de requête JSON avec une limite augmentée pour les PDFs
app.use(bodyParser.json({ limit: '50mb' }));

// Logger les requêtes entrantes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Simple endpoint de test
app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ status: 'success', message: 'API server is running' });
});

// Endpoint Claude API
app.post('/api/claude', async (req, res) => {
  try {
    console.log("Claude API endpoint called");

    // Logs de débogage pour voir ce qui est disponible
    console.log("Environment variables:", {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? "defined" : "undefined",
      VITE_ANTHROPIC_API_KEY: process.env.VITE_ANTHROPIC_API_KEY ? "defined" : "undefined"
    });

    console.log("Firebase Config:", JSON.stringify(functions.config()));

    // IMPORTANT: Ne plus utiliser de clé API hardcodée - Utiliser les variables d'environnement
    const hardcodedApiKey = "REMOVED_API_KEY"; // La clé a été supprimée pour des raisons de sécurité

    // Priorité: 1) Variable d'environnement Firebase 2) Variable .env
    const apiKey = process.env.ANTHROPIC_API_KEY ||
      process.env.VITE_ANTHROPIC_API_KEY;
    // Ne pas utiliser de clé API hardcodée

    console.log("API Key found:", apiKey ? "YES" : "NO");

    if (!apiKey) {
      console.error("Claude API key is missing");
      return res.status(500).json({
        status: 'error',
        message: "Claude API key is missing in environment"
      });
    }

    // Extraire les données de la requête
    const { model, max_tokens, temperature, system, messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid request format: messages array missing or invalid");
      return res.status(400).json({
        status: 'error',
        message: "Invalid request format: messages array is required"
      });
    }

    console.log("Request validation passed, preparing Claude API call");

    // Créer des messages modifiés avec le format corrigé
    const modifiedMessages = messages.map(msg => {
      if (msg.content && Array.isArray(msg.content)) {
        // Corriger le format pour les éléments de contenu texte
        const modifiedContent = msg.content.map(contentItem => {
          if (contentItem.type === 'text') {
            // L'API attend maintenant la structure { type: 'text', text: "your text" }
            return {
              type: 'text',
              text: contentItem.text
            };
          }
          return contentItem;
        });

        return {
          ...msg,
          content: modifiedContent
        };
      }
      return msg;
    });

    // Créer la requête Claude API
    const claudeRequest = {
      model: model || "claude-3-5-sonnet-20241022",
      max_tokens: max_tokens || 4000,
      temperature: temperature || 0.2,
      system: system || "You are a helpful assistant",
      messages: modifiedMessages
    };

    console.log("Sending request to Claude API with model:", claudeRequest.model);

    // Envoyer la requête à l'API Claude
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(claudeRequest)
    });

    console.log(`Claude API response status: ${claudeResponse.status}`);

    // Traiter la réponse
    const responseText = await claudeResponse.text();
    console.log("Received response from Claude API");

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
      console.log("Successfully parsed response as JSON");

      if (claudeResponse.status !== 200) {
        console.error("Claude API error response:", parsedResponse);
        return res.status(claudeResponse.status).json({
          status: 'error',
          message: parsedResponse.error?.message || "Error from Claude API",
          details: parsedResponse
        });
      }

      // Retourner la réponse Claude complète
      return res.json({
        status: 'success',
        content: parsedResponse.content
      });

    } catch (parseError) {
      console.error("Error parsing Claude API response:", parseError);
      return res.status(500).json({
        status: 'error',
        message: "Failed to parse Claude API response",
        rawResponse: responseText.substring(0, 500) + "..." // Premier 500 caractères pour débogage
      });
    }

  } catch (error) {
    console.error("Error in Claude API handler:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || "An error occurred processing your request"
    });
  }
});

// ChatGPT API endpoint for recommendations
app.post('/api/chatgpt', async (req, res) => {
  try {
    console.log("ChatGPT API endpoint called for recommendations");

    // Get API key from Firestore or environment variables
    let apiKey = await getOpenAIApiKey();

    if (!apiKey) {
      console.error('❌ ERREUR: Clé API OpenAI manquante');
      return res.status(500).json({
        status: 'error',
        message: 'OpenAI API key is missing. Please add it to Firestore (settings/openai) or .env file (OPENAI_API_KEY).'
      });
    }

    const { prompt, type, cvContent } = req.body;

    if (!prompt) {
      return res.status(400).json({
        status: 'error',
        message: 'Prompt is required'
      });
    }

    // Build messages for ChatGPT
    // Adapt system message based on request type for better context
    let systemMessage = "You are an expert career coach. Always respond with valid JSON matching the exact format requested. Do not include any markdown code blocks, just return the raw JSON object.";

    // Enhanced system message for CV section rewriting
    if (type === 'cv-section-rewrite') {
      systemMessage = "You are an elite CV strategist specializing in ATS optimization and professional content enhancement. You analyze CV sections deeply and provide powerful, achievement-focused rewrites. Always respond with valid JSON in this exact format: {\"content\": \"the improved text\"}. Never include markdown code blocks or extra formatting.";
    }

    const messages = [
      {
        role: "system",
        content: systemMessage
      },
      {
        role: "user",
        content: prompt
      }
    ];

    console.log('📡 Sending request to ChatGPT API...');
    console.log(`   Type: ${type}`);
    console.log(`   Prompt length: ${prompt.length}`);

    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-5.2", // Using GPT-5.2 for best quality
        messages: messages,
        response_format: { type: 'json_object' },
        max_completion_tokens: 4000,
        temperature: 0.3 // Lower temperature for more consistent, structured responses
      })
    });

    console.log(`OpenAI API response status: ${openaiResponse.status}`);

    // Handle response
    const responseText = await openaiResponse.text();
    console.log("Response received, length:", responseText.length);

    if (!openaiResponse.ok) {
      console.error("Non-200 response:", responseText);
      try {
        const errorData = JSON.parse(responseText);
        return res.status(openaiResponse.status).json({
          status: 'error',
          message: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`,
          error: errorData.error
        });
      } catch (e) {
        return res.status(openaiResponse.status).json({
          status: 'error',
          message: `OpenAI API error: ${responseText.substring(0, 200)}`
        });
      }
    }

    // Parse and return response
    try {
      const parsedResponse = JSON.parse(responseText);
      const content = parsedResponse.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from ChatGPT API');
      }

      // Parse JSON content
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

      console.log('✅ ChatGPT recommendation completed successfully');

      return res.json({
        status: 'success',
        content: parsedContent,
        usage: parsedResponse.usage
      });
    } catch (parseError) {
      console.error("Parse error:", parseError);
      return res.status(500).json({
        status: 'error',
        message: "Failed to parse response",
        rawResponse: responseText.substring(0, 500) + "..."
      });
    }

  } catch (error) {
    console.error("Error in ChatGPT API handler:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || "An error occurred processing your request",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ============================================
// OpenAI Realtime Session Endpoint (Mock Interview)
// Creates WebSocket session for real-time voice interview
// ============================================
app.post('/api/openai-realtime-session', async (req, res) => {
  try {
    console.log('🎙️ OpenAI Realtime Session endpoint called');

    // Get API key from Firestore or environment variables
    let apiKey = await getOpenAIApiKey();

    if (!apiKey) {
      console.error('❌ OpenAI API key is missing');
      return res.status(500).json({
        status: 'error',
        message: 'OpenAI API key is missing. Please add it to Firestore (settings/openai) or .env file.'
      });
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
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        errorMessage = errorText.substring(0, 200);
      }

      return res.status(secretResponse.status).json({
        status: 'error',
        message: errorMessage
      });
    }

    const secretData = await secretResponse.json();
    console.log('✅ Client secret response received');

    // Extract client_secret
    let clientSecret;
    let expiresAt;

    if (secretData.client_secret?.value) {
      clientSecret = secretData.client_secret.value;
      expiresAt = secretData.client_secret.expires_at;
    } else if (typeof secretData.client_secret === 'string') {
      clientSecret = secretData.client_secret;
      expiresAt = secretData.expires_at;
    } else if (secretData.value) {
      clientSecret = secretData.value;
      expiresAt = secretData.expires_at;
    }

    if (!clientSecret) {
      console.error('❌ Could not extract client_secret from response');
      return res.status(500).json({
        status: 'error',
        message: 'Invalid response from OpenAI API - no client_secret found'
      });
    }

    // Construct the WebSocket URL for GA API
    const serverUrl = `wss://api.openai.com/v1/realtime?model=${model}`;

    console.log('✅ Client secret created successfully');

    res.json({
      url: serverUrl,
      client_secret: clientSecret,
      expires_at: expiresAt
    });

  } catch (error) {
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
  try {
    console.log('📊 Live interview analysis endpoint called');

    const { transcript, jobContext, userProfile } = req.body;

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Transcript is required and must be a non-empty array'
      });
    }

    // Get API key
    let apiKey = await getOpenAIApiKey();

    if (!apiKey) {
      return res.status(500).json({
        status: 'error',
        message: 'OpenAI API key is missing'
      });
    }

    // Format transcript for analysis
    const formattedTranscript = transcript
      .filter(entry => entry.text && entry.text.trim())
      .map(entry => `${entry.role.toUpperCase()}: ${entry.text}`)
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
- Company: ${jobContext?.companyName || 'Unknown'}
- Position: ${jobContext?.position || 'Unknown'}
- Description: ${jobContext?.jobDescription?.substring(0, 500) || 'Not provided'}

CANDIDATE PROFILE:
- Name: ${userProfile?.firstName || 'Unknown'} ${userProfile?.lastName || ''}
- Current Position: ${userProfile?.currentPosition || 'Not provided'}
- Experience: ${userProfile?.yearsOfExperience || 'Not provided'} years

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
        model: "gpt-5.2",
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
      return res.status(openaiResponse.status).json({
        status: 'error',
        message: `OpenAI API error: ${errorText.substring(0, 200)}`
      });
    }

    const responseData = await openaiResponse.json();
    const content = responseData.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from OpenAI API');
    }

    const analysis = JSON.parse(content);
    console.log('✅ Interview analysis completed');

    res.json({
      status: 'success',
      analysis
    });

  } catch (error) {
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
  try {
    console.log("🔵 CV Review AI endpoint called");

    // Get API key
    let apiKey = await getOpenAIApiKey();

    if (!apiKey) {
      console.error('❌ OpenAI API key is missing for CV Review');
      return res.status(500).json({
        status: 'error',
        message: 'OpenAI API key is missing.'
      });
    }

    const { cvData, jobContext, previousAnalysis } = req.body;

    if (!cvData) {
      return res.status(400).json({
        status: 'error',
        message: 'CV data is required'
      });
    }

    // Build prompt
    const cvJson = JSON.stringify(cvData, null, 2);
    const firstName = cvData.personalInfo?.firstName || 'there';

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
      return res.status(openaiResponse.status).json({
        status: 'error',
        message: `OpenAI API error: ${errorText.substring(0, 200)}`
      });
    }

    const responseData = await openaiResponse.json();
    const content = responseData.choices[0]?.message?.content;

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
    if (!reviewResult.suggestions) reviewResult.suggestions = [];
    if (!reviewResult.analyzedAt) reviewResult.analyzedAt = new Date().toISOString();

    console.log('✅ CV Review completed successfully');

    res.json({
      status: 'success',
      result: reviewResult,
      usage: responseData.usage
    });

  } catch (error) {
    console.error('❌ Error in CV Review:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to analyze CV'
    });
  }
});

// Exporter l'app Express en tant que fonction Firebase
exports.api = functions.https.onRequest(app);
exports.startCampaign = serverlessFunctions.startCampaign;
exports.updateCampaignEmails = serverlessFunctions.updateCampaignEmails;
exports.analyzeCVVision = serverlessFunctions.analyzeCVVision;
exports.syncUserToHubSpot = serverlessFunctions.syncUserToHubSpot;
exports.sendHubSpotEventFunction = serverlessFunctions.sendHubSpotEventFunction;
exports.syncUserToBrevo = serverlessFunctions.syncUserToBrevo;

// Exporter les fonctions Stripe depuis le fichier compilé
exports.createCheckoutSession = serverlessFunctions.createCheckoutSession;
exports.stripeWebhook = serverlessFunctions.stripeWebhook;
exports.processStripeSession = serverlessFunctions.processStripeSession;

// Exporter les fonctions d'ATS/embeddings/matching depuis le build TypeScript
// (nécessaire pour que Firebase les détecte lors du déploiement)
exports.fetchJobsFromATS = serverlessFunctions.fetchJobsFromATS;
exports.generateJobEmbedding = serverlessFunctions.generateJobEmbedding;
exports.generateUserEmbedding = serverlessFunctions.generateUserEmbedding;
exports.matchJobsForUsers = serverlessFunctions.matchJobsForUsers;
exports.getMatchedJobs = serverlessFunctions.getMatchedJobs;

// Export job search function
exports.searchJobs = serverlessFunctions.searchJobs;

// Export Stripe Portal function
exports.createPortalSession = serverlessFunctions.createPortalSession;
