import { searchPerplexity } from '../lib/perplexity';
import { SocialPlatform } from '../types/socialPost';

// ============================================
// TYPES
// ============================================

export interface TopicSuggestion {
    title: string;
    context: string;
    whyNow: string;
    suggestedPlatforms: SocialPlatform[];
    angle: string;
}

// ============================================
// SUGGEST TOPICS
// ============================================

export async function suggestTopics(
    language: 'fr' | 'en' = 'fr',
    customTopic?: string,
    location: 'Global' | 'US' | 'France' | string = 'Global'
): Promise<TopicSuggestion[]> {
    const today = new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    let scopeInstruction = '';

    // Add location context
    const locationContext = location === 'Global'
        ? (language === 'fr' ? "Monde entier" : "Global")
        : location;

    if (customTopic) {
        scopeInstruction = language === 'fr'
            ? `FOCUS SPÉCIFIQUE OBLIGATOIRE : Tu dois trouver des actualités et tendances UNIQUEMENT liées à : "${customTopic}" dans la zone géographique : ${locationContext}.`
            : `MANDATORY SPECIFIC FOCUS: You must find news and trends ONLY related to: "${customTopic}" in the region: ${locationContext}.`;
    } else {
        scopeInstruction = language === 'fr'
            ? `Domaines à couvrir (Large) : Marché de l'emploi, Recrutement, Tech RH, Management, IA au travail. Zone géographique : ${locationContext}.`
            : `Areas to cover (Broad): Job Market, Recruiting, HR Tech, Management, AI at work. Region: ${locationContext}.`;
    }

    const prompt = language === 'fr'
        ? `Nous sommes le ${today}. Tu es un Analyste de Tendances Senior (Trend Spotter) pour un média business premium.

OBJECTIF : Identifier 6 opportunités de contenus "High-Potential" pour des posts LinkedIn/Twitter.
${scopeInstruction}

CRITÈRES DE SÉLECTION "PREMIUM" :
1. FRAÎCHEUR : Idéalement < 48h. Si > 48h, ça doit être une tendance de fond massive.
2. POTENTIEL VIRAL : Sujets clivants, contre-intuitifs, ou données chocs. Pas de "conseils tièdes".
3. ANGLE EXPERT : On ne veut pas l'info brute, on veut l'angle qui fait réfléchir les décideurs.

Pour chaque suggestion, structure la réponse ainsi :
- title: Une "Title Idea" accrocheuse (style newsletter business)
- context: Le fait précis + Source (nom du média/étude) + Date
- whyNow: Pourquoi c'est le moment d'en parler (Urgence/Pertinence)
- suggestedPlatforms: ["linkedin", "twitter", "reddit"] selon le format
- angle: L'angle d'attaque (ex: "Contrarian Take", "Data Breakdown", "Future Signal", "Hot Take")

RÈGLES :
- Sources REELLES obligatoires.
- Diversité des formats.

Réponds en JSON strict :
{ "suggestions": [{ "title": "...", "context": "...", "whyNow": "...", "suggestedPlatforms": [...], "angle": "..." }] }`

        : `Today is ${today}. You are a Senior Trend Spotter for a premium business media outlet.

OBJECTIF: Identify 6 "High-Potential" content opportunities for LinkedIn/Twitter posts.
${scopeInstruction}

"PREMIUM" SELECTION CRITERIA:
1. FRESHNESS: Ideally < 48h. If > 48h, it must be a massive underlying trend.
2. VIRAL POTENTIAL: Polarizing topics, counter-intuitive facts, or shocking data. No "lukewarm advice".
3. EXPERT ANGLE: We don't want raw news, we want the angle that makes decision-makers think.

For each suggestion, structure the response:
- title: A catchy "Title Idea" (business newsletter style)
- context: The specific fact + Source (media name/study) + Date
- whyNow: Why talk about it NOW (Urgency/Relevance)
- suggestedPlatforms: ["linkedin", "twitter", "reddit"] depending on fit
- angle: Attack angle (e.g. "Contrarian Take", "Data Breakdown", "Future Signal", "Hot Take")

RULES:
- REAL sources mandatory.
- Diversity of formats.

Respond in strict JSON:
{ "suggestions": [{ "title": "...", "context": "...", "whyNow": "...", "suggestedPlatforms": [...], "angle": "..." }] }`;

    const systemMessage = language === 'fr'
        ? 'Tu es un expert en veille stratégique et création de contenu business. Réponds UNIQUEMENT en JSON valide.'
        : 'You are an expert in strategic intelligence and business content creation. Respond ONLY in valid JSON.';

    try {
        const result = await searchPerplexity([
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
        ], 'sonar-pro');

        const text = result.content || '';


        // Parse the JSON, handling potential markdown code block wrappers
        let cleanText = text.trim();
        if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        const parsed = JSON.parse(cleanText);
        return (parsed.suggestions || []) as TopicSuggestion[];
    } catch (error) {
        console.error('Error fetching topic suggestions:', error);
        throw error;
    }
}
