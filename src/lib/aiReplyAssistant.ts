import { getOpenAIInstance } from './openai';
import { OutreachMessage } from '../types/job';

export interface ContactContext {
  contactName: string;
  contactRole?: string;
  companyName: string;
  relationshipGoal?: string;
  warmthLevel?: string;
}

export interface UserContext {
  firstName?: string;
  lastName?: string;
  currentPosition?: string;
}

export interface SmartReply {
  id: string;
  text: string;
  tone: 'friendly' | 'professional' | 'casual';
  intent: 'thank' | 'follow_up' | 'schedule' | 'question' | 'general';
}

export interface GenerateRepliesOptions {
  conversationHistory: OutreachMessage[];
  contactContext: ContactContext;
  userContext?: UserContext;
  language?: 'en' | 'fr';
}

export interface DraftReplyOptions extends GenerateRepliesOptions {
  userIntent?: string;
  tone?: 'friendly' | 'professional' | 'casual' | 'bold';
}

/**
 * Formats conversation history for AI context
 */
function formatConversationHistory(messages: OutreachMessage[], contactName: string): string {
  if (!messages || messages.length === 0) {
    return 'No previous messages in conversation.';
  }

  return messages
    .slice(-10) // Last 10 messages for context
    .map((msg) => {
      const sender = msg.type === 'sent' ? 'You' : contactName;
      const date = new Date(msg.sentAt).toLocaleDateString();
      return `[${date}] ${sender}: ${msg.content}`;
    })
    .join('\n\n');
}

/**
 * Gets the last received message to understand what to reply to
 */
function getLastReceivedMessage(messages: OutreachMessage[]): OutreachMessage | null {
  if (!messages || messages.length === 0) return null;
  
  // Find the last received message
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].type === 'received') {
      return messages[i];
    }
  }
  return null;
}

/**
 * Generates 2-3 smart reply suggestions based on conversation context
 */
export async function generateSmartReplies(
  options: GenerateRepliesOptions
): Promise<SmartReply[]> {
  const { conversationHistory, contactContext, userContext, language = 'en' } = options;
  
  const openai = await getOpenAIInstance();
  const conversationText = formatConversationHistory(conversationHistory, contactContext.contactName);
  const lastMessage = getLastReceivedMessage(conversationHistory);

  const systemPrompt = language === 'fr' 
    ? `Tu es un assistant qui génère des suggestions de réponses courtes et naturelles pour des conversations professionnelles de networking.

RÈGLES CRITIQUES:
1. Génère exactement 3 suggestions de réponses courtes (1-2 phrases max)
2. Chaque réponse doit être naturelle et humaine, PAS robotique
3. Varie les tons: une amicale, une professionnelle, une décontractée
4. Les réponses doivent être appropriées au contexte de la conversation
5. N'utilise JAMAIS de formules génériques comme "J'espère que vous allez bien"
6. Sois direct et concis

FORMAT DE RÉPONSE (JSON strict):
[
  {"text": "réponse 1", "tone": "friendly", "intent": "type"},
  {"text": "réponse 2", "tone": "professional", "intent": "type"},
  {"text": "réponse 3", "tone": "casual", "intent": "type"}
]

Les intents possibles: thank, follow_up, schedule, question, general`
    : `You are an assistant that generates short, natural reply suggestions for professional networking conversations.

CRITICAL RULES:
1. Generate exactly 3 short reply suggestions (1-2 sentences max each)
2. Each reply must be natural and human, NOT robotic
3. Vary the tones: one friendly, one professional, one casual
4. Replies must be appropriate to the conversation context
5. NEVER use generic phrases like "I hope this finds you well"
6. Be direct and concise

RESPONSE FORMAT (strict JSON):
[
  {"text": "reply 1", "tone": "friendly", "intent": "type"},
  {"text": "reply 2", "tone": "professional", "intent": "type"},
  {"text": "reply 3", "tone": "casual", "intent": "type"}
]

Possible intents: thank, follow_up, schedule, question, general`;

  const userPrompt = `CONVERSATION CONTEXT:
Contact: ${contactContext.contactName}${contactContext.contactRole ? ` (${contactContext.contactRole})` : ''} at ${contactContext.companyName}
${contactContext.relationshipGoal ? `Goal: ${contactContext.relationshipGoal}` : ''}
${userContext?.firstName ? `Your name: ${userContext.firstName}` : ''}

CONVERSATION HISTORY:
${conversationText}

${lastMessage ? `LAST MESSAGE TO REPLY TO:
"${lastMessage.content}"` : 'No message to reply to yet - suggest opening messages.'}

Generate 3 smart reply suggestions as JSON array.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated');
    }

    // Parse the JSON response
    const parsed = JSON.parse(content);
    const replies = Array.isArray(parsed) ? parsed : parsed.replies || parsed.suggestions || [];

    return replies.slice(0, 3).map((reply: any, index: number) => ({
      id: `smart-reply-${Date.now()}-${index}`,
      text: reply.text || reply.message || '',
      tone: reply.tone || 'professional',
      intent: reply.intent || 'general',
    }));
  } catch (error) {
    console.error('Error generating smart replies:', error);
    // Return fallback suggestions
    return [
      {
        id: `smart-reply-fallback-1`,
        text: language === 'fr' ? 'Merci pour votre réponse !' : 'Thanks for getting back to me!',
        tone: 'friendly',
        intent: 'thank',
      },
      {
        id: `smart-reply-fallback-2`,
        text: language === 'fr' 
          ? 'Ce serait super d\'échanger davantage. Vous êtes disponible cette semaine ?' 
          : 'Would love to chat more. Are you free this week?',
        tone: 'casual',
        intent: 'schedule',
      },
      {
        id: `smart-reply-fallback-3`,
        text: language === 'fr'
          ? 'Je serais ravi d\'en discuter plus en détail.'
          : 'I\'d be happy to discuss this further.',
        tone: 'professional',
        intent: 'follow_up',
      },
    ];
  }
}

/**
 * Generates a full draft reply based on user intent and conversation context
 */
export async function generateDraftReply(
  options: DraftReplyOptions
): Promise<string> {
  const { 
    conversationHistory, 
    contactContext, 
    userContext, 
    userIntent,
    tone = 'professional',
    language = 'en' 
  } = options;

  const openai = await getOpenAIInstance();
  const conversationText = formatConversationHistory(conversationHistory, contactContext.contactName);
  const lastMessage = getLastReceivedMessage(conversationHistory);

  const toneInstructions = {
    friendly: language === 'fr' 
      ? 'Ton amical et chaleureux, comme un message à un collègue qu\'on apprécie.'
      : 'Friendly and warm tone, like messaging a colleague you appreciate.',
    professional: language === 'fr'
      ? 'Ton professionnel mais pas froid, respectueux et efficace.'
      : 'Professional but not cold, respectful and efficient.',
    casual: language === 'fr'
      ? 'Ton décontracté et naturel, comme un message texte à un contact.'
      : 'Casual and natural tone, like texting a contact.',
    bold: language === 'fr'
      ? 'Ton direct et confiant, va droit au but.'
      : 'Direct and confident tone, gets straight to the point.',
  };

  const systemPrompt = language === 'fr'
    ? `Tu es un assistant de rédaction expert pour les emails professionnels de networking.

OBJECTIF: Rédiger une réponse appropriée au contexte de la conversation.

RÈGLES:
1. La réponse doit sembler écrite par un HUMAIN
2. Maximum 4-6 lignes de contenu
3. JAMAIS de phrases génériques ("J'espère que vous allez bien", etc.)
4. Réponds directement au contenu du dernier message reçu
5. Maintiens le même niveau de formalité que la conversation

TON: ${toneInstructions[tone]}

${userIntent ? `INTENTION DE L'UTILISATEUR: ${userIntent}` : ''}

Génère UNIQUEMENT le texte de la réponse, sans explications.`
    : `You are an expert writing assistant for professional networking emails.

GOAL: Write an appropriate reply based on the conversation context.

RULES:
1. The reply must feel written by a HUMAN
2. Maximum 4-6 lines of content
3. NEVER use generic phrases ("I hope you're doing well", etc.)
4. Directly respond to the content of the last received message
5. Maintain the same level of formality as the conversation

TONE: ${toneInstructions[tone]}

${userIntent ? `USER INTENT: ${userIntent}` : ''}

Generate ONLY the reply text, no explanations.`;

  const userPrompt = `CONTEXT:
Contact: ${contactContext.contactName}${contactContext.contactRole ? ` (${contactContext.contactRole})` : ''} at ${contactContext.companyName}
${contactContext.relationshipGoal ? `Relationship goal: ${contactContext.relationshipGoal}` : ''}
${userContext?.firstName ? `Your name: ${userContext.firstName}` : ''}
${userContext?.currentPosition ? `Your role: ${userContext.currentPosition}` : ''}

CONVERSATION HISTORY:
${conversationText}

${lastMessage ? `REPLYING TO:
"${lastMessage.content}"` : 'Starting a new conversation.'}

Write the reply:`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.75,
      max_tokens: 400,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated');
    }

    // Clean up the response
    return content
      .trim()
      .replace(/^["']|["']$/g, '') // Remove quotes if wrapped
      .replace(/^(Subject|Objet):.+\n/i, ''); // Remove subject line if present
  } catch (error) {
    console.error('Error generating draft reply:', error);
    throw error;
  }
}

/**
 * Quick action intents for generating specific types of replies
 */
export const quickActionIntents = {
  thank: {
    en: 'Thank them for their response and express appreciation',
    fr: 'Les remercier pour leur réponse et exprimer sa gratitude',
  },
  follow_up: {
    en: 'Follow up on the previous discussion and move things forward',
    fr: 'Faire un suivi de la discussion précédente et faire avancer les choses',
  },
  schedule: {
    en: 'Suggest scheduling a meeting or call',
    fr: 'Proposer de planifier une réunion ou un appel',
  },
  question: {
    en: 'Ask a relevant question about their work or company',
    fr: 'Poser une question pertinente sur leur travail ou leur entreprise',
  },
  share_value: {
    en: 'Share something valuable or relevant to their interests',
    fr: 'Partager quelque chose de valuable ou pertinent pour leurs intérêts',
  },
};

export type QuickActionType = keyof typeof quickActionIntents;

