const fetch = require('node-fetch');

async function testClaudeAPI() {
  try {
    // Clé API à tester
    const apiKey = "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";
    
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