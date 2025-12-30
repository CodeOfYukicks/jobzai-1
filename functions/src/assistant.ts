import { onRequest } from "firebase-functions/v2/https";
import { getOpenAIClient } from './utils/openai';

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
            aiProvider,
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

        const openai = await getOpenAIClient();

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
${userContext.education?.map((edu: any) => `- ${edu.degree} in ${edu.field} at ${edu.school} (${edu.startDate} - ${edu.endDate || 'Present'})`).join('\n') || 'N/A'}

Languages: ${userContext.languages?.map((l: any) => `${l.language} (${l.proficiency})`).join(', ') || 'N/A'}
Certifications: ${userContext.certifications?.map((c: any) => `${c.name} (${c.issuer})`).join(', ') || 'N/A'}
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

        // Prepare messages
        const messages = [
            { role: 'system', content: systemPrompt },
            ...(conversationHistory || []).map((msg: any) => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: message }
        ];

        // Set up streaming response
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

        const stream = await openai.chat.completions.create({
            model: 'gpt-4o', // Use a capable model
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
