const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

// Load environment variables
dotenv.config();

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
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'anthropic-version'],
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

    try {
      openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o", // Using GPT-4o for better quality
          messages: messages,
          response_format: { type: 'json_object' },
          max_tokens: maxTokens,
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

    const { cvData, jobContext } = req.body;

    if (!cvData) {
      console.error('❌ CV data is missing in request body');
      return res.status(400).json({
        status: 'error',
        message: 'CV data is required'
      });
    }

    // Generate the CV review prompt
    const prompt = generateCVReviewPrompt(cvData, jobContext);
    
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
          model: "gpt-4o",
          messages: messages,
          response_format: { type: 'json_object' },
          max_tokens: 8000,
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
function generateCVReviewPrompt(cvData, jobContext) {
  const cvJson = JSON.stringify(cvData, null, 2);
  
  return `You are an expert CV/Resume reviewer and ATS optimization specialist. Analyze the following CV and provide highly specific, actionable suggestions to improve it.

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
   - Mention 1-2 specific strengths you noticed in their CV
   - Provide an ATS compatibility score (0-100)
   - List 2-3 key strengths
   - List 2-3 main issues to address

2. SUGGESTIONS:
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
      max_tokens: max_tokens || 6000, // Increased for more detailed analysis
      temperature: temperature || 0.1, // Lower temperature for more precise, consistent analysis
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
        model: 'gpt-4o',
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
        max_tokens: 4000,
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

      // Set a reasonable timeout
      await page.setDefaultNavigationTimeout(45000);
      await page.setDefaultTimeout(45000);

      // Set user agent to avoid bot detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

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

      // Wait a bit for dynamic content to load
      console.log('⏳ Waiting for dynamic content...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('📝 Extracting page content...');

      // Extract all text content from the page
      const pageContent = await page.evaluate(() => {
        // Remove script and style elements
        const scripts = document.querySelectorAll('script, style, noscript, iframe');
        scripts.forEach(el => el.remove());

        // Get main content areas (common job posting selectors)
        const selectors = [
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

        let content = '';
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            content = element.innerText || element.textContent || '';
            if (content.length > 500) break; // Use first substantial content found
          }
        }

        // Fallback to body if no specific content found
        if (!content || content.length < 500) {
          content = document.body.innerText || document.body.textContent || '';
        }

        // Also try to get structured data
        // Extract job title with multiple selectors
        const titleSelectors = [
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
        let title = '';
        for (const selector of titleSelectors) {
          const element = document.querySelector(selector);
          if (element && element.innerText && element.innerText.trim().length > 0) {
            title = element.innerText.trim();
            break;
          }
        }

        // Extract company with multiple selectors
        const companySelectors = [
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

        let company = '';
        for (const selector of companySelectors) {
          const element = document.querySelector(selector);
          if (element && element.innerText && element.innerText.trim().length > 0) {
            company = cleanCompanyNameEarly(element.innerText.trim());
            if (company.length > 0 && company.length < 100) {
              break;
            }
          }
        }

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

        // Extract location
        const locationSelectors = [
          '.location',
          '[data-testid="location"]',
          '[data-testid="jobLocation"]',
          '.job-location',
          '[class*="location"]',
          '[itemprop="jobLocation"]'
        ];
        let location = '';
        for (const selector of locationSelectors) {
          const element = document.querySelector(selector);
          if (element && element.innerText && element.innerText.trim().length > 0) {
            location = element.innerText.trim();
            break;
          }
        }

        return {
          fullText: content.trim(),
          title: title.trim(),
          company: company.trim(),
          location: location.trim(),
          url: window.location.href
        };
      });

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
        model: 'gpt-4o-mini',
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
  console.log(`GPT-4o Vision API proxy available at http://localhost:${PORT}/api/analyze-cv-vision`);
  console.log(`Job URL extraction available at http://localhost:${PORT}/api/extract-job-url`);
  console.log(`Interview analysis available at http://localhost:${PORT}/api/analyze-interview`);
  console.log(`Whisper transcription available at http://localhost:${PORT}/api/transcribe-audio`);
  console.log(`Stripe Checkout proxy available at http://localhost:${PORT}/api/stripe/create-checkout-session`);
  console.log(`Company Logo API proxy available at http://localhost:${PORT}/api/company-logo`);
  console.log(`Test endpoint available at http://localhost:${PORT}/api/test`);
  console.log(`Claude API test endpoint available at http://localhost:${PORT}/api/claude/test`);
  if (isProduction) {
    console.log(`Application available at http://localhost:${PORT}`);
  }
});
