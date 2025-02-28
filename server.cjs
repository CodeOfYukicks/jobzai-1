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

// Enable CORS for all routes with explicit configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173', 'http://127.0.0.1:5173', 'http://127.0.0.1:4173'],
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

// Simple test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ status: 'success', message: 'Server is running' });
});

// Simple health check endpoint for Claude API access
app.get('/api/claude/test', (req, res) => {
  console.log('Claude API test endpoint called');
  
  // Check for API key
  const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      status: 'error', 
      message: 'Anthropic API key is missing in server environment' 
    });
  }
  
  res.json({ 
    status: 'success', 
    message: 'Claude API endpoint is accessible', 
    apiKeyPresent: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0
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
    console.log("Claude API endpoint called");
    
    // Get API key and validate
    const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error("Claude API key is missing in server environment");
      return res.status(500).json({
        status: 'error',
        message: "Claude API key is missing in server environment. Please check .env file."
      });
    }
    
    console.log(`API Key available: ${apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No'}`);
    
    // Extract request data
    const { model, max_tokens, temperature, system, messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid request format: messages array missing or invalid");
      return res.status(400).json({
        status: 'error',
        message: "Invalid request format: messages array is required"
      });
    }
    
    console.log("Request validation passed, preparing Claude API call");
    
    // Create modified messages array with corrected format
    const modifiedMessages = messages.map(msg => {
      if (msg.content && Array.isArray(msg.content)) {
        // Fix the format for text content items
        const modifiedContent = msg.content.map(contentItem => {
          if (contentItem.type === 'text') {
            // The API now expects { type: 'text', text: "your text" } structure
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
    
    // Create Claude API request
    const claudeRequest = {
      model: model || "claude-3-5-sonnet-20241022",
      max_tokens: max_tokens || 4000,
      temperature: temperature || 0.2,
      system: system || "You are a helpful assistant",
      messages: modifiedMessages
    };
    
    console.log("Sending request to Claude API with model:", claudeRequest.model);
    console.log("First message content format:", JSON.stringify(claudeRequest.messages[0].content[0], null, 2));
    
    // Send request to Claude API
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
    
    // Handle response
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
      
      // Return the full Claude response
      return res.json({
        status: 'success',
        content: parsedResponse.content
      });
      
    } catch (parseError) {
      console.error("Error parsing Claude API response:", parseError);
      return res.status(500).json({
        status: 'error',
        message: "Failed to parse Claude API response",
        rawResponse: responseText.substring(0, 500) + "..." // First 500 chars for debugging
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Claude API proxy available at http://localhost:${PORT}/api/claude`);
  console.log(`Test endpoint available at http://localhost:${PORT}/api/test`);
  console.log(`Claude API test endpoint available at http://localhost:${PORT}/api/claude/test`);
}); 