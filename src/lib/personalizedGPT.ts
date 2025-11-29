import OpenAI from 'openai';
import { getOpenAIInstance } from './openai';
import { UserData } from '../types';

interface ConversationContext {
  userId: string;
  userProfile: UserData;
  recentInteractions: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }[];
}

// In-memory cache for active contexts (in production, use Redis/similar)
const contextCache = new Map<string, ConversationContext>();

// Maximum context window (last N interactions)
const MAX_CONTEXT_WINDOW = 10;

export class PersonalizedGPT {
  private userId: string;
  private openai: OpenAI | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  private async initialize() {
    if (!this.openai) {
      this.openai = await getOpenAIInstance();
    }
  }

  private getContext(): ConversationContext | null {
    return contextCache.get(this.userId) || null;
  }

  private updateContext(interaction: { role: 'user' | 'assistant'; content: string }) {
    const context = this.getContext();
    if (!context) return;

    context.recentInteractions.push({
      ...interaction,
      timestamp: Date.now()
    });

    // Maintain context window size
    if (context.recentInteractions.length > MAX_CONTEXT_WINDOW) {
      context.recentInteractions = context.recentInteractions.slice(-MAX_CONTEXT_WINDOW);
    }

    contextCache.set(this.userId, context);
  }

  async initializeUserContext(userData: UserData) {
    const context: ConversationContext = {
      userId: this.userId,
      userProfile: userData,
      recentInteractions: []
    };

    contextCache.set(this.userId, context);
  }

  private buildSystemPrompt(): string {
    const context = this.getContext();
    if (!context) return '';

    const { userProfile } = context;

    return `You are a personalized career assistant for a job seeker with the following profile:
    - Industry: ${userProfile.industry || 'Not specified'}
    - Job Preferences: ${userProfile.jobPreferences || 'Not specified'}
    - Location: ${userProfile.location || 'Not specified'}
    - Contract Type: ${userProfile.contractType || 'Not specified'}
    - Gender: ${userProfile.gender || 'Not specified'}
    
    Tailor your responses based on this profile and our conversation history.
    Be professional yet personable, and provide specific, actionable advice.`;
  }

  private buildConversationHistory() {
    const context = this.getContext();
    if (!context) return [];

    return context.recentInteractions.map(({ role, content }) => ({
      role,
      content
    }));
  }

  async generateEmailTemplate(options: {
    tone: string;
    purpose: string;
    specificPoints?: string;
  }) {
    await this.initialize();
    if (!this.openai) throw new Error('OpenAI not initialized');

    const context = this.getContext();
    if (!context) throw new Error('User context not found');

    const prompt = `Create a personalized email template for a ${context.userProfile.jobPreferences} 
    professional in the ${context.userProfile.industry} industry.
    
    Tone: ${options.tone}
    Purpose: ${options.purpose}
    ${options.specificPoints ? `Specific Points: ${options.specificPoints}` : ''}
    
    Use the following merge fields:
    - (First name)
    - (Last name)
    - (Company)
    - (Job position)`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        { role: "system", content: this.buildSystemPrompt() },
        ...this.buildConversationHistory(),
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      reasoning_effort: "medium" // GPT-5.1 feature for personalized emails
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from GPT-5.1');

    this.updateContext({
      role: 'user',
      content: prompt
    });

    this.updateContext({
      role: 'assistant',
      content: response
    });

    return response;
  }

  async getPersonalizedRecommendations(category: string) {
    await this.initialize();
    if (!this.openai) throw new Error('OpenAI not initialized');

    const prompt = `Based on the user's profile and job search history, provide personalized ${category} recommendations. 
    Focus on actionable insights that can improve their job search success.`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        { role: "system", content: this.buildSystemPrompt() },
        ...this.buildConversationHistory(),
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      reasoning_effort: "high" // GPT-5.1 feature for personalized recommendations
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from GPT-5.1');

    this.updateContext({
      role: 'user',
      content: prompt
    });

    this.updateContext({
      role: 'assistant',
      content: response
    });

    return response;
  }

  async chat(message: string) {
    await this.initialize();
    if (!this.openai) throw new Error('OpenAI not initialized');

    const completion = await this.openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        { role: "system", content: this.buildSystemPrompt() },
        ...this.buildConversationHistory(),
        { role: "user", content: message }
      ],
      temperature: 0.7,
      reasoning_effort: "medium" // GPT-5.1 feature for conversational chat
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from GPT-5.1');

    this.updateContext({
      role: 'user',
      content: message
    });

    this.updateContext({
      role: 'assistant',
      content: response
    });

    return response;
  }
}
