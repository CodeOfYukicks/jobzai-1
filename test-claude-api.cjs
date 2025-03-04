const fetch = require('node-fetch');

async function testClaudeAPI() {
  try {
    // Obtenir la clé API depuis les variables d'environnement
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error("No API key found in environment variables. Please set ANTHROPIC_API_KEY or VITE_ANTHROPIC_API_KEY.");
      return;
    }
    
    console.log("Testing Claude API with key starting with:", apiKey.substring(0, 15) + "...");
    
    // Requête la plus simple possible
    const minimalRequest = {
      model: "claude-3-haiku-20240307",
      max_tokens: 10,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: "Hello" }]
        }
      ]
    };
    
    // Envoi à l'API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(minimalRequest)
    });
    
    console.log("API Response Status:", response.status);
    
    const responseBody = await response.text();
    console.log("API Response Body:", responseBody);
    
    // Si succès, on obtient une réponse formatée
    if (response.status === 200) {
      const parsedResponse = JSON.parse(responseBody);
      console.log("Claude Response:", parsedResponse.content);
    }
    
  } catch (error) {
    console.error("Error testing Claude API:", error);
  }
}

// Exécuter le test
testClaudeAPI(); 