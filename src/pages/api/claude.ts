import axios from 'axios';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Define the request and response types
interface ClaudeRequest {
  model: string;
  max_tokens: number;
  temperature: number;
  system: string;
  messages: {
    role: string;
    content: Array<{
      type: string;
      text?: string;
      source?: {
        type: string;
        media_type: string;
        data: string;
      }
    }>
  }[];
}

interface ClaudeResponse {
  status: 'success' | 'error';
  content?: any;
  message?: string;
}

/**
 * API endpoint for interacting with the Claude AI assistant
 * This should be deployed as a serverless function
 */
export default async function handler(
  req: { method: string; body: any },
  res: { status: (code: number) => { json: (data: ClaudeResponse) => void } }
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    // Get API key from Firestore (settings/anthropic)
    const settingsDoc = await getDoc(doc(db, 'settings', 'anthropic'));
    const apiKey = settingsDoc.exists() ? settingsDoc.data().apiKey : null;
    
    if (!apiKey) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Claude API key is missing in Firestore (settings/anthropic)' 
      });
    }
    
    // Forward the entire request body to Claude API
    // The client now formats the request correctly
    const claudeRequest = req.body;
    
    console.log('Sending request to Claude API...');
    
    // Send request to Claude API
    const claudeResponse = await axios.post("https://api.anthropic.com/v1/messages", claudeRequest, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      }
    });
    
    console.log('Claude API response received');
    
    // Extract the response content
    const content = claudeResponse.data;
    
    return res.status(200).json({
      status: 'success',
      content: content
    });
  } catch (error: unknown) {
    console.error('Error calling Claude API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    return res.status(500).json({ 
      status: 'error', 
      message: errorMessage
    });
  }
} 