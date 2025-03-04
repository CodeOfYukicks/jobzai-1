const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001; // Utiliser un port différent pour ne pas entrer en conflit

// Parse JSON bodies
app.use(bodyParser.json({ limit: '50mb' }));

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Simple test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ status: 'success', message: 'Server is running' });
});

// Claude API route (version minimale)
app.post('/claude', async (req, res) => {
  try {
    console.log("Claude API endpoint called");
    
    // Clé API hardcodée pour le test
    const apiKey = "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";
    
    console.log("API Key (first 10 chars):", apiKey.substring(0, 10) + "...");
    
    // Version minimale pour le test - utiliser exactement ce qui fonctionne
    const minimalRequest = {
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Bonjour, ceci est un test via le serveur Express. Veuillez confirmer que vous me recevez."
            }
          ]
        }
      ]
    };
    
    console.log("Sending request to Claude API...");
    
    // Envoi à l'API - configuration identique au script de test qui fonctionne
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(minimalRequest)
    });
    
    console.log(`Claude API response status: ${response.status}`);
    
    const responseText = await response.text();
    console.log(`Response received, length: ${responseText.length}`);
    
    if (response.status !== 200) {
      console.error(`Non-200 response: ${responseText.substring(0, 200)}`);
      return res.status(response.status).json({
        status: 'error',
        message: "Error from Claude API"
      });
    }
    
    // Succès
    const parsedResponse = JSON.parse(responseText);
    console.log("Successfully parsed response");
    
    return res.json({
      status: 'success',
      content: parsedResponse.content
    });
    
  } catch (error) {
    console.error("Error in Claude API handler:", error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Claude API test endpoint available at http://localhost:${PORT}/claude`);
}); 