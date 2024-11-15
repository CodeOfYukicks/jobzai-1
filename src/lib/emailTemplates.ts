import OpenAI from 'openai';
import { getOpenAIInstance } from './openai';

interface GeneratedTemplate {
  name: string;
  subject: string;
  content: string;
  tags: string[];
}

interface GenerateOptions {
  tone: 'professional' | 'friendly' | 'enthusiastic';
  specificPoints: string;
  background: string;
  language: string;
}

const LANGUAGE_PROMPTS = {
  en: {
    system: "You are an expert in professional communication and LinkedIn networking, skilled at creating effective follow-up messages. Use only these merge fields: (First name), (Last name), (Company), (Job position), and (Full name).",
    subject: "Following up on our connection"
  },
  fr: {
    system: "Vous êtes un expert en communication professionnelle et réseautage LinkedIn, spécialisé dans la création de messages de suivi efficaces. Utilisez uniquement ces champs de fusion : (First name), (Last name), (Company), (Job position), et (Full name).",
    subject: "Suite à notre connexion"
  },
  es: {
    system: "Eres un experto en comunicación profesional y networking en LinkedIn, especializado en crear mensajes de seguimiento efectivos. Usa solo estos campos de combinación: (First name), (Last name), (Company), (Job position), y (Full name).",
    subject: "Seguimiento a nuestra conexión"
  },
  it: {
    system: "Sei un esperto in comunicazione professionale e networking su LinkedIn, specializzato nella creazione di messaggi di follow-up efficaci. Usa solo questi campi di unione: (First name), (Last name), (Company), (Job position), e (Full name).",
    subject: "In seguito alla nostra connessione"
  },
  ru: {
    system: "Вы эксперт в профессиональной коммуникации и нетворкинге в LinkedIn. Используйте только эти поля слияния: (First name), (Last name), (Company), (Job position), и (Full name).",
    subject: "По поводу нашего подключения"
  },
  zh: {
    system: "您是LinkedIn专业沟通和社交网络专家。仅使用以下合并字段：(First name), (Last name), (Company), (Job position), 和 (Full name)。",
    subject: "关于我们的连接"
  }
};

class TemplateGenerationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'TemplateGenerationError';
  }
}

function extractSection(content: string, marker: string): string | null {
  const regex = new RegExp(`${marker}\\s*([\\s\\S]*?)(?=\\b(?:NAME|SUBJECT|CONTENT|TAGS)\\b|$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

function validateTemplate(template: Partial<GeneratedTemplate>): asserts template is GeneratedTemplate {
  const errors: string[] = [];

  if (!template.name) errors.push('Template name is missing');
  if (!template.subject) errors.push('Template subject is missing');
  if (!template.content) errors.push('Template content is missing');
  if (!template.tags || !Array.isArray(template.tags)) errors.push('Template tags are invalid');
  if (template.tags?.length === 0) errors.push('Template must have at least one tag');

  if (errors.length > 0) {
    throw new TemplateGenerationError('Template validation failed', { errors });
  }
}

function processTags(tags: string[]): string[] {
  // Filter out duplicates and limit to 4 tags
  const uniqueTags = Array.from(new Set(tags));
  return uniqueTags.slice(0, 4).map(tag => tag.toLowerCase());
}

export async function generateEmailTemplate(options: GenerateOptions): Promise<GeneratedTemplate> {
  let openai: OpenAI;

  try {
    openai = await getOpenAIInstance();
  } catch (error) {
    console.error('Failed to initialize OpenAI:', error);
    throw new TemplateGenerationError(
      'Unable to connect to AI service. Please try again later.',
      { error }
    );
  }

  const languagePrompt = LANGUAGE_PROMPTS[options.language] || LANGUAGE_PROMPTS.en;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `${languagePrompt.system} 
          You must format your response exactly as shown below, with each section clearly marked:

          NAME
          [Template name]
          SUBJECT
          [Email subject]
          CONTENT
          [Email content]
          TAGS
          [Provide exactly 4 relevant, comma-separated tags]`
        },
        {
          role: "user",
          content: `Create a LinkedIn follow-up message template with:
          
          Tone: ${options.tone}
          Language: ${options.language}
          ${options.specificPoints ? `Specific Points: ${options.specificPoints}` : ''}
          ${options.background ? `Background: ${options.background}` : ''}

          The template should:
          1. Use appropriate merge fields for personalization
          2. Express genuine interest in potential collaboration
          3. Highlight relevant shared interests or background
          4. Include a clear but soft call to action
          5. Maintain professional courtesy while being personable

          Important: Include exactly 4 relevant tags that describe the template's tone, purpose, and context.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new TemplateGenerationError('No template content generated');
    }

    // Extract each section
    const rawTags = extractSection(content, 'TAGS')?.split(',').map(tag => tag.trim()).filter(Boolean) || [];
    
    const template: Partial<GeneratedTemplate> = {
      name: extractSection(content, 'NAME'),
      subject: extractSection(content, 'SUBJECT'),
      content: extractSection(content, 'CONTENT'),
      tags: processTags(rawTags)
    };

    // Validate the template
    validateTemplate(template);

    return template;
  } catch (error) {
    console.error('Error generating template:', error);

    if (error instanceof TemplateGenerationError) {
      throw error;
    }

    if (error.status === 429) {
      throw new TemplateGenerationError('Rate limit exceeded. Please try again in a few moments.');
    }

    throw new TemplateGenerationError(
      'Failed to generate template. Please try again.',
      { error }
    );
  }
}