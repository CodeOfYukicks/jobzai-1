import { searchPerplexity, PerplexityMessage } from '../lib/perplexity';

export interface TrendingNewsResult {
    summary: string;
    sources?: string[]; // Perplexity might include citations in text, but if we parse them we can list them.
}

/**
 * Searches for trending news on a specific topic using Perplexity API.
 * Returns a comprehensive summary of recent events and key facts.
 */
export async function findTrendingNews(topic: string, language: 'en' | 'fr' = 'en'): Promise<string> {
    const systemPrompt = language === 'fr'
        ? `Tu es un assistant de recherche expert. Ta tâche est de trouver les informations les plus récentes et pertinentes sur le sujet donné.
       Concentre-toi sur les actualités, les tendances et les faits récents (dernières 24h à 1 semaine).
       IMPORTANT: Pour chaque fait ou chiffre clé, mentionne EXPLICITEMENT le nom de la source (ex: "Selon Le Monde", "D'après TechCrunch").
       Fournis un résumé complet et structuré qui servira de base pour écrire un article de blog détaillé.`
        : `You are an expert research assistant. Your task is to find the most recent and relevant information on the given topic.
       Focus on news, trends, and recent facts (last 24h to 1 week).
       IMPORTANT: For every key fact or figure, EXPLICITLY mention the source name (e.g., "According to NYT", "Per TechCrunch").
       Provide a comprehensive and structured summary that will serve as the basis for writing a detailed blog article.`;

    const userPrompt = language === 'fr'
        ? `Sujet: ${topic}
       Trouve les dernières actualités et tendances sur ce sujet.
       Inclus des chiffres clés, des dates, et des citations si possible.
       Assure-toi de citer le NOM de la source pour chaque information clé.
       Structure la réponse avec des points clés.`
        : `Topic: ${topic}
       Find the latest news and trends on this subject.
       Include key figures, dates, and citations if possible.
       Ensure you cite the SOURCE NAME for each key piece of information.
       Structure the answer with key points.`;

    const messages: PerplexityMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ];

    try {
        const { content, citations } = await searchPerplexity(messages);

        // Append citations to the content so the AI model has access to source URLs
        let formattedContent = content;
        if (citations && citations.length > 0) {
            formattedContent += "\n\n=== SOURCES ===\n" + citations.map((url, i) => `[${i + 1}] ${url}`).join('\n');
        }

        return formattedContent;
    } catch (error) {
        console.error('Failed to find trending news:', error);
        throw error;
    }
}

/**
 * Sketches 10 trending topics based on a general domain.
 */
export async function getTrendingTopics(domain: string = 'Recrutement, Carrière, Marché du travail', language: 'en' | 'fr' = 'fr'): Promise<string[]> {
    const systemPrompt = language === 'fr'
        ? `Tu es un expert en veille stratégique. Ta mission est d'identifier les sujets chauds et tendances actuelles.`
        : `You are a strategic intelligence expert. Your mission is to identify hot topics and current trends.`;

    const userPrompt = language === 'fr'
        ? `Donne-moi une liste de 10 sujets d'actualité très précis et tendances actuellement dans le domaine : "${domain}".
       Format de réponse attendu : Une simple liste numérotée, sans introduction ni conclusion. Juste les 10 sujets.`
        : `Give me a list of 10 very specific and currently trending news topics in the domain: "${domain}".
       Expected response format: A simple numbered list, without introduction or conclusion. Just the 10 topics.`;

    const messages: PerplexityMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ];

    try {
        const { content } = await searchPerplexity(messages);

        // Parse the list
        const topics = content.split('\n')
            .filter(line => /^\d+\./.test(line.trim())) // Keep only numbered lines
            .map(line => line.replace(/^\d+\.\s*/, '').trim()) // Remove numbers
            .filter(line => line.length > 5) // Remove too short lines
            .slice(0, 10); // Keep max 10

        return topics;
    } catch (error) {
        console.error('Failed to get trending topics:', error);
        return [];
    }
}
