const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const serverlessFunctions = require('./lib/index.js');

// Load environment variables
dotenv.config();

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

// Exporter l'app Express en tant que fonction Firebase
exports.api = functions.https.onRequest(app);
exports.startCampaign = serverlessFunctions.startCampaign;
exports.updateCampaignEmails = serverlessFunctions.updateCampaignEmails;
exports.analyzeCVVision = serverlessFunctions.analyzeCVVision;
exports.syncUserToHubSpot = serverlessFunctions.syncUserToHubSpot;
exports.sendHubSpotEventFunction = serverlessFunctions.sendHubSpotEventFunction;
exports.syncUserToBrevo = serverlessFunctions.syncUserToBrevo;
