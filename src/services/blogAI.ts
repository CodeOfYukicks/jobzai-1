import { getOpenAIInstance } from '../lib/openai';

export interface AIArticleConfig {
    topic: string;
    tone?: string;
    keywords?: string;
    language?: string;
}

export const generateAIArticle = async (config: AIArticleConfig) => {
    const openai = await getOpenAIInstance();

    const prompt = `
    Role: You are an expert content writer for a premium career advice blog called "Cubbbe".
    Task: Write a high-quality, engaging, and SEO-optimized blog article.
    
    Topic: ${config.topic}
    Tone: ${config.tone || 'Professional, encouraging, and authoritative'}
    Language: ${config.language || 'English'}
    ${config.keywords ? `Keywords to include: ${config.keywords}` : ''}

    Structure:
    1. Catchy Title (H1) - Do not label it "Title", just write the title.
    2. Engaging Introduction (Hook the reader).
    3. Several well-structured sections with H2 headings.
    4. Practical tips/takeaways.
    5. A strong conclusion.

    Format: Return ONLY the markdown content. Do not wrap in codes. Start directly with the H1 title line (e.g., "# Title").
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a world-class blog writer known for engaging, high-retention content." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
        });

        return completion.choices[0].message.content || '';
    } catch (error) {
        console.error('Error generating article:', error);
        throw error;
    }
};

export const generateAIImage = async (prompt: string) => {
    const openai = await getOpenAIInstance();

    try {
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: `A premium, modern, minimalist, high-quality editorial illustration for a blog post about: ${prompt}. Style: Abstract, professional, suitable for a career platform like Qonto or Linear. No text in image.`,
            n: 1,
            size: "1024x1024",
            quality: "hd",
            style: "vivid"
        });

        return response.data[0].url;
    } catch (error) {
        console.error('Error generating image:', error);
        throw error;
    }
};
