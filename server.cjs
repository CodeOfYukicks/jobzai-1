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
    const messages = [
      {
        role: "system",
        content: "You are an expert career coach. Always respond with valid JSON matching the exact format requested. Do not include any markdown code blocks, just return the raw JSON object."
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
        model: "gpt-4o", // Using GPT-4o for better quality
        messages: messages,
        response_format: { type: 'json_object' },
        max_tokens: 4000,
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

// GPT-4o Vision API route for CV analysis
app.post('/api/analyze-cv-vision', async (req, res) => {
  try {
    console.log("GPT-4o Vision API endpoint called");
    
    // Get API key from Firestore or environment variables
    let apiKey = await getOpenAIApiKey();
    
    if (!apiKey) {
      console.error('❌ ERREUR: Clé API OpenAI manquante');
      console.error('   Solution: Ajoutez la clé dans Firestore (settings/openai) ou dans .env (OPENAI_API_KEY=sk-...)');
      return res.status(500).json({ 
        status: 'error', 
        message: 'OpenAI API key is missing. Please add it to Firestore (settings/openai) or .env file (OPENAI_API_KEY).' 
      });
    }
    
    // Extract request data
    const { model, messages, response_format, max_tokens, temperature } = req.body;
    
    // Validate request
    if (!model || !messages || !Array.isArray(messages)) {
      console.error('Invalid request format:', { model, hasMessages: !!messages });
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request format: model and messages array are required'
      });
    }
    
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
    
    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        messages: messages,
        response_format: response_format || { type: 'json_object' },
        max_tokens: max_tokens || 6000, // Increased for more detailed analysis
        temperature: temperature || 0.1, // Lower temperature for more precise, consistent analysis
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
      
      console.log('✅ GPT-4o Vision analysis completed successfully');
      
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
    console.error("Error in GPT-4o Vision API handler:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || "An error occurred processing your request",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Stripe Checkout Session Proxy - Pour éviter les problèmes CORS en développement
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  try {
    console.log('🔄 Proxying Stripe checkout session request to Firebase Functions');
    
    const functionsUrl = 'https://us-central1-jobzai.cloudfunctions.net/createCheckoutSession';
    
    const response = await fetch(functionsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Firebase Functions error:', error);
      return res.status(response.status).json({
        success: false,
        message: error || 'Failed to create checkout session',
      });
    }
    
    const data = await response.json();
    console.log('✅ Stripe checkout session created successfully');
    
    res.json(data);
  } catch (error) {
    console.error('❌ Error proxying Stripe request:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create checkout session',
    });
  }
});

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
  console.log(`Stripe Checkout proxy available at http://localhost:${PORT}/api/stripe/create-checkout-session`);
  console.log(`Test endpoint available at http://localhost:${PORT}/api/test`);
  console.log(`Claude API test endpoint available at http://localhost:${PORT}/api/claude/test`);
  if (isProduction) {
    console.log(`Application available at http://localhost:${PORT}`);
  }
}); 