import axios from 'axios';

// Define the request and response types
interface ClaudeRequest {
  prompt: string;
  type: string;
  cvContent?: string | null;
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
  req: { method: string; body: ClaudeRequest },
  res: { status: (code: number) => { json: (data: ClaudeResponse) => void } }
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  const { prompt, type, cvContent } = req.body;

  if (!prompt || !type) {
    return res.status(400).json({ status: 'error', message: 'Prompt and type are required' });
  }

  try {
    // Get API key from environment variables
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Claude API key is missing in environment' 
      });
    }
    
    // Create message format for Claude API
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt }
        ]
      }
    ];
    
    // Create Claude API request
    const claudeRequest = {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature: 0.2,
      system: "You are an expert career coach helping job candidates prepare for interviews and job applications. Your responses should be practical, specific, and actionable.",
      messages: messages
    };
    
    // Send request to Claude API
    const claudeResponse = await axios.post("https://api.anthropic.com/v1/messages", claudeRequest, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      }
    });
    
    // Extract the response content
    let content = claudeResponse.data.content[0].text;
    
    // For interview-prep type, try to parse as JSON
    if (type === 'interview-prep') {
      try {
        // Extract JSON from the response if it's wrapped in markdown code blocks
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          content = JSON.parse(jsonMatch[1]);
        } else {
          // Try to parse directly
          content = JSON.parse(content);
        }
      } catch (error) {
        console.error('Error parsing interview prep response as JSON:', error);
        // Fall back to text content
      }
    }
    
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