const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const OpenAI = require('openai');

// Load environment variables
dotenv.config();

// OpenAI client - will be initialized lazily
let openai = null;

async function getOpenAIClient() {
  if (openai) return openai;
  
  // Try environment variable first
  let apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  
  // If not in env, try Firestore
  if (!apiKey) {
    try {
      const settingsDoc = await admin.firestore().collection('settings').doc('openai').get();
      if (settingsDoc.exists) {
        const data = settingsDoc.data();
        apiKey = data?.API_KEY || data?.apiKey;
      }
    } catch (error) {
      console.error('Failed to get OpenAI API key from Firestore:', error.message);
    }
  }
  
  if (!apiKey) {
    throw new Error('OpenAI API key not found in environment or Firestore');
  }
  
  openai = new OpenAI({ apiKey });
  console.log('✅ OpenAI client initialized');
  return openai;
}

// Initialize Firebase Admin SDK
try {
  // Try to initialize with service account if available
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'jobzai'
    });
    console.log('✅ Firebase Admin initialized with service account');
  } else {
    // Initialize with default credentials (uses Application Default Credentials)
    // This works when running with firebase login or in Firebase Functions
    admin.initializeApp({
      projectId: 'jobzai'
    });
    console.log('✅ Firebase Admin initialized with default credentials');
  }
} catch (error) {
  console.warn('⚠️  Firebase Admin initialization failed:', error.message);
  console.warn('   Will fallback to environment variables for API keys');
}

// Function to get OpenAI API key from Firestore
async function getOpenAIApiKey() {
  try {
    console.log('🔑 Attempting to retrieve OpenAI API key from Firestore...');
    const settingsDoc = await admin.firestore().collection('settings').doc('openai').get();

    if (settingsDoc.exists) {
      const data = settingsDoc.data();
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
  } catch (error) {
    console.error('❌ Failed to retrieve API key from Firestore:', error.message);
  }

  // Fallback to environment variable
  if (process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY) {
    const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    console.log('Using OpenAI API key from environment variable');
    return apiKey;
  }

  return null;
}

// Function to get Perplexity API key from Firestore
async function getPerplexityApiKey() {
  try {
    console.log('🔑 Attempting to retrieve Perplexity API key from Firestore...');
    const settingsDoc = await admin.firestore().collection('settings').doc('perplexity').get();

    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      const apiKey = data?.apiKey || data?.api_key;
      if (apiKey) {
        console.log('✅ Perplexity API key retrieved from Firestore (first 10 chars):', apiKey.substring(0, 10) + '...');
        return apiKey;
      } else {
        console.warn('⚠️  Document exists but apiKey field is missing. Available fields:', Object.keys(data || {}));
      }
    } else {
      console.warn('⚠️  Document settings/perplexity does not exist in Firestore');
    }
  } catch (error) {
    console.error('❌ Failed to retrieve Perplexity API key from Firestore:', error.message);
  }

  // Fallback to environment variable
  if (process.env.PERPLEXITY_API_KEY || process.env.VITE_PERPLEXITY_API_KEY) {
    const apiKey = process.env.PERPLEXITY_API_KEY || process.env.VITE_PERPLEXITY_API_KEY;
    console.log('Using Perplexity API key from environment variable');
    return apiKey;
  }

  return null;
}

// Function to get Anthropic API key from Firestore
async function getAnthropicApiKey() {
  try {
    console.log('🔑 Attempting to retrieve Anthropic API key from Firestore...');
    const settingsDoc = await admin.firestore().collection('settings').doc('anthropic').get();

    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      const apiKey = data?.apiKey || data?.api_key;
      if (apiKey) {
        console.log('✅ Anthropic API key retrieved from Firestore (first 10 chars):', apiKey.substring(0, 10) + '...');
        return apiKey;
      } else {
        console.warn('⚠️  Document exists but apiKey field is missing. Available fields:', Object.keys(data || {}));
      }
    } else {
      console.warn('⚠️  Document settings/anthropic does not exist in Firestore');
    }
  } catch (error) {
    console.error('❌ Failed to retrieve Anthropic API key from Firestore:', error.message);
  }

  // Fallback to environment variable
  if (process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY) {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
    console.log('Using Anthropic API key from environment variable');
    return apiKey;
  }

  return null;
}

// Function to get Gemini API key from Firestore
async function getGeminiApiKey() {
  try {
    console.log('🔑 Attempting to retrieve Gemini API key from Firestore...');
    const settingsDoc = await admin.firestore().collection('settings').doc('gemini').get();

    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      const apiKey = data?.apiKey || data?.api_key;
      if (apiKey) {
        console.log('✅ Gemini API key retrieved from Firestore (first 10 chars):', apiKey.substring(0, 10) + '...');
        return apiKey;
      } else {
        console.warn('⚠️  Document exists but apiKey field is missing. Available fields:', Object.keys(data || {}));
      }
    } else {
      console.warn('⚠️  Document settings/gemini does not exist in Firestore');
    }
  } catch (error) {
    console.error('❌ Failed to retrieve Gemini API key from Firestore:', error.message);
  }

  // Fallback to environment variable
  if (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    console.log('Using Gemini API key from environment variable');
    return apiKey;
  }

  return null;
}

const app = express();
const PORT = process.env.PORT || 3000;

// Déterminer si nous sommes en production
const isProduction = process.env.NODE_ENV === 'production';

// Liste des domaines autorisés
const allowedOrigins = isProduction
  ? [process.env.PRODUCTION_DOMAIN, 'https://jobzai.com', 'https://www.jobzai.com', 'https://www.jobzai.web.app'].filter(Boolean) // Domaines de production 
  : ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5177', 'http://127.0.0.1:5173', 'http://127.0.0.1:4173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5175']; // Domaines de développement

console.log('CORS configuration:');
console.log('- Environment:', isProduction ? 'Production' : 'Development');
console.log('- Allowed origins:', allowedOrigins);

// Enable CORS for all routes with explicit configuration
app.use(cors({
  origin: function (origin, callback) {
    // Permettre les requêtes sans origine (comme les appels API mobiles ou Postman)
    if (!origin) return callback(null, true);

    // Vérifier si l'origine est dans la liste des domaines autorisés
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn(`Origin ${origin} not allowed by CORS`);
      callback(null, true); // En production, on pourrait être plus restrictif ici
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'anthropic-version', 'Authorization'],
  credentials: true
}));

// Parse JSON bodies with increased limit for large PDFs
app.use(bodyParser.json({ limit: '50mb' }));

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  if (req.method === 'POST' && req.path === '/api/claude') {
    console.log(`Received request with size: ${req.body ? JSON.stringify(req.body).length : 'unknown'} bytes`);
  }
  next();
});

// En production, servir les fichiers statiques du build Vite
if (isProduction) {
  console.log('Serving static files from dist directory');
  // Servir les fichiers statiques du répertoire dist (créé par vite build)
  app.use(express.static(path.join(__dirname, 'dist')));
}

// Simple test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ status: 'success', message: 'Server is running' });
});

// Simple health check endpoint for Claude API access
app.get('/api/claude/test', (req, res) => {
  console.log('Claude API test endpoint called');

  // Logs détaillés pour le débogage
  console.log('Environment variables:');
  console.log('- ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'définie' : 'non définie');
  console.log('- VITE_ANTHROPIC_API_KEY:', process.env.VITE_ANTHROPIC_API_KEY ? 'définie' : 'non définie');

  // IMPORTANT: Ne plus utiliser de clé API hardcodée - Utiliser les variables d'environnement
  const hardcodedApiKey = "REMOVED_API_KEY"; // La clé a été supprimée pour des raisons de sécurité

  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY ||
    process.env.VITE_ANTHROPIC_API_KEY;
  // Ne pas utiliser de clé API hardcodée

  console.log("API Key being used (first 10 chars):", apiKey ? apiKey.substring(0, 10) + "..." : "No key found");

  if (!apiKey) {
    console.error('ERREUR: Clé API Claude manquante dans l\'environnement du serveur');
    return res.status(500).json({
      status: 'error',
      message: 'Anthropic API key is missing in server environment'
    });
  }

  // Essai de faire une requête simple à l'API Claude pour tester la connexion
  console.log('Clé API trouvée, test d\'une requête simple à l\'API Claude...');

  res.json({
    status: 'success',
    message: 'Claude API endpoint is accessible',
    apiKeyPresent: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    environment: isProduction ? 'production' : 'development'
  });
});

// Endpoint to fetch and process CV content
app.get('/api/fetch-cv', async (req, res) => {
  try {
    const cvUrl = req.query.url;
    if (!cvUrl) {
      return res.status(400).json({ status: 'error', message: 'CV URL is required' });
    }

    console.log("Fetching CV from URL:", cvUrl);

    // Fetch the PDF file
    const response = await fetch(cvUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch CV: ${response.statusText}`);
    }

    // Get the PDF as binary data
    const pdfBuffer = await response.arrayBuffer();

    // Convert to Base64
    const base64Pdf = Buffer.from(pdfBuffer).toString('base64');

    console.log("Successfully downloaded and encoded CV");

    // For now, just return a placeholder text extraction
    // In a real implementation, you would use a PDF text extraction library
    return res.json({
      status: 'success',
      content: "PDF CV content extracted. This is a placeholder for PDF text extraction. In production, you would use a proper PDF text extraction library to extract the actual text content from the CV.",
      contentType: 'text/plain'
    });
  } catch (error) {
    console.error("Error fetching CV:", error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Claude API route
app.post('/api/claude', async (req, res) => {
  try {
    console.log("Claude API endpoint called - USING BYPASS METHOD");

    // Logs détaillés pour le débogage
    console.log('Environment variables:');
    console.log('- ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'définie' : 'non définie');
    console.log('- VITE_ANTHROPIC_API_KEY:', process.env.VITE_ANTHROPIC_API_KEY ? 'définie' : 'non définie');

    // IMPORTANT: Ne plus utiliser de clé API hardcodée - Utiliser les variables d'environnement
    const hardcodedApiKey = "REMOVED_API_KEY"; // La clé a été supprimée pour des raisons de sécurité

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY ||
      process.env.VITE_ANTHROPIC_API_KEY;
    // Ne pas utiliser de clé API hardcodée

    console.log("API Key being used (first 10 chars):", apiKey ? apiKey.substring(0, 10) + "..." : "No key found");
    console.log("API Key length:", apiKey ? apiKey.length : 0);

    // Log de débogage - Afficher la structure complète de la requête
    console.log("Request structure:", JSON.stringify({
      body: {
        modelRequested: req.body.model,
        messagesCount: req.body.messages ? req.body.messages.length : 0,
        maxTokens: req.body.max_tokens,
        temperature: req.body.temperature,
        hasSystem: !!req.body.system,
        firstMessageContentTypes: req.body.messages && req.body.messages.length > 0 && req.body.messages[0].content
          ? req.body.messages[0].content.map(item => item.type)
          : []
      }
    }, null, 2));

    // ===================================================================
    // CONTOURNEMENT COMPLET - UTILISATION DU CODE DU SCRIPT TEST FONCTIONNEL
    // ===================================================================

    // Extraire seulement les messages du corps de la requête
    const messages = req.body.messages || [];

    // Utiliser exactement la même structure de requête que notre script de test
    const minimalRequest = {
      model: "claude-3-5-sonnet-20241022", // Modèle qui supporte les entrées PDF
      max_tokens: req.body.max_tokens || 4000,
      messages: messages
    };

    console.log("BYPASS: Sending request with working code pattern...");
    console.log("Final request structure:", JSON.stringify(minimalRequest, (key, value) => {
      // Ne pas afficher le contenu base64 complet pour éviter de saturer les logs
      if (key === 'data' && typeof value === 'string' && value.length > 100) {
        return value.substring(0, 100) + `... [${value.length} chars total]`;
      }
      return value;
    }, 2));

    // Envoi à l'API avec exactement la même configuration que notre test fonctionnel
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,  // En minuscules uniquement
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(minimalRequest)
    });

    console.log(`Claude API response status: ${claudeResponse.status}`);

    // Traitement de la réponse
    const responseText = await claudeResponse.text();
    console.log("Response received, length:", responseText.length);

    if (claudeResponse.status !== 200) {
      console.error("Non-200 response:", responseText);
      return res.status(claudeResponse.status).json({
        status: 'error',
        message: "Error from Claude API: " + (JSON.parse(responseText)?.error?.message || "Unknown error"),
        fullError: JSON.parse(responseText)
      });
    }

    // Renvoyer la réponse au client
    try {
      const parsedResponse = JSON.parse(responseText);
      return res.json({
        status: 'success',
        content: parsedResponse.content
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
    console.error("Error in Claude API handler:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || "An error occurred processing your request",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Endpoint de test simple pour l'authentification Claude
app.get('/api/claude/auth-test', async (req, res) => {
  try {
    console.log("Claude API auth test endpoint called");

    // IMPORTANT: Ne plus utiliser de clé API hardcodée - Utiliser les variables d'environnement
    const hardcodedApiKey = "REMOVED_API_KEY"; // La clé a été supprimée pour des raisons de sécurité

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY ||
      process.env.VITE_ANTHROPIC_API_KEY;

    console.log("Testing API Key (first 10 chars):", apiKey ? apiKey.substring(0, 10) + "..." : "No key found");

    // Requête Claude minimaliste pour tester l'authentification
    const minimalRequest = {
      model: "claude-3-5-sonnet-20241022", // Modèle qui supporte les entrées PDF
      max_tokens: 10,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Hello"
            }
          ]
        }
      ]
    };

    // Essayer plusieurs en-têtes "x-api-key" avec des casses différentes
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "X-Api-Key": apiKey, // Variation avec majuscules
      "anthropic-version": "2023-06-01"
    };

    console.log("Sending minimal test request to Claude API");

    // Envoi de la requête à l'API Claude
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(minimalRequest)
    });

    console.log(`Claude API test response status: ${response.status}`);

    // Traiter la réponse
    const responseBody = await response.text();
    console.log("Raw response:", responseBody);

    return res.json({
      status: response.status === 200 ? 'success' : 'error',
      details: responseBody
    });

  } catch (error) {
    console.error("Error in Claude auth test:", error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// ChatGPT API route for recommendations (replacing Claude)
app.post('/api/chatgpt', async (req, res) => {
  try {
    console.log("ChatGPT API endpoint called for recommendations");
    console.log("Request body keys:", Object.keys(req.body || {}));

    // Get API key from Firestore or environment variables
    let apiKey;
    try {
      apiKey = await getOpenAIApiKey();
    } catch (keyError) {
      console.error('❌ Error retrieving API key:', keyError);
      return res.status(500).json({
        status: 'error',
        message: `Failed to retrieve API key: ${keyError.message}`,
        details: process.env.NODE_ENV === 'development' ? keyError.stack : undefined
      });
    }

    if (!apiKey) {
      console.error('❌ ERREUR: Clé API OpenAI manquante');
      console.error('   Checking environment variables:');
      console.error('   - OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'defined' : 'not defined');
      console.error('   - VITE_OPENAI_API_KEY:', process.env.VITE_OPENAI_API_KEY ? 'defined' : 'not defined');
      return res.status(500).json({
        status: 'error',
        message: 'OpenAI API key is missing. Please add it to Firestore (settings/openai) or .env file (OPENAI_API_KEY).'
      });
    }

    console.log('✅ API key retrieved successfully (first 10 chars):', apiKey.substring(0, 10) + '...');

    const { prompt, type, cvContent } = req.body;

    if (!prompt) {
      console.error('❌ Prompt is missing in request body');
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

    // Enhanced system message for CV rewrite generation (full CV with 6 templates)
    if (type === 'cv-rewrite') {
      systemMessage = "You are THE WORLD'S BEST CV STRATEGIST with 20+ years placing candidates at FAANG, McKinsey, and Fortune 500 companies. You provide detailed, accurate CV rewrites in JSON format with 6 professional templates. You NEVER fabricate information. Always respond with valid JSON matching the exact structure requested. Never include markdown code blocks.";
    }

    // Enhanced system message for translation tasks
    if ((type === 'cv-edit' || type === 'resume-optimizer' || type === 'cv-translation') && (prompt.includes('translate') || prompt.includes('translation') || prompt.includes('localization'))) {
      systemMessage = "You are an elite professional translator and localization expert. You specialize in producing perfect, native-quality translations that read as if originally written in the target language. Always respond with valid JSON matching the exact format requested. Do not include any markdown code blocks, just return the raw JSON object.";
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
    let openaiResponse;
    let responseText;

    // Increase max_tokens for resume-optimizer and cv-rewrite to handle comprehensive CVs
    // cv-rewrite needs even more tokens because it generates 6 complete CV templates
    const maxTokens = type === 'cv-rewrite' ? 16000 :
      type === 'resume-optimizer' ? 8000 :
        4000;

    // Select model based on task type
    // Use GPT-4o for all tasks - latest and most capable model
    const model = 'gpt-5.2';

    try {
      openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          response_format: { type: 'json_object' },
          max_completion_tokens: maxTokens,
          temperature: 0.3 // Lower temperature for more consistent, structured responses
        })
      });

      console.log(`OpenAI API response status: ${openaiResponse.status}`);

      // Handle response
      responseText = await openaiResponse.text();
      console.log("Response received, length:", responseText.length);

      if (!openaiResponse.ok) {
        console.error("❌ Non-200 response from OpenAI API");
        console.error("Response status:", openaiResponse.status);
        console.error("Response text (first 500 chars):", responseText.substring(0, 500));

        try {
          const errorData = JSON.parse(responseText);
          console.error("Parsed error data:", JSON.stringify(errorData, null, 2));
          return res.status(openaiResponse.status).json({
            status: 'error',
            message: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`,
            error: errorData.error,
            type: errorData.error?.type,
            code: errorData.error?.code
          });
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          return res.status(openaiResponse.status).json({
            status: 'error',
            message: `OpenAI API error (status ${openaiResponse.status}): ${responseText.substring(0, 200)}`
          });
        }
      }
    } catch (fetchError) {
      console.error("❌ Error calling OpenAI API:", fetchError);
      console.error("Error message:", fetchError.message);
      console.error("Error stack:", fetchError.stack);
      return res.status(500).json({
        status: 'error',
        message: `Failed to call OpenAI API: ${fetchError.message}`,
        details: process.env.NODE_ENV === 'development' ? fetchError.stack : undefined
      });
    }

    // Parse and return response
    try {
      console.log("Parsing OpenAI API response...");
      const parsedResponse = JSON.parse(responseText);

      if (!parsedResponse.choices || !Array.isArray(parsedResponse.choices) || parsedResponse.choices.length === 0) {
        console.error("❌ Invalid response structure - no choices found");
        console.error("Response structure:", JSON.stringify(parsedResponse, null, 2));
        throw new Error('Invalid response structure from ChatGPT API - no choices found');
      }

      const content = parsedResponse.choices[0]?.message?.content;

      if (!content) {
        console.error("❌ Empty content in response");
        console.error("Response structure:", JSON.stringify(parsedResponse, null, 2));
        throw new Error('Empty response from ChatGPT API');
      }

      console.log("Content received, length:", content.length);
      console.log("Content preview (first 200 chars):", content.substring(0, 200));

      // Parse JSON content
      let parsedContent;
      try {
        parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
        console.log("✅ Successfully parsed JSON content");
      } catch (parseError) {
        console.warn("⚠️  Failed to parse content as JSON, trying to extract from markdown...");
        console.warn("Parse error:", parseError.message);
        // If parsing fails, try to extract JSON from markdown
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
          content.match(/```json\s*([\s\S]*?)\s*```/) ||
          content.match(/```\n([\s\S]*?)\n```/) ||
          content.match(/{[\s\S]*}/);
        if (jsonMatch) {
          try {
            const jsonString = jsonMatch[1] || jsonMatch[0];
            parsedContent = JSON.parse(jsonString);
            console.log("✅ Successfully extracted and parsed JSON from markdown");
          } catch (extractError) {
            console.error("❌ Failed to parse extracted JSON:", extractError.message);
            console.error("Extracted JSON preview:", (jsonMatch[1] || jsonMatch[0]).substring(0, 500));
            throw new Error(`Could not parse JSON from response: ${extractError.message}`);
          }
        } else {
          console.error("❌ Could not find JSON in response content");
          console.error("Content (first 1000 chars):", content.substring(0, 1000));
          throw new Error('Could not parse JSON from response - no valid JSON found');
        }
      }

      // Validate parsed content structure for resume-optimizer type
      if (type === 'resume-optimizer') {
        if (!parsedContent || typeof parsedContent !== 'object') {
          throw new Error('Parsed content is not a valid object');
        }
        if (!parsedContent.optimizedResumeMarkdown) {
          console.warn("⚠️  Missing optimizedResumeMarkdown in response");
          // Don't throw - let client handle it, but log warning
        }
        // Validate structuredCV if present
        if (parsedContent.structuredCV) {
          if (typeof parsedContent.structuredCV !== 'object') {
            console.warn("⚠️  structuredCV is not an object, removing it");
            delete parsedContent.structuredCV;
          } else {
            // Ensure it has required structure
            if (!parsedContent.structuredCV.personalInfo) {
              console.warn("⚠️  structuredCV missing personalInfo");
            }
            // Ensure arrays exist
            if (!Array.isArray(parsedContent.structuredCV.experiences)) {
              parsedContent.structuredCV.experiences = [];
            }
            if (!Array.isArray(parsedContent.structuredCV.educations)) {
              parsedContent.structuredCV.educations = [];
            }
            if (!Array.isArray(parsedContent.structuredCV.skills)) {
              parsedContent.structuredCV.skills = [];
            }
            if (!Array.isArray(parsedContent.structuredCV.languages)) {
              parsedContent.structuredCV.languages = [];
            }
            if (!Array.isArray(parsedContent.structuredCV.certificates)) {
              parsedContent.structuredCV.certificates = [];
            }
          }
        }
        console.log('✅ Resume optimizer response validated:', {
          hasMarkdown: !!parsedContent.optimizedResumeMarkdown,
          hasStructuredCV: !!parsedContent.structuredCV,
          atsScore: parsedContent.atsScore
        });
      }

      console.log('✅ ChatGPT recommendation completed successfully');

      return res.json({
        status: 'success',
        content: parsedContent,
        usage: parsedResponse.usage
      });
    } catch (parseError) {
      console.error("❌ Parse error:", parseError);
      console.error("Error message:", parseError.message);
      console.error("Error stack:", parseError.stack);
      console.error("Raw response (first 1000 chars):", responseText ? responseText.substring(0, 1000) : 'No response text');
      return res.status(500).json({
        status: 'error',
        message: `Failed to parse response: ${parseError.message}`,
        rawResponse: responseText ? responseText.substring(0, 500) + "..." : "No response text available"
      });
    }

  } catch (error) {
    console.error("❌ Unexpected error in ChatGPT API handler:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // Check if response was already sent
    if (res.headersSent) {
      console.error("⚠️  Response already sent, cannot send error response");
      return;
    }

    res.status(500).json({
      status: 'error',
      message: error.message || "An error occurred processing your request",
      errorType: error.name || 'UnknownError',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ============================================
// Helper functions for AI Assistant with different providers
// ============================================

/**
 * Call Claude (Anthropic) API with streaming
 */
async function callClaudeAssistant(messages, systemPrompt, apiKey, res) {
  const https = require('https');
  
  // Convert messages format for Claude API
  const claudeMessages = messages.filter(msg => msg.role !== 'system').map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content
  }));

  const postData = JSON.stringify({
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    temperature: 0.7,
    system: systemPrompt,
    messages: claudeMessages,
    stream: true
  });

  const options = {
    hostname: 'api.anthropic.com',
    port: 443,
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  let buffer = '';
  let fullContent = '';

  const claudeReq = https.request(options, (claudeRes) => {
    // Handle non-200 status codes by reading the error body first
    if (claudeRes.statusCode !== 200) {
      let errorBody = '';
      claudeRes.on('data', (chunk) => {
        errorBody += chunk.toString();
      });
      claudeRes.on('end', () => {
        console.error('❌ Claude API error status:', claudeRes.statusCode);
        console.error('❌ Claude API error body:', errorBody);
        
        // Try to parse the error for a better message
        let errorMessage = `Claude API error (status ${claudeRes.statusCode})`;
        try {
          const errorData = JSON.parse(errorBody);
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // Use the raw error body if it's not JSON
          if (errorBody && errorBody.length < 500) {
            errorMessage = errorBody;
          }
        }
        
        console.error('❌ Claude API error message:', errorMessage);
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      });
      return;
    }

    claudeRes.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(6);
          if (data === '[DONE]') {
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            // Claude streaming format
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              const content = parsed.delta.text;
              fullContent += content;
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    });

    claudeRes.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
      console.log('✅ [ANTHROPIC] Claude Sonnet 4.5 response completed (streamed)');
      console.log(`   Response length: ${fullContent.length} chars`);
    });

    claudeRes.on('error', (err) => {
      console.error('❌ Claude stream error:', err);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    });
  });

  claudeReq.on('error', (err) => {
    console.error('❌ Claude request error:', err);
    if (!res.headersSent) {
      res.status(500).json({ status: 'error', message: err.message });
    } else {
      res.end();
    }
  });

  claudeReq.write(postData);
  claudeReq.end();
}

/**
 * Call Gemini (Google) API with streaming
 */
async function callGeminiAssistant(messages, systemPrompt, apiKey, res) {
  const https = require('https');
  
  // Convert messages format for Gemini API
  const geminiContents = [];
  
  // Add system prompt as first user message
  if (systemPrompt) {
    geminiContents.push({
      role: 'user',
      parts: [{ text: systemPrompt }]
    });
    geminiContents.push({
      role: 'model',
      parts: [{ text: 'Understood. I will assist you accordingly.' }]
    });
  }
  
  // Add conversation messages
  messages.filter(msg => msg.role !== 'system').forEach(msg => {
    geminiContents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    });
  });

  const postData = JSON.stringify({
    contents: geminiContents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2000
    }
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models/gemini-3-pro:streamGenerateContent?key=${apiKey}&alt=sse`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  let buffer = '';
  let fullContent = '';

  const geminiReq = https.request(options, (geminiRes) => {
    // Handle non-200 status codes by reading the error body first
    if (geminiRes.statusCode !== 200) {
      let errorBody = '';
      geminiRes.on('data', (chunk) => {
        errorBody += chunk.toString();
      });
      geminiRes.on('end', () => {
        console.error('❌ Gemini API error status:', geminiRes.statusCode);
        console.error('❌ Gemini API error body:', errorBody);
        
        // Try to parse the error for a better message
        let errorMessage = `Gemini API error (status ${geminiRes.statusCode})`;
        try {
          const errorData = JSON.parse(errorBody);
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // Use the raw error body if it's not JSON
          if (errorBody && errorBody.length < 500) {
            errorMessage = errorBody;
          }
        }
        
        console.error('❌ Gemini API error message:', errorMessage);
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      });
      return;
    }

    geminiRes.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(6);
          if (data === '[DONE]') {
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            // Gemini streaming format
            if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
              const content = parsed.candidates[0].content.parts[0].text;
              fullContent += content;
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    });

    geminiRes.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
      console.log('✅ [GEMINI] Gemini 3 Pro response completed (streamed)');
      console.log(`   Response length: ${fullContent.length} chars`);
    });

    geminiRes.on('error', (err) => {
      console.error('❌ Gemini stream error:', err);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    });
  });

  geminiReq.on('error', (err) => {
    console.error('❌ Gemini request error:', err);
    if (!res.headersSent) {
      res.status(500).json({ status: 'error', message: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  });

  geminiReq.write(postData);
  geminiReq.end();
}

// ============================================
// AI Assistant Chat Endpoint
// Context-aware chatbot for job search assistance
// ============================================
app.post('/api/assistant', async (req, res) => {
  try {
    console.log('\n🤖 ════════════════════════════════════════════════════════');
    console.log('🤖 AI Assistant endpoint called');
    
    const { message, aiProvider = 'openai', pageContext, userContext, conversationHistory, userId, pageData, selectedContextItems, inlineEditMode = false, selectionMode = false, selectedText = '', personaConfig = null, personaPrompt = '', whiteboardMode = false, whiteboardIntent = null } = req.body;

    console.log('🤖 ┌─────────────────────────────────────────────────────┐');
    console.log(`🤖 │ AI Provider: ${aiProvider.toUpperCase().padEnd(39)} │`);
    console.log(`🤖 │ User: ${(userContext?.firstName || 'Unknown').padEnd(44)} │`);
    console.log(`🤖 │ Message: ${(message.substring(0, 40) + '...').padEnd(41)} │`);
    console.log(`🤖 │ Inline Edit Mode: ${String(inlineEditMode).padEnd(33)} │`);
    console.log(`🤖 │ Whiteboard Mode: ${String(whiteboardMode).padEnd(34)} │`);
    if (whiteboardMode && whiteboardIntent) {
      console.log(`🤖 │ Whiteboard Intent: ${String(whiteboardIntent.type).padEnd(32)} │`);
    }
    console.log('🤖 └─────────────────────────────────────────────────────┘');
    
    // Get appropriate API key based on provider
    let apiKey;
    try {
      switch (aiProvider) {
        case 'anthropic':
          apiKey = await getAnthropicApiKey();
          break;
        case 'gemini':
          apiKey = await getGeminiApiKey();
          break;
        case 'openai':
        default:
          apiKey = await getOpenAIApiKey();
          break;
      }
    } catch (keyError) {
      console.error('❌ Error retrieving API key:', keyError);
      return res.status(500).json({
        status: 'error',
        message: `Failed to retrieve API key for ${aiProvider}: ${keyError.message}`
      });
    }

    if (!apiKey) {
      return res.status(500).json({
        status: 'error',
        message: `${aiProvider.toUpperCase()} API key is missing. Please configure it in Firestore (settings/${aiProvider}).`
      });
    }

    if (!message) {
      return res.status(400).json({
        status: 'error',
        message: 'Message is required'
      });
    }

    console.log(`📍 Page context: ${pageContext?.pageName || 'Unknown'}`);
    console.log(`👤 User: ${userContext?.firstName || 'Unknown'}`);
    console.log(`📊 Page data keys: ${pageData ? Object.keys(pageData).join(', ') : 'None'}`);
    console.log(`📎 Context items: ${selectedContextItems?.length || 0} items`);
    
    // Log whiteboard mode details
    if (whiteboardMode) {
      console.log('🎨 ┌─────────────────────────────────────────────────────┐');
      console.log('🎨 │ WHITEBOARD MODE ACTIVE                              │');
      console.log(`🎨 │ Intent Type: ${(whiteboardIntent?.type || 'unknown').padEnd(38)} │`);
      console.log(`🎨 │ Topic: ${(whiteboardIntent?.extractedTopic || 'none').substring(0, 42).padEnd(44)} │`);
      console.log('🎨 └─────────────────────────────────────────────────────┘');
      
      if (selectedContextItems?.length > 0) {
        console.log('🎨 Context items with data:');
        for (const item of selectedContextItems) {
          console.log(`🎨   - ${item.type}: ${item.title}`);
          if (item.data) {
            const dataPreview = JSON.stringify(item.data).substring(0, 200);
            console.log(`🎨     Data: ${dataPreview}...`);
          } else {
            console.log('🎨     Data: NONE');
          }
        }
      }
    }

    // Build system prompt with context and page data (pass inlineEditMode to skip EDIT_NOTE markup instructions)
    let systemPrompt = buildAssistantSystemPrompt(pageContext, userContext, pageData, selectedContextItems, inlineEditMode);
    
    // Add persona customization if provided
    if (personaPrompt) {
      console.log(`🎭 Persona: ${personaConfig?.name || 'Custom'} (tone: ${personaConfig?.tone || 'default'})`);
      systemPrompt = `## AI PERSONALITY CUSTOMIZATION
${personaPrompt}

---

${systemPrompt}`;
    }
    
    // Add inline edit mode instructions if enabled
    if (inlineEditMode) {
      let inlineEditInstructions = `

## 🎯 INLINE EDIT MODE ACTIVE 🎯

You are editing a note directly. Your response will be applied DIRECTLY to the user's note document.

### ⚠️ CRITICAL RULES - YOU MUST FOLLOW THESE ⚠️

1. **OUTPUT ONLY THE CONTENT** - ZERO explanations, introductions, or commentary
2. **FORBIDDEN PHRASES** - NEVER write ANY of these:
   - "Here's a summary..."
   - "Here's the rewritten..."
   - "I've improved..."
   - "The updated note is..."
   - "Here are the changes..."
   - "Let me..."
   - Any sentence describing what you're doing
3. **NO MARKUP** - Do NOT use [[note:...]], [[application:...]], [[EDIT_NOTE:...]] or any special markup
4. **START IMMEDIATELY** with the actual content (heading, bullet point, text, table, etc.)

### CONTENT STRUCTURE
Use rich markdown formatting:
- **Headings**: # ## ### for hierarchy
- **Lists**: - or * for bullets, 1. 2. 3. for numbered
- **Tables**: | Header | Header | with proper formatting
- **Bold/Italic**: **bold** and *italic* for emphasis
- **Blockquotes**: > for callouts

### EXAMPLES OF CORRECT OUTPUT

User: "Summarize this note"
CORRECT:
# Key Points

- First important point
- Second important point

## Details
The main theme is...

WRONG:
Here's a summary of your note:
- Point 1
- Point 2

User: "Improve this"
CORRECT:
# Professional Summary

Experienced consultant with 8+ years...

WRONG:
I've improved your note with better structure:
# Professional Summary...

---
START YOUR RESPONSE DIRECTLY WITH THE CONTENT. NO PREAMBLE.
`;

      // Add selection-specific instructions if in selection mode
      if (selectionMode && selectedText) {
        inlineEditInstructions += `

## 🎯 SELECTION MODE - PARTIAL EDIT 🎯

The user has SELECTED specific text to edit. You must ONLY rewrite/edit that selected portion.

**SELECTED TEXT:**
"${selectedText}"

**CRITICAL RULES FOR SELECTION MODE:**
1. Output ONLY the replacement for the selected text
2. Do NOT include any surrounding context - just the edited portion
3. Match the approximate length unless asked to expand/shorten
4. Preserve the tone and style of the surrounding document
5. Do NOT add extra formatting unless specifically requested

**EXAMPLE:**
If selected text is: "This is a simple example."
And user asks to "make it more professional"
Output: "This serves as an illustrative example."
(Just the replacement, nothing else!)

`;
      }
      
      systemPrompt = inlineEditInstructions + '\n\n' + systemPrompt;
    }

    // Add whiteboard mode instructions if enabled
    if (whiteboardMode && whiteboardIntent) {
      const contentType = whiteboardIntent.type || 'brainstorm';
      const topic = whiteboardIntent.extractedTopic || message;
      const count = whiteboardIntent.extractedCount || 5;
      
      let whiteboardPrompt = `
## 🎨 WHITEBOARD CONTENT GENERATION MODE 🎨

You are generating structured content for a visual whiteboard. Your response will be parsed and converted into visual shapes.

### CONTENT TYPE: ${contentType.toUpperCase().replace('_', ' ')}
### TOPIC: ${topic}
`;

      switch (contentType) {
        case 'mind_map':
          whiteboardPrompt += `
### MIND MAP GENERATION RULES

Return a JSON object with this EXACT structure:
{
  "centerTopic": "Main Topic (short, max 30 chars)",
  "branches": [
    {
      "text": "Branch 1 Name",
      "color": "blue",
      "children": [
        { "text": "Sub-item 1" },
        { "text": "Sub-item 2" }
      ]
    },
    {
      "text": "Branch 2 Name", 
      "color": "green",
      "children": [
        { "text": "Sub-item 1" }
      ]
    }
  ]
}

RULES:
- centerTopic: The main theme (max 30 characters)
- Create 4-6 main branches covering different aspects
- Each branch should have 2-4 children
- Available colors: yellow, blue, green, orange, red, violet
- Keep all text concise (max 50 characters per item)
- Make content relevant, actionable, and specific
- Return ONLY the JSON object, no explanations
`;
          break;

        case 'sticky_notes':
          whiteboardPrompt += `
### STICKY NOTES GENERATION RULES

Return a JSON array with ${count} sticky notes:
[
  { "text": "First idea or point (max 100 chars)", "color": "yellow" },
  { "text": "Second idea or point", "color": "blue" },
  { "text": "Third idea or point", "color": "green" }
]

RULES:
- Generate exactly ${count} sticky notes
- Available colors: yellow, blue, green, orange, red, violet
- Keep text concise (max 100 characters per note)
- Each note should be a distinct, actionable idea
- Vary the colors for visual appeal
- Make ideas specific and relevant to the topic
- Return ONLY the JSON array, no explanations
`;
          break;

        case 'flow_diagram':
          whiteboardPrompt += `
### FLOW DIAGRAM GENERATION RULES

Return a JSON object with nodes and connections:
{
  "nodes": [
    { "id": "start", "text": "Start", "type": "start" },
    { "id": "step1", "text": "First Step", "type": "process" },
    { "id": "decision1", "text": "Decision?", "type": "decision" },
    { "id": "step2", "text": "Alternative", "type": "process" },
    { "id": "end", "text": "End", "type": "end" }
  ],
  "connections": [
    { "from": "start", "to": "step1" },
    { "from": "step1", "to": "decision1" },
    { "from": "decision1", "to": "step2", "label": "No" },
    { "from": "decision1", "to": "end", "label": "Yes" },
    { "from": "step2", "to": "end" }
  ]
}

Node types:
- "start": Starting point (use at beginning)
- "end": End point (use at end)
- "process": Action/process step (rectangles)
- "decision": Decision point (use for branching)

RULES:
- Create 5-10 nodes for a clear flow
- Each node needs a unique id (lowercase, no spaces)
- Keep node text concise (max 40 characters)
- Include at least one decision point if appropriate
- Connection labels are optional (use for decisions)
- Return ONLY the JSON object, no explanations
`;
          break;

        default:
          // Default to sticky notes for brainstorm
          whiteboardPrompt += `
### BRAINSTORM - STICKY NOTES FORMAT

Return a JSON array with 5-6 ideas as sticky notes:
[
  { "text": "Key insight or idea", "color": "yellow" },
  { "text": "Another important point", "color": "blue" },
  { "text": "Action item or suggestion", "color": "green" }
]

RULES:
- Generate 5-6 distinct, valuable ideas
- Available colors: yellow, blue, green, orange, red, violet
- Keep text concise and actionable
- Vary the colors
- Return ONLY the JSON array, no explanations
`;
      }

      // Add user context if available
      if (userContext) {
        whiteboardPrompt += `
### USER CONTEXT
${userContext.currentJobTitle ? `- Current role: ${userContext.currentJobTitle}` : ''}
${userContext.skills?.length > 0 ? `- Skills: ${userContext.skills.slice(0, 10).join(', ')}` : ''}
${userContext.firstName ? `- Name: ${userContext.firstName}` : ''}

Use this context to make the content more personalized and relevant.
`;
      }

      // Add selected context items if available
      if (selectedContextItems && selectedContextItems.length > 0) {
        whiteboardPrompt += `
### 📋 IMPORTANT CONTEXT FROM USER'S DATA - USE THIS IN YOUR RESPONSE
`;
        for (const item of selectedContextItems) {
          // Extract key information based on type
          let contextDetails = '';
          if (item.data) {
            const d = item.data;
            switch (item.type) {
              case 'job-application':
              case 'campaign':
                contextDetails = `
- Company: ${d.companyName || d.company || 'N/A'}
- Position: ${d.position || d.jobTitle || 'N/A'}
- Job Description: ${(d.jobDescription || d.description || '').substring(0, 800)}
- Required Skills: ${d.requirements || d.skills || 'N/A'}
- Status: ${d.status || 'N/A'}
`;
                break;
              case 'resume':
              case 'cv-analysis':
                contextDetails = `
- Summary: ${(d.summary || d.professionalSummary || '').substring(0, 500)}
- Skills: ${Array.isArray(d.skills) ? d.skills.join(', ') : (d.skills || 'N/A')}
- Experience: ${d.yearsOfExperience || 'N/A'} years
`;
                break;
              case 'interview':
                contextDetails = `
- Company: ${d.companyName || 'N/A'}
- Position: ${d.position || 'N/A'}
- Interview Type: ${d.type || d.interviewType || 'N/A'}
- Date: ${d.date || d.scheduledDate || 'N/A'}
`;
                break;
              default:
                contextDetails = JSON.stringify(d, null, 2).substring(0, 1000);
            }
          }
          
          whiteboardPrompt += `
#### ${item.type.toUpperCase()}: ${item.title}
${contextDetails || 'No additional data'}
`;
        }
        whiteboardPrompt += `
⚠️ CRITICAL: Use the context above to generate SPECIFIC, RELEVANT content.
- Reference the company name, position, and requirements
- Tailor branches/notes to the actual job context
- Do NOT use generic placeholders like "Idea 1", "Main Ideas", "Resource 1"
`;
      }

      whiteboardPrompt += `
---
⚠️ OUTPUT REQUIREMENTS:
1. Return ONLY valid JSON - no markdown, no \`\`\`, no explanations
2. Start directly with { or [ character
3. End with } or ] character
4. ALL content must be specific and relevant to the topic/context provided
5. NEVER use placeholder text like "Idea 1", "Task 1", "Step 1" - always use real content
`;

      systemPrompt = whiteboardPrompt + '\n\n' + systemPrompt;
    }

    // Build messages array
    const messages = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-10)) { // Last 10 messages for context
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    // Add current user message
    messages.push({
      role: "user",
      content: message
    });

    console.log(`📡 Sending request to ${aiProvider.toUpperCase()} for assistant response (streaming)...`);
    console.log('🤖 ════════════════════════════════════════════════════════\n');

    // Set headers for SSE streaming FIRST
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Route to appropriate AI provider
    switch (aiProvider) {
      case 'anthropic':
        console.log('🧠 [ANTHROPIC] Calling Claude Sonnet 4.5 (latest)...');
        await callClaudeAssistant(messages, systemPrompt, apiKey, res);
        return;
      
      case 'gemini':
        console.log('⚡ [GEMINI] Calling Gemini 3 Pro (latest)...');
        await callGeminiAssistant(messages, systemPrompt, apiKey, res);
        return;
      
      case 'openai':
      default:
        console.log('✨ [OPENAI] Calling GPT-5.2 (latest)...');
        // Use https module for reliable streaming in Node.js
        const https = require('https');
        
        const postData = JSON.stringify({
          model: 'gpt-5.2',
          messages: messages,
          max_completion_tokens: 2000,
          temperature: 0.7,
          stream: true
        });

        const options = {
          hostname: 'api.openai.com',
          port: 443,
          path: '/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        let buffer = '';
        let fullContent = '';

        const openaiReq = https.request(options, (openaiRes) => {
          // Handle non-200 status codes by reading the error body first
          if (openaiRes.statusCode !== 200) {
            let errorBody = '';
            openaiRes.on('data', (chunk) => {
              errorBody += chunk.toString();
            });
            openaiRes.on('end', () => {
              console.error('❌ OpenAI API error status:', openaiRes.statusCode);
              console.error('❌ OpenAI API error body:', errorBody);
              
              // Try to parse the error for a better message
              let errorMessage = `OpenAI API error (status ${openaiRes.statusCode})`;
              try {
                const errorData = JSON.parse(errorBody);
                if (errorData.error?.message) {
                  errorMessage = errorData.error.message;
                } else if (errorData.message) {
                  errorMessage = errorData.message;
                }
              } catch (e) {
                // Use the raw error body if it's not JSON
                if (errorBody && errorBody.length < 500) {
                  errorMessage = errorBody;
                }
              }
              
              console.error('❌ OpenAI API error message:', errorMessage);
              res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
              res.write('data: [DONE]\n\n');
              res.end();
            });
            return;
          }

          openaiRes.on('data', (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('data: ')) {
                const data = trimmedLine.slice(6);
                if (data === '[DONE]') {
                  continue;
                }
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullContent += content;
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          });

          openaiRes.on('end', () => {
            res.write('data: [DONE]\n\n');
            res.end();
            console.log('✅ [OPENAI] GPT-5.2 response completed (streamed)');
            console.log(`   Response length: ${fullContent.length} chars`);
          });

          openaiRes.on('error', (err) => {
            console.error('❌ OpenAI stream error:', err);
            res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
          });
        });

        openaiReq.on('error', (err) => {
          console.error('❌ OpenAI request error:', err);
          if (!res.headersSent) {
            res.status(500).json({ status: 'error', message: err.message });
          } else {
            res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
          }
        });

        openaiReq.write(postData);
        openaiReq.end();
        return;
    }

  } catch (error) {
    console.error('❌ AI Assistant error:', error);
    
    if (res.headersSent) {
      res.end();
      return;
    }
    
    res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred'
    });
  }
});

// ============================================
// PRODUCT KNOWLEDGE BASE
// Comprehensive documentation of Cubbbe features
// ============================================
const PRODUCT_KNOWLEDGE = {
  // Platform Overview
  overview: {
    name: 'Cubbbe',
    description: 'Plateforme de recherche d\'emploi propulsée par l\'IA qui aide les candidats à trouver, postuler et décrocher leur emploi idéal.',
    tagline: 'Révolutionnez votre recherche d\'emploi avec l\'IA',
    mainSections: ['APPLY (Postuler)', 'TRACK (Suivre)', 'PREPARE (Préparer)', 'IMPROVE (S\'améliorer)'],
  },

  // ============================================
  // APPLY SECTION FEATURES
  // ============================================
  features: {
    jobBoard: {
      name: 'Job Board',
      path: '/jobs',
      section: 'APPLY',
      description: 'Explorez des milliers d\'offres d\'emploi avec des filtres avancés et un matching IA.',
      whatItDoes: [
        'Affiche les offres d\'emploi les plus récentes et pertinentes',
        'Filtre par localisation, type de contrat, niveau d\'expérience, salaire',
        'Mode "For You" qui utilise l\'IA pour matcher avec votre profil',
        'Sauvegarde des offres favorites',
        'Score de compatibilité automatique avec votre CV',
      ],
      howToUse: [
        'Allez dans "Job Board" dans le menu de gauche (section Apply)',
        'Utilisez la barre de recherche pour chercher par mot-clé ou entreprise',
        'Appliquez des filtres (Remote, Full-time, etc.) pour affiner',
        'Cliquez sur une offre pour voir les détails',
        'Utilisez "Save" pour garder une offre en favoris',
        'Cliquez sur "Apply" pour postuler directement ou ajouter à vos candidatures',
      ],
      tips: [
        'Activez le mode "For You" pour voir les jobs qui matchent votre profil',
        'Vérifiez le score de match avant de postuler - visez 70%+',
        'Sauvegardez les offres intéressantes et revenez-y quand votre CV est optimisé',
      ],
    },

    autopilot: {
      name: 'AutoPilot / Campaigns',
      path: '/campaigns',
      section: 'APPLY',
      description: 'Automatisez vos campagnes de candidature avec des séquences d\'emails personnalisées.',
      whatItDoes: [
        'Crée des campagnes d\'outreach automatisées vers les recruteurs',
        'Gère des séquences d\'emails de suivi automatiques',
        'Personnalise les messages avec les données de l\'entreprise',
        'Suit les taux d\'ouverture et de réponse',
        'Planifie les envois au moment optimal',
      ],
      howToUse: [
        'Allez dans "AutoPilot" ou "Campaigns" dans le menu',
        'Cliquez sur "Nouvelle campagne" ou "Create Campaign"',
        'Définissez votre cible : industries, postes, entreprises',
        'Créez votre séquence d\'emails (premier contact + follow-ups)',
        'Ajoutez vos contacts ou importez une liste',
        'Configurez le timing des envois',
        'Lancez la campagne et suivez les résultats',
      ],
      tips: [
        'Commencez petit : testez avec 10-20 contacts avant d\'élargir',
        'Personnalisez le premier email avec des détails spécifiques à l\'entreprise',
        'Attendez 3-5 jours entre chaque relance',
        'Analysez les taux de réponse pour améliorer vos messages',
      ],
    },

    resumeLab: {
      name: 'Resume Lab',
      path: '/cv-analysis',
      section: 'APPLY',
      description: 'Analysez votre CV contre une offre d\'emploi et obtenez un score de match détaillé.',
      whatItDoes: [
        'Compare votre CV à une description de poste spécifique',
        'Calcule un score de compatibilité (0-100%)',
        'Identifie vos forces qui matchent avec l\'offre',
        'Détecte les lacunes et compétences manquantes',
        'Suggère des améliorations concrètes pour votre CV',
        'Génère une version optimisée de votre CV',
        'Crée un plan d\'action 48h pour améliorer votre candidature',
      ],
      howToUse: [
        'Allez dans "Resume Lab" dans le menu',
        'Uploadez votre CV (PDF ou Word)',
        'Collez l\'URL ou le texte de l\'offre d\'emploi ciblée',
        'Cliquez sur "Analyser"',
        'Consultez votre score et les sections détaillées',
        'Utilisez les suggestions pour améliorer votre CV',
        'Téléchargez la version optimisée si disponible',
      ],
      tips: [
        'Analysez votre CV pour chaque offre importante - un CV générique score moins bien',
        'Concentrez-vous sur les "Quick Wins" - corrections rapides à fort impact',
        'Visez un score de 75%+ avant de postuler',
        'Gardez les analyses pour référence future',
      ],
    },

    // ============================================
    // TRACK SECTION FEATURES
    // ============================================
    applicationTracking: {
      name: 'Application Tracking',
      path: '/applications',
      section: 'TRACK',
      description: 'Tableau Kanban pour suivre toutes vos candidatures et leur progression.',
      whatItDoes: [
        'Affiche toutes vos candidatures dans un tableau Kanban visuel',
        'Organise par statut : Applied, Interviewing, Offer, Rejected, etc.',
        'Stocke les détails de chaque candidature (entreprise, poste, contact)',
        'Permet d\'ajouter des notes et des rappels',
        'Suit les entretiens programmés',
        'Calcule vos statistiques de réponse',
      ],
      howToUse: [
        'Allez dans "Application Tracking" dans le menu',
        'Cliquez sur "+ Add Application" pour ajouter une candidature',
        'Remplissez : entreprise, poste, date, lien de l\'offre',
        'Glissez-déposez les cartes pour changer le statut',
        'Cliquez sur une carte pour voir/éditer les détails',
        'Ajoutez des notes pour chaque étape du processus',
      ],
      tips: [
        'Ajoutez chaque candidature immédiatement après avoir postulé',
        'Utilisez les notes pour garder trace de vos interactions',
        'Mettez à jour les statuts régulièrement pour des stats précises',
        'Programmez des rappels de suivi pour les candidatures sans réponse après 7 jours',
      ],
    },

    calendar: {
      name: 'Calendar',
      path: '/calendar',
      section: 'TRACK',
      description: 'Vue calendrier de vos entretiens et deadlines importantes.',
      whatItDoes: [
        'Affiche tous vos entretiens programmés',
        'Montre les deadlines de candidature',
        'Vue jour, semaine ou mois',
        'Synchronisation avec vos candidatures',
      ],
      howToUse: [
        'Allez dans "Calendar" dans le menu',
        'Naviguez avec les flèches ou le sélecteur de date',
        'Cliquez sur un événement pour voir les détails',
        'Les entretiens ajoutés dans vos candidatures apparaissent automatiquement',
      ],
      tips: [
        'Vérifiez votre calendrier chaque matin',
        'Préparez vos entretiens 24h à l\'avance minimum',
      ],
    },

    // ============================================
    // PREPARE SECTION FEATURES
    // ============================================
    interviewHub: {
      name: 'Interview Hub',
      path: '/upcoming-interviews',
      section: 'PREPARE',
      description: 'Centre de préparation pour vos entretiens à venir.',
      whatItDoes: [
        'Liste tous vos entretiens programmés',
        'Affiche les détails de chaque entretien (entreprise, poste, type, date)',
        'Permet d\'ajouter des notes de préparation',
        'Fournit des informations sur l\'entreprise',
        'Donne accès aux outils de préparation',
      ],
      howToUse: [
        'Allez dans "Interview Hub" dans le menu',
        'Visualisez vos prochains entretiens',
        'Cliquez sur un entretien pour accéder à la préparation détaillée',
        'Ajoutez des notes, questions à poser, points à mentionner',
        'Lancez un Mock Interview pour vous entraîner',
      ],
      tips: [
        'Préparez chaque entretien au moins 24h à l\'avance',
        'Notez 3-5 questions à poser au recruteur',
        'Relisez la description du poste avant l\'entretien',
      ],
    },

    mockInterview: {
      name: 'Mock Interview',
      path: '/mock-interview',
      section: 'PREPARE',
      description: 'Entraînez-vous avec une IA qui simule un vrai entretien.',
      whatItDoes: [
        'Simule un entretien d\'embauche réaliste avec une IA',
        'Pose des questions adaptées au poste et à l\'entreprise',
        'Analyse vos réponses en temps réel',
        'Donne du feedback détaillé sur le contenu et la structure',
        'Suggère des améliorations concrètes',
        'Permet de s\'entraîner aux questions comportementales (STAR)',
      ],
      howToUse: [
        'Allez dans "Mock Interview" dans le menu',
        'Sélectionnez le type d\'entretien (technique, RH, comportemental)',
        'Optionnel : liez à une candidature spécifique pour un contexte personnalisé',
        'Lancez l\'interview',
        'Répondez aux questions comme en vrai entretien',
        'Recevez votre feedback et score à la fin',
      ],
      tips: [
        'Entraînez-vous à voix haute, pas juste dans votre tête',
        'Utilisez la méthode STAR pour les questions comportementales',
        'Faites au moins 2-3 mock interviews avant un vrai entretien',
        'Revoyez le feedback et retravaillez vos points faibles',
      ],
    },

    documentManager: {
      name: 'Document Manager',
      path: '/resume-builder',
      section: 'PREPARE',
      description: 'Créez et gérez vos notes, documents et templates.',
      whatItDoes: [
        'Créer des notes de préparation',
        'Stocker des documents importants',
        'Organiser par dossiers',
        'Éditeur de texte riche avec formatage',
        'Recherche dans tous vos documents',
      ],
      howToUse: [
        'Allez dans "Document Manager" dans le menu',
        'Cliquez sur "New Note" pour créer une note',
        'Organisez avec des dossiers si besoin',
        'Utilisez la barre d\'outils pour formater',
        'Vos documents sont sauvegardés automatiquement',
      ],
      tips: [
        'Créez une note par entreprise avec vos recherches',
        'Gardez un fichier "Questions fréquentes" avec vos meilleures réponses',
        'Notez les feedbacks reçus après chaque entretien',
      ],
    },

    // ============================================
    // IMPROVE SECTION FEATURES
    // ============================================
    professionalProfile: {
      name: 'Professional Profile',
      path: '/professional-profile',
      section: 'IMPROVE',
      description: 'Gérez votre profil professionnel utilisé par l\'IA pour personnaliser les recommandations.',
      whatItDoes: [
        'Stocke vos informations professionnelles',
        'Définit vos compétences et expertises',
        'Configure vos préférences de recherche (salaire, localisation, remote)',
        'Permet à l\'IA de mieux vous comprendre',
        'Améliore le matching avec les offres',
      ],
      howToUse: [
        'Allez dans "Professional Profile" dans le menu',
        'Complétez chaque section : expérience, compétences, formation',
        'Définissez vos critères de recherche idéaux',
        'Ajoutez vos soft skills et centres d\'intérêt professionnels',
        'Mettez à jour régulièrement quand vos objectifs évoluent',
      ],
      tips: [
        'Un profil complet = de meilleures recommandations',
        'Soyez précis sur vos compétences techniques',
        'Mettez des fourchettes de salaire réalistes',
      ],
    },

    recommendations: {
      name: 'Recommendations',
      path: '/recommendations',
      section: 'IMPROVE',
      description: 'Conseils personnalisés générés par l\'IA pour améliorer votre recherche.',
      whatItDoes: [
        'Analyse votre activité et vos résultats',
        'Génère des conseils personnalisés',
        'Suggère des actions prioritaires',
        'Recommande des compétences à développer',
        'Identifie des opportunités basées sur votre profil',
      ],
      howToUse: [
        'Allez dans "Recommendations" dans le menu',
        'Consultez les conseils générés pour vous',
        'Cliquez sur une recommandation pour plus de détails',
        'Marquez les actions comme complétées',
      ],
      tips: [
        'Vérifiez les recommandations chaque semaine',
        'Priorisez les actions à fort impact',
        'Un profil plus complet = des recommandations plus pertinentes',
      ],
    },

    dashboard: {
      name: 'Dashboard',
      path: '/dashboard',
      section: 'IMPROVE',
      description: 'Vue d\'ensemble de votre activité et de vos métriques de recherche d\'emploi.',
      whatItDoes: [
        'Affiche vos statistiques clés (candidatures, taux de réponse, entretiens)',
        'Montre votre activité récente',
        'Visualise votre progression dans le temps',
        'Liste vos prochains entretiens',
        'Résume vos candidatures par statut',
      ],
      howToUse: [
        'C\'est votre page d\'accueil après connexion',
        'Consultez vos métriques en haut de page',
        'Vérifiez les actions urgentes',
        'Cliquez sur les éléments pour plus de détails',
      ],
      tips: [
        'Commencez chaque session par le Dashboard pour un aperçu rapide',
        'Visez un minimum de 5-10 candidatures par semaine',
        'Suivez votre taux de réponse pour ajuster votre approche',
      ],
    },

    emailTemplates: {
      name: 'Email Templates',
      path: '/email-templates',
      section: 'TOOLS',
      description: 'Créez et gérez vos modèles d\'emails pour les candidatures et relances.',
      whatItDoes: [
        'Stocke vos modèles d\'emails réutilisables',
        'Permet de créer des templates personnalisables',
        'Variables dynamiques pour personnalisation automatique',
        'Templates pour différents contextes (candidature, relance, remerciement)',
      ],
      howToUse: [
        'Allez dans "Email Templates" dans le menu',
        'Cliquez sur "Create Template" pour un nouveau modèle',
        'Utilisez les variables comme {company}, {position}, {contact}',
        'Sauvegardez et réutilisez dans vos campagnes',
      ],
      tips: [
        'Créez des templates pour chaque situation : candidature spontanée, réponse à offre, relance, remerciement',
        'Testez vos templates avant de les utiliser en masse',
        'Personnalisez toujours le premier paragraphe',
      ],
    },
  },

  // ============================================
  // NAVIGATION GUIDE
  // ============================================
  navigation: {
    sidebar: {
      apply: ['Job Board', 'AutoPilot', 'Campaigns', 'Resume Lab'],
      track: ['Application Tracking', 'Calendar'],
      prepare: ['Interview Hub', 'Mock Interview', 'Document Manager'],
      improve: ['Professional Profile', 'Recommendations', 'Dashboard'],
    },
    shortcuts: {
      'rechercher des offres': '/jobs',
      'mes candidatures': '/applications',
      'analyser mon cv': '/cv-analysis',
      'préparer un entretien': '/upcoming-interviews',
      'mock interview': '/mock-interview',
      'mes notes': '/resume-builder',
      'mon profil': '/professional-profile',
      'statistiques': '/dashboard',
      'campagnes': '/campaigns',
      'templates email': '/email-templates',
      'paramètres': '/settings',
      'abonnement': '/billing',
    },
  },

  // ============================================
  // COMMON QUESTIONS
  // ============================================
  faq: {
    'comment postuler': 'Allez dans Job Board, trouvez une offre, cliquez dessus puis sur "Apply". Vous pouvez aussi ajouter manuellement une candidature dans Application Tracking.',
    'comment améliorer mon cv': 'Utilisez Resume Lab pour analyser votre CV contre une offre spécifique. Suivez les suggestions d\'amélioration et téléchargez la version optimisée.',
    'comment suivre mes candidatures': 'Toutes vos candidatures sont dans Application Tracking. Utilisez le tableau Kanban pour visualiser et mettre à jour les statuts.',
    'comment me préparer à un entretien': 'Allez dans Interview Hub pour voir vos entretiens à venir, puis utilisez Mock Interview pour vous entraîner.',
    'comment fonctionne le matching': 'L\'IA compare votre profil et CV avec les offres d\'emploi. Plus votre profil est complet, meilleur est le matching.',
    'combien de crédits par action': 'L\'analyse CV et les messages IA consomment 1 crédit. Les utilisateurs Premium ont des crédits illimités.',
    'comment créer une campagne': 'Allez dans AutoPilot/Campaigns, créez une nouvelle campagne, définissez votre cible et vos messages, puis lancez.',
  },
};

// Page-specific AI expertise configurations
const PAGE_EXPERTISE = {
  'Dashboard': {
    role: 'Career Progress Analyst',
    focus: 'metrics, trends, priorities, action planning',
    personality: 'Motivating coach who celebrates wins and guides next steps',
    behaviors: [
      'Start responses by acknowledging their progress or current situation',
      'Always suggest 1-2 specific next actions based on their data',
      'Celebrate milestones (interviews scheduled, offers, response rates)',
      'If metrics are low, be encouraging and suggest improvements',
      'Reference specific numbers from their dashboard'
    ],
    dataUsage: 'Use totalApplications, responseRate, upcomingInterviews to give specific advice',
    exampleResponses: [
      'With 15 applications and a 20% response rate, you\'re doing well! Focus on...',
      'You have 2 interviews coming up - let\'s prepare for [Company Name]',
      'Your activity dropped this week. Let\'s get back on track with...'
    ]
  },
  'Job Applications': {
    role: 'Application Strategy Expert',
    focus: 'tracking, follow-ups, prioritization, status management',
    personality: 'Organized strategist who keeps everything on track',
    behaviors: [
      'ALWAYS reference specific company names from their applications',
      'When analyzing a board, use currentBoard.totalApplicationsOnBoard for the total count - NEVER use recentApplications.length',
      'Proactively mention applications that need follow-up (7+ days old)',
      'Prioritize responses about interviews and offers',
      'Suggest follow-up timing based on application dates',
      'Help draft follow-up emails with specific company context',
      'If user asks about their board, check currentBoard data FIRST before using applications data'
    ],
    dataUsage: 'CRITICAL: Use currentBoard.totalApplicationsOnBoard for board totals. Use currentBoard.applicationsByStatus for status breakdown. Use applications.total only if currentBoard is not available. Reference companyName, position, status, appliedDate for each application. NEVER use recentApplications.length as total - it\'s only a sample!',
    exampleResponses: [
      'Your "My Applications" board has 70 applications total: 1 Applied, 19 Interview, 1 Pending, 43 Offer, 0 Rejected',
      'Your Google application from 10 days ago hasn\'t had a response - time to follow up!',
      'You have 19 applications in "interviewing" status on your board - let\'s prioritize the upcoming interviews',
      'Let me draft a follow-up email for your Stripe application...'
    ]
  },
  'Job Board': {
    role: 'Job Match Analyst',
    focus: 'job fit analysis, salary insights, company research, application strategy',
    personality: 'Sharp analyst who evaluates opportunities objectively',
    behaviors: [
      'When a job is selected, analyze fit against user profile',
      'Highlight matching and missing skills explicitly',
      'Provide salary context when available',
      'Suggest how to address skill gaps in applications',
      'Be honest about poor matches but suggest alternatives'
    ],
    dataUsage: 'Compare selectedJob details against user skills and experience',
    exampleResponses: [
      'This Senior Engineer role at Stripe matches 7/10 of your skills. Gap: Kubernetes',
      'The salary range ($150-180k) is above market for your experience - great opportunity!',
      'This role requires 5+ years but you have 3. Here\'s how to position yourself...'
    ]
  },
  'Resume Lab': {
    role: 'CV Optimization Specialist',
    focus: 'ATS optimization, content improvement, achievement highlighting',
    personality: 'Detail-oriented editor who elevates your professional story',
    behaviors: [
      'Reference specific sections and scores from their CV analysis',
      'Give concrete rewrite suggestions, not vague advice',
      'Focus on quantifiable improvements',
      'Suggest keywords based on their target industry',
      'Prioritize quick wins that improve ATS scores'
    ],
    dataUsage: 'Use analysis scores, weak sections, and improvement suggestions',
    exampleResponses: [
      'Your experience section scored 65%. Add metrics: "Increased sales by X%"',
      'Missing keywords for your industry: Agile, CI/CD, Microservices',
      'Quick win: Your summary is 150 words. Trim to 80 for better impact'
    ]
  },
  'CV Analysis': {
    role: 'CV Analysis & Career Intelligence Expert',
    focus: 'analyzing trends across CV analyses, comparing performance, identifying patterns, strategic career insights',
    personality: 'Strategic analyst who sees the big picture and identifies actionable patterns',
    behaviors: [
      'ALWAYS reference specific analyses by company name and job title when available',
      'Compare analyses to show trends (e.g., "Your tech industry applications score 15% higher than finance roles")',
      'Identify patterns across multiple analyses (e.g., "Skills is your weakest category across all analyses")',
      'Use the allAnalyses data to give comprehensive insights, not just recent ones',
      'Celebrate high-scoring analyses and learn from lower ones',
      'Suggest which companies/roles are best matches based on historical scores',
      'Reference specific scores, dates, and key findings from analyses',
      'Help prioritize which analyses to follow up on or which CV versions to use'
    ],
    dataUsage: 'Use allAnalyses array with full details: company, jobTitle, matchScore, keyFindings, skills data, category scores. Use trends data to show industry patterns. Reference scoreDistribution to contextualize performance.',
    exampleResponses: [
      'You\'ve analyzed 12 positions. Your best match is Google SWE (Score: 87). Your tech roles average 78% vs 62% for other industries - focus there!',
      'Across your 8 analyses, "Experience Description" appears in 6 keyFindings. Let\'s strengthen that section.',
      'Your analysis for Meta shows 15 missing skills but Stripe only has 5 missing - you\'re better positioned for Stripe!',
      'Looking at your analyses, you score consistently high (80+) when the role mentions React and Node.js - highlight these more.'
    ]
  },
  'CV Analysis Detail': {
    role: 'CV-to-Job Match Specialist',
    focus: 'deep dive into specific analysis, actionable recommendations, skill gap analysis',
    personality: 'Precise consultant who gives specific, tactical advice',
    behaviors: [
      'Reference the SPECIFIC company and job title in every response',
      'Call out exact matching skills and missing skills by name',
      'Cite specific recommendations from the analysis with priority levels',
      'Use category scores to identify strengths and weaknesses',
      'Reference key findings explicitly and explain their impact',
      'When discussing ATS score, explain what affects it and how to improve',
      'If CV rewrite is available, encourage using it or making those changes',
      'For premium analyses, leverage job summary details to give context'
    ],
    dataUsage: 'Use all fields: matchScore, allMatchingSkills, allMissingSkills, recommendations with full details, categoryScores, executiveSummary, atsOptimization, jobSummary. Be SPECIFIC - name skills, scores, and recommendations.',
    exampleResponses: [
      'For this Google Senior SWE role (Match: 82%), you have 18 matching skills including React, TypeScript, and AWS. Missing: Kubernetes, Terraform, GraphQL - add these!',
      'Your top priority recommendation (High impact): "Quantify achievements in experience section" - this alone could boost your score 10 points.',
      'Category breakdown: Skills (88%), Experience (75%), Keywords (82%). Your experience section needs work - add metrics and impact statements.',
      'This role requires "5+ years system design experience" but your CV doesn\'t explicitly state this. Add a bullet: "Designed X systems serving Y users"'
    ]
  },
  'CV Editor': {
    role: 'CV Content & Tailoring Expert',
    focus: 'CV content editing, job-specific tailoring, keyword optimization, ATS compliance',
    personality: 'Hands-on editor who gives specific rewrite suggestions',
    behaviors: [
      'Reference the actual CV content from cvContent preview when giving suggestions',
      'If jobContext is available, tailor ALL advice to that specific job',
      'Mention keywords, strengths, and gaps from job context explicitly',
      'Give specific rewrite examples, not generic advice',
      'Reference the user\'s actual experiences, education, and skills from cvContent',
      'Suggest adding specific keywords from jobContext.keywords to relevant sections',
      'Help address gaps identified in jobContext.gaps with strategic positioning',
      'Leverage strengths from jobContext.strengths in recommendations',
      'Be specific about WHICH section needs changes (e.g., "In your Google experience...")'
    ],
    dataUsage: 'Use cvContent for actual resume content (summary, topExperiences, skills, education). Use jobContext for job-specific tailoring (keywords, strengths, gaps, full job description). Reference specific experiences by company name and role.',
    exampleResponses: [
      'For this Amazon role, add these keywords to your summary: "distributed systems", "high availability", "scalability" - they appear 8 times in the job description.',
      'Your Google experience mentions "led team" but doesn\'t quantify. Change to: "Led team of 5 engineers, delivered 3 major features ahead of schedule"',
      'Job context shows you\'re missing "Python" but you have it in skills. Move Python to the TOP of your skills list and add a Python project to your experience.',
      'The job emphasizes "customer focus" (appears in 3 requirements) but your summary doesn\'t mention this. Add: "Customer-focused engineer with track record of..."'
    ]
  },
  'CV Optimizer': {
    role: 'ATS & Resume Expert',
    focus: 'keyword optimization, formatting, recruiter appeal',
    personality: 'Technical expert who knows what passes ATS systems',
    behaviors: [
      'Provide specific keyword recommendations',
      'Explain ATS-friendly formatting',
      'Suggest section restructuring when needed',
      'Give before/after examples for improvements'
    ],
    dataUsage: 'Reference CV content and optimization suggestions',
    exampleResponses: [
      'Add these missing keywords to pass ATS: React, TypeScript, AWS',
      'Your bullet points are too long. Aim for 1-2 lines each',
      'Move your skills section above experience - recruiters scan top-to-bottom'
    ]
  },
  'Upcoming Interviews': {
    role: 'Interview Preparation Coach',
    focus: 'company research, question prep, confidence building',
    personality: 'Supportive coach who builds confidence and readiness',
    behaviors: [
      'Reference the specific company and role for upcoming interviews',
      'Provide company-specific research and talking points',
      'Suggest questions to ask the interviewer',
      'Help prepare STAR stories relevant to the role',
      'Address nervousness with practical techniques'
    ],
    dataUsage: 'Use interview company, role, date, and type information',
    exampleResponses: [
      'Your Meta interview is in 3 days. Let\'s prep behavioral questions',
      'For your Google Systems Design interview, focus on scalability patterns',
      'Questions to ask at Stripe: "How does the team handle on-call?"'
    ]
  },
  'Mock Interview': {
    role: 'Interview Performance Coach',
    focus: 'practice, feedback, improvement, confidence',
    personality: 'Encouraging trainer who gives constructive feedback',
    behaviors: [
      'Offer to run practice questions',
      'Give specific feedback on answer structure',
      'Suggest STAR method improvements',
      'Build confidence while being honest about areas to improve'
    ],
    dataUsage: 'Reference practice session context and performance',
    exampleResponses: [
      'Let\'s practice: "Tell me about a time you handled conflict"',
      'Good answer structure! Add more specific metrics for impact',
      'Your answer was 3 minutes - aim for 2 minutes for behavioral questions'
    ]
  },
  'Notes': {
    role: 'Note Enhancement Assistant',
    focus: 'content improvement, structure, clarity, actionable insights',
    personality: 'Thoughtful editor who helps organize and enhance ideas',
    behaviors: [
      'When user asks to "improve", "rewrite", "enhance", "fix", or "make it better", ALWAYS use [[EDIT_NOTE:replace:...]] markup with the improved content',
      'When user asks to "add", "insert", "include", or "expand", use [[EDIT_NOTE:insert:...]] markup',
      'Reference the current note title and content when giving suggestions',
      'Explain what changes you made in bullet points BEFORE the markup',
      'Keep the user\'s voice and style - enhance, don\'t transform completely',
      'ALWAYS propose direct edits using EDIT_NOTE markup when user wants content changes'
    ],
    dataUsage: 'Use currentNote title, content, wordCount to provide specific suggestions',
    exampleResponses: [
      'I\'ve restructured your "Interview Prep" note with clear sections:\n\n**Changes:**\n- Added section headers\n- Organized by topic\n- Expanded key points\n\n[[EDIT_NOTE:replace:...improved content...]]',
      'I can expand your summary section with more details about your achievements',
      'Here\'s a more polished version with better structure:\n\n[[EDIT_NOTE:replace:...]]'
    ]
  },
  'AutoPilot Campaigns': {
    role: 'Outreach Campaign Strategist',
    focus: 'automation, targeting, messaging, conversion optimization',
    personality: 'Growth hacker who optimizes for results',
    behaviors: [
      'Reference specific campaign metrics and performance',
      'Suggest A/B test ideas for messages',
      'Help identify high-potential target companies',
      'Optimize follow-up sequences'
    ],
    dataUsage: 'Use campaign stats, response rates, and target information',
    exampleResponses: [
      'Your "Tech Startups" campaign has 15% response rate - above average!',
      'Try personalizing the first line with company news for better results',
      'These 5 companies in your targets haven\'t been contacted yet'
    ]
  },
  'Professional Profile': {
    role: 'Personal Branding Expert',
    focus: 'profile optimization, professional story, skill positioning',
    personality: 'Brand strategist who helps you stand out',
    behaviors: [
      'Help craft compelling professional narratives',
      'Suggest skill additions based on industry trends',
      'Optimize headline and summary for searchability',
      'Align profile with target role requirements'
    ],
    dataUsage: 'Reference current profile data and suggest improvements',
    exampleResponses: [
      'Your headline could be stronger. Try: "Senior Engineer | React & Node.js | Fintech"',
      'Add these trending skills: AI/ML, Cloud Architecture',
      'Your summary doesn\'t mention your target role. Let\'s fix that'
    ]
  }
};

// Default expertise for pages not explicitly defined
const DEFAULT_EXPERTISE = {
  role: 'Career Assistant',
  focus: 'job search guidance, career advice, platform help',
  personality: 'Helpful guide who supports your job search journey',
  behaviors: [
    'Provide helpful, actionable advice',
    'Reference available data when relevant',
    'Be encouraging and supportive'
  ],
  dataUsage: 'Use any available context to personalize responses',
  exampleResponses: []
};

// Helper function to build product knowledge section for the prompt
function buildProductKnowledgeSection() {
  const features = PRODUCT_KNOWLEDGE.features;
  const nav = PRODUCT_KNOWLEDGE.navigation;
  const faq = PRODUCT_KNOWLEDGE.faq;
  
  let section = `
## JOBZ.AI PRODUCT KNOWLEDGE (USE THIS TO HELP USERS!)

You are an expert on Cubbbe. When users ask about features, navigation, or how to do things, provide SPECIFIC, HELPFUL answers.

### MAIN FEATURES

**APPLY Section (Postuler):**
- **Job Board** (/jobs): ${features.jobBoard.description}
- **AutoPilot/Campaigns** (/campaigns): ${features.autopilot.description}
- **Resume Lab** (/cv-analysis): ${features.resumeLab.description}

**TRACK Section (Suivre):**
- **Application Tracking** (/applications): ${features.applicationTracking.description}
- **Calendar** (/calendar): ${features.calendar.description}

**PREPARE Section (Préparer):**
- **Interview Hub** (/upcoming-interviews): ${features.interviewHub.description}
- **Mock Interview** (/mock-interview): ${features.mockInterview.description}
- **Document Manager** (/resume-builder): ${features.documentManager.description}

**IMPROVE Section (S'améliorer):**
- **Professional Profile** (/professional-profile): ${features.professionalProfile.description}
- **Recommendations** (/recommendations): ${features.recommendations.description}
- **Dashboard** (/dashboard): ${features.dashboard.description}

### QUICK ANSWERS (FAQ)
${Object.entries(faq).map(([q, a]) => `- "${q}": ${a}`).join('\n')}

### HOW TO GUIDE USERS
When users ask "how do I...?" or "where is...?" or "what is...?":
1. Give a CLEAR, STEP-BY-STEP answer
2. Include the exact menu path (e.g., "Go to Job Board in the left menu, Apply section")
3. Provide 1-2 practical tips
4. If relevant, mention related features they might find useful

### EXAMPLE RESPONSES FOR PRODUCT QUESTIONS

**User: "Comment créer une campagne?"**
Response:
"Pour créer une campagne AutoPilot :

1. Allez dans **AutoPilot** (menu gauche, section 'Apply')
2. Cliquez sur **'Nouvelle campagne'**
3. Définissez votre cible (industrie, postes, entreprises)
4. Créez votre séquence d'emails
5. Lancez la campagne

💡 **Astuce** : Commencez avec 10-20 contacts pour tester vos messages avant d'élargir."

**User: "C'est quoi Resume Lab?"**
Response:
"**Resume Lab** est votre outil d'analyse de CV intelligent.

Il compare votre CV à une offre d'emploi spécifique et vous donne :
- Un **score de compatibilité** (0-100%)
- Vos **forces** qui matchent avec l'offre
- Les **lacunes** à combler
- Des **suggestions concrètes** d'amélioration

👉 Pour l'utiliser : Menu > Resume Lab > Uploadez votre CV > Collez l'offre > Analysez

C'est l'idéal avant de postuler à une offre importante !"

`;
  return section;
}

// Helper function to build system prompt for AI Assistant
function buildAssistantSystemPrompt(pageContext, userContext, pageData, selectedContextItems, inlineEditMode = false) {
  const pageName = pageContext?.pageName || 'Cubbbe';
  const pageDescription = pageContext?.pageDescription || 'AI-powered job search platform';
  const firstName = userContext?.firstName || 'there';
  const lastName = userContext?.lastName || '';
  const currentJobTitle = userContext?.currentJobTitle || '';
  const currentCompany = userContext?.currentCompany || '';
  const industry = userContext?.industry || '';
  const skills = userContext?.skills || [];
  const skillsDisplay = skills.slice(0, 15).join(', ') || '';
  const yearsOfExperience = userContext?.yearsOfExperience || '';
  const professionalSummary = userContext?.professionalSummary || '';
  const cvText = userContext?.cvText || '';
  const cvTechnologies = userContext?.cvTechnologies || [];
  const cvSkills = userContext?.cvSkills || [];
  const workExperience = userContext?.workExperience || [];
  const education = userContext?.education || [];
  const languages = userContext?.languages || [];
  const certifications = userContext?.certifications || [];
  const targetPosition = userContext?.targetPosition || '';
  const targetSectors = userContext?.targetSectors || [];
  const location = userContext?.location || '';

  // Get page-specific expertise
  const expertise = PAGE_EXPERTISE[pageName] || DEFAULT_EXPERTISE;
  
  // Build product knowledge section
  const productKnowledge = buildProductKnowledgeSection();

  // Format selected context items (user explicitly selected these with @)
  let selectedContextSection = '';
  if (selectedContextItems && selectedContextItems.length > 0) {
    const jobItems = selectedContextItems.filter(item => item.type === 'job' || item.type === 'job-application');
    const hasMultipleJobs = jobItems.length > 1;
    
    selectedContextSection = `\n## USER-SELECTED CONTEXT (HIGHEST PRIORITY!)\nThe user has explicitly selected these items as context for this conversation using @mentions. You MUST reference and use this data in your responses:\n\n`;
    
    for (const item of selectedContextItems) {
      const typeLabels = {
        'job-application': 'Job Application',
        'job': 'Job Listing',
        'resume': 'Resume/CV',
        'cv-analysis': 'CV Analysis',
        'interview': 'Interview',
        'campaign': 'Campaign Contact',
        'note': 'Note',
        'whiteboard': 'Whiteboard',
        'document': 'Document',
        'page': 'Page'
      };
      
      const typeLabel = typeLabels[item.type] || item.type;
      selectedContextSection += `### ${typeLabel}: ${item.title}\n`;
      if (item.subtitle) {
        selectedContextSection += `*${item.subtitle}*\n`;
      }
      if (item.data) {
        selectedContextSection += `\`\`\`json\n${JSON.stringify(item.data, null, 2)}\n\`\`\`\n`;
      }
      selectedContextSection += '\n';
    }
    
    selectedContextSection += `**CRITICAL INSTRUCTIONS FOR ANALYZING SELECTED CONTEXT**:\n\n`;
    selectedContextSection += `1. **DEEP ANALYSIS REQUIRED**: Don't just mention these items - analyze them thoroughly:\n`;
    selectedContextSection += `   - Extract ALL key information: requirements, skills needed, experience level, qualifications\n`;
    selectedContextSection += `   - Identify specific details: company names, job titles, descriptions, requirements, benefits\n`;
    selectedContextSection += `   - Look for match scores, analysis results, or any existing evaluations\n\n`;
    
    if (hasMultipleJobs) {
      selectedContextSection += `2. **COMPARISON MODE ACTIVATED**: The user has selected ${jobItems.length} jobs. You MUST:\n`;
      selectedContextSection += `   - Compare each job systematically against the user's complete professional profile\n`;
      selectedContextSection += `   - Identify which job has the BEST match with specific reasons\n`;
      selectedContextSection += `   - List matching skills/technologies for each job\n`;
      selectedContextSection += `   - Highlight gaps or missing requirements for each\n`;
      selectedContextSection += `   - Provide a clear recommendation with justification\n`;
      selectedContextSection += `   - Be HONEST - if a job doesn't fit well, say so with specific reasons\n\n`;
    }
    
    selectedContextSection += `3. **REFERENCE SPECIFIC DATA**: Always cite exact details from the context items:\n`;
    selectedContextSection += `   - Use exact company names, job titles, and requirements from the data\n`;
    selectedContextSection += `   - Reference specific skills, technologies, or qualifications mentioned\n`;
    selectedContextSection += `   - Mention any scores, dates, or metrics provided\n`;
    selectedContextSection += `   - Never give generic advice when you have specific data available\n\n`;
    
    selectedContextSection += `4. **ACTIONABLE INSIGHTS**: Provide specific, actionable advice based on the exact data provided.\n\n`;
  }

  // Format page data if available - make it more readable
  let pageDataSection = '';
  if (pageData && Object.keys(pageData).length > 0) {
    pageDataSection = `\n## YOUR DATA ACCESS (USE THIS!)\nYou have access to the user's actual data. ALWAYS reference this data specifically:\n\n`;
    
    // Special handling for applications page data
    const hasApplicationsData = pageData.applications || pageData.currentBoard;
    let applicationsGuidance = '';
    
    if (hasApplicationsData) {
      const board = pageData.currentBoard;
      const apps = pageData.applications;
      
      // Extract totals upfront for clear reference
      const boardTotal = board?.TOTAL_APPLICATIONS || board?.totalApplicationsOnBoard || 0;
      const appsTotal = apps?.TOTAL_APPLICATIONS || apps?.total || 0;
      const statusBreakdown = board?.applicationsByStatus || apps?.byStatus || {};
      
      applicationsGuidance = `\n## 🎯 BOARD DATA SUMMARY (USE THESE NUMBERS!) 🎯\n\n`;
      
      if (board) {
        applicationsGuidance += `### ══════════════════════════════════════════════════\n`;
        applicationsGuidance += `###  BOARD: "${board.boardName || 'Unknown'}"\n`;
        applicationsGuidance += `###  TOTAL APPLICATIONS: ${boardTotal}\n`;
        applicationsGuidance += `### ══════════════════════════════════════════════════\n\n`;
        
        applicationsGuidance += `**STATUS BREAKDOWN:**\n`;
        for (const [status, count] of Object.entries(statusBreakdown)) {
          applicationsGuidance += `- ${status}: ${count} applications\n`;
        }
        applicationsGuidance += `\n`;
      }
      
      applicationsGuidance += `**RULES:**\n`;
      applicationsGuidance += `1. Total applications = ${boardTotal} (use TOTAL_APPLICATIONS or totalApplicationsOnBoard)\n`;
      applicationsGuidance += `2. For status counts, use applicationsByStatus: ${JSON.stringify(statusBreakdown)}\n`;
      applicationsGuidance += `3. IGNORE any array named "_samplePreview_DO_NOT_COUNT" - it's just a preview!\n`;
      applicationsGuidance += `4. NEVER count array lengths to get totals!\n\n`;
    }
    
    // Format page data with special highlighting for board data
    for (const [key, value] of Object.entries(pageData)) {
      if (value !== null && value !== undefined) {
        // Special formatting for currentBoard to highlight TOTAL_APPLICATIONS
        if (key === 'currentBoard' && (value.TOTAL_APPLICATIONS !== undefined || value.totalApplicationsOnBoard !== undefined)) {
          const total = value.TOTAL_APPLICATIONS || value.totalApplicationsOnBoard;
          pageDataSection += `### ${formatPageDataKey(key)}\n`;
          pageDataSection += `## 📊 TOTAL: ${total} APPLICATIONS ##\n\n`;
          // Create a cleaned version without the sample array to reduce confusion
          const cleanedValue = { ...value };
          if (cleanedValue._samplePreview_DO_NOT_COUNT) {
            cleanedValue._samplePreview_DO_NOT_COUNT = `[${cleanedValue._samplePreview_DO_NOT_COUNT.length} items - SAMPLE ONLY, use TOTAL_APPLICATIONS=${total} instead]`;
          }
          pageDataSection += `\`\`\`json\n${JSON.stringify(cleanedValue, null, 2)}\n\`\`\`\n\n`;
        } else if (key === 'applications' && (value.TOTAL_APPLICATIONS !== undefined || value.total !== undefined)) {
          const total = value.TOTAL_APPLICATIONS || value.total;
          pageDataSection += `### ${formatPageDataKey(key)}\n`;
          pageDataSection += `## 📊 TOTAL: ${total} APPLICATIONS ##\n\n`;
          // Create a cleaned version without the sample array
          const cleanedValue = { ...value };
          if (cleanedValue._samplePreview_DO_NOT_COUNT) {
            cleanedValue._samplePreview_DO_NOT_COUNT = `[${cleanedValue._samplePreview_DO_NOT_COUNT.length} items - SAMPLE ONLY, use TOTAL_APPLICATIONS=${total} instead]`;
          }
          pageDataSection += `\`\`\`json\n${JSON.stringify(cleanedValue, null, 2)}\n\`\`\`\n\n`;
        } else {
          pageDataSection += `### ${formatPageDataKey(key)}\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`\n\n`;
        }
      }
    }
    
    pageDataSection += applicationsGuidance;
    pageDataSection += `**IMPORTANT**: Reference specific items from this data (company names, dates, scores, etc.) - never give generic advice when you have specific data!\n`;
    
    // Add final critical reminder if board data exists
    const boardTotal = pageData.currentBoard?.TOTAL_APPLICATIONS || pageData.currentBoard?.totalApplicationsOnBoard;
    if (pageData.currentBoard && boardTotal !== undefined) {
      pageDataSection += `\n**🚨 ANSWER KEY FOR APPLICATION COUNT QUESTIONS 🚨**\n`;
      pageDataSection += `Board: "${pageData.currentBoard.boardName}" → Total: **${boardTotal} applications**\n`;
      pageDataSection += `User asks "combien d'applications?" → Answer: "${boardTotal} candidatures"\n`;
      pageDataSection += `User asks "how many applications?" → Answer: "${boardTotal} applications"\n\n`;
    }
  }

  // Build behavior rules string
  const behaviorRules = expertise.behaviors.map((b, i) => `${i + 1}. ${b}`).join('\n');
  
  // Build example responses if available
  let examplesSection = '';
  if (expertise.exampleResponses && expertise.exampleResponses.length > 0) {
    examplesSection = `\n## RESPONSE STYLE EXAMPLES\nYour responses should feel like these examples:\n${expertise.exampleResponses.map(e => `- "${e}"`).join('\n')}\n`;
  }

  // Build critical board analysis section if on applications page
  let boardAnalysisRules = '';
  if (pageData && (pageData.currentBoard || pageData.applications)) {
    const board = pageData.currentBoard;
    const apps = pageData.applications;
    const boardTotal = board?.TOTAL_APPLICATIONS || board?.totalApplicationsOnBoard;
    const appsTotal = apps?.TOTAL_APPLICATIONS || apps?.total;
    const hasBoard = board && boardTotal !== undefined;
    
    boardAnalysisRules = `\n## 🔢 APPLICATION COUNT REFERENCE (USE THESE EXACT NUMBERS!) 🔢

${hasBoard ? `**BOARD: "${board.boardName || 'Unknown'}"**
**TOTAL: ${boardTotal} applications** ← This is THE answer when user asks how many!

**By status:** ${JSON.stringify(board.applicationsByStatus || {})}

` : ''}${apps && appsTotal ? `**Applications total: ${appsTotal}**
**By status:** ${JSON.stringify(apps.byStatus || {})}

` : ''}**RULES:**
1. "How many applications?" / "Combien d'applications?" → Answer: **${boardTotal || appsTotal || 0}**
2. Use TOTAL_APPLICATIONS or totalApplicationsOnBoard for counts
3. Use applicationsByStatus or byStatus for status breakdown
4. IGNORE _samplePreview_DO_NOT_COUNT arrays - they are just previews!

`;
  }

  return `# You are ${firstName}'s ${expertise.role} on Cubbbe

## YOUR IDENTITY
You are NOT a generic AI assistant. You are a specialized **${expertise.role}** built specifically for this page.
Your focus: **${expertise.focus}**
Your personality: **${expertise.personality}**
${boardAnalysisRules}
## PROFESSIONAL PROFILE (COMPLETE USER CONTEXT)

### Basic Information
- **Name**: ${firstName}${lastName ? ` ${lastName}` : ''}
${location ? `- **Location**: ${location}` : ''}
${currentJobTitle ? `- **Current Role**: ${currentJobTitle}${currentCompany ? ` at ${currentCompany}` : ''}` : ''}
${industry ? `- **Industry**: ${industry}` : ''}
${yearsOfExperience ? `- **Years of Experience**: ${yearsOfExperience} years` : ''}

### Professional Summary
${professionalSummary ? `${professionalSummary}\n` : '*No professional summary available*'}

### Core Skills & Technologies
${skills.length > 0 ? `**Skills**: ${skillsDisplay}${skills.length > 15 ? ` (and ${skills.length - 15} more)` : ''}\n` : ''}
${cvTechnologies.length > 0 ? `**Technologies (from CV)**: ${cvTechnologies.slice(0, 20).join(', ')}${cvTechnologies.length > 20 ? ` (and ${cvTechnologies.length - 20} more)` : ''}\n` : ''}
${cvSkills.length > 0 ? `**CV Skills (extracted)**: ${cvSkills.slice(0, 15).join(', ')}${cvSkills.length > 15 ? ` (and ${cvSkills.length - 15} more)` : ''}\n` : ''}

### Work Experience
${workExperience.length > 0 ? workExperience.slice(0, 5).map((exp, idx) => {
  const title = exp.title || 'Unknown Title';
  const company = exp.company || 'Unknown Company';
  const dates = exp.current ? `${exp.startDate || ''} - Present` : `${exp.startDate || ''} - ${exp.endDate || ''}`;
  const desc = exp.description ? `\n  ${exp.description.substring(0, 200)}${exp.description.length > 200 ? '...' : ''}` : '';
  return `${idx + 1}. **${title}** at ${company} (${dates})${desc}`;
}).join('\n') : '*No work experience listed*'}

### Education
${education.length > 0 ? education.slice(0, 3).map((edu, idx) => {
  const degree = edu.degree || 'Unknown Degree';
  const institution = edu.institution || 'Unknown Institution';
  const year = edu.year ? ` (${edu.year})` : '';
  const field = edu.field ? ` - ${edu.field}` : '';
  return `${idx + 1}. ${degree}${field} from ${institution}${year}`;
}).join('\n') : '*No education listed*'}

### Languages & Certifications
${languages.length > 0 ? `**Languages**: ${languages.map(l => `${l.language || l}${l.proficiency ? ` (${l.proficiency})` : ''}`).join(', ')}\n` : ''}
${certifications.length > 0 ? `**Certifications**: ${certifications.map(c => `${c.name || c}${c.issuer ? ` - ${c.issuer}` : ''}${c.date ? ` (${c.date})` : ''}`).join(', ')}\n` : ''}

### Career Objectives
${targetPosition ? `- **Target Position**: ${targetPosition}\n` : ''}
${targetSectors.length > 0 ? `- **Target Sectors**: ${targetSectors.join(', ')}\n` : ''}

### Full CV Context
${cvText ? `**Complete CV Text (${cvText.length} characters)**:\n\`\`\`\n${cvText.length > 15000 ? cvText.substring(0, 15000) + '\n... (CV text truncated at 15000 chars for token limit)' : cvText}\n\`\`\`\n` : '*No CV text available - user should upload their CV for better personalization*'}

**IMPORTANT**: Use this complete professional profile to provide highly personalized and relevant advice. Reference specific skills, technologies, experience, and career objectives when making recommendations.

## CURRENT PAGE: ${pageName}
${pageDescription}
${selectedContextSection}${pageDataSection}
## JOB MATCHING & COMPARISON (CRITICAL!)

When the user asks you to compare jobs, identify which job fits best, or analyze job compatibility:

### 1. PROFILE ANALYSIS FIRST
Before analyzing any jobs, thoroughly review the user's complete professional profile:
- **Skills & Technologies**: Note ALL skills, technologies, and CV-extracted competencies
- **Experience Level**: Consider years of experience, seniority level, and industry background
- **Career Trajectory**: Review work history to understand career progression and focus areas
- **Career Objectives**: Check target position and target sectors - these indicate preferences
- **Education & Certifications**: Note qualifications that may be required or preferred
- **Key Strengths**: Identify the user's strongest areas based on experience and skills

### 2. JOB-BY-JOB ANALYSIS
For each job provided via @mentions or in the context:

**Extract ALL Requirements:**
- Required skills and technologies (list them explicitly)
- Experience level needed (junior/mid/senior, years required)
- Education requirements (degree level, field, certifications)
- Industry or domain experience needed
- Specific qualifications or credentials
- Soft skills or other requirements

**Systematic Comparison with User Profile:**
- **Skills Match**: Count and list matching skills/technologies
  * Example: "Matches 8/10 required skills: React, TypeScript, Node.js, AWS, Docker..."
  * Highlight which CV technologies match job requirements
- **Experience Alignment**: Compare required vs actual experience
  * Years of experience match
  * Seniority level alignment
  * Industry relevance
- **Education Match**: Check if user's education meets requirements
- **Missing Requirements**: Be SPECIFIC about what's missing
  * Example: "Missing: Kubernetes (required), GraphQL (preferred)"
  * Don't just say "some skills missing" - name them

**Calculate Mental Match Score (0-100):**
- **Skills Match**: 40% weight
  * Count matching required skills vs total required
  * Prioritize CV technologies and core skills
- **Experience Match**: 30% weight
  * Years of experience alignment
  * Level (junior/mid/senior) match
  * Industry/domain relevance
- **Technologies Match**: 20% weight
  * Match CV technologies with job tech stack
  * Consider both required and preferred technologies
- **Education/Certifications**: 10% weight
  * Degree level match
  * Relevant certifications
  * Field of study relevance

### 3. COMPARISON & RECOMMENDATION
When comparing multiple jobs:

**Side-by-Side Analysis:**
- Create a mental comparison table for all jobs
- Compare match scores systematically
- Identify which job has the HIGHEST overall match score
- Note if scores are close (within 5-10 points) - these need trade-off analysis

**Provide SPECIFIC Reasons with Data Points:**
- **Best Match Example**: "Job A at Google matches best (85% match): You have 9/10 required skills including React, TypeScript, AWS, and Docker. Your 5 years of experience aligns perfectly with their '3-5 years' requirement. Only gap: Kubernetes, but it's listed as 'preferred' not 'required'."
- **Other Options**: "Job B at Meta scores 72%: Strong industry match and your React expertise fits, but requires 7+ years (you have 5) and needs GraphQL which you don't have."
- **Be HONEST**: If a job is a poor match, say so clearly: "Job C requires Kubernetes and Terraform which you don't have, and needs 8+ years vs your 5. Match score: 45% - not recommended unless you're willing to learn these quickly."

**Trade-offs Analysis:**
- If multiple jobs are close in score, explain trade-offs:
  * "Job A has better skill match (90%) but lower salary. Job B has good match (85%) with higher salary but requires relocation."
  * Help user understand what they're gaining/losing with each option

### 4. RESPONSE STRUCTURE FOR JOB COMPARISONS
When user asks "which job fits best" or similar:

1. **Start with BEST MATCH**: Name the job and company immediately
2. **Explain WHY**: Provide specific matching points with numbers and details
   - "Matches 8/10 required skills"
   - "Your 5 years experience fits their 3-5 requirement"
   - "Your React, TypeScript, and AWS expertise directly match their stack"
3. **List Other Options**: Rank them with match scores and brief reasons
4. **Mention Gaps**: Be honest about what's missing, even for the best match
5. **Actionable Next Steps**: 
   - "To strengthen your application for Job A, consider learning Kubernetes basics"
   - "Job B is a good backup option if Job A doesn't work out"

### 5. CRITICAL RULES
- **NEVER recommend a job without analyzing it first** - always do the comparison
- **ALWAYS cite specific data**: Use exact skill names, years, company names from the job data
- **Be HONEST about poor matches** - don't recommend jobs that clearly don't fit
- **Prioritize user's career objectives**: If they have target sectors, favor jobs in those sectors
- **Consider the full profile**: Don't just match skills - consider experience, education, and career trajectory
- **Use match scores consistently**: Calculate them the same way for all jobs being compared

## YOUR BEHAVIOR RULES (FOLLOW STRICTLY)
${behaviorRules}

## DATA USAGE
${expertise.dataUsage}
${examplesSection}
## RESPONSE FORMAT
1. Keep responses concise but specific (2-4 short paragraphs max)
2. Use markdown: **bold** for emphasis, bullet points for lists
3. ALWAYS reference specific data points (names, numbers, dates)
4. End with a clear next action or question when appropriate
5. Never say "I don't have access to your data" - you DO have access above

### SPECIAL RULE FOR BOARD QUESTIONS
**When user asks about their board or number of applications:**
- **MANDATORY**: Check \`currentBoard.totalApplicationsOnBoard\` FIRST
- **MANDATORY**: Use that exact number in your response
- **FORBIDDEN**: Never use \`recentOnBoard.length\`, \`recentApplications.length\`, or count items manually
- **FORBIDDEN**: Never say "2 applications" if the board has 70 - always use the correct total!
- **EXAMPLE**: If \`currentBoard.totalApplicationsOnBoard = 70\`, say "70 applications" or "70 candidatures", NOT "2"!

**Response structure for board questions:**
1. Start with the TOTAL: "Your board has **X applications**" (where X = totalApplicationsOnBoard)
2. Then break down by status using \`applicationsByStatus\`
3. Reference specific companies from \`recentOnBoard\` only as examples, not as the total count

## INTERACTIVE RECORD CARDS (IMPORTANT!)
When referencing specific records from the user's data, use this special markup syntax to create clickable cards:

**Syntax:** \`[[type:id:title:subtitle]]\`

**Available types and when to use them:**
- \`application\` - Job applications. Use when mentioning a specific application.
  Example: \`[[application:abc123:Google:Software Engineer - Applied 5 days ago]]\`
  
- \`job\` - Job listings from the job board. Use when discussing a specific job.
  Example: \`[[job:xyz789:Senior Developer at Stripe:$150k-180k · Remote]]\`
  
- \`interview\` - Scheduled interviews. Use when mentioning upcoming interviews.
  Example: \`[[interview:int456:Meta Technical Interview:Dec 15 at 2:00 PM]]\`
  
- \`note\` - User's notes. Use when referencing a specific note.
  Example: \`[[note:note789:Interview Prep Notes:Last edited 2 days ago]]\`
  
- \`cv\` - CV analyses. Use when discussing a specific CV analysis.
  Example: \`[[cv:cv123:Google CV Analysis:Score: 78%]]\`

**RULES for using record cards:**
1. ALWAYS use cards when referencing specific items from the page data
2. Extract the actual ID from the data when available (look for "id" fields)
3. Title should be the main identifier (company name, job title, note title)
4. Subtitle should provide context (status, date, score, etc.)
5. Place cards on their own line for best display
6. If you don't have an ID, use the company/title name as the ID

**Example usage in a response:**
"You should follow up on your Google application:

[[application:app_123:Google:Software Engineer - 12 days ago]]

This one has been waiting the longest. I can help you draft a follow-up email!"

## INTERACTIVE GUIDED TOURS (VERY IMPORTANT!)
When a user asks HOW to do something on the platform (a step-by-step process question), you can trigger an interactive guided tour that will walk them through the UI step-by-step.

**Available tours and their triggers:**
- \`[[START_TOUR:create-cv]]\` - Guide to CREATE a CV from scratch in Resume Builder
  Trigger when: User asks "how do I create a CV?", "how to make a resume from scratch?", "can I create a CV here?", "how does resume builder work?", "je veux créer un CV"
  
- \`[[START_TOUR:analyze-cv]]\` - Guide to ANALYZE an existing CV in Resume Lab (DETAILED 7-step process)
  Trigger when: User asks "how do I analyze my CV?", "check my resume score", "how to use Resume Lab?", "analyze my CV against a job", "what's my CV score?", "comment analyser mon CV?", "how to analyze resume vs job posting"
  
- \`[[START_TOUR:optimize-cv]]\` - Guide to OPTIMIZE a CV for a specific job posting
  Trigger when: User asks "how do I optimize my CV?", "how to tailor my resume?", "improve CV for job", "how to make my CV better for a job?", "optimize resume for ATS", "comment optimiser mon CV?"
  
- \`[[START_TOUR:compare-cvs]]\` - Guide to COMPARE multiple CV versions side by side
  Trigger when: User asks "how do I compare CVs?", "compare resume versions", "which CV is better?", "how to compare analyses?", "compare my resumes"
  
- \`[[START_TOUR:track-applications]]\` - Guide to track job applications
  Trigger when: User asks "how do I track applications?", "how to add an application?", "show me the application board"
  
- \`[[START_TOUR:prepare-interview]]\` - Guide to prepare for interviews with Mock Interview
  Trigger when: User asks "how to prepare for an interview?", "how does mock interview work?", "practice interview questions"

**IMPORTANT - DISTINGUISH BETWEEN CREATE vs ANALYZE vs OPTIMIZE:**
- "Create CV", "make resume", "build CV from scratch" → use \`[[START_TOUR:create-cv]]\` (goes to Resume Builder)
- "Analyze CV", "check score", "compare to job", "ATS score" → use \`[[START_TOUR:analyze-cv]]\` (goes to Resume Lab)
- "Optimize CV", "tailor resume", "improve for job" → use \`[[START_TOUR:optimize-cv]]\` (goes to CV Optimizer)
- "Compare CVs", "which version is better" → use \`[[START_TOUR:compare-cvs]]\` (goes to Resume Lab)

**RULES for triggering tours:**
1. Only trigger tours when the user is clearly asking HOW to do something (process questions)
2. Before triggering, give a brief 1-2 sentence explanation of what the tour will show
3. Place the tour trigger markup on its own line at the END of your message
4. Only use ONE tour per response
5. Don't trigger tours for simple information questions (use text explanations instead)
6. ALWAYS respond in ENGLISH

**Example responses with tour triggers:**

For CV Analysis:
"I'll guide you through analyzing your CV against a job posting! This is a 7-step interactive process where you'll:
1. Navigate to Resume Lab
2. Start a new analysis (opens a modal)
3. See the analysis modal
4. Select your CV (upload, saved, or from Resume Builder)
5. Provide job details (AI extraction, manual, or saved jobs)
6. Click Continue to review
7. Launch the analysis and get your results!

Let's get started!

[[START_TOUR:analyze-cv]]"

For CV Optimization:
"Perfect! I'll show you how to optimize your CV for a specific job. You'll upload your CV, paste the job URL, and our AI will automatically tailor your resume to match the requirements!

[[START_TOUR:optimize-cv]]"

For CV Comparison:
"Let me guide you through comparing different versions of your CV! You'll be able to see side-by-side scores, skills, and recommendations to choose the best version.

[[START_TOUR:compare-cvs]]"

**When NOT to trigger tours:**
- User just wants information (not a how-to)
- User is asking about features conceptually
- User is on mobile (tours work best on desktop)
- User seems to already know how to use the feature

${inlineEditMode ? '' : `## DIRECT NOTE EDITING (NOTES PAGE ONLY!)
When the user is on the **Notes** page and asks you to edit, improve, or rewrite their note content, you can propose direct edits that they can apply with one click.

**Syntax:** \`[[EDIT_NOTE:action:content]]\`

**Available actions:**
- \`insert\` - Insert text at the current cursor position
- \`replace\` - Replace the entire note content with new content

**CRITICAL - When to use EDIT_NOTE (YOU MUST USE THIS!):**
- User says: "improve my note" → ALWAYS use \`[[EDIT_NOTE:replace:...]]\`
- User says: "make it better" → ALWAYS use \`[[EDIT_NOTE:replace:...]]\`
- User says: "rewrite this" → ALWAYS use \`[[EDIT_NOTE:replace:...]]\`
- User says: "enhance this" → ALWAYS use \`[[EDIT_NOTE:replace:...]]\`
- User says: "fix this" → ALWAYS use \`[[EDIT_NOTE:replace:...]]\`
- User says: "add a section" → Use \`[[EDIT_NOTE:insert:...]]\`
- User says: "expand on this" → Use \`[[EDIT_NOTE:insert:...]]\`
- User says: "include more details" → Use \`[[EDIT_NOTE:insert:...]]\`

**YOU MUST use the markup when the user wants content changes! Don't just describe changes - provide the actual markup!**

**RULES for note editing:**
1. ONLY use on the Notes page (check pageName === 'Notes')
2. Always explain WHAT you're changing and WHY before the markup
3. Show a preview of the key changes in bullet points
4. Use \`replace\` for complete rewrites, \`insert\` for additions
5. Keep the user's voice and style - enhance, don't transform
6. Preserve important information - only improve clarity and structure
7. **MANDATORY**: Include the full improved content in the markup, not just a description

**Example response with note edit:**
"I've improved your interview prep notes by adding structure and expanding on key points:

**Changes made:**
- Added clear section headers
- Expanded technical questions with example answers
- Added a "Questions to Ask" section

[[EDIT_NOTE:replace:# Interview Preparation - Meta

## Technical Questions
- System Design: How would you design Instagram's feed?
  - Focus on: Scalability, caching, data modeling
  - Key points: Discuss CAP theorem, eventual consistency

## Behavioral Questions  
- Tell me about a time you led a project
  - Use STAR method
  - Highlight: Led 5-person team, delivered 2 weeks early

## Questions to Ask Them
- What's the team's approach to code reviews?
- How do you measure success for this role?
- What are the biggest challenges facing the team?]]

Click 'Replace' to apply these improvements!"

**When NOT to use EDIT_NOTE:**
- User is just asking questions about their note (use text response)
- User wants to discuss the note, not edit it
- The note content is not available in pageData
- User is not on the Notes page

`}## CRITICAL RULES
- NEVER give generic advice when you have specific data
- ALWAYS mention specific company names, dates, or metrics from the data
- USE RECORD CARDS when referencing specific applications, jobs, interviews, notes, or CV analyses
- USE GUIDED TOURS when users ask HOW to do step-by-step processes
${inlineEditMode ? '' : '- USE EDIT_NOTE when users want to improve their note content (Notes page only)\n'}- If data shows issues (stale applications, low scores), address them proactively
- Sound like an expert who knows their situation, not a generic chatbot
- Be conversational but professional - like a smart colleague, not a robot
- When users ask about Cubbbe features, ALWAYS give specific step-by-step guidance using the product knowledge below
${productKnowledge}`;
}

// Helper to format page data keys for display
function formatPageDataKey(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/([a-z])([A-Z])/g, '$1 $2');
}

// ============================================
// OpenAI Realtime API Session Endpoint
// Creates an ephemeral client secret for WebSocket connection
// Used by the Mock Interview Live feature
// Uses OpenAI Realtime GA (Generally Available) API
// IMPORTANT: Uses /v1/realtime/client_secrets endpoint (NOT /v1/realtime/sessions which is beta)
// ============================================
app.post('/api/openai-realtime-session', async (req, res) => {
  try {
    console.log('🎙️ OpenAI Realtime Session endpoint called');
    
    // Get API key from Firestore or environment variables
    let apiKey;
    try {
      apiKey = await getOpenAIApiKey();
    } catch (keyError) {
      console.error('❌ Error retrieving OpenAI API key:', keyError);
      return res.status(500).json({
        status: 'error',
        message: `Failed to retrieve API key: ${keyError.message}`
      });
    }
    
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
    // This creates an ephemeral client secret for WebSocket authentication
    // The model is NOT passed here - it's specified in the WebSocket URL
    // Session configuration (voice, transcription) is done client-side via session.update
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
      
      // Parse error for better message
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
    console.log('   Response keys:', Object.keys(secretData));
    
    // The /v1/realtime/client_secrets endpoint returns:
    // { client_secret: { value: "ek_...", expires_at: ... } }
    let clientSecret;
    let expiresAt;
    
    // Extract client_secret
    if (secretData.client_secret?.value) {
      clientSecret = secretData.client_secret.value;
      expiresAt = secretData.client_secret.expires_at;
      console.log('   Parsed client_secret.value format');
    } else if (typeof secretData.client_secret === 'string') {
      clientSecret = secretData.client_secret;
      expiresAt = secretData.expires_at;
      console.log('   Parsed string client_secret format');
    } else if (secretData.value) {
      clientSecret = secretData.value;
      expiresAt = secretData.expires_at;
      console.log('   Parsed direct value format');
    }
    
    if (!clientSecret) {
      console.error('❌ Could not extract client_secret from response');
      console.error('   Full response:', JSON.stringify(secretData, null, 2));
      return res.status(500).json({
        status: 'error',
        message: 'Invalid response from OpenAI API - no client_secret found'
      });
    }
    
    // Construct the WebSocket URL for GA API
    const serverUrl = `wss://api.openai.com/v1/realtime?model=${model}`;
    
    console.log('✅ Client secret created successfully');
    console.log('   Client secret (first 20 chars):', clientSecret.substring(0, 20) + '...');
    console.log('   Server URL:', serverUrl);
    
    // Return the WebSocket URL and client secret
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
// Evaluates content, expression, job fit with interactive highlights
// ============================================

app.post('/api/analyze-live-interview', async (req, res) => {
  try {
    console.log('📊 Live interview analysis endpoint called (Enhanced v2)');
    
    const { transcript, jobContext, userProfile } = req.body;
    
    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Transcript is required and must be a non-empty array'
      });
    }
    
    // Get API key
    let apiKey;
    try {
      apiKey = await getOpenAIApiKey();
    } catch (keyError) {
      console.error('❌ Error retrieving API key:', keyError);
      return res.status(500).json({
        status: 'error',
        message: `Failed to retrieve API key: ${keyError.message}`
      });
    }
    
    if (!apiKey) {
      return res.status(500).json({
        status: 'error',
        message: 'OpenAI API key is missing'
      });
    }
    
    // Format transcript with IDs for highlight references
    const formattedTranscript = transcript.map((entry, idx) => {
      const role = entry.role === 'assistant' ? 'INTERVIEWER' : 'CANDIDATE';
      const entryId = entry.id || `entry-${idx}`;
      return `[${entryId}] ${role}: ${entry.text || '(no response)'}`;
    }).join('\n\n');
    
    // Extract candidate responses only for detailed analysis
    const candidateResponses = transcript
      .filter(e => e.role === 'user')
      .map((e, idx) => `Response ${idx + 1} [${e.id || `entry-${idx}`}]: "${e.text || '(no response)'}"`)
      .join('\n');
    
    const position = jobContext?.position || 'the position';
    const company = jobContext?.companyName || 'the company';
    const jobDescription = jobContext?.jobDescription || '';
    const requirements = jobContext?.requirements || [];
    
    // Build user context string
    let userContextStr = '';
    if (userProfile) {
      userContextStr = `
CANDIDATE PROFILE:
- Name: ${userProfile.firstName || ''} ${userProfile.lastName || ''}
- Current Role: ${userProfile.currentPosition || 'Not specified'}
- Experience: ${userProfile.yearsOfExperience || 'Not specified'} years
- Target Position: ${userProfile.targetPosition || position}
- Skills: ${(userProfile.skills || []).join(', ') || 'Not specified'}
- Education: ${userProfile.education || 'Not specified'}
${userProfile.cvText ? `\nFull CV Text:\n${userProfile.cvText.length > 10000 ? userProfile.cvText.substring(0, 10000) + '...(truncated)' : userProfile.cvText}` : ''}
`;
    }
    
    // Build job context string
    let jobContextStr = `
JOB CONTEXT:
- Position: ${position}
- Company: ${company}
${jobDescription ? `- Job Description: ${jobDescription.substring(0, 800)}${jobDescription.length > 800 ? '...' : ''}` : ''}
${requirements.length > 0 ? `- Key Requirements: ${requirements.slice(0, 10).join(', ')}` : ''}
`;
    
    // Detect if the candidate barely spoke
    const candidateWords = transcript
      .filter(e => e.role === 'user' && e.text)
      .map(e => e.text.trim())
      .join(' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
    
    const wordCount = candidateWords.length;
    const hasMinimalInput = wordCount < 30;
    
    const minimalInputInstructions = hasMinimalInput ? `
⚠️ CRITICAL: THE CANDIDATE PROVIDED VERY LIMITED RESPONSES (only ${wordCount} words total)

MANDATORY SCORING FOR MINIMAL INPUT:
- overallScore: MUST be 5-15 (they barely participated)
- contentAnalysis.relevanceScore: MUST be 0-10 (no real content provided)
- contentAnalysis.specificityScore: MUST be 0-5 (no specifics given)
- expressionAnalysis scores: MUST be 5-15 (cannot assess expression with so few words)
- jobFitAnalysis.fitScore: MUST be 0-10 (cannot demonstrate fit without speaking)

Other requirements:
1. executiveSummary MUST explicitly state they did not engage with the interview
2. criticalIssues MUST include "Failed to respond to interview questions"
3. In transcriptHighlights, include the unanswered interviewer questions as "weakness"
4. Provide actionable feedback on HOW to structure a proper response

DO NOT use default scores of 50. The scores must reflect the actual lack of participation.
` : '';

    const analysisPrompt = `You are an ELITE senior hiring manager and interview performance coach with 25+ years at top tech companies. Your job is to give PRECISE, ANALYTICAL, CONSTRUCTIVE feedback that actually helps candidates improve. Be honest but not cruel. Be specific, not generic.

${userContextStr}
${jobContextStr}

═══════════════════════════════════════════════════════════════
FULL INTERVIEW TRANSCRIPT
═══════════════════════════════════════════════════════════════
${formattedTranscript}

${minimalInputInstructions}
═══════════════════════════════════════════════════════════════
ANALYSIS FRAMEWORK - BE THOROUGH & SPECIFIC
═══════════════════════════════════════════════════════════════

1. CONTENT ANALYSIS - Did they actually answer what was asked?
   - Did they dodge questions or go off-topic?
   - Did they give SPECIFIC examples with metrics/outcomes?
   - Did they demonstrate relevant experience for THIS specific role?
   - STAR Method: Did they structure answers with Situation, Task, Action, Result?
   - If they didn't speak much, what questions did they fail to answer?

2. EXPRESSION & DELIVERY ANALYSIS - HOW did they communicate?
   - Organization: Was their thinking logical and structured, or scattered/rambling?
   - Clarity: Were they concise or did they use too many words?
   - Confidence signals: Did they use hedging language ("I think", "maybe", "kind of")?
   - Vocabulary: Professional and precise, or vague filler words?
   - Did they repeat themselves or go in circles?
   - If they barely spoke, note the missed opportunity to showcase communication skills

3. JOB FIT ANALYSIS - Would YOU hire them for this role?
   - Match their demonstrated skills to the job requirements
   - Identify CRITICAL missing competencies
   - Be honest: Would they survive 90 days in this role?
   - What specific skills for ${position} were NOT addressed?

4. TRANSCRIPT HIGHLIGHTS - Quote EXACT phrases from their responses
   - Find 3-6 specific quotes that are either strong or problematic
   - Reference the entry ID in brackets [entry-X]
   - Even if they only said "Hello" - analyze what little they said
   - Also highlight interviewer questions that went unanswered

5. RESPONSE-BY-RESPONSE ANALYSIS - Analyze EACH candidate response individually
   For EVERY response the candidate gave (even short ones like "Hello" or "Let's get started"):
   - Structure: How well organized was this specific response?
   - Content: Was it specific or vague? Did it answer what was asked?
   - Expression: Tone, vocabulary, confidence level
   - What was GOOD about this response (even if minor)?
   - What could be IMPROVED (be specific)?
   - What SHOULD they have said instead (if response was weak)?
   
   This is CRITICAL: Users need feedback on EACH thing they said, not just overall.

SCORING PRINCIPLES - READ CAREFULLY:
1. Scores MUST reflect ACTUAL performance, not defaults
2. If candidate barely spoke → scores should be 0-15
3. If candidate gave vague answers → scores should be 20-40  
4. If candidate gave decent answers → scores should be 45-65
5. If candidate gave strong, specific answers → scores should be 70-85
6. 86+ is EXCEPTIONAL and requires multiple specific examples with metrics

SCORING GUIDE (0-100):
- 0-15: Failed to engage - barely spoke, didn't answer questions
- 16-35: Poor - major issues, no specifics, missed key opportunities
- 36-55: Below Average - attempted answers but significant gaps
- 56-70: Average - some potential but clear areas for improvement
- 71-85: Good - solid performance with minor tweaks needed
- 86-100: Exceptional - rare, only for outstanding interviews

Return this EXACT JSON structure (adjust all scores based on ACTUAL performance):
{
  "verdict": {
    "passed": false,
    "confidence": "high",
    "reason": "Brief explanation for pass/fail decision"
  },
  "overallScore": 0,
  "executiveSummary": "2-3 sentences assessing what ACTUALLY happened in the interview",
  
  "contentAnalysis": {
    "relevanceScore": 0,
    "specificityScore": 0,
    "didAnswerQuestions": "yes|partially|no|barely",
    "questionsEvaded": ["list any questions they didn't answer or dodged"],
    "examplesProvided": 0,
    "examplesQuality": "none|vague|generic|specific|excellent",
    "starMethodUsage": {
      "situation": false,
      "task": false,
      "action": false,
      "result": false
    },
    "contentVerdict": "1-2 sentences on content quality based on what was said"
  },
  
  "expressionAnalysis": {
    "organizationScore": 0,
    "clarityScore": 0,
    "confidenceScore": 0,
    "structureAssessment": "organized|mixed|scattered|minimal",
    "fillerWordsCount": 0,
    "fillerWordsDetected": [],
    "hedgingPhrases": [],
    "expressionVerdict": "1-2 sentences on communication style"
  },
  
  "jobFitAnalysis": {
    "fitScore": 0,
    "matchedSkills": [],
    "missingSkills": ["all required skills not demonstrated"],
    "experienceRelevance": "not-demonstrated",
    "wouldSurvive90Days": "cannot-assess",
    "competitivePosition": "Honest comparison based on what was demonstrated"
  },
  
  "transcriptHighlights": [
    {
      "entryId": "entry-X",
      "excerpt": "EXACT quote from transcript (copy/paste)",
      "type": "strength|improvement|weakness",
      "category": "content|expression|job_fit|engagement",
      "feedback": "Specific, actionable feedback for this exact quote"
    }
  ],
  
  "responseAnalysis": [
    {
      "entryId": "entry-X",
      "responseText": "The exact text of what they said",
      "questionAsked": "What the interviewer asked before this response",
      "structureScore": 0,
      "contentScore": 0,
      "expressionScore": 0,
      "overallResponseScore": 0,
      "tone": "confident|neutral|hesitant|enthusiastic",
      "whatWasGood": ["Positive aspect 1", "Positive aspect 2"],
      "whatToImprove": ["Improvement 1", "Improvement 2"],
      "idealResponse": "What they SHOULD have said (2-3 sentences showing a better answer)",
      "detailedFeedback": "2-3 sentences explaining why this response was good/bad and how to improve"
    }
  ],
  
  "strengths": [
    "Find something positive based on actual transcript content"
  ],
  
  "criticalIssues": [
    "Most important issue based on what actually happened"
  ],
  
  "actionPlan": [
    "Action 1: Specific thing to do differently next time",
    "Action 2: What to practice before the next interview",
    "Action 3: Concrete next step for improvement"
  ]
}

CRITICAL RULES:
1. SCORES MUST REFLECT ACTUAL PERFORMANCE - not defaults. If they barely spoke, scores = 0-15.
2. Quote EXACT text from transcript in highlights - copy/paste their words
3. Reference entry IDs that exist in the transcript (format: entry-0, entry-1, etc.)
4. Be SPECIFIC - no generic feedback like "communicate better"
5. If they rambled, quote the rambling. If they were silent, note the silence.
6. Scores above 70 require strong answers with specific examples. 80+ is EXCEPTIONAL.
7. ONLY return valid JSON - no markdown, no backticks
8. DO NOT use placeholder scores of 50. Calculate each score based on what they actually said.
9. If candidate only said greetings or very short responses, ALL scores should be under 20.
10. responseAnalysis MUST include an entry for EVERY candidate response (user role entries)
11. Even "Hello" or "Let's start" deserves analysis - analyze tone, enthusiasm, missed opportunity
12. idealResponse should show what a GREAT candidate would have said in that situation
13. whatWasGood should find at least one positive even in weak responses (e.g., "polite greeting")`;

    console.log('📤 Sending enhanced analysis request to GPT-4...');
    console.log('   Transcript entries:', transcript.length);
    console.log('   Has user profile:', !!userProfile);
    console.log('   Has job description:', !!jobDescription);
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout for longer analysis
    
    let response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are a precise, analytical senior interview coach. Your scoring MUST reflect actual performance:

SCORING RULES (MANDATORY):
- If candidate barely spoke or only greeted: ALL scores 0-15
- If candidate gave vague, non-specific answers: scores 20-40
- If candidate gave decent answers without examples: scores 40-55
- If candidate gave good answers with some specifics: scores 55-70
- If candidate gave excellent answers with metrics/STAR: scores 70-85
- Scores 85+ require exceptional, specific, measurable examples

NEVER use default/placeholder scores. Calculate each score based on actual transcript content.
Quote exact phrases. Reference entry IDs. Provide actionable feedback.
Always respond with valid JSON only - no markdown, no backticks.`
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          temperature: 0.5, // Lower temperature for more consistent analysis
          max_tokens: 4000, // More tokens for detailed analysis
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('❌ Analysis request timed out after 90s');
        throw new Error('Analysis request timed out. Please try again.');
      }
      throw fetchError;
    }
    clearTimeout(timeoutId);
    
    console.log('📥 Response received, status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📦 Response parsed successfully');
    
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      console.error('❌ No content in response:', data);
      throw new Error('No content in OpenAI response');
    }
    
    console.log('📝 Content length:', content.length);
    
    // Parse JSON response
    let analysis;
    try {
      // Try to extract JSON if wrapped in markdown (shouldn't happen with json_object mode)
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      analysis = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('❌ Failed to parse analysis JSON:', parseError);
      console.error('Content preview:', content.substring(0, 500));
      throw new Error('Failed to parse analysis response');
    }
    
    // Helper function to safely parse scores - 0 is valid, only default for undefined/NaN
    const parseScore = (value, defaultValue = 0) => {
      const parsed = parseInt(value);
      return isNaN(parsed) ? defaultValue : Math.min(100, Math.max(0, parsed));
    };
    
    // Validate and set defaults for required fields
    analysis.verdict = analysis.verdict || { passed: false, confidence: 'medium', hireDecision: 'no' };
    analysis.overallScore = parseScore(analysis.overallScore, 0);
    analysis.executiveSummary = analysis.executiveSummary || 'Interview completed. Analysis pending.';
    
    // Content analysis defaults - 0 is valid for minimal participation
    analysis.contentAnalysis = analysis.contentAnalysis || {};
    analysis.contentAnalysis.relevanceScore = parseScore(analysis.contentAnalysis.relevanceScore, 0);
    analysis.contentAnalysis.specificityScore = parseScore(analysis.contentAnalysis.specificityScore, 0);
    analysis.contentAnalysis.starMethodUsage = analysis.contentAnalysis.starMethodUsage || { situation: false, task: false, action: false, result: false };
    
    // Expression analysis defaults - 0 is valid for minimal participation
    analysis.expressionAnalysis = analysis.expressionAnalysis || {};
    analysis.expressionAnalysis.organizationScore = parseScore(analysis.expressionAnalysis.organizationScore, 0);
    analysis.expressionAnalysis.clarityScore = parseScore(analysis.expressionAnalysis.clarityScore, 0);
    analysis.expressionAnalysis.confidenceScore = parseScore(analysis.expressionAnalysis.confidenceScore, 0);
    
    // Job fit defaults - 0 is valid for not demonstrating fit
    analysis.jobFitAnalysis = analysis.jobFitAnalysis || {};
    analysis.jobFitAnalysis.fitScore = parseScore(analysis.jobFitAnalysis.fitScore, 0);
    analysis.jobFitAnalysis.matchedSkills = analysis.jobFitAnalysis.matchedSkills || [];
    analysis.jobFitAnalysis.missingSkills = analysis.jobFitAnalysis.missingSkills || [];
    
    // Highlights, strengths, issues, action plan
    analysis.transcriptHighlights = analysis.transcriptHighlights || [];
    analysis.strengths = analysis.strengths || [];
    analysis.criticalIssues = analysis.criticalIssues || [];
    analysis.actionPlan = analysis.actionPlan || [];
    
    // Determine passed status based on score if not set
    if (analysis.verdict.passed === undefined) {
      analysis.verdict.passed = analysis.overallScore >= 65;
    }
    
    console.log('✅ Enhanced interview analysis completed successfully');
    console.log('   Overall score:', analysis.overallScore);
    console.log('   Verdict:', analysis.verdict.passed ? 'PASSED' : 'NEEDS WORK');
    console.log('   Highlights count:', analysis.transcriptHighlights.length);
    
    res.json(analysis);
    
  } catch (error) {
    console.error('❌ Error analyzing interview:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to analyze interview'
    });
  }
});

// Perplexity API endpoint
app.post('/api/perplexity', async (req, res) => {
  try {
    console.log("🔵 Perplexity API endpoint called");
    console.log("   Request body keys:", Object.keys(req.body || {}));

    // Get API key from Firestore or environment variables
    let apiKey;
    try {
      apiKey = await getPerplexityApiKey();
    } catch (keyError) {
      console.error('❌ Error retrieving Perplexity API key:', keyError);
      return res.status(500).json({
        status: 'error',
        message: `Failed to retrieve Perplexity API key: ${keyError.message}`,
        details: process.env.NODE_ENV === 'development' ? keyError.stack : undefined
      });
    }

    if (!apiKey) {
      console.error('❌ ERREUR: Clé API Perplexity manquante');
      console.error('   Checking environment variables:');
      console.error('   - PERPLEXITY_API_KEY:', process.env.PERPLEXITY_API_KEY ? 'defined' : 'not defined');
      console.error('   - VITE_PERPLEXITY_API_KEY:', process.env.VITE_PERPLEXITY_API_KEY ? 'defined' : 'not defined');
      return res.status(500).json({
        status: 'error',
        message: 'Perplexity API key is missing. Please add it to Firestore (settings/perplexity) or .env file (PERPLEXITY_API_KEY).'
      });
    }

    console.log('✅ Perplexity API key retrieved successfully (first 10 chars):', apiKey.substring(0, 10) + '...');

    // Extract request parameters
    const { 
      prompt, 
      model = 'sonar-pro', 
      messages, 
      temperature = 0.7, 
      max_tokens = 1500,
      search_recency_filter,
      return_citations,
      systemMessage: customSystemMessage  // Allow callers to override the default system message
    } = req.body;

    // Build messages array - use provided messages or construct from prompt
    let requestMessages;
    if (messages && Array.isArray(messages)) {
      requestMessages = messages;
    } else if (prompt) {
      // Use custom system message if provided, otherwise use default conversational one
      const systemMessage = customSystemMessage || `You are a conversational interview coach helping with job interview preparation. 

Follow these strict guidelines:
1. Keep responses extremely brief and direct - first paragraph should contain the key answer.
2. Limit to 1-2 short paragraphs total unless explicitly asked for more detail.
3. Never reveal or explain your thinking process - just provide the final answer.
4. Use natural, friendly language as if chatting with a friend.
5. When giving advice, jump straight to the actionable tips.
6. Avoid lengthy explanations or theoretical background information.
7. Use bullet points sparingly and only for very short lists.

You can browse the web when needed for specific information, but keep search results brief.`;

      requestMessages = [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ];
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Either prompt or messages array is required'
      });
    }

    // Build request body for Perplexity API
    const perplexityRequestBody = {
      model: model,
      messages: requestMessages,
      temperature: temperature,
      max_tokens: max_tokens
    };

    // Add optional parameters if provided
    if (search_recency_filter) {
      perplexityRequestBody.search_recency_filter = search_recency_filter;
    }
    if (return_citations !== undefined) {
      perplexityRequestBody.return_citations = return_citations;
    }

    console.log('📡 Sending request to Perplexity API...');
    console.log(`   Model: ${model}`);
    console.log(`   Messages count: ${requestMessages.length}`);
    console.log(`   Max tokens: ${max_tokens}`);

    // Call Perplexity API
    const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(perplexityRequestBody)
    });

    console.log(`Perplexity API response status: ${perplexityResponse.status}`);

    // Handle response
    const responseText = await perplexityResponse.text();
    console.log("Response received, length:", responseText.length);

    if (!perplexityResponse.ok) {
      console.error("Non-200 response:", responseText);
      try {
        const errorData = JSON.parse(responseText);
        return res.status(perplexityResponse.status).json({
          status: 'error',
          message: `Perplexity API error: ${errorData.error?.message || 'Unknown error'}`,
          error: errorData.error,
          errorMessage: errorData.error?.message || 'Unknown API error'
        });
      } catch (e) {
        return res.status(perplexityResponse.status).json({
          status: 'error',
          message: `Perplexity API error: ${responseText.substring(0, 200)}`,
          errorMessage: responseText.substring(0, 200)
        });
      }
    }

    // Parse and return response
    try {
      const parsedResponse = JSON.parse(responseText);
      
      // Extract text content from response
      if (parsedResponse.choices && parsedResponse.choices.length > 0) {
        const textContent = parsedResponse.choices[0].message.content;
        console.log('Response content preview:', textContent.substring(0, 100) + '...');
        
        // Return response in the same format as the original client-side function
        return res.json({
          ...parsedResponse,
          text: textContent
        });
      } else {
        console.error('Unexpected response structure:', parsedResponse);
        return res.status(500).json({
          status: 'error',
          text: "I received a response from the API but couldn't extract the answer. Please try again.",
          error: true,
          errorMessage: "Invalid response structure"
        });
      }
    } catch (parseError) {
      console.error("❌ Parse error:", parseError);
      return res.status(500).json({
        status: 'error',
        message: "Failed to parse Perplexity API response",
        rawResponse: responseText.substring(0, 500) + "...",
        error: true,
        errorMessage: parseError.message
      });
    }

  } catch (error) {
    console.error("❌ Unexpected error in Perplexity API handler:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // Check if response was already sent
    if (res.headersSent) {
      console.error("⚠️  Response already sent, cannot send error response");
      return;
    }

    // Check if it's a network error
    if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
      return res.status(500).json({
        status: 'error',
        text: "It looks like your browser might be blocking the connection to our AI service. This could be due to an ad blocker, privacy extension, or network issues. Try disabling any extensions that might interfere with API requests.",
        error: true,
        errorMessage: error.message
      });
    }

    return res.status(500).json({
      status: 'error',
      text: "I'm sorry, I couldn't process your request due to a technical issue. This could be a network problem, an issue with the Perplexity API, or with your browser settings blocking certain requests. Please try again later.",
      error: true,
      errorMessage: error.message || 'Unknown error'
    });
  }
});

// GPT-4o-mini endpoint for fast chat responses
// This is optimized for speed and cost while maintaining good quality
app.post('/api/chat-fast', async (req, res) => {
  try {
    console.log("⚡ GPT-4o-mini Fast Chat endpoint called");
    console.log("   Request body keys:", Object.keys(req.body || {}));

    // Get API key from Firestore or environment variables
    let apiKey;
    try {
      apiKey = await getOpenAIApiKey();
    } catch (keyError) {
      console.error('❌ Error retrieving OpenAI API key:', keyError);
      return res.status(500).json({
        status: 'error',
        message: `Failed to retrieve API key: ${keyError.message}`,
        error: true,
        errorMessage: keyError.message
      });
    }

    if (!apiKey) {
      console.error('❌ ERROR: OpenAI API key missing for fast chat');
      return res.status(500).json({
        status: 'error',
        message: 'OpenAI API key is missing. Please add it to Firestore (settings/openai) or .env file (OPENAI_API_KEY).',
        error: true,
        errorMessage: 'API key not configured'
      });
    }

    console.log('✅ OpenAI API key retrieved successfully (first 10 chars):', apiKey.substring(0, 10) + '...');

    // Extract request parameters
    const { 
      prompt, 
      messages, 
      systemMessage,
      temperature = 0.7, 
      max_tokens = 1000
    } = req.body;

    // Build messages array
    let requestMessages = [];
    
    if (messages && Array.isArray(messages)) {
      requestMessages = messages;
    } else if (prompt) {
      // Default system message for interview coaching
      const defaultSystemMessage = systemMessage || `You are a conversational interview coach helping with job interview preparation. 

Follow these strict guidelines:
1. Keep responses extremely brief and direct - first paragraph should contain the key answer.
2. Limit to 1-2 short paragraphs total unless explicitly asked for more detail.
3. Never reveal or explain your thinking process - just provide the final answer.
4. Use natural, friendly language as if chatting with a friend.
5. When giving advice, jump straight to the actionable tips.
6. Avoid lengthy explanations or theoretical background information.
7. Use bullet points sparingly and only for very short lists.`;

      requestMessages = [
        { role: 'system', content: defaultSystemMessage },
        { role: 'user', content: prompt }
      ];
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Either prompt or messages array is required',
        error: true,
        errorMessage: 'Missing prompt or messages'
      });
    }

    console.log('📡 Sending request to OpenAI GPT-4o-mini...');
    console.log(`   Messages count: ${requestMessages.length}`);
    console.log(`   Max tokens: ${max_tokens}`);

    // Call OpenAI API with GPT-4o-mini for speed
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: requestMessages,
        temperature: temperature,
        max_completion_tokens: max_tokens
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
          error: true,
          errorMessage: errorData.error?.message || 'Unknown API error'
        });
      } catch (e) {
        return res.status(openaiResponse.status).json({
          status: 'error',
          message: `OpenAI API error: ${responseText.substring(0, 200)}`,
          error: true,
          errorMessage: responseText.substring(0, 200)
        });
      }
    }

    // Parse and return response
    try {
      const parsedResponse = JSON.parse(responseText);
      
      // Extract text content from response
      if (parsedResponse.choices && parsedResponse.choices.length > 0) {
        const textContent = parsedResponse.choices[0].message.content;
        console.log('✅ GPT-4o-mini response preview:', textContent.substring(0, 100) + '...');
        
        // Return response in a format compatible with the client
        return res.json({
          status: 'success',
          text: textContent,
          choices: parsedResponse.choices,
          usage: parsedResponse.usage
        });
      } else {
        console.error('Unexpected response structure:', parsedResponse);
        return res.status(500).json({
          status: 'error',
          text: "I received a response from the API but couldn't extract the answer. Please try again.",
          error: true,
          errorMessage: "Invalid response structure"
        });
      }
    } catch (parseError) {
      console.error("❌ Parse error:", parseError);
      return res.status(500).json({
        status: 'error',
        message: "Failed to parse OpenAI API response",
        error: true,
        errorMessage: parseError.message
      });
    }

  } catch (error) {
    console.error("❌ Unexpected error in GPT-4o-mini chat handler:", error);

    if (res.headersSent) {
      console.error("⚠️  Response already sent, cannot send error response");
      return;
    }

    return res.status(500).json({
      status: 'error',
      text: "I'm sorry, I couldn't process your request due to a technical issue. Please try again later.",
      error: true,
      errorMessage: error.message || 'Unknown error'
    });
  }
});

// GPT-4o endpoint for high-quality question generation
// Uses GPT-4o for better reasoning and question quality
app.post('/api/generate-questions', async (req, res) => {
  try {
    console.log("🧠 GPT-4o Question Generation endpoint called");
    console.log("   Request body keys:", Object.keys(req.body || {}));

    // Get API key
    let apiKey;
    try {
      apiKey = await getOpenAIApiKey();
    } catch (keyError) {
      console.error('❌ Error retrieving OpenAI API key:', keyError);
      return res.status(500).json({
        status: 'error',
        message: `Failed to retrieve API key: ${keyError.message}`
      });
    }

    if (!apiKey) {
      console.error('❌ ERROR: OpenAI API key missing');
      return res.status(500).json({
        status: 'error',
        message: 'OpenAI API key is missing.'
      });
    }

    const { prompt, max_tokens = 2000, temperature = 0.7 } = req.body;

    if (!prompt) {
      return res.status(400).json({
        status: 'error',
        message: 'Prompt is required'
      });
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
        model: 'gpt-5.2',
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
      return res.status(openaiResponse.status).json({
        status: 'error',
        message: 'Failed to generate questions',
        details: errorText
      });
    }

    const responseData = await openaiResponse.json();
    const content = responseData.choices[0]?.message?.content;

    if (!content) {
      return res.status(500).json({
        status: 'error',
        message: 'Empty response from AI'
      });
    }

    console.log('✅ GPT-4o question generation completed');

    // Parse and return the JSON response
    try {
      const questionsData = JSON.parse(content);
      return res.json({
        status: 'success',
        text: content,
        data: questionsData,
        choices: responseData.choices
      });
    } catch (parseError) {
      // Return raw content if not valid JSON
      return res.json({
        status: 'success',
        text: content,
        choices: responseData.choices
      });
    }

  } catch (error) {
    console.error("❌ Error in question generation:", error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to generate questions'
    });
  }
});

// CV Review AI Analysis endpoint
app.post('/api/cv-review', async (req, res) => {
  try {
    console.log("🔵 CV Review AI endpoint called");
    console.log("   Request body keys:", Object.keys(req.body || {}));

    // Get API key from Firestore or environment variables
    let apiKey;
    try {
      apiKey = await getOpenAIApiKey();
    } catch (keyError) {
      console.error('❌ Error retrieving API key:', keyError);
      return res.status(500).json({
        status: 'error',
        message: `Failed to retrieve API key: ${keyError.message}`
      });
    }

    if (!apiKey) {
      console.error('❌ ERREUR: Clé API OpenAI manquante pour CV Review');
      return res.status(500).json({
        status: 'error',
        message: 'OpenAI API key is missing. Please add it to Firestore (settings/openai) or .env file (OPENAI_API_KEY).'
      });
    }

    console.log('✅ API key retrieved successfully for CV Review');

    const { cvData, jobContext, previousAnalysis } = req.body;

    if (!cvData) {
      console.error('❌ CV data is missing in request body');
      return res.status(400).json({
        status: 'error',
        message: 'CV data is required'
      });
    }

    // Log if we have history context
    if (previousAnalysis) {
      console.log('   📊 Previous analysis provided');
      console.log(`   Previous score: ${previousAnalysis.score}`);
      console.log(`   Applied suggestions: ${previousAnalysis.appliedSuggestionIds?.length || 0}`);
    }

    // Generate the CV review prompt with history context
    const prompt = generateCVReviewPrompt(cvData, jobContext, previousAnalysis);
    
    const systemMessage = `You are an elite CV/Resume strategist and ATS optimization expert. You analyze CVs with extreme precision and provide highly actionable, specific suggestions. 

CRITICAL RULES:
1. Always respond with valid JSON matching the EXACT structure requested
2. Never include markdown code blocks - just raw JSON
3. Be SPECIFIC - reference actual content from the CV, not generic advice
4. Prioritize suggestions by real impact on ATS scores and recruiter engagement
5. For each suggestion, provide a concrete action that can be applied`;

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

    console.log('📡 Sending CV review request to ChatGPT API...');
    console.log(`   CV sections: ${cvData.sections?.length || 0}`);
    console.log(`   Has job context: ${!!jobContext}`);

    // Call OpenAI API
    let openaiResponse;
    let responseText;

    try {
      openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-5.2",
          messages: messages,
          response_format: { type: 'json_object' },
          max_completion_tokens: 8000,
          temperature: 0.3
        })
      });

      console.log(`OpenAI API response status: ${openaiResponse.status}`);

      responseText = await openaiResponse.text();
      console.log("Response received, length:", responseText.length);

      if (!openaiResponse.ok) {
        console.error("❌ Non-200 response from OpenAI API for CV Review");
        console.error("Response status:", openaiResponse.status);
        
        try {
          const errorData = JSON.parse(responseText);
          return res.status(openaiResponse.status).json({
            status: 'error',
            message: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`,
            error: errorData.error
          });
        } catch (parseError) {
          return res.status(openaiResponse.status).json({
            status: 'error',
            message: `OpenAI API error (status ${openaiResponse.status})`
          });
        }
      }
    } catch (fetchError) {
      console.error("❌ Error calling OpenAI API for CV Review:", fetchError);
      return res.status(500).json({
        status: 'error',
        message: `Failed to call OpenAI API: ${fetchError.message}`
      });
    }

    // Parse and return response
    try {
      console.log("Parsing CV Review response...");
      const parsedResponse = JSON.parse(responseText);

      if (!parsedResponse.choices || parsedResponse.choices.length === 0) {
        throw new Error('Invalid response structure from ChatGPT API');
      }

      const content = parsedResponse.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from ChatGPT API');
      }

      // Parse JSON content
      let reviewResult;
      try {
        reviewResult = typeof content === 'string' ? JSON.parse(content) : content;
        console.log("✅ Successfully parsed CV review JSON content");
      } catch (parseError) {
        console.warn("⚠️  Failed to parse content as JSON, trying to extract...");
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
          content.match(/{[\s\S]*}/);
        if (jsonMatch) {
          reviewResult = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          throw new Error('Could not parse JSON from response');
        }
      }

      // Ensure required structure
      if (!reviewResult.summary) {
        reviewResult.summary = {
          greeting: `Hey ${cvData.personalInfo?.firstName || 'there'}, I've analyzed your CV.`,
          overallScore: 50,
          strengths: [],
          mainIssues: []
        };
      }
      
      if (!reviewResult.suggestions || !Array.isArray(reviewResult.suggestions)) {
        reviewResult.suggestions = [];
      }
      
      if (!reviewResult.analyzedAt) {
        reviewResult.analyzedAt = new Date().toISOString();
      }

      // Ensure each suggestion has required fields
      reviewResult.suggestions = reviewResult.suggestions.map((suggestion, index) => ({
        id: suggestion.id || `suggestion-${index}`,
        title: suggestion.title || 'Suggestion',
        description: suggestion.description || '',
        section: suggestion.section || 'about',
        priority: suggestion.priority || 'medium',
        tags: Array.isArray(suggestion.tags) ? suggestion.tags : [],
        action: suggestion.action || { type: 'update', targetSection: suggestion.section || 'about' },
        isApplicable: suggestion.isApplicable !== undefined ? suggestion.isApplicable : true
      }));

      console.log('✅ CV Review completed successfully');
      console.log(`   Overall score: ${reviewResult.summary.overallScore}`);
      console.log(`   Suggestions count: ${reviewResult.suggestions.length}`);

      return res.json({
        status: 'success',
        result: reviewResult,
        usage: parsedResponse.usage
      });
    } catch (parseError) {
      console.error("❌ Parse error in CV Review:", parseError);
      return res.status(500).json({
        status: 'error',
        message: `Failed to parse response: ${parseError.message}`
      });
    }

  } catch (error) {
    console.error("❌ Unexpected error in CV Review handler:", error);
    
    if (res.headersSent) {
      return;
    }

    res.status(500).json({
      status: 'error',
      message: error.message || "An error occurred processing your CV review request"
    });
  }
});

// Helper function for CV Review prompt generation
function generateCVReviewPrompt(cvData, jobContext, previousAnalysis) {
  const cvJson = JSON.stringify(cvData, null, 2);
  
  // Build previous analysis context section
  let previousContext = '';
  if (previousAnalysis) {
    const appliedSuggestions = previousAnalysis.appliedSuggestionIds || [];
    const appliedCount = appliedSuggestions.length;
    
    previousContext = `
🔄 PREVIOUS ANALYSIS CONTEXT - **CRITICAL FOR CREDIBILITY**:
This is a RE-ANALYSIS. The user has made changes since the last analysis.

Previous Analysis Details:
- Previous Score: ${previousAnalysis.score}/100
- Timestamp: ${previousAnalysis.timestamp}
- Applied Suggestions Count: ${appliedCount}
${appliedCount > 0 ? `- Applied Suggestion IDs: ${appliedSuggestions.join(', ')}` : ''}

**EXTREMELY IMPORTANT INSTRUCTIONS FOR RE-ANALYSIS:**

1. **DETECT IMPROVEMENTS**: Compare the current CV with what you'd expect based on the previous score.
   - If phone was missing and now exists → ACKNOWLEDGE IT in your greeting
   - If summary was poor and now improved → ACKNOWLEDGE IT
   - If skills were added → ACKNOWLEDGE IT
   
2. **ADJUST SCORE APPROPRIATELY**: 
   - If ${appliedCount} suggestions were applied, the score MUST increase significantly
   - Previous score: ${previousAnalysis.score}/100
   - Expected improvement: +${Math.min(appliedCount * 5, 30)} to +${Math.min(appliedCount * 8, 40)} points
   - DO NOT give the same score if real improvements were made
   
3. **NEVER REPEAT FIXED ISSUES**:
   - DO NOT suggest things that were already fixed
   - ${appliedCount > 0 ? `These suggestion IDs were applied: ${appliedSuggestions.join(', ')}` : ''}
   - Check if the target fields of these suggestions now exist/are filled
   
4. **CELEBRATE PROGRESS**:
   - Start your greeting by acknowledging what they improved
   - Example: "Great job adding your phone number and LinkedIn! Your CV is looking much stronger."
   - Be specific about what got better
   
5. **FOCUS ON NEW ISSUES**:
   - Find NEW problems or areas for improvement
   - Don't rehash old suggestions that were addressed
   - Move to next-level improvements
   
6. **BE CREDIBLE**:
   - If the CV is genuinely good now (score 85+), say so!
   - Don't force suggestions if everything is solid
   - Quality over quantity

**FAILURE TO FOLLOW THESE INSTRUCTIONS WILL DESTROY USER TRUST**
`;
  }
  
  return `You are an expert CV/Resume reviewer and ATS optimization specialist. Analyze the following CV and provide highly specific, actionable suggestions to improve it.
${previousContext}
${jobContext ? `
TARGET JOB CONTEXT:
- Position: ${jobContext.jobTitle}
- Company: ${jobContext.company}
- Job Description: ${jobContext.jobDescription || 'Not provided'}
- Key Skills Required: ${(jobContext.keywords || []).join(', ') || 'Not specified'}
- Identified Strengths: ${(jobContext.strengths || []).join(', ') || 'None identified'}
- Identified Gaps: ${(jobContext.gaps || []).join(', ') || 'None identified'}
` : 'No specific job target provided - analyze for general improvement.'}

CV DATA (JSON):
${cvJson}

ANALYSIS REQUIREMENTS:

1. REVIEW SUMMARY:
   - Write a personalized greeting using the candidate's first name (${cvData.personalInfo?.firstName || 'there'})
   ${previousAnalysis ? '- **ACKNOWLEDGE improvements made since last analysis** (if any)' : ''}
   - Mention 1-2 specific strengths you noticed in their CV
   - Provide an ATS compatibility score (0-100)${previousAnalysis ? ` - MUST be higher than ${previousAnalysis.score} if improvements were made!` : ''}
   - List 2-3 key strengths
   - List 2-3 main issues to address

2. **CRITICAL: MISSING FOR JOB (if job context provided)**:
   - Analyze the job description and identify what's MISSING from the CV
   - List specific skills, experiences, or qualifications that the job requires but the CV doesn't mention
   - For each missing item, explain WHY it matters for this role
   - Be BRUTALLY HONEST - if major requirements are missing, the score should reflect this
   - This is the MOST important section for the user to understand their gaps
   
   Include a "missing_for_job" section in your response with:
   - critical_missing: Skills/experience that are DEAL-BREAKERS if missing
   - important_missing: Highly desirable qualifications not present
   - nice_to_have_missing: Optional items that could boost the application
   - estimated_match_percentage: How well the CV matches the job (0-100)

3. SUGGESTIONS:
   For each issue found, create a suggestion with:
   - id: unique identifier (e.g., "contact-phone", "exp-metrics-1")
   - title: Short, actionable title (e.g., "Add Phone Number", "Quantify achievements at [Company]")
   - description: 2-3 sentences explaining WHY this matters and HOW to fix it
   - section: One of "contact", "about", "experiences", "education", "skills", "certifications", "projects", "languages"
   - priority: "high", "medium", or "low"
   - tags: Array from ["missing_info", "ats_optimize", "add_impact", "stay_relevant", "be_concise", "tailor_resume"]
   - action: Object with:
     - type: "add", "update", "remove", or "rewrite"
     - targetSection: Same as section
     - targetField: (optional) specific field like "phone", "summary"
     - targetItemId: (optional) ID of specific experience/education item
     - suggestedValue: (optional) The suggested text/value
     - currentValue: (optional) Current value if rewriting
   - isApplicable: boolean - can this be auto-applied?

PRIORITIES:
- HIGH: Missing critical info (phone, email), no summary, no metrics in experience
- MEDIUM: Missing LinkedIn, skills need expansion, summary too long/short
- LOW: Nice-to-have improvements, formatting suggestions

IMPORTANT:
- Be SPECIFIC to this CV - don't give generic advice
- Reference actual content from the CV in your suggestions
- If targeting a specific job, prioritize suggestions that align with job requirements
- Include at least 5-15 suggestions across different sections
- Provide suggested text/values where possible for "add" and "rewrite" actions

Respond ONLY with valid JSON in this exact structure:
{
  "summary": {
    "greeting": "string",
    "overallScore": number,
    "strengths": ["string"],
    "mainIssues": ["string"]
  },
  "missing_for_job": {
    "critical_missing": [
      {
        "item": "string (skill, experience, or qualification)",
        "why_critical": "string (why this is a deal-breaker for this role)",
        "how_to_address": "string (concrete suggestion to address this gap)"
      }
    ],
    "important_missing": [
      {
        "item": "string",
        "impact": "string (how this affects the application)"
      }
    ],
    "nice_to_have_missing": ["string"],
    "estimated_match_percentage": number,
    "match_summary": "string (2-3 sentence summary of how well CV matches the job)"
  },
  "suggestions": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "section": "string",
      "priority": "string",
      "tags": ["string"],
      "action": {
        "type": "string",
        "targetSection": "string",
        "targetField": "string (optional)",
        "targetItemId": "string (optional)",
        "suggestedValue": "string (optional)",
        "currentValue": "string (optional)"
      },
      "isApplicable": boolean
    }
  ],
  "analyzedAt": "${new Date().toISOString()}"
}`;
}

// GPT-4o Vision API route for CV analysis
app.post('/api/analyze-cv-vision', async (req, res) => {
  try {
    console.log("🔵 GPT-4o Vision API endpoint called");
    console.log("   Request body keys:", Object.keys(req.body || {}));

    // Get API key from Firestore or environment variables
    let apiKey;
    let apiKeySource = 'unknown';

    try {
      apiKey = await getOpenAIApiKey();

      // Check environment variables directly as fallback
      if (!apiKey) {
        if (process.env.OPENAI_API_KEY) {
          apiKey = process.env.OPENAI_API_KEY;
          apiKeySource = 'OPENAI_API_KEY env var';
          console.log('✅ Using API key from OPENAI_API_KEY environment variable');
        } else if (process.env.VITE_OPENAI_API_KEY) {
          apiKey = process.env.VITE_OPENAI_API_KEY;
          apiKeySource = 'VITE_OPENAI_API_KEY env var';
          console.log('✅ Using API key from VITE_OPENAI_API_KEY environment variable');
        }
      } else {
        apiKeySource = 'Firestore or env var';
      }
    } catch (keyError) {
      console.error('❌ Error retrieving API key from Firestore:', keyError.message);
      console.error('   Stack:', keyError.stack);
      // Try environment variables as fallback
      if (process.env.OPENAI_API_KEY) {
        apiKey = process.env.OPENAI_API_KEY;
        apiKeySource = 'OPENAI_API_KEY env var (fallback)';
        console.log('✅ Using API key from OPENAI_API_KEY environment variable (fallback)');
      } else if (process.env.VITE_OPENAI_API_KEY) {
        apiKey = process.env.VITE_OPENAI_API_KEY;
        apiKeySource = 'VITE_OPENAI_API_KEY env var (fallback)';
        console.log('✅ Using API key from VITE_OPENAI_API_KEY environment variable (fallback)');
      }
    }

    if (!apiKey) {
      console.error('❌ ERREUR: Clé API OpenAI manquante');
      console.error('   Sources vérifiées:');
      console.error('   - Firestore (settings/openai)');
      console.error('   - OPENAI_API_KEY env var:', process.env.OPENAI_API_KEY ? '✅ Found' : '❌ Not found');
      console.error('   - VITE_OPENAI_API_KEY env var:', process.env.VITE_OPENAI_API_KEY ? '✅ Found' : '❌ Not found');
      console.error('   Solution: Ajoutez la clé dans .env (OPENAI_API_KEY=sk-...) ou dans Firestore (settings/openai)');
      return res.status(500).json({
        status: 'error',
        message: 'OpenAI API key is missing. Please add OPENAI_API_KEY to your .env file or settings/openai in Firestore.'
      });
    }

    console.log(`✅ API key retrieved successfully from: ${apiKeySource}`);
    console.log('   Key length:', apiKey.length);
    console.log('   First 10 chars:', apiKey.substring(0, 10) + '...');

    // Extract request data
    const { model, messages, response_format, max_tokens, temperature } = req.body;

    // Validate request
    if (!model || !messages || !Array.isArray(messages)) {
      console.error('❌ Invalid request format:', {
        model,
        hasMessages: !!messages,
        messagesType: typeof messages,
        messagesLength: Array.isArray(messages) ? messages.length : 'N/A'
      });
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request format: model and messages array are required'
      });
    }

    console.log('✅ Request validation passed');

    console.log('📡 Sending request to GPT-4o Vision API...');
    console.log(`   Model: ${model}`);
    console.log(`   Messages: ${messages.length}`);
    // Count images in messages (content can be string or array)
    let imageCount = 0;
    messages.forEach(msg => {
      if (Array.isArray(msg.content)) {
        imageCount += msg.content.filter((c) => c.type === 'image_url').length;
      }
    });
    console.log(`   Images: ${imageCount}`);

    // Prepare request body
    const requestBody = {
      model: model || 'gpt-4o',
      messages: messages,
      max_completion_tokens: max_tokens || 6000, // Increased for more detailed analysis
      temperature: temperature || 0.1 // Lower temperature for more precise, consistent analysis
    };

    // Only add response_format if it's specified (required for json_object mode)
    if (response_format) {
      requestBody.response_format = response_format;
    }

    console.log('📤 Request body prepared:', {
      model: requestBody.model,
      messagesCount: requestBody.messages.length,
      hasResponseFormat: !!requestBody.response_format,
      maxTokens: requestBody.max_tokens
    });

    // Call OpenAI API
    let openaiResponse;
    try {
      openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
    } catch (fetchError) {
      console.error("❌ Fetch error:", fetchError);
      return res.status(500).json({
        status: 'error',
        message: `Network error: ${fetchError.message || 'Failed to connect to OpenAI API'}`,
        details: process.env.NODE_ENV === 'development' ? fetchError.stack : undefined
      });
    }

    console.log(`📥 OpenAI API response status: ${openaiResponse.status}`);

    // Handle response
    const responseText = await openaiResponse.text();
    console.log("📄 Response received, length:", responseText.length);

    if (!openaiResponse.ok) {
      console.error("❌ Non-200 response:", responseText.substring(0, 500));
      try {
        const errorData = JSON.parse(responseText);
        console.error("❌ Error details:", errorData);
        return res.status(openaiResponse.status).json({
          status: 'error',
          message: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`,
          error: errorData.error,
          errorType: errorData.error?.type,
          errorCode: errorData.error?.code
        });
      } catch (e) {
        console.error("❌ Failed to parse error response:", e);
        return res.status(openaiResponse.status).json({
          status: 'error',
          message: `OpenAI API error: ${responseText.substring(0, 200)}`,
          rawResponse: responseText.substring(0, 500)
        });
      }
    }

    // Parse and return response
    try {
      console.log('📝 Parsing response...');
      const parsedResponse = JSON.parse(responseText);

      if (!parsedResponse.choices || !Array.isArray(parsedResponse.choices) || parsedResponse.choices.length === 0) {
        console.error('❌ No choices in response:', parsedResponse);
        throw new Error('No choices in OpenAI API response');
      }

      const content = parsedResponse.choices[0]?.message?.content;

      if (!content) {
        console.error('❌ Empty content in response:', parsedResponse);
        throw new Error('Empty response from GPT-4o Vision API');
      }

      console.log('✅ Content extracted, length:', content.length);

      // Parse JSON if needed
      let parsedContent;
      try {
        if (typeof content === 'string') {
          parsedContent = JSON.parse(content);
        } else {
          parsedContent = content;
        }
        console.log('✅ Content parsed as JSON successfully');
      } catch (e) {
        console.warn('⚠️  Direct JSON parse failed, trying to extract JSON from markdown...');
        // If parsing fails, try to extract JSON from markdown
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
          content.match(/{[\s\S]*}/);
        if (jsonMatch) {
          parsedContent = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          console.log('✅ JSON extracted from markdown');
        } else {
          console.error('❌ Could not parse JSON from response. Content preview:', content.substring(0, 200));
          throw new Error('Could not parse JSON from response');
        }
      }

      console.log('✅ GPT-4o Vision analysis completed successfully');

      return res.json({
        status: 'success',
        content: parsedContent,
        usage: parsedResponse.usage
      });
    } catch (parseError) {
      console.error("❌ Parse error:", parseError);
      console.error("   Error message:", parseError.message);
      console.error("   Response preview:", responseText.substring(0, 500));
      return res.status(500).json({
        status: 'error',
        message: `Failed to parse response: ${parseError.message || 'Unknown error'}`,
        rawResponse: responseText.substring(0, 500) + "..."
      });
    }

  } catch (error) {
    console.error("❌ Error in GPT-4o Vision API handler:", error);
    console.error("   Error name:", error.name);
    console.error("   Error message:", error.message);
    console.error("   Error stack:", error.stack);

    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to analyze CV',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Company logo endpoint
app.get('/api/company-logo', async (req, res) => {
  try {
    const { domain } = req.query;

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Domain parameter is required',
      });
    }

    console.log(`🔄 Fetching logo for domain: ${domain}`);

    const logoUrl = `https://logo.clearbit.com/${domain}`;

    // Faire une requête HEAD pour vérifier si le logo existe
    const response = await fetch(logoUrl, { method: 'HEAD' });

    if (response.ok) {
      // Si le logo existe, retourner l'URL
      res.json({
        success: true,
        logoUrl: logoUrl,
      });
    } else {
      // Si le logo n'existe pas, retourner null
      res.json({
        success: false,
        logoUrl: null,
      });
    }
  } catch (error) {
    console.error('❌ Error fetching company logo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch company logo',
      logoUrl: null,
    });
  }
});

// Analyze interview answers using AI
app.post('/api/analyze-interview', async (req, res) => {
  try {
    console.log('🎯 Interview analysis endpoint called');
    const { questions, answers, jobContext } = req.body;

    // Validate input
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Questions array is required'
      });
    }

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({
        status: 'error',
        message: 'Answers object is required'
      });
    }

    // Get API key
    let apiKey;
    try {
      apiKey = await getOpenAIApiKey();
      if (!apiKey) {
        apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
      }
    } catch (error) {
      console.error('Error getting API key:', error);
      apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    }

    if (!apiKey) {
      return res.status(500).json({
        status: 'error',
        message: 'OpenAI API key is not configured'
      });
    }

    // Build the analysis prompt
    console.log('📊 Received data:', {
      questionsCount: questions.length,
      answersKeys: Object.keys(answers),
      questionIds: questions.map(q => q.id)
    });

    const questionAnswerPairs = questions.map((q, idx) => {
      const answer = answers[q.id] || answers[idx] || 'No answer provided';
      console.log(`Question ${idx + 1} (ID: ${q.id}):`, {
        hasAnswerById: !!answers[q.id],
        hasAnswerByIdx: !!answers[idx],
        answerLength: answer ? answer.length : 0,
        answerPreview: answer ? answer.substring(0, 50) : 'N/A'
      });
      return `Question ${idx + 1} (Question ID: ${q.id}): ${q.text}\nAnswer: ${answer}`;
    }).join('\n\n');

    const contextInfo = jobContext ? 
      `\nJob Context:\n- Company: ${jobContext.companyName}\n- Position: ${jobContext.position}${jobContext.jobDescription ? `\n- Description: ${jobContext.jobDescription}` : ''}${jobContext.requiredSkills ? `\n- Required Skills: ${jobContext.requiredSkills.join(', ')}` : ''}` 
      : '';

    const prompt = `You are an expert interview coach analyzing a candidate's interview performance. Analyze the following interview answers and provide detailed feedback.

${contextInfo}

Interview Questions and Answers:
${questionAnswerPairs}

Provide a comprehensive analysis in the following JSON format:
{
  "overallScore": <number 0-100>,
  "passed": <boolean>,
  "passReason": "<brief explanation of pass/fail decision>",
  "tier": "<excellent|good|needs-improvement|poor>",
  "executiveSummary": "<2-3 sentence overview of performance>",
  "keyStrengths": ["<strength 1>", "<strength 2>", ...],
  "areasForImprovement": ["<area 1>", "<area 2>", ...],
  "recommendation": "<overall recommendation for the candidate>",
  "answerAnalyses": [
    {
      "questionId": <number - USE THE EXACT QUESTION ID PROVIDED IN THE QUESTION>,
      "score": <number 0-100>,
      "feedback": "<detailed paragraph explaining the quality of the answer, structure, content, and delivery>",
      "highlights": [
        {
          "text": "<exact excerpt from answer - quote directly>",
          "type": "<strength|improvement|weakness>",
          "comment": "<specific actionable feedback on this excerpt>"
        }
      ],
      "strengths": ["<specific strength 1>", "<specific strength 2>", ...],
      "improvements": ["<specific improvement 1>", "<specific improvement 2>", ...],
      "suggestions": ["<actionable suggestion 1>", "<actionable suggestion 2>", ...],
      "starEvaluation": {
        "situation": <boolean - true if situation is clearly described>,
        "task": <boolean - true if task/challenge is explained>,
        "action": <boolean - true if actions taken are detailed>,
        "result": <boolean - true if results/outcomes are mentioned>
      }
    }
  ],
  "actionItems": ["<action 1>", "<action 2>", ...]
}

IMPORTANT INSTRUCTIONS:
1. Use the EXACT Question ID provided in parentheses for each question (e.g., "Question ID: 0" means use questionId: 0)
2. Provide analysis for ALL questions, even if the answer is "No answer provided" (give score 0 and constructive feedback)
3. In highlights, quote EXACT excerpts from the candidate's answer
4. Be specific, constructive, and actionable in your feedback
5. For STAR evaluation, use boolean true/false (not numbers)
6. Focus on: communication clarity, structure, content depth, STAR method usage, and job alignment
7. Provide at least 3-5 highlights per answer with specific quotes and feedback`;

    console.log('📤 Sending analysis request to OpenAI...');

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5.2',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview coach providing detailed, constructive feedback on interview performance. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_completion_tokens: 4000,
        response_format: { type: 'json_object' }
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('❌ OpenAI API error:', errorText);
      return res.status(openaiResponse.status).json({
        status: 'error',
        message: 'Failed to analyze interview',
        details: errorText
      });
    }

    const responseData = await openaiResponse.json();
    const analysisContent = responseData.choices[0]?.message?.content;

    if (!analysisContent) {
      return res.status(500).json({
        status: 'error',
        message: 'Empty response from AI'
      });
    }

    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(analysisContent);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to parse AI response',
        rawResponse: analysisContent.substring(0, 500)
      });
    }

    console.log('✅ Interview analysis completed successfully');

    return res.json({
      status: 'success',
      analysis: analysis
    });

  } catch (error) {
    console.error('❌ Error in interview analysis:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to analyze interview',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Transcribe audio using Whisper API
app.post('/api/transcribe-audio', async (req, res) => {
  try {
    console.log('🎤 Whisper transcription endpoint called');
    
    const { audioData, detectedLanguage } = req.body;

    // Validate input
    if (!audioData) {
      return res.status(400).json({
        status: 'error',
        message: 'Audio data is required'
      });
    }

    // Get API key
    let apiKey;
    try {
      apiKey = await getOpenAIApiKey();
      if (!apiKey) {
        apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
      }
    } catch (error) {
      console.error('Error getting API key:', error);
      apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    }

    if (!apiKey) {
      return res.status(500).json({
        status: 'error',
        message: 'OpenAI API key is not configured'
      });
    }

    console.log('📤 Sending audio to Whisper API...');

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioData.split(',')[1], 'base64');
    
    // Create form data for Whisper API
    const FormData = require('form-data');
    const form = new FormData();
    
    // Add audio file with proper extension
    form.append('file', audioBuffer, {
      filename: 'audio.webm',
      contentType: 'audio/webm'
    });
    form.append('model', 'whisper-1');
    
    // Smart language detection:
    // - If language already detected in session, use it
    // - Otherwise, let Whisper auto-detect
    if (detectedLanguage) {
      console.log('🌍 Using previously detected language:', detectedLanguage);
      form.append('language', detectedLanguage);
    } else {
      console.log('🔍 Auto-detecting language (first question)');
    }
    
    form.append('response_format', 'json');

    // Call Whisper API
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...form.getHeaders()
      },
      body: form
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('❌ Whisper API error:', whisperResponse.status, errorText);
      return res.status(whisperResponse.status).json({
        status: 'error',
        message: 'Failed to transcribe audio',
        details: errorText
      });
    }

    const transcriptionData = await whisperResponse.json();
    const transcription = transcriptionData.text || '';
    const language = transcriptionData.language || 'en';

    console.log('✅ Whisper transcription completed:', {
      transcription: transcription.substring(0, 100) + '...',
      detectedLanguage: language,
      duration: transcriptionData.duration
    });

    return res.json({
      status: 'success',
      transcription: transcription,
      detectedLanguage: language // Return detected language to frontend
    });

  } catch (error) {
    console.error('❌ Error in Whisper transcription:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to transcribe audio',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Extract job posting content from URL using Puppeteer
app.post('/api/extract-job-url', async (req, res) => {
  let browser = null;

  try {
    const { url } = req.body;

    // Validate URL
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'URL is required and must be a string'
      });
    }

    // Normalize URL
    let normalizedUrl = url.trim();

    // Add protocol if missing
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    // Basic URL validation
    try {
      new URL(normalizedUrl);
    } catch (urlError) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid URL format'
      });
    }

    console.log('🔍 Extracting job posting from URL:', normalizedUrl);

    // Detect ATS type from URL for optimized extraction
    const hostname = new URL(normalizedUrl).hostname.toLowerCase();
    let atsType = 'generic';
    
    if (hostname.includes('myworkdayjobs.com') || hostname.includes('workday.com')) {
      atsType = 'workday';
    } else if (hostname.includes('lever.co') || hostname.includes('jobs.lever.co')) {
      atsType = 'lever';
    } else if (hostname.includes('greenhouse.io') || hostname.includes('boards.greenhouse.io')) {
      atsType = 'greenhouse';
    } else if (hostname.includes('ashbyhq.com')) {
      atsType = 'ashby';
    } else if (hostname.includes('smartrecruiters.com')) {
      atsType = 'smartrecruiters';
    } else if (hostname.includes('jobvite.com')) {
      atsType = 'jobvite';
    } else if (hostname.includes('icims.com') || hostname.includes('careers-')) {
      atsType = 'icims';
    } else if (hostname.includes('bamboohr.com')) {
      atsType = 'bamboohr';
    } else if (hostname.includes('recruitee.com')) {
      atsType = 'recruitee';
    } else if (hostname.includes('breezy.hr')) {
      atsType = 'breezy';
    } else if (hostname.includes('jazz.co') || hostname.includes('applytojob.com')) {
      atsType = 'jazz';
    } else if (hostname.includes('welcometothejungle.com') || hostname.includes('wttj.co')) {
      atsType = 'welcometothejungle';
    }
    
    console.log(`🏷️  Detected ATS type: ${atsType}`);

    // ATS-specific selectors for better extraction accuracy
    const ATS_SELECTORS = {
      workday: {
        title: ['[data-automation-id="jobPostingHeader"] h2', '.css-1q2dra3', 'h2[data-automation-id="jobPostingHeader"]', '.WGDC-jss-job-header h2'],
        company: ['[data-automation-id="employerLogo"] + div', '.css-8neuee', '[data-automation-id="jobPostingHeader"] span', '.WGDC-jss-company'],
        location: ['[data-automation-id="locations"]', '.css-cygeeu', '[data-automation-id="jobPostingHeader"] .css-129m7dg'],
        description: ['[data-automation-id="jobPostingDescription"]', '.WGDC-jss-job-description', '[data-automation-id="jobDescription"]']
      },
      lever: {
        title: ['.posting-headline h2', '.posting-title', 'h2.posting-headline'],
        company: ['.posting-categories .sort-by-team', '.main-header-logo img[alt]', 'a.main-header-logo'],
        location: ['.posting-categories .location', '.sort-by-location', '.posting-location'],
        description: ['.posting-description', '.content', '.posting-page-content']
      },
      greenhouse: {
        title: ['.app-title', '#header .job-title', 'h1.job-title', '.job-post-title'],
        company: ['.company-name', '#header .company-name', '[data-automation="company-name"]'],
        location: ['.location', '.job-post-location', '#header .location'],
        description: ['#content', '.job-post-content', '#app_body', '.content-wrapper']
      },
      ashby: {
        title: ['h1.ashby-job-posting-heading', '[data-testid="job-title"]', 'h1'],
        company: ['[data-testid="company-name"]', '.ashby-company-name', 'header .company'],
        location: ['[data-testid="job-location"]', '.ashby-job-location', '.location'],
        description: ['[data-testid="job-description"]', '.ashby-job-description', '.job-description']
      },
      smartrecruiters: {
        title: ['h1.job-title', '.job-title', 'h1[class*="title"]'],
        company: ['.company-name', '.employer-name', '[class*="company"]'],
        location: ['.job-location', '.location', '[class*="location"]'],
        description: ['.job-description', '.job-details', '#job-description']
      },
      welcometothejungle: {
        title: ['h1[class*="Title"]', '[data-testid="job-title"]', 'h1'],
        company: ['[data-testid="company-name"]', 'a[href*="/companies/"]', '.company-name'],
        location: ['[data-testid="job-location"]', '.job-location', '[class*="location"]'],
        description: ['[data-testid="job-description"]', '.job-description', '.job-details']
      },
      generic: {
        title: ['h1', '.job-title', '[data-testid="job-title"]', '[class*="job-title"]', '[class*="jobTitle"]'],
        company: ['.company-name', '[data-testid="company-name"]', '[class*="company"]', '[class*="employer"]'],
        location: ['.location', '[data-testid="location"]', '[class*="location"]'],
        description: ['.job-description', '#job-description', '.description', 'article', 'main']
      }
    };

    // Get selectors for detected ATS (fallback to generic)
    const selectors = ATS_SELECTORS[atsType] || ATS_SELECTORS.generic;
    console.log(`📋 Using ${atsType} selectors for extraction`);

    // Lazy load puppeteer to avoid startup issues
    let puppeteer;
    try {
      puppeteer = require('puppeteer');
      console.log('✅ Puppeteer loaded successfully');
    } catch (e) {
      console.error('❌ Puppeteer not available:', e.message);
      console.error('   Stack:', e.stack);
      return res.status(500).json({
        status: 'error',
        message: `Puppeteer is not available on the server: ${e.message}`
      });
    }

    try {
      console.log('🚀 Launching browser...');
      // Launch browser with optimized settings
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080'
        ]
      });
      console.log('✅ Browser launched successfully');

      const page = await browser.newPage();

      // Set a reasonable timeout (increased for slow sites)
      await page.setDefaultNavigationTimeout(60000);
      await page.setDefaultTimeout(60000);

      // Set user agent to avoid bot detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
      
      // Set extra headers to appear more like a real browser
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
      });

      console.log('📄 Navigating to URL...');
      try {
        await page.goto(normalizedUrl, {
          waitUntil: 'networkidle2',
          timeout: 45000
        });
        console.log('✅ Page loaded with networkidle2');
      } catch (navError) {
        console.warn('⚠️  networkidle2 failed, trying domcontentloaded:', navError.message);
        try {
          await page.goto(normalizedUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 45000
          });
          console.log('✅ Page loaded with domcontentloaded');
        } catch (fallbackError) {
          console.error('❌ Navigation failed with both methods:', fallbackError.message);
          throw new Error(`Failed to navigate to URL: ${fallbackError.message}`);
        }
      }

      // Wait for dynamic content to load (longer for complex SPAs)
      console.log('⏳ Waiting for dynamic content...');
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // For Workday, wait for specific elements
      if (atsType === 'workday') {
        try {
          await page.waitForSelector('[data-automation-id="jobPostingDescription"]', { timeout: 10000 });
          console.log('✅ Workday job description loaded');
        } catch (e) {
          console.log('⚠️ Workday selector not found, continuing with generic extraction');
        }
      }

      console.log('📝 Extracting page content with ATS-specific selectors...');

      // Extract all text content from the page using ATS-specific selectors
      const pageContent = await page.evaluate((atsSelectors) => {
        // Remove script and style elements
        const scripts = document.querySelectorAll('script, style, noscript, iframe');
        scripts.forEach(el => el.remove());

        // Helper to try multiple selectors and return first match
        function trySelectors(selectorList, extractText = true) {
          for (const selector of selectorList) {
            try {
              const element = document.querySelector(selector);
              if (element) {
                const text = extractText ? (element.innerText || element.textContent || '').trim() : element;
                if (text && text.length > 0) {
                  return text;
                }
              }
            } catch (e) {
              // Selector might be invalid, continue
            }
          }
          return '';
        }

        // Get description content using ATS-specific selectors first
        let content = '';
        
        // Try ATS-specific description selectors first
        if (atsSelectors && atsSelectors.description) {
          content = trySelectors(atsSelectors.description);
        }
        
        // Fallback to generic selectors
        if (!content || content.length < 200) {
          const genericSelectors = [
            'main',
            '[role="main"]',
            '.job-description',
            '.job-posting',
            '.job-details',
            '#job-description',
            '#job-details',
            'article',
            '.content',
            'body'
          ];
          
          for (const selector of genericSelectors) {
            try {
              const element = document.querySelector(selector);
              if (element) {
                const text = element.innerText || element.textContent || '';
                if (text.length > content.length) {
                  content = text;
                }
                if (content.length > 1000) break;
              }
            } catch (e) {}
          }
        }

        // Fallback to body if no specific content found
        if (!content || content.length < 200) {
          content = document.body.innerText || document.body.textContent || '';
        }

        // Extract job title with ATS-specific selectors first
        let title = '';
        if (atsSelectors && atsSelectors.title) {
          title = trySelectors(atsSelectors.title);
        }
        
        // Fallback to generic title selectors
        if (!title) {
          const genericTitleSelectors = [
            'h1',
            '.job-title',
            '[data-testid="job-title"]',
            '[data-testid="jobTitle"]',
            '.jobTitle',
            'h1.job-title',
            '.job-header h1',
            '.job-header-title',
            '[class*="job-title"]',
            '[class*="jobTitle"]'
          ];
          title = trySelectors(genericTitleSelectors);
        }

        // Extract company with ATS-specific selectors first
        let company = '';
        if (atsSelectors && atsSelectors.company) {
          company = trySelectors(atsSelectors.company);
        }
        
        // Fallback to generic company selectors if not found
        if (!company) {
          const genericCompanySelectors = [
            '.company-name',
            '[data-testid="company-name"]',
            '[data-testid="companyName"]',
            '.employer-name',
            '.company',
            '.employer',
            '[class*="company-name"]',
            '[class*="companyName"]',
            '[class*="employer"]',
            '.job-company',
            '.job-header .company',
            '[itemprop="hiringOrganization"]',
            '[itemprop="name"]'
          ];
          company = trySelectors(genericCompanySelectors);
        }
        
        // Helper function to clean company name (defined early for use in extraction)
        function cleanCompanyNameEarly(name) {
          if (!name) return '';
          let cleaned = name.trim();

          // Common words to exclude from company names
          const commonWordsRegex = /^(Now|The|How|What|When|Where|Why|This|That|These|Those|Here|There|From|With|About|Learn|See|View|Read|More|Page|Site|Link|Job|Jobs|Career|Careers)$/i;

          // If the text is too long (> 50 chars), it's likely a sentence/description, not just the company name
          // Try to extract the company name from the sentence
          if (cleaned.length > 50) {
            // Pattern 1: Extract company name from patterns like "how [CompanyName] uses [CompanyName]"
            // Also handles cases like "Now on NowHear how ServiceNow uses ServiceNow"
            const pattern1 = /(?:how|about|learn\s+about|see\s+how|on\s+\w+\s+how)\s+([A-Z][a-zA-Z0-9&\s-]{3,30}?)\s+(?:uses|works|does|is)/i;
            const match1 = cleaned.match(pattern1);
            if (match1 && match1[1]) {
              const extracted1 = match1[1].trim();
              // If the extracted name is valid, use it
              if (extracted1.length >= 4 && !commonWordsRegex.test(extracted1)) {
                cleaned = extracted1;
              }
            }

            // Pattern 1b: Look for company name that appears after "how" and before "uses/works/etc"
            // This handles cases where there's text before "how"
            // Only try if pattern1 didn't find a valid name
            if (cleaned.length > 50) {
              const pattern1b = /how\s+([A-Z][a-zA-Z0-9&\s-]{3,30}?)\s+(?:uses|works|does|is)/i;
              const match1b = cleaned.match(pattern1b);
              if (match1b && match1b[1]) {
                const extracted = match1b[1].trim();
                if (extracted.length >= 4 && !commonWordsRegex.test(extracted)) {
                  cleaned = extracted;
                }
              }
            }

            // Pattern 2: Look for repeated company names (e.g., "ServiceNow uses ServiceNow")
            const words = cleaned.split(/\s+/);
            const wordCounts = {};
            words.forEach(word => {
              const cleanWord = word.replace(/[^\w&]/g, '');
              // Focus on longer words (3+ chars) that start with capital and are likely company names
              // Exclude common short words like "Now", "The", "How", etc.
              if (cleanWord.length >= 3 && /^[A-Z]/.test(cleanWord) && !commonWordsRegex.test(cleanWord)) {
                wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
              }
            });
            // Find the most repeated capitalized word (likely the company name)
            // Prefer longer words if they appear multiple times
            const mostRepeated = Object.entries(wordCounts)
              .sort((a, b) => {
                // First sort by count (descending)
                if (b[1] !== a[1]) return b[1] - a[1];
                // Then by length (descending) - longer words are more likely to be company names
                return b[0].length - a[0].length;
              })[0];
            if (mostRepeated && mostRepeated[1] > 1) {
              cleaned = mostRepeated[0];
            } else {
              // Pattern 3: Extract first capitalized word/phrase (likely company name)
              const firstCapMatch = cleaned.match(/^[^A-Z]*([A-Z][a-zA-Z0-9&\s-]{2,30}?)(?:\s|$|\.|,)/);
              if (firstCapMatch && firstCapMatch[1]) {
                cleaned = firstCapMatch[1].trim();
              } else {
                // Pattern 4: Take first 3-4 words if they start with capital
                const firstWords = words.slice(0, 4).filter(w => /^[A-Z]/.test(w));
                if (firstWords.length > 0) {
                  cleaned = firstWords.join(' ').substring(0, 50);
                }
              }
            }
          }

          // Remove common prefixes
          cleaned = cleaned.replace(/^(at|from|by|with|via|for)\s+/i, '').trim();

          // Remove common suffixes and navigation text
          cleaned = cleaned.replace(/\s*(linkedin|linkedin page|page|website|site|careers|jobs|job board|job posting|learn more|see more|view|read more).*$/i, '').trim();
          cleaned = cleaned.replace(/\s*-\s*(linkedin|page|website|site).*$/i, '').trim();

          // Remove sentence endings and descriptions
          cleaned = cleaned.replace(/\s*(uses|works|does|is|are|was|were|will|can|may|might|should|could|would|has|have|had|get|got|go|goes|went|come|comes|came|make|makes|made|take|takes|took|see|sees|saw|know|knows|knew|think|thinks|thought|say|says|said|tell|tells|told|give|gives|gave|find|finds|found|use|using|used|work|working|worked|do|doing|done|be|being|been|have|having|had|get|getting|got|go|going|went|come|coming|came|make|making|made|take|taking|took|see|seeing|saw|know|knowing|knew|think|thinking|thought|say|saying|said|tell|telling|told|give|giving|gave|find|finding|found).*$/i, '').trim();

          // Remove URLs
          cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, '').trim();

          // Remove email addresses
          cleaned = cleaned.replace(/[^\s]+@[^\s]+/gi, '').trim();

          // Remove trailing punctuation and common sentence endings
          cleaned = cleaned.replace(/[.,;:!?]+$/g, '').trim();

          // Remove extra whitespace
          cleaned = cleaned.replace(/\s+/g, ' ').trim();

          // Final validation: if still too long or contains too many words, take first 2-3 words
          const finalWords = cleaned.split(/\s+/);
          if (finalWords.length > 4 || cleaned.length > 50) {
            cleaned = finalWords.slice(0, 3).join(' ').trim();
          }

          // Remove any remaining trailing punctuation
          cleaned = cleaned.replace(/[.,;:!?]+$/g, '').trim();

          return cleaned;
        }

        // Clean company name
        company = cleanCompanyNameEarly(company);

        // If company not found with selectors, try extracting from links
        if (!company || company.length === 0) {
          const companyLinks = document.querySelectorAll('a[href*="/company/"], a[href*="/employer/"], a[href*="/organizations/"]');
          for (const link of companyLinks) {
            const linkText = link.innerText.trim();
            if (linkText && linkText.length > 0) {
              const cleanedLinkText = cleanCompanyNameEarly(linkText);
              if (cleanedLinkText.length > 0 && cleanedLinkText.length < 100) {
                company = cleanedLinkText;
                break;
              }
            }
          }
        }

        // Clean the company name we found (final pass)
        company = cleanCompanyNameEarly(company);

        // If company not found, try to extract from meta tags
        if (!company || company.length === 0) {
          const metaCompany = document.querySelector('meta[property="og:site_name"], meta[name="company"], meta[property="company"]');
          if (metaCompany) {
            const metaValue = metaCompany.getAttribute('content') || metaCompany.getAttribute('value') || '';
            company = cleanCompanyNameEarly(metaValue);
          }
        }

        // If still not found, try to extract from structured data (JSON-LD)
        if (!company || company.length === 0) {
          const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
          for (const script of jsonLdScripts) {
            try {
              const data = JSON.parse(script.textContent || '{}');
              if (data.hiringOrganization && data.hiringOrganization.name) {
                company = cleanCompanyNameEarly(data.hiringOrganization.name);
                if (company) break;
              }
              if (data.employer && data.employer.name) {
                company = cleanCompanyNameEarly(data.employer.name);
                if (company) break;
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }

        // Final cleanup
        company = cleanCompanyNameEarly(company);

        // Extract location with ATS-specific selectors first
        let location = '';
        if (atsSelectors && atsSelectors.location) {
          location = trySelectors(atsSelectors.location);
        }
        
        // Fallback to generic location selectors
        if (!location) {
          const genericLocationSelectors = [
            '.location',
            '[data-testid="location"]',
            '[data-testid="jobLocation"]',
            '.job-location',
            '[class*="location"]',
            '[itemprop="jobLocation"]'
          ];
          location = trySelectors(genericLocationSelectors);
        }

        return {
          fullText: content.trim(),
          title: title.trim(),
          company: company.trim(),
          location: location.trim(),
          url: window.location.href
        };
      }, selectors);

      await browser.close();
      browser = null;

      // Validate and clean extracted data
      const extractedTitle = (pageContent.title || '').trim();
      const extractedCompany = (pageContent.company || '').trim();
      const extractedContent = (pageContent.fullText || '').trim();
      const extractedLocation = (pageContent.location || '').trim();
      const extractedUrl = (pageContent.url || normalizedUrl).trim();

      // Validate that we have sufficient content
      if (!extractedContent || extractedContent.length < 100) {
        console.warn('⚠️  Extracted content is too short:', extractedContent.length);
        // Don't fail, but log warning - let client decide
      }

      // Clean and normalize title
      let cleanedTitle = extractedTitle;
      if (cleanedTitle) {
        // Remove common prefixes/suffixes
        cleanedTitle = cleanedTitle.replace(/^(Job|Position|Role|Opening):\s*/i, '').trim();
        cleanedTitle = cleanedTitle.replace(/\s*-\s*(Apply|View|See).*$/i, '').trim();
        // Limit length
        if (cleanedTitle.length > 200) {
          cleanedTitle = cleanedTitle.substring(0, 200).trim();
        }
      }

      // Clean and normalize company
      let cleanedCompany = extractedCompany;
      if (cleanedCompany) {
        // Remove common prefixes
        cleanedCompany = cleanedCompany.replace(/^(Company|Employer|Organization):\s*/i, '').trim();
        // Limit length
        if (cleanedCompany.length > 100) {
          cleanedCompany = cleanedCompany.substring(0, 100).trim();
        }
      }

      // Clean content - remove excessive whitespace
      let cleanedContent = extractedContent;
      if (cleanedContent) {
        // Remove excessive newlines and whitespace
        cleanedContent = cleanedContent.replace(/\n{3,}/g, '\n\n');
        cleanedContent = cleanedContent.replace(/[ \t]+/g, ' ');
        cleanedContent = cleanedContent.trim();
      }

      console.log('✅ Successfully extracted and cleaned content:', {
        title: cleanedTitle || 'NOT FOUND',
        titleLength: cleanedTitle.length,
        company: cleanedCompany || 'NOT FOUND',
        companyLength: cleanedCompany.length,
        contentLength: cleanedContent.length,
        location: extractedLocation || 'NOT FOUND',
        hasContent: cleanedContent.length >= 100
      });

      // Validate minimum requirements
      if (!cleanedContent || cleanedContent.length < 50) {
        return res.status(400).json({
          status: 'error',
          message: 'Could not extract sufficient job description content from the URL. The page may be protected, require login, or not contain a job posting.',
          extracted: {
            title: cleanedTitle,
            company: cleanedCompany,
            contentLength: cleanedContent.length
          }
        });
      }

      return res.json({
        status: 'success',
        content: cleanedContent,
        title: cleanedTitle || undefined,
        company: cleanedCompany || undefined,
        location: extractedLocation || undefined,
        url: extractedUrl
      });

    } catch (browserError) {
      console.error('❌ Browser error:', browserError);
      console.error('   Error name:', browserError.name);
      console.error('   Error message:', browserError.message);
      console.error('   Error stack:', browserError.stack);

      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('❌ Error closing browser:', closeError.message);
        }
        browser = null;
      }
      throw browserError;
    }

  } catch (error) {
    console.error('❌ Error extracting job URL:', error);
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);

    // Ensure browser is closed even if error occurred
    if (browser) {
      try {
        await browser.close().catch(() => { });
      } catch (closeError) {
        console.error('❌ Error closing browser in catch block:', closeError.message);
      }
    }

    // Check if response was already sent
    if (res.headersSent) {
      console.error("⚠️  Response already sent, cannot send error response");
      return;
    }

    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to extract job posting content',
      errorType: error.name || 'UnknownError',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Generate STAR story using AI
app.post('/api/generate-star-story', async (req, res) => {
  try {
    console.log('⭐ STAR story generation endpoint called');
    const { userId, skill, jobDescription, position, companyName } = req.body;

    if (!userId || !skill) {
      return res.status(400).json({
        status: 'error',
        message: 'userId and skill are required'
      });
    }

    // Fetch user profile data from Firestore using Admin SDK
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const userData = userDoc.data();

    // Extract comprehensive profile data
    const profileData = {
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      professionalHistory: userData.professionalHistory || [],
      skills: userData.skills || [],
      tools: userData.tools || [],
      softSkills: userData.softSkills || [],
      yearsOfExperience: userData.yearsOfExperience || 0,
      education: {
        level: userData.educationLevel || '',
        field: userData.educationField || '',
        institution: userData.educationInstitution || '',
        major: userData.educationMajor || '',
        graduationYear: userData.graduationYear || '',
      },
      languages: userData.languages || [],
      certifications: userData.certifications || [],
      careerPriorities: userData.careerPriorities || [],
      primaryMotivator: userData.primaryMotivator || '',
      managementExperience: userData.managementExperience || { hasExperience: false },
      mentoringExperience: userData.mentoringExperience || false,
      recruitingExperience: userData.recruitingExperience || false,
    };

    // Get CV content
    let cvContent = '';
    let cvTechnologies = [];
    let cvSkills = [];

    if (userData.cvText) {
      cvContent = userData.cvText;
      console.log(`✓ Using extracted CV text (${cvContent.length} characters)`);
    } else {
      console.log('⚠ No CV text found in Firestore');
    }

    if (userData.cvTechnologies && Array.isArray(userData.cvTechnologies)) {
      cvTechnologies = userData.cvTechnologies;
      console.log(`✓ Found ${cvTechnologies.length} CV-extracted technologies`);
    }
    if (userData.cvSkills && Array.isArray(userData.cvSkills)) {
      cvSkills = userData.cvSkills;
      console.log(`✓ Found ${cvSkills.length} CV-extracted skills`);
    }

    if (!cvContent && userData.cvUrl) {
      console.log(`⚠ CV URL available but cvText not found`);
    }

    console.log('📊 Data summary for STAR generation:');
    console.log(`   - Professional history entries: ${(profileData.professionalHistory || []).length}`);
    console.log(`   - Skills: ${(profileData.skills || []).length}`);
    console.log(`   - Tools: ${(profileData.tools || []).length}`);
    console.log(`   - CV text length: ${cvContent.length} characters`);
    console.log(`   - CV technologies: ${cvTechnologies.length}`);
    console.log(`   - CV skills: ${cvSkills.length}`);

    // Build experience summary
    const experienceSummary = profileData.professionalHistory && profileData.professionalHistory.length > 0
      ? profileData.professionalHistory
          .map((exp) => {
            const responsibilities = Array.isArray(exp.responsibilities)
              ? exp.responsibilities.join('; ')
              : exp.responsibilities || '';
            const achievements = Array.isArray(exp.achievements)
              ? exp.achievements.join('; ')
              : exp.achievements || '';
            const industry = exp.industry || '';
            const contractType = exp.contractType || '';
            const location = exp.location || '';

            return `Position: ${exp.title || 'N/A'} at ${exp.company || 'N/A'}
Duration: ${exp.startDate || 'N/A'} - ${exp.endDate || 'Present'}${exp.current ? ' (Current)' : ''}
Industry: ${industry}
Contract Type: ${contractType}
Location: ${location}
Responsibilities: ${responsibilities || 'N/A'}
Achievements: ${achievements || 'N/A'}`;
          })
          .join('\n\n---\n\n')
      : 'No professional history available.';

    // Build comprehensive skills list
    const allSkills = [
      ...(profileData.skills || []),
      ...(profileData.tools || []),
      ...(profileData.softSkills || []),
      ...(cvTechnologies || []),
      ...(cvSkills || []),
    ].filter((skill, index, self) => skill && self.indexOf(skill) === index);

    // Build languages summary
    const languagesSummary = profileData.languages && profileData.languages.length > 0
      ? profileData.languages.map((lang) => {
          if (typeof lang === 'string') return lang;
          return `${lang.language} (${lang.level || 'N/A'})`;
        }).join(', ')
      : 'No languages specified';

    // Build certifications summary
    const certificationsSummary = profileData.certifications && profileData.certifications.length > 0
      ? profileData.certifications.map((cert) => {
          if (typeof cert === 'string') return cert;
          return `${cert.name || cert}${cert.issuer ? ` from ${cert.issuer}` : ''}${cert.year ? ` (${cert.year})` : ''}`;
        }).join(', ')
      : 'No certifications listed';

    // Get API keys from Firestore
    const openaiSettingsDoc = await admin.firestore().collection('settings').doc('openai').get();
    const openaiApiKey = openaiSettingsDoc.exists ? (openaiSettingsDoc.data().apiKey || null) : null;

    const anthropicSettingsDoc = await admin.firestore().collection('settings').doc('anthropic').get();
    const anthropicApiKey = anthropicSettingsDoc.exists ? (anthropicSettingsDoc.data().apiKey || null) : null;

    // Fallback to environment variables
    const finalOpenAIApiKey = openaiApiKey || process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    const finalAnthropicApiKey = anthropicApiKey || process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;

    if (!finalOpenAIApiKey && !finalAnthropicApiKey) {
      return res.status(500).json({
        status: 'error',
        message: 'No AI API key found'
      });
    }

    // Build the prompt
    const prompt = `You are an expert career coach helping a candidate prepare for interviews. Your task is to create an authentic STAR (Situation, Task, Action, Result) story for the skill "${skill}".

CRITICAL RULES:
1. ONLY use real experiences from the user's profile data provided below
2. NEVER invent, fabricate, or make up experiences
3. If no relevant experience exists for this skill, respond with: {"status": "no_experience", "message": "Based on your profile, we couldn't find relevant experience for ${skill}. Consider gaining experience or focusing on transferable skills."}
4. Be honest and authentic - it's better to say there's no match than to invent something
5. You can combine multiple experiences if they relate to the skill
6. Focus on the most relevant and impactful experience

=== COMPREHENSIVE USER PROFILE ===

PROFESSIONAL EXPERIENCE:
${experienceSummary}

SKILLS & EXPERTISE:
- Technical Skills: ${(profileData.skills || []).join(', ') || 'None listed'}
- Tools & Technologies: ${(profileData.tools || []).join(', ') || 'None listed'}
- Soft Skills: ${(profileData.softSkills || []).join(', ') || 'None listed'}
- CV-Extracted Technologies: ${cvTechnologies.length > 0 ? cvTechnologies.join(', ') : 'None'}
- CV-Extracted Skills: ${cvSkills.length > 0 ? cvSkills.join(', ') : 'None'}
- All Skills Combined: ${allSkills.length > 0 ? allSkills.join(', ') : 'None listed'}

EXPERIENCE LEVEL:
- Years of Experience: ${profileData.yearsOfExperience || 0}
- Management Experience: ${profileData.managementExperience?.hasExperience ? `Yes (Team size: ${profileData.managementExperience.teamSize || 'N/A'}, Type: ${profileData.managementExperience.teamType || 'N/A'})` : 'No'}
- Mentoring Experience: ${profileData.mentoringExperience ? 'Yes' : 'No'}
- Recruiting Experience: ${profileData.recruitingExperience ? 'Yes' : 'No'}

EDUCATION:
- Level: ${profileData.education.level || 'Not specified'}
- Field: ${profileData.education.field || 'Not specified'}
- Institution: ${profileData.education.institution || 'Not specified'}
- Major: ${profileData.education.major || 'Not specified'}
- Graduation Year: ${profileData.education.graduationYear || 'Not specified'}

LANGUAGES:
${languagesSummary}

CERTIFICATIONS:
${certificationsSummary}

CAREER CONTEXT:
- Career Priorities: ${(profileData.careerPriorities || []).join(', ') || 'None specified'}
- Primary Motivator: ${profileData.primaryMotivator || 'Not specified'}

${cvContent ? `\n=== COMPLETE CV CONTENT (Extracted Text) ===\n${cvContent}\n` : '\n=== CV CONTENT ===\nNo CV text available in database.\n'}

${jobDescription ? `\n=== JOB CONTEXT ===\nPosition: ${position || 'N/A'} at ${companyName || 'N/A'}\nJob Description:\n${jobDescription}\n` : ''}

TASK: Create a STAR story for "${skill}" using ONLY real experiences from the profile above.

If you find relevant experience, respond with JSON:
{
  "status": "success",
  "story": {
    "situation": "Brief context and challenge (2-3 sentences)",
    "action": "Specific actions you took, tools/technologies used (3-4 sentences)",
    "result": "Quantifiable outcomes, impact, lessons learned (2-3 sentences)"
  }
}

If NO relevant experience exists, respond with:
{
  "status": "no_experience",
  "message": "Based on your profile, we couldn't find relevant experience for ${skill}. Consider gaining experience or focusing on transferable skills."
}

Respond ONLY with valid JSON, no markdown, no explanations.`;

    let starStory;

    // Try OpenAI first, then Claude
    if (finalOpenAIApiKey) {
      try {
        console.log('📡 Calling OpenAI API for STAR story generation...');
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${finalOpenAIApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'You are an expert career coach. Always respond with valid JSON matching the exact format requested. Never invent experiences.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
            max_completion_tokens: 2000,
          })
        });

        if (openaiResponse.ok) {
          const responseData = await openaiResponse.json();
          const responseText = responseData.choices[0]?.message?.content || '';
          starStory = JSON.parse(responseText);
          
          // Validate all three fields are present
          if (starStory.status === 'success' && starStory.story) {
            console.log('✅ OpenAI STAR story generated successfully');
            console.log('   Situation length:', starStory.story.situation?.length || 0);
            console.log('   Action length:', starStory.story.action?.length || 0);
            console.log('   Result length:', starStory.story.result?.length || 0);
            
            // Ensure all fields exist
            if (!starStory.story.situation || !starStory.story.action || !starStory.story.result) {
              console.warn('⚠️ Missing fields in generated story:', {
                hasSituation: !!starStory.story.situation,
                hasAction: !!starStory.story.action,
                hasResult: !!starStory.story.result
              });
            }
          }
        } else {
          // Read the error response body to get detailed error message
          const errorBody = await openaiResponse.text();
          let errorMessage = `OpenAI API error: ${openaiResponse.status}`;
          try {
            const errorJson = JSON.parse(errorBody);
            if (errorJson.error?.message) {
              errorMessage = `OpenAI API error (${openaiResponse.status}): ${errorJson.error.message}`;
            }
            console.error('❌ OpenAI API error response:', errorJson);
          } catch (parseError) {
            console.error('❌ OpenAI API raw error:', errorBody);
          }
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('❌ OpenAI error:', error.message);
        // Fall through to Claude
        if (!finalAnthropicApiKey) throw error;
      }
    }

    // Use Claude if OpenAI failed or wasn't available
    if (!starStory && finalAnthropicApiKey) {
      try {
        console.log('📡 Calling Claude API for STAR story generation...');
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': finalAnthropicApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2000,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          })
        });

          if (claudeResponse.ok) {
            const responseData = await claudeResponse.json();
            const content = responseData.content[0].text;
            // Extract JSON from response (Claude might wrap it in markdown)
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              starStory = JSON.parse(jsonMatch[0]);
              
              // Validate all three fields are present
              if (starStory.status === 'success' && starStory.story) {
                console.log('✅ Claude STAR story generated successfully');
                console.log('   Situation length:', starStory.story.situation?.length || 0);
                console.log('   Action length:', starStory.story.action?.length || 0);
                console.log('   Result length:', starStory.story.result?.length || 0);
                
                // Ensure all fields exist
                if (!starStory.story.situation || !starStory.story.action || !starStory.story.result) {
                  console.warn('⚠️ Missing fields in generated story:', {
                    hasSituation: !!starStory.story.situation,
                    hasAction: !!starStory.story.action,
                    hasResult: !!starStory.story.result
                  });
                }
              }
            } else {
              throw new Error('Could not parse Claude response');
            }
          } else {
            // Read the error response body to get detailed error message
            const errorBody = await claudeResponse.text();
            let errorMessage = `Claude API error: ${claudeResponse.status}`;
            try {
              const errorJson = JSON.parse(errorBody);
              if (errorJson.error?.message) {
                errorMessage = `Claude API error (${claudeResponse.status}): ${errorJson.error.message}`;
              }
              console.error('❌ Claude API error response:', errorJson);
            } catch (parseError) {
              console.error('❌ Claude API raw error:', errorBody);
            }
            throw new Error(errorMessage);
          }
      } catch (error) {
        console.error('❌ Claude error:', error.message);
        throw error;
      }
    }

    if (!starStory) {
      throw new Error('Failed to generate STAR story');
    }

    // Validate response structure
    if (starStory.status === 'no_experience') {
      return res.status(200).json(starStory);
    }

    if (starStory.status === 'success' && starStory.story) {
      // Validate story has all required fields
      const hasSituation = starStory.story.situation && starStory.story.situation.trim().length > 0;
      const hasAction = starStory.story.action && starStory.story.action.trim().length > 0;
      const hasResult = starStory.story.result && starStory.story.result.trim().length > 0;
      
      if (hasSituation && hasAction && hasResult) {
        console.log('✅ Returning complete STAR story with all three fields');
        return res.status(200).json(starStory);
      } else {
        console.error('❌ STAR story missing required fields:', {
          hasSituation,
          hasAction,
          hasResult,
          situationLength: starStory.story.situation?.length || 0,
          actionLength: starStory.story.action?.length || 0,
          resultLength: starStory.story.result?.length || 0
        });
      }
    }

    // If we get here, something went wrong
    return res.status(200).json({
      status: 'no_experience',
      message: `Based on your profile, we couldn't find relevant experience for ${skill}. Consider gaining experience or focusing on transferable skills.`
    });

  } catch (error) {
    console.error('❌ Error generating STAR story:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to generate STAR story'
    });
  }
});

// Explain why a job matches a user
app.post('/api/explainMatch', async (req, res) => {
  try {
    const { user, job } = req.body || {};
    if (!user || !job) {
      return res.status(400).json({ error: 'Missing user or job in body' });
    }
    const apiKey = await getOpenAIApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    const apiUrl = process.env.VITE_OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
    const systemPrompt = 'You are a helpful career coach. Explain concisely (6-10 sentences) why the job matches the user. Mention overlapping skills, experience alignment, and possible gaps with actionable suggestions. Avoid generic fluff.';
    const userPrompt = `
User Profile:
- Name: ${user.name || ''}
- Role: ${user.currentRole || ''}
- Location: ${user.location || ''}
- Years Experience: ${user.yearsExperience || ''}
- Skills: ${(user.skills || []).join(', ')}
- Preferences: remote=${user.preferences?.remote ? 'yes' : 'no'}, seniority=[${(user.preferences?.seniority || []).join(', ')}], domains=[${(user.preferences?.domains || []).join(', ')}]

Job:
- Title: ${job.title || ''}
- Company: ${job.company || ''}
- Location: ${job.location || ''}
- Skills: ${(job.skills || []).join(', ')}
- Description: ${(job.description || '').slice(0, 2000)}
    `.trim();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5
      })
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('OpenAI API error:', response.status, errorText);
      return res.status(500).json({ error: 'Failed generating explanation' });
    }
    const json = await response.json();
    const explanation = json?.choices?.[0]?.message?.content || '';
    return res.json({ explanation });
  } catch (e) {
    console.error('Error in explainMatch:', e);
    return res.status(500).json({ error: 'Failed to generate explanation' });
  }
});

// OLD DUPLICATE/CORRUPTED CODE REMOVED - analyze-interview endpoint is defined earlier

// ============================================
// APOLLO LEAD SOURCING API
// ============================================

// Helper to verify Firebase ID token
async function verifyFirebaseToken(req, res, next) {
  console.log('🔐 Token verification for:', req.method, req.path);
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No auth header found');
    return res.status(401).json({ error: 'Unauthorized - Missing token' });
  }
  
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    console.log('✅ Token verified for user:', decodedToken.uid);
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
}

// Get Apollo API key from Firestore
async function getApolloApiKey() {
  try {
    const settingsDoc = await admin.firestore().collection('settings').doc('apollo').get();
    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      return data?.API_KEY || data?.apiKey;
    }
  } catch (error) {
    console.error('Failed to get Apollo API key:', error.message);
  }
  return null;
}

// Apollo People Search endpoint
app.post('/api/apollo/search', verifyFirebaseToken, async (req, res) => {
  console.log('🔍 Apollo search request from user:', req.user.uid);
  
  try {
    const { campaignId, targeting, maxResults = 20 } = req.body;  // Test mode: 20 contacts
    
    if (!campaignId || !targeting) {
      return res.status(400).json({ error: 'Missing campaignId or targeting' });
    }
    
    // Get Apollo API key
    const apiKey = await getApolloApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: 'Apollo API key not configured' });
    }
    
    // Map seniority values to Apollo format
    const SENIORITY_MAPPING = {
      'entry': 'entry',
      'senior': 'senior',
      'manager': 'manager',
      'director': 'director',
      'vp': 'vp',
      'c_suite': 'c_suite'
    };
    
    // Map company size to Apollo ranges
    const COMPANY_SIZE_MAPPING = {
      '1-10': '1,10',
      '11-50': '11,50',
      '51-200': '51,200',
      '201-500': '201,500',
      '501-1000': '501,1000',
      '1001-5000': '1001,5000',
      '5001+': '5001,10000'
    };
    
    // Build Apollo search params
    const searchParams = {
      per_page: Math.min(maxResults, 100),
      page: 1
    };
    
    if (targeting.personTitles?.length > 0) {
      searchParams.person_titles = targeting.personTitles;
    }
    
    if (targeting.personLocations?.length > 0) {
      searchParams.person_locations = targeting.personLocations;
    }
    
    if (targeting.seniorities?.length > 0) {
      searchParams.person_seniorities = targeting.seniorities.map(
        s => SENIORITY_MAPPING[s] || s
      );
    }
    
    if (targeting.companySizes?.length > 0) {
      searchParams.organization_num_employees_ranges = targeting.companySizes.map(
        s => COMPANY_SIZE_MAPPING[s] || s
      );
    }
    
    console.log('📡 Apollo search params:', JSON.stringify(searchParams));
    
    // Call Apollo People Search API
    const apolloResponse = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify(searchParams)
    });
    
    if (!apolloResponse.ok) {
      const errorText = await apolloResponse.text();
      console.error('❌ Apollo API error:', apolloResponse.status, errorText);
      return res.status(500).json({ error: `Apollo API error: ${apolloResponse.status}`, details: errorText });
    }
    
    const data = await apolloResponse.json();
    console.log('✅ Apollo returned', data.people?.length || 0, 'people');
    
    // Filter out excluded companies
    const excludedCompanies = targeting.excludedCompanies || [];
    const excludedLower = excludedCompanies.map(c => c.toLowerCase());
    
    let filteredPeople = (data.people || []).filter(person => {
      if (!person.organization?.name) return true;
      return !excludedLower.some(excluded => 
        person.organization.name.toLowerCase().includes(excluded)
      );
    });
    
    // TEST MODE: Skip Apollo email enrichment to save credits
    // Assign test emails alternating between two addresses
    const TEST_EMAILS = ['rouchdi.touil@gmail.com', 'rouchdi.touil94@gmail.com'];
    console.log('🧪 TEST MODE: Assigning test emails instead of Apollo enrichment');
    
    const enrichedPeople = filteredPeople.map((person, index) => ({
      ...person,
      email: TEST_EMAILS[index % 2]  // Alternate between the two test emails
    }));
    
    console.log(`📧 Assigned ${enrichedPeople.length} test emails`);
    
    // Store contacts in Firestore
    const db = admin.firestore();
    const firestoreBatch = db.batch();
    const campaignRef = db.collection('campaigns').doc(campaignId);
    const recipientsRef = campaignRef.collection('recipients');
    
    const contacts = enrichedPeople.map(person => ({
      apolloId: person.id,
      firstName: person.first_name,
      lastName: person.last_name,
      fullName: person.name,
      title: person.title,
      email: (person.email && !person.email.includes('not_unlocked')) ? person.email : null,
      linkedinUrl: person.linkedin_url,
      company: person.organization?.name || null,
      companyWebsite: person.organization?.website_url || null,
      companyIndustry: person.organization?.industry || null,
      companySize: person.organization?.estimated_num_employees || null,
      location: [person.city, person.state, person.country].filter(Boolean).join(', ') || null,
      status: 'pending',
      emailGenerated: false,
      emailContent: null,
      emailSubject: null,
      sentAt: null,
      openedAt: null,
      repliedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }));
    
    // Add each contact to Firestore batch
    contacts.forEach(contact => {
      const docRef = recipientsRef.doc();
      firestoreBatch.set(docRef, contact);
    });
    
    // Update campaign stats
    const emailCount = contacts.filter(c => c.email).length;
    firestoreBatch.update(campaignRef, {
      'stats.contactsFound': contacts.length,
      'stats.emailsRevealed': emailCount,
      status: 'contacts_fetched',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    await firestoreBatch.commit();
    console.log('✅ Stored', contacts.length, 'contacts in Firestore');
    
    res.json({
      success: true,
      contactsFound: contacts.length,
      emailsRevealed: emailCount,
      totalAvailable: data.pagination?.total_entries || 0,
      contacts: contacts.map(c => ({
        fullName: c.fullName,
        title: c.title,
        company: c.company,
        email: c.email,
        hasEmail: !!c.email
      }))
    });
    
  } catch (error) {
    console.error('❌ Apollo search error:', error);
    res.status(500).json({ error: 'Failed to search Apollo', details: error.message });
  }
});

// Apollo Contact Enrichment endpoint
app.post('/api/apollo/enrich', verifyFirebaseToken, async (req, res) => {
  try {
    const { apolloId } = req.body;
    
    if (!apolloId) {
      return res.status(400).json({ error: 'Missing apolloId' });
    }
    
    const apiKey = await getApolloApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: 'Apollo API key not configured' });
    }
    
    const apolloResponse = await fetch('https://api.apollo.io/v1/people/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify({
        id: apolloId,
        reveal_personal_emails: false
      })
    });
    
    if (!apolloResponse.ok) {
      return res.status(500).json({ error: 'Failed to enrich contact' });
    }
    
    const data = await apolloResponse.json();
    
    res.json({
      success: true,
      email: data.person?.email || null,
      linkedinUrl: data.person?.linkedin_url || null
    });
    
  } catch (error) {
    console.error('❌ Apollo enrich error:', error);
    res.status(500).json({ error: 'Failed to enrich contact', details: error.message });
  }
});

// ============================================================================
// CAMPAIGN EMAIL SYSTEM
// ============================================================================

// Generate a single variant for A/B testing
app.post('/api/campaigns/generate-variant', verifyFirebaseToken, async (req, res) => {
  const { type, tone = 'casual', language = 'en', outreachGoal = 'job', existingVariants = [] } = req.body;
  const userId = req.user.uid;
  
  console.log(`🧪 Generating ${type} variant for ${outreachGoal}`);
  
  try {
    const db = admin.firestore();
    
    // Get user profile for context
    const userDoc = await db.collection('users').doc(userId).get();
    const userProfile = userDoc.exists ? userDoc.data() : {};
    
    const toneInstructions = {
      casual: language === 'fr' 
        ? 'Ton décontracté et amical'
        : 'Casual and friendly tone',
      professional: language === 'fr'
        ? 'Ton professionnel mais chaleureux'
        : 'Professional but warm tone',
      bold: language === 'fr'
        ? 'Ton direct et confiant'
        : 'Direct and confident tone'
    };
    
    const goalContext = {
      job: language === 'fr'
        ? 'Recherche active d\'un poste'
        : 'Actively looking for a job position',
      internship: language === 'fr'
        ? 'Recherche active d\'un stage'
        : 'Seeking an internship opportunity',
      networking: language === 'fr'
        ? 'Cherche à établir un contact professionnel, pas de recherche active'
        : 'Looking to connect professionally, not actively job searching'
    };
    
    let systemPrompt = '';
    
    if (type === 'hook') {
      systemPrompt = language === 'fr' ? `Génère UNE accroche d'email qui donne envie de lire la suite. Écris comme un humain, pas comme une IA.

BUT: ${goalContext[outreachGoal]}

✅ ACCROCHES QUI MARCHENT:
- "Hey {{firstName}}, je suis tombé sur ton profil et j'ai vu que tu gères la tech chez {{company}}. Cool."
- "Salut {{firstName}}, en cherchant des {{position}} sur LinkedIn, ton profil m'a interpellé."
- "{{firstName}}, j'ai vu ce que fait {{company}} en ce moment. Intéressant."

❌ NUL (on zappe direct):
- "Cher {{firstName}}, je suis passionné par les opportunités chez {{company}}..."
- "Bonjour, votre parcours exceptionnel m'a beaucoup impressionné..."

RÈGLES:
- 1-2 phrases max, comme un message LinkedIn
- Commence par "Hey", "Salut" ou directement {{firstName}}
- Mentionne LinkedIn OU un truc spécifique sur eux
- ${toneInstructions[tone]}
- INTERDITS: "passionné", "impressionné", "opportunité", "exceptionnel"

Déjà utilisées (évite):
${existingVariants.map((v, i) => `${i + 1}. ${v}`).join('\n') || 'Aucune'}

Génère l'accroche, rien d'autre.` : `Generate ONE email hook that makes people want to read more. Write like a human, not AI.

GOAL: ${goalContext[outreachGoal]}

✅ HOOKS THAT WORK:
- "Hey {{firstName}}, came across your profile and saw you're running eng at {{company}}. Nice."
- "{{firstName}}, I was looking for {{position}}s on LinkedIn and your profile stood out."
- "Saw what {{company}} is doing lately. Pretty interesting."

❌ BAD (instant delete):
- "Dear {{firstName}}, I am passionate about the opportunities at {{company}}..."
- "Hello, your exceptional career path has deeply impressed me..."

RULES:
- 1-2 sentences max, like a LinkedIn DM
- Start with "Hey", "Hi" or just {{firstName}}
- Mention LinkedIn OR something specific about them
- ${toneInstructions[tone]}
- BANNED: "passionate", "impressed", "opportunity", "exceptional", "excited"

Already used (avoid):
${existingVariants.map((v, i) => `${i + 1}. ${v}`).join('\n') || 'None'}

Just the hook, nothing else.`;
    } else if (type === 'body') {
      // Build sender context from actual profile data
      const senderContext = [];
      if (userProfile.currentPosition) {
        senderContext.push(`Current role: ${userProfile.currentPosition}`);
      }
      if (userProfile.yearsOfExperience) {
        senderContext.push(`${userProfile.yearsOfExperience} years of experience`);
      }
      if (userProfile.skills && userProfile.skills.length > 0) {
        senderContext.push(`Skills: ${userProfile.skills.slice(0, 3).join(', ')}`);
      }
      if (userProfile.professionalHistory && userProfile.professionalHistory.length > 0) {
        const recent = userProfile.professionalHistory[0];
        senderContext.push(`Recent: ${recent.title} at ${recent.company}`);
      }
      
      const contextStr = senderContext.length > 0 ? `\n\nSENDER INFO:\n${senderContext.join('\n')}` : '';
      
      systemPrompt = language === 'fr' ? `Génère LE CORPS d'un email (pas l'accroche, pas le CTA). Écris naturellement.

CE QUE TU FAIS:
- 2 phrases MAX qui expliquent ton background et pourquoi tu les contactes
- Vient APRÈS "Hey {{firstName}}, [accroche]" et AVANT "T'aurais 15 min?"
- But: ${goalContext[outreachGoal]}

✅ BON (naturel, direct):
${outreachGoal === 'job' ? '- "Je bosse dans le dev depuis 5 ans et ce que fait {{company}} en data m\'intéresse vraiment."\n- "J\'ai bossé sur des systèmes scalables et je cherche de nouveaux challenges."' : ''}
${outreachGoal === 'internship' ? '- "Je finis mon master en info et {{company}} serait parfait pour mon stage de fin d\'études."\n- "J\'ai déjà fait un stage en dev et votre approche me parle."' : ''}
${outreachGoal === 'networking' ? '- "Je suis dans le même secteur et y\'a un truc sur lequel j\'aimerais ton avis."\n- "J\'ai vu votre approche sur [X] et ça m\'a interpellé."' : ''}

❌ NUL:
- "Mon expertise extensive en développement me permet d'offrir une valeur significative..."
- "Je serais ravi de contribuer à votre entreprise innovante..."

RÈGLES:
- Première personne ("Je"), jamais troisième
- PAS de question, PAS de demande - juste le contexte
- ${toneInstructions[tone]}
- INTERDITS: "expertise", "ravi", "innovant", "valeur ajoutée"${contextStr}

Déjà utilisées:
${existingVariants.map((v, i) => `${i + 1}. ${v}`).join('\n') || 'Aucune'}

2 phrases qui expliquent qui tu es et pourquoi tu écris.` : `Generate THE BODY of an email (not the hook, not the CTA). Write naturally.

WHAT YOU'RE DOING:
- 2 sentences MAX explaining your background and why you're reaching out
- Comes AFTER "Hey {{firstName}}, [hook]" and BEFORE "Got 15 min?"
- Goal: ${goalContext[outreachGoal]}

✅ GOOD (natural, direct):
${outreachGoal === 'job' ? '- "I\'ve been in dev for 5 years and what {{company}} is doing in data really caught my attention."\n- "I\'ve worked on scalable systems and I\'m looking for new challenges."' : ''}
${outreachGoal === 'internship' ? '- "I\'m finishing my CS degree and {{company}} would be perfect for my internship."\n- "I\'ve done a dev internship before and your approach really resonates with me."' : ''}
${outreachGoal === 'networking' ? '- "I\'m in the same space and there\'s something I\'d love to get your take on."\n- "Saw your approach to [X] and it really got me thinking."' : ''}

❌ BAD:
- "My extensive expertise in development allows me to provide significant value..."
- "I would be thrilled to contribute to your innovative company..."

RULES:
- First person ("I"), never third
- NO questions, NO asks - just context
- ${toneInstructions[tone]}
- BANNED: "expertise", "thrilled", "innovative", "value proposition"${contextStr}

Already used:
${existingVariants.map((v, i) => `${i + 1}. ${v}`).join('\n') || 'None'}

2 sentences explaining who you are and why you're writing.`;
    } else if (type === 'cta') {
      const ctaGuidelines = {
        job: language === 'fr'
          ? 'Demande un échange pour discuter d\'opportunités'
          : 'Ask for a chat to discuss opportunities',
        internship: language === 'fr'
          ? 'Demande un échange pour parler du stage'
          : 'Ask for a chat to discuss the internship',
        networking: language === 'fr'
          ? 'Demande juste un échange informel, pas de recherche active'
          : 'Just ask for an informal chat, not actively looking'
      };
      
const senderName = userProfile.firstName || '[Sender name]';
      
      systemPrompt = language === 'fr' ? `Génère UN call-to-action + signature pour finir l'email. Simple et direct.

EXPÉDITEUR: ${senderName}
BUT: ${goalContext[outreachGoal]}

✅ CTAs QUI MARCHENT:
- "T'aurais 15 min pour en discuter ?\\n\\nÀ+,\\n${senderName}"
- "Ce serait cool d'échanger si t'es dispo cette semaine.\\n\\n${senderName}"
- "Dis-moi si t'as un créneau, je m'adapte.\\n\\n${senderName}"

❌ NUL:
- "Je serais extrêmement reconnaissant si vous pouviez m'accorder un entretien..."
- "Dans l'attente de votre retour, je reste à votre entière disposition..."

RÈGLES:
- 1 phrase + signature
- LA SIGNATURE DOIT ÊTRE "${senderName}" - c'est le prénom de l'expéditeur
- ${ctaGuidelines[outreachGoal]}
- ${toneInstructions[tone]}
- INTERDITS: "disposition", "reconnaissant", "entretien formel"

Déjà utilisées:
${existingVariants.map((v, i) => `${i + 1}. ${v}`).join('\n') || 'Aucune'}

CTA + signature avec "${senderName}", c'est tout.` : `Generate ONE call-to-action + signature to close the email. Simple and direct.

SENDER: ${senderName}
GOAL: ${goalContext[outreachGoal]}

✅ CTAs THAT WORK:
- "Got 15 min for a quick chat?\\n\\nCheers,\\n${senderName}"
- "Would be great to connect if you're free this week.\\n\\n${senderName}"
- "Let me know if you have a slot - I'm flexible.\\n\\nBest,\\n${senderName}"

❌ BAD:
- "I would be extremely grateful if you could grant me an interview..."
- "Looking forward to your response, I remain at your disposal..."

RULES:
- 1 sentence + signature
- THE SIGNATURE MUST BE "${senderName}" - this is the sender's first name
- ${ctaGuidelines[outreachGoal]}
- ${toneInstructions[tone]}
- BANNED: "grateful", "disposal", "formal interview"

Already used:
${existingVariants.map((v, i) => `${i + 1}. ${v}`).join('\n') || 'None'}

CTA + signature with "${senderName}", that's it.`;
    }
    
    const openaiClient = await getOpenAIClient();
    
    // More explicit user prompt to ensure only the specific part is generated
    let userPrompt = '';
    if (type === 'hook') {
      userPrompt = language === 'fr' 
        ? `Génère SEULEMENT une accroche (1-2 phrases). PAS de corps d'email, PAS de signature, PAS de sujet. Juste l'accroche d'ouverture avec merge fields.`
        : `Generate ONLY an opening hook (1-2 sentences). NO email body, NO signature, NO subject. Just the opening hook with merge fields.`;
    } else if (type === 'body') {
      userPrompt = language === 'fr'
        ? `Génère 2 PHRASES MAX. Première personne ("Je"). Explique POURQUOI tu contactes. PAS de question. PAS de demande. Juste ton intérêt/background.`
        : `Generate 2 SENTENCES MAX. First person ("I"). Explain WHY you're reaching out. NO question. NO ask. Just your interest/background.`;
    } else if (type === 'cta') {
      const senderFirstName = userProfile.firstName || '[Your first name]';
      
      userPrompt = language === 'fr'
        ? `Génère UN CTA + signature pour finir l'email. SIGNE AVEC: ${senderFirstName}

Exemple de format:
"T'aurais 15 min pour en discuter?

${senderFirstName}"

IMPORTANT: La signature DOIT être "${senderFirstName}" (pas un autre prénom). Juste le CTA + signature, rien d'autre.`
        : `Generate ONE CTA + signature to close the email. SIGN WITH: ${senderFirstName}

Example format:
"Got 15 min for a quick chat?

${senderFirstName}"

IMPORTANT: The signature MUST be "${senderFirstName}" (not a different name). Just CTA + signature, nothing else.`;
    }
    
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-5.2-chat-latest",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_completion_tokens: 150
    });
    
    let variant = completion.choices[0]?.message?.content?.trim() || '';
    
    // Clean up any unwanted prefixes or suffixes
    variant = variant
      .replace(/^(Hook|Body|CTA|Opening|Accroche|Corps):\s*/i, '')
      .replace(/^["'`]/g, '')
      .replace(/["'`]$/g, '')
      .trim();
    
    res.json({
      success: true,
      variant
    });
    
  } catch (error) {
    console.error('❌ Variant generation error:', error);
    res.status(500).json({ error: 'Failed to generate variant', details: error.message });
  }
});

// Generate email templates with merge fields
app.post('/api/campaigns/generate-templates', verifyFirebaseToken, async (req, res) => {
  const { tone = 'casual', language = 'en', keyPoints = '', outreachGoal = 'job', count = 3 } = req.body;
  const userId = req.user.uid;
  
  console.log(`📝 Generating ${count} email templates`);
  
  try {
    const db = admin.firestore();
    
    // Get user profile for context
    const userDoc = await db.collection('users').doc(userId).get();
    const userProfile = userDoc.exists ? userDoc.data() : {};
    
    // Build user context
    const userContext = [];
    if (userProfile.firstName) {
      userContext.push(`Sender: ${userProfile.firstName}${userProfile.lastName ? ' ' + userProfile.lastName : ''}`);
    }
    if (userProfile.currentPosition) {
      userContext.push(`Current role: ${userProfile.currentPosition}`);
    }
    if (userProfile.yearsOfExperience) {
      userContext.push(`Experience: ${userProfile.yearsOfExperience} years`);
    }
    if (keyPoints) {
      userContext.push(`Key points to mention: ${keyPoints}`);
    }
    
    const contextStr = userContext.join('\n');
    
    const toneInstructions = {
      casual: language === 'fr' 
        ? 'Ton décontracté et amical, comme un message LinkedIn entre professionnels.'
        : 'Casual and friendly tone, like a LinkedIn message between professionals.',
      professional: language === 'fr'
        ? 'Ton professionnel mais chaleureux, pas corporate ou robotique.'
        : 'Professional but warm tone, not corporate or robotic.',
      bold: language === 'fr'
        ? 'Ton direct et confiant, qui va droit au but sans être arrogant.'
        : 'Direct and confident tone, straight to the point without being arrogant.'
    };
    
    const goalContext = {
      job: language === 'fr'
        ? 'Recherche active d\'opportunités professionnelles'
        : 'Actively looking for new job opportunities',
      internship: language === 'fr'
        ? 'Recherche active d\'un stage'
        : 'Actively seeking an internship',
      networking: language === 'fr'
        ? 'Cherche à établir des contacts professionnels'
        : 'Looking to build professional connections'
    };

    const goalInstructions = {
      job: language === 'fr'
        ? 'Mentionner que tu cherches de nouvelles opportunités'
        : 'Mention looking for new opportunities',
      internship: language === 'fr'
        ? 'Mentionner que tu cherches un stage'
        : 'Mention seeking an internship',
      networking: language === 'fr'
        ? 'Pas de recherche active, juste échanger'
        : 'Not actively looking, just want to connect'
    };

    const systemPrompt = language === 'fr' ? `Tu es un copywriter expert spécialisé dans les cold emails qui obtiennent des réponses (taux de réponse 30%+).

CONTEXTE: ${goalContext[outreachGoal]}

OBJECTIF: Créer ${count} templates d'emails AUTHENTIQUES et HUMAINS avec des champs de fusion.

CHAMPS DE FUSION:
- {{firstName}} - Prénom
- {{lastName}} - Nom  
- {{company}} - Entreprise
- {{position}} - Poste
- {{location}} - Lieu

EXEMPLES D'EMAILS QUI MARCHENT:

✅ BON (naturel, direct, humain):
"Salut {{firstName}},

Je suis tombé sur ton profil LinkedIn et j'ai vu que tu gères l'équipe tech chez {{company}}. 

Je bosse dans le dev depuis 5 ans, et votre approche sur [X] m'a vraiment interpellé. Ce serait cool d'échanger si t'as 15 min ?

À bientôt,
Alex"

❌ MAUVAIS (robotique, corporate):
"Cher {{firstName}}, je suis passionné par les opportunités incroyables chez {{company}}. Votre parcours exceptionnel m'inspire énormément..."

RÈGLES D'OR:
1. Écris comme tu parlerais à un collègue sympa
2. UNE seule idée par email, UNE seule demande
3. 4-5 phrases MAX, pas de pavés
4. Commence par "Salut" ou "Hey", jamais "Cher" ou "Bonjour Monsieur"
5. INTERDITS: "passionné", "opportunité", "impressionné", "inspiré", "incroyable"
6. Signature = prénom seul, pas de titre
7. ${goalInstructions[outreachGoal]}
8. Chaque template = angle DIFFÉRENT (curiosité, valeur, connexion, timing)

TON: ${toneInstructions[tone]}

Format:
TEMPLATE [n]
SUBJECT: [objet intrigant 3-5 mots]
---
[corps naturel et humain]

Génère ${count} templates maintenant.` : `You're a cold email copywriter with a 30%+ reply rate. Write emails that feel like they're from a real person, not AI.

CONTEXT: ${goalContext[outreachGoal]}

GOAL: Create ${count} AUTHENTIC, HUMAN email templates with merge fields.

MERGE FIELDS:
- {{firstName}} - First name
- {{lastName}} - Last name
- {{company}} - Company
- {{position}} - Role
- {{location}} - Location

EXAMPLES OF EMAILS THAT WORK:

✅ GOOD (natural, direct, human):
"Hey {{firstName}},

Came across your profile on LinkedIn and saw you're running eng at {{company}}.

I've been in dev for 5 years, and your team's approach to [X] caught my eye. Would be great to chat for 15 min if you're up for it?

Cheers,
Alex"

❌ BAD (robotic, corporate):
"Dear {{firstName}}, I am passionate about the incredible opportunities at {{company}}. Your exceptional career path deeply inspires me..."

GOLDEN RULES:
1. Write like you're texting a friendly colleague
2. ONE idea per email, ONE ask
3. 4-5 sentences MAX, no walls of text
4. Start with "Hey" or "Hi", never "Dear" or "To whom"
5. BANNED WORDS: "passionate", "opportunity", "impressed", "inspired", "incredible", "excited"
6. Sign with first name only, no titles
7. ${goalInstructions[outreachGoal]}
8. Each template = DIFFERENT angle (curiosity, value, connection, timing)

TONE: ${toneInstructions[tone]}

Format:
TEMPLATE [n]
SUBJECT: [intriguing 3-5 word subject]
---
[natural, human body]

Generate ${count} templates now.`;

    const openaiClient = await getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-5.2-chat-latest",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `SENDER CONTEXT:\n${contextStr}\n\nGenerate ${count} different email templates with merge fields. Make them sound genuinely human - like a real person wrote them, not AI.` }
      ],
      max_completion_tokens: 1800
    });
    
    const content = completion.choices[0]?.message?.content || '';
    
    // Parse templates
    const templateBlocks = content.split(/TEMPLATE\s+\d+/i).filter(block => block.trim());
    const templates = [];
    
    for (let i = 0; i < Math.min(templateBlocks.length, count); i++) {
      const block = templateBlocks[i];
      const subjectMatch = block.match(/SUBJECT:\s*(.+)/i);
      const subject = subjectMatch ? subjectMatch[1].trim() : `Quick question about {{company}}`;
      
      const bodyMatch = block.split(/---+/);
      const body = bodyMatch.length > 1 ? bodyMatch[1].trim() : block.replace(/SUBJECT:.+/i, '').trim();
      
      templates.push({
        id: `template-${Date.now()}-${i}`,
        subject,
        body
      });
    }
    
    // If we didn't get enough templates, add defaults
    while (templates.length < count) {
      const idx = templates.length;
      templates.push({
        id: `template-${Date.now()}-${idx}`,
        subject: language === 'fr' 
          ? `Question rapide concernant {{company}}`
          : `Quick question about {{company}}`,
        body: language === 'fr'
          ? `Bonjour {{firstName}},\n\nJe suis ${userProfile.firstName || '[Votre nom]'} et je m'intéresse beaucoup à {{company}}.\n\nSeriez-vous disponible pour un échange rapide sur votre expérience en tant que {{position}} ?\n\nMerci,\n${userProfile.firstName || '[Votre nom]'}`
          : `Hi {{firstName}},\n\nI'm ${userProfile.firstName || '[Your name]'} and I'm really interested in {{company}}.\n\nWould you be open to a quick chat about your experience as {{position}}?\n\nThanks,\n${userProfile.firstName || '[Your name]'}`
      });
    }
    
    res.json({
      success: true,
      templates: templates.slice(0, count)
    });
    
  } catch (error) {
    console.error('❌ Template generation error:', error);
    res.status(500).json({ error: 'Failed to generate templates', details: error.message });
  }
});

// Generate personalized emails for all recipients in a campaign
// Supports 3 modes: auto (AI per contact), template (merge fields), abtest (variant combinations)
app.post('/api/campaigns/:campaignId/generate-emails', verifyFirebaseToken, async (req, res) => {
  console.log('🔥 GENERATE EMAILS ENDPOINT HIT');
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  console.log('User:', req.user?.uid);
  
  const { campaignId } = req.params;
  const { tone = 'casual', language = 'en' } = req.body;
  const userId = req.user.uid;
  
  console.log(`📧 Generating emails for campaign ${campaignId}`);
  
  try {
    const db = admin.firestore();
    
    // Get campaign data
    const campaignRef = db.collection('campaigns').doc(campaignId);
    const campaignDoc = await campaignRef.get();
    
    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const campaignData = campaignDoc.data();
    if (campaignData.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Get user profile for email generation context
    const userDoc = await db.collection('users').doc(userId).get();
    const userProfile = userDoc.exists ? userDoc.data() : {};
    
    // Get all recipients without generated emails
    console.log(`📂 Getting recipients from campaigns/${campaignId}/recipients`);
    const allRecipientsSnapshot = await campaignRef.collection('recipients').get();
    console.log(`📂 Found ${allRecipientsSnapshot.size} total recipients in collection`);
    
    if (allRecipientsSnapshot.empty) {
      console.log('⚠️ No recipients found in subcollection!');
      return res.json({ success: true, generated: 0, message: 'No recipients in campaign' });
    }
    
    // Filter to only those without generated emails
    const recipientDocs = allRecipientsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.emailGenerated !== true;
    });
    
    console.log(`📧 After filter: ${recipientDocs.length} recipients need email generation`);
    
    if (recipientDocs.length === 0) {
      return res.json({ success: true, generated: 0, message: 'All emails already generated' });
    }
    
    // Determine generation mode
    const mode = campaignData.emailGenerationMode || 'auto';
    console.log(`📧 Using generation mode: ${mode}`);
    
    // Build user context for AI prompt (used in auto mode)
    const userContext = buildUserContext(userProfile, campaignData.targeting);
    
    // Generate emails for each recipient
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const recipientDoc of recipientDocs) {
      const recipient = recipientDoc.data();
      
      try {
        let subject, body, variantConfig;
        
        if (mode === 'template' && campaignData.template) {
          // Template mode: Replace merge fields
          ({ subject, body } = replaceMergeFields(campaignData.template, recipient));
        } else if (mode === 'abtest' && campaignData.abTestVariants) {
          // A/B Testing mode: Randomly combine hook + body + cta
          ({ subject, body, variantConfig } = generateABTestEmail(campaignData.abTestVariants, recipient));
        } else {
          // Auto mode: AI generates unique email per contact
          ({ subject, body } = await generateEmailForRecipient(
            userContext,
            recipient,
            tone,
            language,
            userProfile,
            campaignData.outreachGoal || 'job'
          ));
        }
        
        // Update recipient with generated email
        const updateData = {
          emailSubject: subject,
          emailContent: body,
          emailGenerated: true,
          emailTone: tone,
          status: 'email_generated',
          generatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Add variant config for A/B testing
        if (variantConfig) {
          updateData.variantConfig = variantConfig;
          updateData.variantId = `${variantConfig.hookIndex}-${variantConfig.bodyIndex}-${variantConfig.ctaIndex}`;
        }
        
        await recipientDoc.ref.update(updateData);
        
        results.push({ id: recipientDoc.id, success: true, subject });
        successCount++;
        console.log(`  ✅ Generated email for ${recipient.fullName}`);
        
      } catch (error) {
        console.error(`  ❌ Failed to generate for ${recipient.fullName}:`, error.message);
        results.push({ id: recipientDoc.id, success: false, error: error.message });
        errorCount++;
      }
      
      // Small delay to avoid rate limiting (only for auto mode with AI)
      if (mode === 'auto') {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    // Update campaign stats
    await campaignRef.update({
      'stats.emailsGenerated': admin.firestore.FieldValue.increment(successCount),
      status: successCount > 0 ? 'emails_generated' : campaignData.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({
      success: true,
      generated: successCount,
      failed: errorCount,
      total: recipientDocs.length,
      mode,
      results
    });
    
  } catch (error) {
    console.error('❌ Email generation error:', error);
    res.status(500).json({ error: 'Failed to generate emails', details: error.message });
  }
});

// Helper function to replace merge fields in template
function replaceMergeFields(template, recipient) {
  let subject = template.subject || '';
  let body = template.body || '';
  
  const replacements = {
    '{{firstName}}': recipient.firstName || '',
    '{{lastName}}': recipient.lastName || '',
    '{{company}}': recipient.company || '',
    '{{position}}': recipient.title || '',
    '{{location}}': recipient.location || ''
  };
  
  for (const [field, value] of Object.entries(replacements)) {
    subject = subject.replace(new RegExp(field, 'g'), value);
    body = body.replace(new RegExp(field, 'g'), value);
  }
  
  return { subject, body };
}

// Helper function to generate A/B test email
function generateABTestEmail(variants, recipient) {
  const { hooks = [], bodies = [], ctas = [] } = variants;
  
  // Randomly select one from each category
  const hookIndex = Math.floor(Math.random() * hooks.length);
  const bodyIndex = Math.floor(Math.random() * bodies.length);
  const ctaIndex = Math.floor(Math.random() * ctas.length);
  
  const hook = hooks[hookIndex] || '';
  const body = bodies[bodyIndex] || '';
  const cta = ctas[ctaIndex] || '';
  
  // Combine and replace merge fields
  const fullBody = `${hook}\n\n${body}\n\n${cta}`;
  const { subject, body: processedBody } = replaceMergeFields(
    { subject: `Quick question about {{company}}`, body: fullBody },
    recipient
  );
  
  return {
    subject,
    body: processedBody,
    variantConfig: {
      hookIndex,
      bodyIndex,
      ctaIndex
    }
  };
}

// Helper function to build user context for AI
function buildUserContext(userProfile, targeting) {
  const parts = [];
  
  if (userProfile.firstName) {
    parts.push(`Sender's name: ${userProfile.firstName}${userProfile.lastName ? ' ' + userProfile.lastName : ''}`);
  }
  if (userProfile.currentPosition) {
    parts.push(`Current role: ${userProfile.currentPosition}`);
  }
  if (userProfile.yearsOfExperience) {
    parts.push(`Experience: ${userProfile.yearsOfExperience} years`);
  }
  if (userProfile.skills && userProfile.skills.length > 0) {
    parts.push(`Key skills: ${userProfile.skills.slice(0, 5).join(', ')}`);
  }
  if (targeting?.personTitles?.length > 0) {
    parts.push(`Looking for: ${targeting.personTitles[0]} positions`);
  }
  if (targeting?.industries?.length > 0) {
    parts.push(`Target industry: ${targeting.industries[0]}`);
  }
  if (targeting?.personLocations?.length > 0) {
    parts.push(`Preferred location: ${targeting.personLocations[0]}`);
  }
  if (userProfile.professionalHistory && userProfile.professionalHistory.length > 0) {
    const recentJob = userProfile.professionalHistory[0];
    parts.push(`Recent experience: ${recentJob.title} at ${recentJob.company}`);
  }
  
  return parts.join('\n');
}

// Helper function to generate email for a single recipient
async function generateEmailForRecipient(userContext, recipient, tone, language, userProfile, outreachGoal = 'job') {
  const toneInstructions = {
    casual: language === 'fr' 
      ? 'Ton décontracté et amical, comme un message LinkedIn entre professionnels.'
      : 'Casual and friendly tone, like a LinkedIn message between professionals.',
    professional: language === 'fr'
      ? 'Ton professionnel mais chaleureux, pas corporate ou robotique.'
      : 'Professional but warm tone, not corporate or robotic.',
    bold: language === 'fr'
      ? 'Ton direct et confiant, qui va droit au but sans être arrogant.'
      : 'Direct and confident tone, straight to the point without being arrogant.'
  };
  
  const goalContext = {
    job: language === 'fr'
      ? 'Recherche active de nouvelles opportunités professionnelles'
      : 'Actively looking for new job opportunities',
    internship: language === 'fr'
      ? 'Recherche active d\'un stage'
      : 'Actively seeking an internship',
    networking: language === 'fr'
      ? 'Cherche à établir des contacts professionnels'
      : 'Looking to build professional connections'
  };

  const goalInstructions = {
    job: language === 'fr'
      ? 'Mentionner que tu cherches de nouvelles opportunités'
      : 'Mention that you\'re looking for new opportunities',
    internship: language === 'fr'
      ? 'Mentionner que tu cherches un stage'
      : 'Mention that you\'re seeking an internship',
    networking: language === 'fr'
      ? 'Pas de recherche active, juste échanger'
      : 'Not actively looking, just want to connect'
  };
  
  const systemPrompt = language === 'fr' ? `Tu es un copywriter qui écrit des cold emails avec un taux de réponse de 35%. Écris comme un VRAI humain, pas comme une IA.

CONTEXTE: ${goalContext[outreachGoal]}

DESTINATAIRE:
- Prénom: ${recipient.firstName}
- Entreprise: ${recipient.company || 'leur boîte'}
- Poste: ${recipient.title || 'leur rôle'}

EXEMPLES QUI MARCHENT:

✅ BON (le mec répond):
"Salut ${recipient.firstName},

Je suis tombé sur ton profil et j'ai vu que t'es ${recipient.title || 'dans le game'} chez ${recipient.company}. Cool.

Je bosse dans le même secteur depuis quelques années, et y'a un truc sur lequel j'aimerais bien avoir ton avis. T'aurais 15 min pour en discuter ?

À+
[Prénom]"

❌ NUL (poubelle direct):
"Cher ${recipient.firstName}, je suis passionné par les opportunités incroyables chez ${recipient.company}..."

RÈGLES D'OR:
1. Écris comme tu parlerais à un pote bossant dans le même secteur
2. COMMENCE par LinkedIn ou par un truc spécifique sur eux
3. 4-5 phrases MAX. Pas de roman.
4. UNE seule demande : un call de 15 min
5. ${goalInstructions[outreachGoal]}
6. INTERDITS: "passionné", "opportunité", "ravi", "impressionné", "incroyable", "exceptionnel"
7. Signe avec ton prénom, point final

TON: ${toneInstructions[tone]}

Format:
SUBJECT: [3-5 mots max, intrigant]
---
[email naturel et humain]` : `You're a cold email copywriter with a 35% reply rate. Write like a REAL human, not AI.

CONTEXT: ${goalContext[outreachGoal]}

RECIPIENT:
- Name: ${recipient.firstName}
- Company: ${recipient.company || 'their company'}
- Role: ${recipient.title || 'their role'}

EXAMPLES THAT WORK:

✅ GOOD (gets a reply):
"Hey ${recipient.firstName},

Came across your profile and saw you're ${recipient.title || 'doing cool stuff'} at ${recipient.company}. Nice.

I've been in the same space for a few years, and there's something I'd love to get your take on. Got 15 min for a quick chat?

Cheers,
[First name]"

❌ BAD (straight to trash):
"Dear ${recipient.firstName}, I am passionate about the incredible opportunities at ${recipient.company}..."

GOLDEN RULES:
1. Write like you're messaging a work friend
2. START with LinkedIn or something specific about them
3. 4-5 sentences MAX. No essays.
4. ONE ask only: a 15 min call
5. ${goalInstructions[outreachGoal]}
6. BANNED: "passionate", "opportunity", "excited", "impressed", "incredible", "amazing"
7. Sign with first name only, period

TONE: ${toneInstructions[tone]}

Format:
SUBJECT: [3-5 words max, intriguing]
---
[natural, human email]`;

  const openaiClient = await getOpenAIClient();
  const completion = await openaiClient.chat.completions.create({
    model: "gpt-5.2-chat-latest",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `WHO I AM:\n${userContext}\n\nWrite an email to ${recipient.firstName} (${recipient.title || 'professional'} at ${recipient.company}). Make it sound like I actually typed this myself - casual, direct, human. Sign with "${userProfile.firstName || 'Me'}". Remember: if this email sounds like it could be from ChatGPT, rewrite it.` }
    ],
    max_completion_tokens: 450
  });
  
  const content = completion.choices[0]?.message?.content || '';
  
  // Parse subject and body
  const subjectMatch = content.match(/SUBJECT:\s*(.+)/i);
  const subject = subjectMatch ? subjectMatch[1].trim() : `Quick question`;
  
  const bodyMatch = content.split(/---+/);
  const body = bodyMatch.length > 1 ? bodyMatch[1].trim() : content.replace(/SUBJECT:.+/i, '').trim();
  
  return { subject, body };
}

// Send emails in batch (max 10 per request to avoid spam filters)
app.post('/api/campaigns/:campaignId/send-emails', verifyFirebaseToken, async (req, res) => {
  const { campaignId } = req.params;
  const { batchSize = 10 } = req.body;
  const userId = req.user.uid;
  
  console.log(`📤 Sending emails for campaign ${campaignId}`);
  
  try {
    const db = admin.firestore();
    
    // Get campaign
    const campaignRef = db.collection('campaigns').doc(campaignId);
    const campaignDoc = await campaignRef.get();
    
    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const campaignData = campaignDoc.data();
    if (campaignData.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Get Gmail tokens and refresh if needed
    let accessToken;
    try {
      accessToken = await refreshGmailToken(userId);
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError.message);
      return res.status(401).json({ 
        error: 'Gmail token expired', 
        message: refreshError.message,
        needsReconnect: true 
      });
    }
    
    const gmailTokenDoc = await db.collection('gmailTokens').doc(userId).get();
    const gmailTokens = gmailTokenDoc.data();
    const senderEmail = gmailTokens.email;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Gmail access token missing. Please reconnect Gmail.' });
    }
    
    // Get recipients with generated emails but not yet sent
    const recipientsSnapshot = await campaignRef.collection('recipients')
      .where('emailGenerated', '==', true)
      .where('status', '==', 'email_generated')
      .limit(batchSize)
      .get();
    
    if (recipientsSnapshot.empty) {
      return res.json({ success: true, sent: 0, message: 'No emails to send' });
    }
    
    // Get user profile for sender name
    const userDoc = await db.collection('users').doc(userId).get();
    const userProfile = userDoc.exists ? userDoc.data() : {};
    const senderName = userProfile.firstName && userProfile.lastName
      ? `${userProfile.firstName} ${userProfile.lastName}`
      : userProfile.firstName || senderEmail.split('@')[0];
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    const TRACKING_BASE_URL = process.env.TRACKING_URL || `http://localhost:${PORT}`;
    
    for (const recipientDoc of recipientsSnapshot.docs) {
      const recipient = recipientDoc.data();
      
      if (!recipient.email) {
        console.log(`  ⚠️ Skipping ${recipient.fullName} - no email`);
        results.push({ id: recipientDoc.id, success: false, error: 'No email address' });
        errorCount++;
        continue;
      }
      
      try {
        // Create tracking pixel URL
        const trackingId = `${campaignId}_${recipientDoc.id}`;
        const trackingPixel = `<img src="${TRACKING_BASE_URL}/api/track/open/${trackingId}" width="1" height="1" style="display:none;" />`;
        
        // Build email with tracking pixel
        const emailBody = `${recipient.emailContent}\n\n${trackingPixel}`;
        
        // Check if campaign has CV attachment
        let cvAttachmentData = null;
        if (campaignData.attachCV && campaignData.cvAttachment) {
          try {
            // Download CV from URL
            const cvResponse = await fetch(campaignData.cvAttachment.url);
            if (cvResponse.ok) {
              const cvBuffer = await cvResponse.arrayBuffer();
              cvAttachmentData = {
                filename: campaignData.cvAttachment.name.endsWith('.pdf') 
                  ? campaignData.cvAttachment.name 
                  : `${campaignData.cvAttachment.name}.pdf`,
                mimeType: 'application/pdf',
                data: Buffer.from(cvBuffer).toString('base64')
              };
            }
          } catch (cvError) {
            console.warn(`  ⚠️ Could not attach CV for ${recipient.fullName}:`, cvError.message);
            // Continue without attachment
          }
        }
        
        // Create raw email in RFC 2822 format
        const rawEmail = cvAttachmentData
          ? createRawEmailWithAttachment({
              from: senderEmail,
              fromName: senderName,
              to: recipient.email,
              subject: recipient.emailSubject,
              body: emailBody,
              attachment: cvAttachmentData
            })
          : createRawEmail({
              from: senderEmail,
              fromName: senderName,
              to: recipient.email,
              subject: recipient.emailSubject,
              body: emailBody
            });
        
        // Send via Gmail API
        const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ raw: rawEmail })
        });
        
        if (!sendResponse.ok) {
          const errorData = await sendResponse.json();
          throw new Error(errorData.error?.message || 'Gmail API error');
        }
        
        const sendData = await sendResponse.json();
        
        // Update recipient status
        await recipientDoc.ref.update({
          status: 'sent',
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          gmailMessageId: sendData.id,
          gmailThreadId: sendData.threadId,
          trackingId: trackingId
        });
        
        results.push({ id: recipientDoc.id, success: true, messageId: sendData.id });
        successCount++;
        console.log(`  ✅ Sent email to ${recipient.fullName} (${recipient.email})`);
        
        // Small delay between sends
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`  ❌ Failed to send to ${recipient.fullName}:`, error.message);
        
        await recipientDoc.ref.update({
          status: 'send_failed',
          sendError: error.message,
          lastSendAttempt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        results.push({ id: recipientDoc.id, success: false, error: error.message });
        errorCount++;
      }
    }
    
    // Update campaign stats
    await campaignRef.update({
      'stats.emailsSent': admin.firestore.FieldValue.increment(successCount),
      status: successCount > 0 ? 'sending' : campaignData.status,
      lastSendBatch: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Calculate remaining to send
    const remainingSnapshot = await campaignRef.collection('recipients')
      .where('status', '==', 'email_generated')
      .get();
    
    res.json({
      success: true,
      sent: successCount,
      failed: errorCount,
      remaining: remainingSnapshot.size,
      results
    });
    
  } catch (error) {
    console.error('❌ Email sending error:', error);
    res.status(500).json({ error: 'Failed to send emails', details: error.message });
  }
});

// Helper function to create RFC 2822 raw email for Gmail API
function createRawEmail({ from, fromName, to, subject, body }) {
  // Create HTML email with proper formatting
  const htmlBody = body
    .replace(/\n/g, '<br>')
    .replace(/(<img[^>]*>)/g, '$1'); // Keep image tags intact
  
  // Format: "FirstName LastName <email@domain.com>"
  const fromHeader = fromName ? `${fromName} <${from}>` : from;
  
  const email = [
    `From: ${fromHeader}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    htmlBody
  ].join('\r\n');
  
  // Base64url encode
  return Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Helper function to create email with PDF attachment
function createRawEmailWithAttachment({ from, fromName, to, subject, body, attachment }) {
  const boundary = `----boundary_${Date.now()}`;
  
  // Create HTML body with proper formatting
  const htmlBody = body
    .replace(/\n/g, '<br>')
    .replace(/(<img[^>]*>)/g, '$1');
  
  // Format: "FirstName LastName <email@domain.com>"
  const fromHeader = fromName ? `${fromName} <${from}>` : from;
  
  const email = [
    `From: ${fromHeader}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody,
    '',
    `--${boundary}`,
    `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${attachment.filename}"`,
    '',
    attachment.data,
    '',
    `--${boundary}--`
  ].join('\r\n');
  
  // Base64url encode
  return Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Tracking pixel endpoint - returns 1x1 transparent GIF
app.get('/api/track/open/:trackingId', async (req, res) => {
  const { trackingId } = req.params;
  
  console.log(`👁️ Email opened: ${trackingId}`);
  
  try {
    // Parse tracking ID: campaignId_recipientId
    const [campaignId, recipientId] = trackingId.split('_');
    
    if (campaignId && recipientId) {
      const db = admin.firestore();
      const recipientRef = db.collection('campaigns').doc(campaignId).collection('recipients').doc(recipientId);
      const recipientDoc = await recipientRef.get();
      
      if (recipientDoc.exists) {
        const recipient = recipientDoc.data();
        
        // Only update if not already opened and status is 'sent'
        if (recipient.status === 'sent') {
          await recipientRef.update({
            status: 'opened',
            openedAt: admin.firestore.FieldValue.serverTimestamp(),
            openCount: admin.firestore.FieldValue.increment(1)
          });
          
          // Update campaign stats
          await db.collection('campaigns').doc(campaignId).update({
            'stats.opened': admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`  ✅ Marked as opened`);
        } else if (recipient.status === 'opened' || recipient.status === 'replied') {
          // Just increment open count
          await recipientRef.update({
            openCount: admin.firestore.FieldValue.increment(1)
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Tracking error:', error);
    // Don't fail the request - still return the pixel
  }
  
  // Return 1x1 transparent GIF
  const transparentGif = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  
  res.set({
    'Content-Type': 'image/gif',
    'Content-Length': transparentGif.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  res.send(transparentGif);
});

// Check for replies in Gmail inbox
app.post('/api/campaigns/:campaignId/check-replies', verifyFirebaseToken, async (req, res) => {
  const { campaignId } = req.params;
  const userId = req.user.uid;
  
  console.log(`📬 Checking replies for campaign ${campaignId}`);
  
  try {
    const db = admin.firestore();
    
    // Get campaign
    const campaignRef = db.collection('campaigns').doc(campaignId);
    const campaignDoc = await campaignRef.get();
    
    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const campaignData = campaignDoc.data();
    if (campaignData.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Get Gmail tokens and refresh if needed
    let accessToken;
    try {
      accessToken = await refreshGmailToken(userId);
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError.message);
      return res.status(401).json({ 
        error: 'Gmail token expired', 
        message: refreshError.message,
        needsReconnect: true 
      });
    }
    
    const gmailTokenDoc = await db.collection('gmailTokens').doc(userId).get();
    const gmailTokens = gmailTokenDoc.data();
    
    // Get sent recipients that haven't replied yet
    console.log('📬 Querying for sent/opened recipients...');
    const recipientsSnapshot = await campaignRef.collection('recipients')
      .where('status', 'in', ['sent', 'opened'])
      .get();
    
    console.log(`📬 Found ${recipientsSnapshot.size} recipients with sent/opened status`);
    
    if (recipientsSnapshot.empty) {
      return res.json({ success: true, repliesFound: 0, message: 'No sent emails to check' });
    }
    
    let repliesFound = 0;
    const results = [];
    
    for (const recipientDoc of recipientsSnapshot.docs) {
      const recipient = recipientDoc.data();
      
      console.log(`  Checking ${recipient.fullName}: threadId=${recipient.gmailThreadId}, status=${recipient.status}`);
      
      if (!recipient.gmailThreadId) {
        console.log(`  ⚠️ Skipping ${recipient.fullName} - no threadId`);
        continue;
      }
      
      try {
        // Get thread to check for replies
        console.log(`  📨 Fetching Gmail thread ${recipient.gmailThreadId}...`);
        const threadResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/threads/${recipient.gmailThreadId}`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        );
        
        if (!threadResponse.ok) {
          const errorText = await threadResponse.text();
          console.log(`  ❌ Gmail API error for ${recipient.fullName}: ${threadResponse.status} - ${errorText}`);
          continue;
        }
        
        const threadData = await threadResponse.json();
        console.log(`  📧 Thread has ${threadData.messages?.length || 0} messages`);
        
        // If thread has more than 1 message, there's a reply
        if (threadData.messages && threadData.messages.length > 1) {
          // Check if any message is not from us (it's a reply)
          const senderEmail = gmailTokens.email.toLowerCase();
          console.log(`  🔍 Checking for replies (sender: ${senderEmail})`);
          
          // In test mode, emails are sent to ourselves, so we check if there's more than 1 message
          // by checking if any message after the first one exists (that's the reply)
          const firstMessageId = threadData.messages[0]?.id;
          const hasReply = threadData.messages.some((msg, index) => {
            // Skip the first message (the one we sent)
            if (index === 0) return false;
            
            // Check if this is a different message (a reply)
            const fromHeader = msg.payload?.headers?.find(h => h.name.toLowerCase() === 'from');
            const from = fromHeader?.value?.toLowerCase() || '';
            
            // In test mode: any message after the first is a reply
            // In production: check if from is different from sender
            const isTestMode = recipient.email?.includes('rouchdi.touil');
            const isReply = isTestMode ? true : !from.includes(senderEmail);
            
            if (isReply) console.log(`  📩 Found reply from: ${from} (msg ${index + 1}/${threadData.messages.length})`);
            return isReply;
          });
          
          if (hasReply && recipient.status !== 'replied') {
            await recipientDoc.ref.update({
              status: 'replied',
              repliedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            // Create notification for campaign reply
            try {
              const userNotificationsRef = db.collection('users').doc(userId).collection('notifications');
              await userNotificationsRef.add({
                type: 'campaign_reply',
                title: 'Campaign Reply Received',
                message: `${recipient.fullName || recipient.email}${recipient.company ? ` from ${recipient.company}` : ''} replied to your campaign`,
                icon: 'mail',
                actionUrl: `/campaigns-auto?campaign=${campaignId}&recipient=${recipientDoc.id}`,
                actionLabel: 'View Reply',
                metadata: {
                  contactName: recipient.fullName || recipient.email,
                  contactEmail: recipient.email,
                  companyName: recipient.company,
                  campaignId: campaignId,
                  recipientId: recipientDoc.id,
                },
                read: false,
                priority: 'high',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
              });
              console.log(`  🔔 Notification created for reply from ${recipient.fullName}`);
            } catch (notifError) {
              console.error(`  ⚠️ Failed to create notification:`, notifError.message);
            }
            
            repliesFound++;
            results.push({ id: recipientDoc.id, name: recipient.fullName, replied: true });
            console.log(`  ✅ Found reply from ${recipient.fullName}`);
          }
        }
        
      } catch (error) {
        console.error(`  ⚠️ Error checking thread for ${recipient.fullName}:`, error.message);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Update campaign stats if we found replies
    if (repliesFound > 0) {
      await campaignRef.update({
        'stats.replied': admin.firestore.FieldValue.increment(repliesFound),
        lastReplyCheck: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    res.json({
      success: true,
      repliesFound,
      checked: recipientsSnapshot.size,
      results
    });
    
  } catch (error) {
    console.error('❌ Reply check error:', error);
    res.status(500).json({ error: 'Failed to check replies', details: error.message });
  }
});

// Exchange Gmail authorization code for tokens (with refresh token)
app.post('/api/gmail/exchange-code', verifyFirebaseToken, async (req, res) => {
  const { code } = req.body;
  const userId = req.user.uid;
  
  console.log('🔑 Exchanging Gmail authorization code for tokens');
  
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }
  
  try {
    const db = admin.firestore();
    
    // Get Gmail OAuth credentials from Firestore
    const gmailSettingsDoc = await db.collection('settings').doc('gmail').get();
    if (!gmailSettingsDoc.exists) {
      return res.status(500).json({ error: 'Gmail OAuth not configured' });
    }
    
    const gmailSettings = gmailSettingsDoc.data();
    const clientId = gmailSettings.CLIENT_ID;
    const clientSecret = gmailSettings.CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Gmail OAuth credentials missing' });
    }
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: 'postmessage', // For popup flow
        grant_type: 'authorization_code'
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('Token exchange error:', tokenData);
      return res.status(400).json({ error: tokenData.error_description || tokenData.error });
    }
    
    const { access_token, refresh_token, expires_in } = tokenData;
    
    // Get user email
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    const userInfo = await userInfoResponse.json();
    const userEmail = userInfo.email;
    
    // Store tokens in Firestore
    await db.collection('gmailTokens').doc(userId).set({
      accessToken: access_token,
      refreshToken: refresh_token,
      email: userEmail,
      expiresAt: Date.now() + (expires_in || 3600) * 1000,
      connectedAt: admin.firestore.FieldValue.serverTimestamp(),
      userId: userId
    });
    
    console.log(`✅ Gmail connected for ${userEmail} with refresh token`);
    
    res.json({
      success: true,
      email: userEmail,
      hasRefreshToken: !!refresh_token
    });
    
  } catch (error) {
    console.error('Error exchanging Gmail code:', error);
    res.status(500).json({ error: 'Failed to exchange code', details: error.message });
  }
});

// Helper function to refresh Gmail access token
async function refreshGmailToken(userId) {
  const db = admin.firestore();
  
  // Get stored tokens
  const tokenDoc = await db.collection('gmailTokens').doc(userId).get();
  if (!tokenDoc.exists) {
    throw new Error('No Gmail tokens found');
  }
  
  const tokenData = tokenDoc.data();
  
  // Check if token is still valid (with 5 min buffer)
  if (tokenData.expiresAt > Date.now() + 5 * 60 * 1000) {
    return tokenData.accessToken;
  }
  
  // Need to refresh
  if (!tokenData.refreshToken) {
    throw new Error('No refresh token available - please reconnect Gmail');
  }
  
  console.log(`🔄 Refreshing Gmail token for user ${userId}`);
  
  // Get OAuth credentials
  const gmailSettingsDoc = await db.collection('settings').doc('gmail').get();
  const gmailSettings = gmailSettingsDoc.data();
  
  // Refresh the token
  const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: gmailSettings.CLIENT_ID,
      client_secret: gmailSettings.CLIENT_SECRET,
      refresh_token: tokenData.refreshToken,
      grant_type: 'refresh_token'
    })
  });
  
  const refreshData = await refreshResponse.json();
  
  if (refreshData.error) {
    console.error('Token refresh error:', refreshData);
    throw new Error(refreshData.error_description || 'Failed to refresh token');
  }
  
  // Update stored token
  await db.collection('gmailTokens').doc(userId).update({
    accessToken: refreshData.access_token,
    expiresAt: Date.now() + (refreshData.expires_in || 3600) * 1000
  });
  
  console.log(`✅ Gmail token refreshed successfully`);
  
  return refreshData.access_token;
}

// Get Gmail thread reply content
app.get('/api/gmail/thread/:threadId', verifyFirebaseToken, async (req, res) => {
  const { threadId } = req.params;
  const userId = req.user.uid;
  
  console.log(`📨 Fetching Gmail thread ${threadId} for reply content`);
  
  try {
    const db = admin.firestore();
    
    // Get Gmail tokens and refresh if needed
    let accessToken;
    try {
      accessToken = await refreshGmailToken(userId);
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError.message);
      return res.status(401).json({ 
        error: 'Gmail token expired', 
        message: refreshError.message,
        needsReconnect: true 
      });
    }
    
    const gmailTokenDoc = await db.collection('gmailTokens').doc(userId).get();
    const gmailTokens = gmailTokenDoc.data();
    const senderEmail = gmailTokens.email?.toLowerCase();
    
    // Fetch thread with full message content
    const threadResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );
    
    if (!threadResponse.ok) {
      const errorText = await threadResponse.text();
      console.error('Gmail API error:', errorText);
      
      // Check for expired token
      if (threadResponse.status === 401) {
        return res.status(401).json({ 
          error: 'Gmail token expired', 
          message: 'Please reconnect Gmail to refresh your access token',
          needsReconnect: true 
        });
      }
      return res.status(500).json({ error: 'Failed to fetch thread' });
    }
    
    const threadData = await threadResponse.json();
    
    if (!threadData.messages || threadData.messages.length < 2) {
      return res.json({ success: true, reply: null, message: 'No reply found' });
    }
    
    // Find the reply message (not from us)
    let replyMessage = null;
    for (let i = threadData.messages.length - 1; i >= 0; i--) {
      const msg = threadData.messages[i];
      const fromHeader = msg.payload?.headers?.find(h => h.name.toLowerCase() === 'from');
      const from = fromHeader?.value || '';
      
      // In test mode, take any message after the first
      // In production, take message not from sender
      if (i > 0) {
        replyMessage = msg;
        break;
      }
    }
    
    if (!replyMessage) {
      return res.json({ success: true, reply: null, message: 'No reply found' });
    }
    
    // Extract reply details
    const headers = replyMessage.payload?.headers || [];
    const fromHeader = headers.find(h => h.name.toLowerCase() === 'from')?.value || 'Unknown';
    const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
    const dateHeader = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';
    
    // Extract body content
    let body = '';
    
    function extractBody(payload) {
      if (payload.body?.data) {
        return Buffer.from(payload.body.data, 'base64').toString('utf-8');
      }
      if (payload.parts) {
        for (const part of payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            return Buffer.from(part.body.data, 'base64').toString('utf-8');
          }
          if (part.parts) {
            const nested = extractBody(part);
            if (nested) return nested;
          }
        }
        // Fallback to HTML if no plain text
        for (const part of payload.parts) {
          if (part.mimeType === 'text/html' && part.body?.data) {
            const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
            // Basic HTML to text conversion
            return html
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<\/p>/gi, '\n\n')
              .replace(/<[^>]+>/g, '')
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .trim();
          }
        }
      }
      return '';
    }
    
    body = extractBody(replyMessage.payload);
    
    // Clean up the body (remove quoted text)
    const lines = body.split('\n');
    const cleanLines = [];
    for (const line of lines) {
      // Stop at quoted text indicators
      if (line.startsWith('>') || line.startsWith('On ') && line.includes(' wrote:')) {
        break;
      }
      if (line.includes('wrote:') && line.includes('@')) {
        break;
      }
      cleanLines.push(line);
    }
    body = cleanLines.join('\n').trim();
    
    // Use internalDate (Unix timestamp in milliseconds) for reliable date parsing
    // This is more reliable than parsing the RFC 2822 date header
    let isoDate;
    try {
      if (replyMessage.internalDate) {
        // internalDate is a Unix timestamp in milliseconds
        const timestamp = parseInt(replyMessage.internalDate);
        if (!isNaN(timestamp) && timestamp > 0) {
          isoDate = new Date(timestamp).toISOString();
        } else {
          throw new Error('Invalid internalDate');
        }
      } else {
        // Fallback to dateHeader if internalDate is not available
        const date = new Date(dateHeader);
        if (!isNaN(date.getTime())) {
          isoDate = date.toISOString();
        } else {
          throw new Error('Invalid dateHeader');
        }
      }
    } catch (e) {
      // If both fail, use current date
      console.warn('Failed to parse date, using current date:', e.message);
      isoDate = new Date().toISOString();
    }
    
    res.json({
      success: true,
      reply: {
        from: fromHeader,
        subject: subjectHeader,
        body: body || '(No text content)',
        date: isoDate
      }
    });
    
  } catch (error) {
    console.error('Error fetching thread:', error);
    res.status(500).json({ error: 'Failed to fetch reply', details: error.message });
  }
});

// Send reply to Gmail thread
app.post('/api/gmail/thread/:threadId/reply', verifyFirebaseToken, async (req, res) => {
  const { threadId } = req.params;
  const { message } = req.body;
  const userId = req.user.uid;
  
  console.log(`📤 Sending reply to thread ${threadId}`);
  
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
    const db = admin.firestore();
    
    // Get Gmail tokens and refresh if needed
    let accessToken;
    try {
      accessToken = await refreshGmailToken(userId);
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError.message);
      return res.status(401).json({ 
        error: 'Gmail token expired', 
        message: refreshError.message,
        needsReconnect: true 
      });
    }
    
    const gmailTokenDoc = await db.collection('gmailTokens').doc(userId).get();
    const gmailTokens = gmailTokenDoc.data();
    const senderEmail = gmailTokens.email;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Gmail access token missing. Please reconnect Gmail.' });
    }
    
    // Fetch thread to get the original message details
    const threadResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );
    
    if (!threadResponse.ok) {
      const errorText = await threadResponse.text();
      console.error('Gmail API error:', errorText);
      
      if (threadResponse.status === 401) {
        return res.status(401).json({ 
          error: 'Gmail token expired', 
          message: 'Please reconnect Gmail to refresh your access token',
          needsReconnect: true 
        });
      }
      return res.status(500).json({ error: 'Failed to fetch thread' });
    }
    
    const threadData = await threadResponse.json();
    
    if (!threadData.messages || threadData.messages.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    // Get the last message in the thread to reply to
    const lastMessage = threadData.messages[threadData.messages.length - 1];
    const headers = lastMessage.payload?.headers || [];
    
    // Find recipient email (To header from last message, or From if replying)
    const toHeader = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
    const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
    const messageIdHeader = headers.find(h => h.name.toLowerCase() === 'message-id')?.value || '';
    
    // Extract email from "Name <email@example.com>" format
    const toEmail = toHeader.match(/<([^>]+)>/) ? toHeader.match(/<([^>]+)>/)[1] : toHeader;
    
    // Create reply subject (add Re: if not already present)
    let replySubject = subjectHeader;
    if (!replySubject.toLowerCase().startsWith('re:')) {
      replySubject = `Re: ${replySubject}`;
    }
    
    // Create raw email for reply
    const htmlBody = message
      .replace(/\n/g, '<br>')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/&lt;br&gt;/g, '<br>');
    
    // Build email headers
    const emailHeaders = [
      `From: ${senderEmail}`,
      `To: ${toEmail}`,
      `Subject: ${replySubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8'
    ];
    
    // Add In-Reply-To and References headers if Message-ID is available
    if (messageIdHeader) {
      emailHeaders.push(`In-Reply-To: ${messageIdHeader}`);
      emailHeaders.push(`References: ${messageIdHeader}`);
    }
    
    emailHeaders.push(''); // Empty line before body
    
    const email = [
      ...emailHeaders,
      htmlBody
    ].join('\r\n');
    
    // Base64url encode
    const rawEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // Send reply via Gmail API (using threadId to keep it in the same thread)
    const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        raw: rawEmail,
        threadId: threadId
      })
    });
    
    if (!sendResponse.ok) {
      const errorData = await sendResponse.json();
      console.error('Gmail send error:', errorData);
      throw new Error(errorData.error?.message || 'Gmail API error');
    }
    
    const sendData = await sendResponse.json();
    
    console.log(`✅ Reply sent successfully: ${sendData.id}`);
    
    res.json({
      success: true,
      messageId: sendData.id,
      threadId: sendData.threadId
    });
    
  } catch (error) {
    console.error('Error sending reply:', error);
    res.status(500).json({ error: 'Failed to send reply', details: error.message });
  }
});

// ==================== GOOGLE CALENDAR API ====================

// Helper function to refresh Calendar access token
async function refreshCalendarToken(userId) {
  const db = admin.firestore();
  
  // Get stored tokens
  const tokenDoc = await db.collection('calendarTokens').doc(userId).get();
  if (!tokenDoc.exists) {
    throw new Error('No Calendar tokens found');
  }
  
  const tokenData = tokenDoc.data();
  
  // Check if token is still valid (with 5 min buffer)
  if (tokenData.expiresAt > Date.now() + 5 * 60 * 1000) {
    return tokenData.accessToken;
  }
  
  // Need to refresh
  if (!tokenData.refreshToken) {
    throw new Error('No refresh token available - please reconnect Google Calendar');
  }
  
  console.log(`🔄 Refreshing Calendar token for user ${userId}`);
  
  // Get OAuth credentials (try calendar settings first, fall back to gmail)
  let settingsDoc = await db.collection('settings').doc('calendar').get();
  if (!settingsDoc.exists) {
    settingsDoc = await db.collection('settings').doc('gmail').get();
  }
  const settings = settingsDoc.data();
  
  // Refresh the token
  const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: settings.CLIENT_ID,
      client_secret: settings.CLIENT_SECRET,
      refresh_token: tokenData.refreshToken,
      grant_type: 'refresh_token'
    })
  });
  
  const refreshData = await refreshResponse.json();
  
  if (refreshData.error) {
    throw new Error(refreshData.error_description || refreshData.error);
  }
  
  // Update stored token
  const newExpiresAt = Date.now() + (refreshData.expires_in * 1000);
  await db.collection('calendarTokens').doc(userId).update({
    accessToken: refreshData.access_token,
    expiresAt: newExpiresAt
  });
  
  console.log(`✅ Calendar token refreshed for user ${userId}`);
  return refreshData.access_token;
}

// Exchange Calendar authorization code for tokens
app.post('/api/calendar/exchange-code', verifyFirebaseToken, async (req, res) => {
  const { code } = req.body;
  const userId = req.user.uid;
  
  console.log('🗓️ Exchanging Calendar authorization code for tokens');
  
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }
  
  try {
    const db = admin.firestore();
    
    // Get OAuth credentials (try calendar settings first, fall back to gmail)
    let settingsDoc = await db.collection('settings').doc('calendar').get();
    if (!settingsDoc.exists) {
      settingsDoc = await db.collection('settings').doc('gmail').get();
    }
    
    if (!settingsDoc.exists) {
      return res.status(500).json({ error: 'Calendar OAuth not configured' });
    }
    
    const settings = settingsDoc.data();
    const clientId = settings.CLIENT_ID;
    const clientSecret = settings.CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'OAuth credentials missing' });
    }
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: 'postmessage',
        grant_type: 'authorization_code'
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('Token exchange error:', tokenData);
      return res.status(400).json({ error: tokenData.error_description || tokenData.error });
    }
    
    const { access_token, refresh_token, expires_in } = tokenData;
    
    // Get user email
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    
    const userInfo = await userInfoResponse.json();
    const email = userInfo.email;
    
    // Store tokens in Firestore
    await db.collection('calendarTokens').doc(userId).set({
      accessToken: access_token,
      refreshToken: refresh_token,
      email: email,
      expiresAt: Date.now() + (expires_in * 1000),
      connectedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Calendar tokens stored for user ${userId} (${email})`);
    
    res.json({ success: true, email });
  } catch (error) {
    console.error('Error exchanging Calendar code:', error);
    res.status(500).json({ error: 'Failed to exchange code', details: error.message });
  }
});

// Get Calendar events
app.get('/api/calendar/events', verifyFirebaseToken, async (req, res) => {
  const userId = req.user.uid;
  const { timeMin, timeMax } = req.query;
  
  console.log(`📅 Fetching Calendar events for user ${userId}`);
  
  try {
    // Get and refresh token if needed
    let accessToken;
    try {
      accessToken = await refreshCalendarToken(userId);
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError.message);
      return res.status(401).json({ 
        error: 'Calendar token expired', 
        message: refreshError.message,
        needsReconnect: true 
      });
    }
    
    // Build query params
    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250'
    });
    
    if (timeMin) params.append('timeMin', timeMin);
    if (timeMax) params.append('timeMax', timeMax);
    
    // Fetch events from Google Calendar
    const eventsResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );
    
    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      console.error('Calendar API error:', errorText);
      
      if (eventsResponse.status === 401) {
        return res.status(401).json({ 
          error: 'Calendar token expired', 
          message: 'Please reconnect Google Calendar',
          needsReconnect: true 
        });
      }
      return res.status(500).json({ error: 'Failed to fetch events' });
    }
    
    const eventsData = await eventsResponse.json();
    
    console.log(`✅ Fetched ${eventsData.items?.length || 0} Calendar events`);
    
    res.json({ success: true, events: eventsData.items || [] });
  } catch (error) {
    console.error('Error fetching Calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
  }
});

// Create Calendar event
app.post('/api/calendar/events', verifyFirebaseToken, async (req, res) => {
  const userId = req.user.uid;
  const { summary, description, start, end, location, attendees } = req.body;
  
  console.log(`📅 Creating Calendar event for user ${userId}: ${summary}`);
  
  if (!summary || !start || !end) {
    return res.status(400).json({ error: 'Missing required fields: summary, start, end' });
  }
  
  try {
    // Get and refresh token if needed
    let accessToken;
    try {
      accessToken = await refreshCalendarToken(userId);
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError.message);
      return res.status(401).json({ 
        error: 'Calendar token expired', 
        message: refreshError.message,
        needsReconnect: true 
      });
    }
    
    // Build event object
    const event = {
      summary,
      description: description || '',
      start: {
        dateTime: new Date(start).toISOString(),
        timeZone: 'Europe/Paris'
      },
      end: {
        dateTime: new Date(end).toISOString(),
        timeZone: 'Europe/Paris'
      }
    };
    
    if (location) event.location = location;
    if (attendees && attendees.length > 0) {
      event.attendees = attendees.map(email => ({ email }));
    }
    
    // Create event in Google Calendar
    const createResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    );
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Calendar API error:', errorText);
      
      if (createResponse.status === 401) {
        return res.status(401).json({ 
          error: 'Calendar token expired', 
          message: 'Please reconnect Google Calendar',
          needsReconnect: true 
        });
      }
      return res.status(500).json({ error: 'Failed to create event' });
    }
    
    const createdEvent = await createResponse.json();
    
    console.log(`✅ Created Calendar event: ${createdEvent.id}`);
    
    res.json({ success: true, event: createdEvent });
  } catch (error) {
    console.error('Error creating Calendar event:', error);
    res.status(500).json({ error: 'Failed to create event', details: error.message });
  }
});

// Update Calendar event
app.put('/api/calendar/events/:eventId', verifyFirebaseToken, async (req, res) => {
  const userId = req.user.uid;
  const { eventId } = req.params;
  const { summary, description, start, end, location, attendees } = req.body;
  
  console.log(`📅 Updating Calendar event ${eventId} for user ${userId}`);
  
  try {
    // Get and refresh token if needed
    let accessToken;
    try {
      accessToken = await refreshCalendarToken(userId);
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError.message);
      return res.status(401).json({ 
        error: 'Calendar token expired', 
        message: refreshError.message,
        needsReconnect: true 
      });
    }
    
    // First, get the existing event
    const getResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );
    
    if (!getResponse.ok) {
      if (getResponse.status === 404) {
        return res.status(404).json({ error: 'Event not found' });
      }
      if (getResponse.status === 401) {
        return res.status(401).json({ 
          error: 'Calendar token expired', 
          message: 'Please reconnect Google Calendar',
          needsReconnect: true 
        });
      }
      return res.status(500).json({ error: 'Failed to get event' });
    }
    
    const existingEvent = await getResponse.json();
    
    // Build updated event object
    const updatedEvent = { ...existingEvent };
    if (summary) updatedEvent.summary = summary;
    if (description !== undefined) updatedEvent.description = description;
    if (start) {
      updatedEvent.start = {
        dateTime: new Date(start).toISOString(),
        timeZone: 'Europe/Paris'
      };
    }
    if (end) {
      updatedEvent.end = {
        dateTime: new Date(end).toISOString(),
        timeZone: 'Europe/Paris'
      };
    }
    if (location !== undefined) updatedEvent.location = location;
    if (attendees) {
      updatedEvent.attendees = attendees.map(email => ({ email }));
    }
    
    // Update event in Google Calendar
    const updateResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedEvent)
      }
    );
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Calendar API error:', errorText);
      
      if (updateResponse.status === 401) {
        return res.status(401).json({ 
          error: 'Calendar token expired', 
          message: 'Please reconnect Google Calendar',
          needsReconnect: true 
        });
      }
      return res.status(500).json({ error: 'Failed to update event' });
    }
    
    const updated = await updateResponse.json();
    
    console.log(`✅ Updated Calendar event: ${eventId}`);
    
    res.json({ success: true, event: updated });
  } catch (error) {
    console.error('Error updating Calendar event:', error);
    res.status(500).json({ error: 'Failed to update event', details: error.message });
  }
});

// Delete Calendar event
app.delete('/api/calendar/events/:eventId', verifyFirebaseToken, async (req, res) => {
  const userId = req.user.uid;
  const { eventId } = req.params;
  
  console.log(`📅 Deleting Calendar event ${eventId} for user ${userId}`);
  
  try {
    // Get and refresh token if needed
    let accessToken;
    try {
      accessToken = await refreshCalendarToken(userId);
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError.message);
      return res.status(401).json({ 
        error: 'Calendar token expired', 
        message: refreshError.message,
        needsReconnect: true 
      });
    }
    
    // Delete event from Google Calendar
    const deleteResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );
    
    if (!deleteResponse.ok && deleteResponse.status !== 204) {
      const errorText = await deleteResponse.text();
      console.error('Calendar API error:', errorText);
      
      if (deleteResponse.status === 404) {
        return res.status(404).json({ error: 'Event not found' });
      }
      if (deleteResponse.status === 401) {
        return res.status(401).json({ 
          error: 'Calendar token expired', 
          message: 'Please reconnect Google Calendar',
          needsReconnect: true 
        });
      }
      return res.status(500).json({ error: 'Failed to delete event' });
    }
    
    console.log(`✅ Deleted Calendar event: ${eventId}`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting Calendar event:', error);
    res.status(500).json({ error: 'Failed to delete event', details: error.message });
  }
});

// ==================== END GOOGLE CALENDAR API ====================

// En production, pour toutes les autres routes, servir index.html
// Cela permet à React Router de gérer les routes côté client
if (isProduction) {
  app.get('*', (req, res) => {
    // Ne pas rediriger les routes API
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    }
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
  console.log(`Claude API proxy available at http://localhost:${PORT}/api/claude`);
  console.log(`ChatGPT API proxy available at http://localhost:${PORT}/api/chatgpt`);
  console.log(`Perplexity API proxy available at http://localhost:${PORT}/api/perplexity`);
  console.log(`GPT-4o Vision API proxy available at http://localhost:${PORT}/api/analyze-cv-vision`);
  console.log(`Job URL extraction available at http://localhost:${PORT}/api/extract-job-url`);
  console.log(`Interview analysis available at http://localhost:${PORT}/api/analyze-interview`);
  console.log(`Whisper transcription available at http://localhost:${PORT}/api/transcribe-audio`);
  console.log(`STAR story generation available at http://localhost:${PORT}/api/generate-star-story`);
  console.log(`Stripe Checkout proxy available at http://localhost:${PORT}/api/stripe/create-checkout-session`);
  console.log(`Company Logo API proxy available at http://localhost:${PORT}/api/company-logo`);
  console.log(`Test endpoint available at http://localhost:${PORT}/api/test`);
  console.log(`Claude API test endpoint available at http://localhost:${PORT}/api/claude/test`);
  if (isProduction) {
    console.log(`Application available at http://localhost:${PORT}`);
  }
});
