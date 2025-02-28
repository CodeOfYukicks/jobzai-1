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

// Enable CORS for all routes
app.use(cors());

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

// Claude API proxy endpoint
app.post('/api/claude', async (req, res) => {
  try {
    // Get the API key from environment or request header
    const apiKey = process.env.VITE_ANTHROPIC_API_KEY || req.headers['x-api-key'];
    
    if (!apiKey) {
      console.log('API key is missing');
      return res.status(400).json({ error: 'API key is missing' });
    }

    console.log('Forwarding request to Claude API...');
    console.log('API Key available:', apiKey ? 'Yes (first few chars: ' + apiKey.substring(0, 5) + '...)' : 'No');
    
    // Log the content types being sent
    if (req.body && req.body.messages && req.body.messages[0] && req.body.messages[0].content) {
      console.log('Content types in request:');
      req.body.messages[0].content.forEach((item, idx) => {
        console.log(`  Item ${idx}: type=${item.type}, media_type=${item.media_type || 'N/A'}`);
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    // Log response status and detailed error if not successful
    console.log(`Claude API response status: ${response.status}`);
    if (response.status !== 200) {
      console.error('Claude API error response:', JSON.stringify(data, null, 2));
    }
    
    // Forward the response status and data
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Error proxying request to Claude API:', error);
    res.status(500).json({ error: `Failed to proxy request to Claude API: ${error.message}` });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Claude API proxy available at http://localhost:${PORT}/api/claude`);
  console.log(`Test endpoint available at http://localhost:${PORT}/api/test`);
}); 