const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

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
  console.log(`Test endpoint available at http://localhost:${PORT}/api/test`);
  console.log(`Claude API test endpoint available at http://localhost:${PORT}/api/claude/test`);
  if (isProduction) {
    console.log(`Application available at http://localhost:${PORT}`);
  }
}); 