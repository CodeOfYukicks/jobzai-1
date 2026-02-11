import { queryPerplexity } from '../lib/perplexity';
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

export async function suggestTopics(language: 'fr' | 'en' = 'fr'): Promise<TopicSuggestion[]> {
    const today = new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const prompt = language === 'fr'
        ? `Nous sommes le ${today}. Tu es un veilleur spécialisé dans le marché de l'emploi, les RH, le recrutement et la tech RH.

Ta mission : Trouve 6 sujets d'actualité RÉCENTS et percutants pour des posts sur les réseaux sociaux (LinkedIn, Twitter/X, Reddit).

Domaines à couvrir :
1. ACTUALITÉS RÉCENTES du marché de l'emploi, RH, recrutement, IA appliquée au travail (dernières 48h à 7 jours)
2. TENDANCES du moment : HR Tech, futur du travail, IA générative et emploi, nouvelles pratiques de recrutement
3. DONNÉES et ÉTUDES récentes sur l'emploi, les salaires, le remote, etc.

Pour chaque sujet :
- title: Un angle éditorial accrocheur (pas juste le sujet brut)
- context: 1-2 phrases sur l'actualité/tendance avec des données concrètes (cite les sources réelles)
- whyNow: Pourquoi c'est pertinent maintenant
- suggestedPlatforms: Les plateformes idéales (["linkedin"], ["twitter"], ["reddit"], ou combo)
- angle: L'angle recommandé ("hot take", "data-driven", "storytelling", "how-to", "débat", "analyse")

RÈGLES :
- Utilise tes sources web en temps réel pour trouver des VRAIES actualités récentes
- PAS de sujets génériques ou evergreen — chaque sujet doit être lié à un fait ou une donnée récente
- PAS de mention de produit, marque ou outil — juste des sujets bruts
- Diversifie les angles et les plateformes

Réponds en JSON strict :
{ "suggestions": [{ "title": "...", "context": "...", "whyNow": "...", "suggestedPlatforms": [...], "angle": "..." }] }`
        : `Today is ${today}. You are a research analyst specialized in the job market, HR, recruiting, and HR tech.

Your mission: Find 6 RECENT and impactful news topics for social media posts on LinkedIn, Twitter/X, Reddit.

Areas to cover:
1. RECENT NEWS in the job market, HR, recruiting, AI applied to work (last 48h to 7 days)
2. Current TRENDS: HR Tech, future of work, generative AI and employment, new recruiting practices
3. Recent DATA and STUDIES on employment, salaries, remote work, etc.

For each topic:
- title: A catchy editorial angle (not just the raw topic)
- context: 1-2 sentences about the news/trend with concrete data (cite real sources)
- whyNow: Why it's relevant right now
- suggestedPlatforms: Best platforms (["linkedin"], ["twitter"], ["reddit"], or combo)
- angle: Recommended angle ("hot take", "data-driven", "storytelling", "how-to", "debate", "analysis")

RULES:
- Use real-time web sources to find REAL recent news
- NO generic or evergreen topics — each topic must be tied to a recent fact or data point
- NO product, brand, or tool mentions — just raw topics
- Diversify angles and platforms

Respond in strict JSON:
{ "suggestions": [{ "title": "...", "context": "...", "whyNow": "...", "suggestedPlatforms": [...], "angle": "..." }] }`;

    const response = await queryPerplexity(prompt, {
        model: 'sonar-pro',
        temperature: 0.7,
        maxTokens: 3000,
        systemMessage: language === 'fr'
            ? 'Tu es un analyste veille spécialisé dans le marché de l\'emploi et la tech RH. Tu as accès au web en temps réel. Réponds UNIQUEMENT en JSON valide.'
            : 'You are a research analyst specialized in the job market and HR tech. You have real-time web access. Respond ONLY in valid JSON.',
    });

    if (response.error) {
        throw new Error(response.errorMessage || 'Failed to get topic suggestions');
    }

    const text = response.text || '';

    // Parse the JSON, handling potential markdown code block wrappers
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(cleanText);
    return (parsed.suggestions || []) as TopicSuggestion[];
}
