const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function testClaudePDFAnalysis() {
  try {
    // Clé API à tester
    const apiKey = "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";
    
    console.log("Testing Claude API with key starting with:", apiKey.substring(0, 15) + "...");
    
    // Version simplifiée sans PDF pour le test
    console.log("Utilisation d'une version simplifiée sans PDF pour le test");
    
    // Construire un prompt similaire à celui de l'application
    const prompt = `
# Test de l'API Claude sans PDF

Ceci est un test simple pour vérifier si l'API Claude fonctionne correctement.
S'il vous plaît, confirmez que vous recevez ce message et répondez par un message court.
`;
    
    // Préparation de la requête Claude API
    const requestData = {
      model: "claude-3-5-sonnet-20241022", // Modèle compatible avec les PDFs
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt }
          ]
        }
      ]
    };
    
    console.log("Sending request to Claude API (without PDF)...");
    
    // Envoi à l'API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(requestData)
    });
    
    console.log("API Response Status:", response.status);
    
    const responseText = await response.text();
    console.log("API Response (first 500 chars):", responseText.substring(0, 500));
    
    // Si succès, on obtient une réponse formatée
    if (response.status === 200) {
      const parsedResponse = JSON.parse(responseText);
      console.log("\nClaude Response Content:");
      console.log(parsedResponse.content.map(item => item.text).join('\n'));
    } else {
      console.error("Error response from Claude API");
    }
    
  } catch (error) {
    console.error("Error testing Claude API:", error);
  }
}

// Exécuter le test
testClaudePDFAnalysis(); 