import { onRequest } from "firebase-functions/v2/https";
import { getOpenAIClient } from './utils/openai';
import * as admin from 'firebase-admin';

// Get Anthropic API key from Firestore
const getAnthropicApiKey = async (): Promise<string | null> => {
    try {
        const settingsDoc = await admin.firestore().collection('settings').doc('anthropic').get();
        if (settingsDoc.exists) {
            const data = settingsDoc.data();
            return data?.apiKey || null;
        }
    } catch (error) {
        console.error('Failed to get Anthropic API key:', error);
    }
    return process.env.ANTHROPIC_API_KEY || null;
};

export const assistant = onRequest({
    region: 'us-central1',
    maxInstances: 10,
    invoker: 'public',
}, async (req, res) => {
    // Set CORS headers explicitly
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const {
            message,
            aiProvider = 'openai', // Default to OpenAI
            conversationHistory,
            pageContext,
            selectedContextItems,
            userContext,
            userId,
            pageData,
            personaConfig,
            personaPrompt,
            inlineEditMode,
            selectionMode,
            selectedText,
            whiteboardMode,
            whiteboardIntent
        } = req.body;

        console.log('🤖 Assistant Request:', {
            userId,
            provider: aiProvider,
            mode: inlineEditMode ? 'inline-edit' : whiteboardMode ? 'whiteboard' : 'chat',
            messageLength: message?.length
        });

        // Construct system prompt based on mode
        let systemPrompt = `You are an advanced AI assistant for Cubbbe, a career acceleration platform.
Your goal is to help users with their job search, CV optimization, interview preparation, and career development.
You have access to the user's profile and context.

You can also trigger interactive tours to guide the user through specific features.
If the user asks how to do something that corresponds to one of the following tours, append the tour trigger \`[[START_TOUR:tour-id]]\` to your response.

Available Tours:
- Create a CV: \`create-cv\`
- Analyze CV: \`analyze-cv\`
- Track Applications: \`track-applications\`
- Prepare for Interview: \`prepare-interview\`
- Optimize CV: \`optimize-cv\`
- Compare CVs: \`compare-cvs\`
- Search Jobs: \`search-jobs\`
- Create Campaign: \`create-campaign\`
- Use Recommendations: \`use-recommendations\`
- Understand Dashboard: \`understand-dashboard\`

Example: "To create a CV, you can use our Resume Builder. [[START_TOUR:create-cv]]"`;

        if (personaPrompt) {
            systemPrompt += `\n\n${personaPrompt}`;
        }

        if (inlineEditMode) {
            systemPrompt += `\n\nYou are acting as an intelligent writing assistant.
The user wants you to edit or improve a specific piece of text or note.
${selectionMode ? `The user has selected the following text to modify: "${selectedText}"` : 'The user wants to modify the current note.'}
Return ONLY the modified text. Do not include explanations unless specifically asked.
Maintain the original formatting (Markdown) unless asked to change it.`;
        } else if (whiteboardMode) {
            systemPrompt += `\n\nYou are a visual thinking assistant helping the user create content on a whiteboard.
The user wants to create a ${whiteboardIntent?.type || 'visual structure'}.
Return a JSON response that describes the structure to create.
For mind maps, return a root node with branches.
For sticky notes, return a list of notes with text and colors.
For flow diagrams, return nodes and connections.`;
        } else {
            // General chat mode
            if (userContext) {
                systemPrompt += `\n\nUser Context:
Name: ${userContext.firstName} ${userContext.lastName || ''}
Email: ${userContext.email || 'N/A'}
Job Title: ${userContext.currentJobTitle || 'N/A'}
Company: ${userContext.currentCompany || 'N/A'}
Location: ${userContext.location || 'N/A'}
Industry: ${userContext.industry || 'N/A'}
Years of Experience: ${userContext.yearsOfExperience || 'N/A'}
Skills: ${userContext.skills?.join(', ') || 'N/A'}

Target Position: ${userContext.targetPosition || 'N/A'}
Target Sectors: ${userContext.targetSectors?.join(', ') || 'N/A'}

Professional Summary:
${userContext.professionalSummary || 'N/A'}

Work Experience:
${userContext.workExperience?.map((exp: any) => `- ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})\n  ${exp.description || ''}`).join('\n') || 'N/A'}

Education:
${userContext.education?.map((edu: any) => `- ${edu.degree} in ${edu.field} at ${edu.institution} (${edu.year || 'N/A'})`).join('\n') || 'N/A'}

Languages: ${userContext.languages?.map((l: any) => `${l.language} (${l.proficiency})`).join(', ') || 'N/A'}
Certifications: ${userContext.certifications?.map((c: any) => `${c.name} (${c.issuer})`).join(', ') || 'N/A'}

CV Text (Full Resume):
${userContext.cvText ? userContext.cvText.substring(0, 3000) + '...' : 'N/A'}
`;
            }

            if (pageContext) {
                systemPrompt += `\n\nCurrent Page: ${pageContext.pageName} (${pageContext.pathname})
Page Description: ${pageContext.pageDescription || ''}`;
            }

            if (pageData && Object.keys(pageData).length > 0) {
                systemPrompt += `\n\nPage Data (Content visible on screen):
${JSON.stringify(pageData, null, 2)}`;
            }

            if (selectedContextItems && selectedContextItems.length > 0) {
                systemPrompt += `\n\nSelected Context Items:
${selectedContextItems.map((item: any) => `- [${item.type}] ${item.title}: ${JSON.stringify(item.data || {}).substring(0, 200)}...`).join('\n')}`;
            }
        }

        // Set up streaming response headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // Flush headers immediately
        if (res.flushHeaders) {
            res.flushHeaders();
        }

        // Send padding to bypass buffering (2KB of spaces)
        res.write(':' + ' '.repeat(2048) + '\n\n');

        // Route to the appropriate provider
        if (aiProvider === 'anthropic') {
            // Use Claude/Anthropic
            console.log('🤖 Using Anthropic Claude Sonnet 4.5');

            const anthropicApiKey = await getAnthropicApiKey();
            if (!anthropicApiKey) {
                throw new Error('Anthropic API key not configured');
            }

            // Format messages for Anthropic
            const anthropicMessages = [
                ...(conversationHistory || []).map((msg: any) => ({
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content
                })),
                { role: 'user', content: message }
            ];

            // Call Anthropic API with streaming
            console.log('🤖 Calling Anthropic with model: claude-sonnet-4-5-20250929');
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': anthropicApiKey,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-5-20250929', // Claude Sonnet 4.5
                    system: systemPrompt,
                    messages: anthropicMessages,
                    max_tokens: 4096,
                    temperature: 0.7,
                    stream: true
                })
            });

            console.log('🤖 Anthropic response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Anthropic API error:', errorText);
                throw new Error(`Anthropic API error: ${errorText}`);
            }

            // Handle streaming from Anthropic
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;

                            try {
                                const parsed = JSON.parse(data);
                                // Anthropic sends content_block_delta events
                                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                                    res.write(`data: ${JSON.stringify({ content: parsed.delta.text })}\n\n`);
                                    if ((res as any).flush) {
                                        (res as any).flush();
                                    }
                                }
                            } catch (e) {
                                // Ignore JSON parse errors for non-data lines
                            }
                        }
                    }
                }
            }

        } else {
            // Use OpenAI (default) - GPT 5.2
            console.log('🤖 Using OpenAI GPT-5.2');

            const openai = await getOpenAIClient();

            // Prepare messages for OpenAI
            const messages = [
                { role: 'system', content: systemPrompt },
                ...(conversationHistory || []).map((msg: any) => ({ role: msg.role, content: msg.content })),
                { role: 'user', content: message }
            ];

            const stream = await openai.chat.completions.create({
                model: 'gpt-5.2', // GPT 5.2
                messages: messages as any,
                stream: true,
                temperature: 0.7,
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                    // Flush after each chunk if possible
                    if ((res as any).flush) {
                        (res as any).flush();
                    }
                }
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error: any) {
        console.error('❌ Error in assistant function:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message || 'Internal server error' });
        } else {
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    }
});

