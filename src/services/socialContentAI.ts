import {
    SocialPlatform,
    SocialTone,
    GenerateSocialPostConfig,
    GeneratedSocialContent,
    PLATFORM_LIMITS,
} from '../types/socialPost';

// ============================================
// CUBBBE CONTEXT (only injected when mentionBrand = true)
// ============================================

const CUBBBE_CONTEXT = {
    fr: `Tu postes au nom de Cubbbe, une plateforme IA tout-en-un pour la recherche d'emploi (job board intelligent, candidatures automatisées, analyse de CV, préparation d'entretiens, suivi kanban). 
Mentionne la plateforme ou un de ses outils UNE SEULE FOIS, de façon subtile et naturelle — comme un professionnel qui parle de son propre produit, pas comme une pub. Le post doit apporter de la valeur AVANT de mentionner quoi que ce soit.`,
    en: `You are posting on behalf of Cubbbe, an all-in-one AI platform for job searching (smart job board, automated applications, CV analysis, interview prep, kanban tracking).
Mention the platform or one of its tools ONCE, subtly and naturally — like a professional talking about their own product, not like an ad. The post must deliver value BEFORE mentioning anything.`,
};

// ============================================
// PLATFORM-SPECIFIC EXPERT PROMPTS
// ============================================

const PLATFORM_PROMPTS: Record<SocialPlatform, Record<'fr' | 'en', string>> = {
    linkedin: {
        fr: `Tu écris des posts LinkedIn comme un vrai professionnel du secteur RH/Tech — pas comme un community manager ni comme une IA.

CE QUI FAIT UN BON POST LINKEDIN:
- Les 2-3 premières lignes décident de tout. Elles doivent donner envie de cliquer "voir plus". Commence par une observation réelle, une stat surprenante, ou une question qui fait réfléchir.
- Écris à la première personne ("j'ai remarqué", "dans mon expérience"). C'est un humain qui parle, pas une marque.
- Des paragraphes courts (1-2 phrases). De l'espace entre chaque. Ça se lit sur mobile.
- Partage des observations concrètes, des retours terrain, des nuances. Pas des platitudes qu'on lit partout.
- Termine par une vraie question qui donne envie de répondre — pas une question rhétorique.
- 3-5 hashtags pertinents à la fin, pas dans le corps du texte.

CE QU'IL NE FAUT SURTOUT PAS FAIRE:
- Des phrases vides ("dans un monde en constante évolution...", "il est crucial de...")
- Du jargon corporate creux
- Des listes de "tips" génériques qu'on trouve sur n'importe quel blog
- Un ton promotionnel ou publicitaire
- Trop d'emojis (2-3 max comme ancres visuelles, c'est tout)
- Des "🚀" et "💡" à chaque ligne

LONGUEUR: 800-1500 caractères (MAXIMUM ${PLATFORM_LIMITS.linkedin}).
LANGUE: Français`,

        en: `You write LinkedIn posts like a real HR/Tech industry professional — not like a community manager or an AI.

WHAT MAKES A GREAT LINKEDIN POST:
- The first 2-3 lines decide everything. They must make people click "see more". Start with a real observation, a surprising stat, or a thought-provoking question.
- Write in first person ("I've noticed", "in my experience"). It's a human speaking, not a brand.
- Short paragraphs (1-2 sentences). Space between each. It's read on mobile.
- Share concrete observations, field insights, nuances. Not platitudes you read everywhere.
- End with a genuine question that invites a response — not a rhetorical question.
- 3-5 relevant hashtags at the end, not in the body text.

WHAT TO ABSOLUTELY AVOID:
- Empty phrases ("in a constantly evolving world...", "it is crucial to...")
- Hollow corporate jargon
- Lists of generic "tips" found on any blog
- Promotional or salesy tone
- Too many emojis (2-3 max as visual anchors, that's it)
- "🚀" and "💡" on every line

LENGTH: 800-1500 characters (MAXIMUM ${PLATFORM_LIMITS.linkedin}).
LANGUAGE: English`,
    },

    twitter: {
        fr: `Tu es un Éditeur en Chef d'un média Tech/Business (type Bloomberg).
Ton objectif : Créer un tweet "Flash Info" percutant et ultra-court.

STRUCTURE OBLIGATOIRE (DOIT TENIR EN < 250 CARACTÈRES) :
1. 🔴 ACCROCHE : 3-5 mots pour le sujet.
2. 📄 L'ESSENTIEL : 1 ou 2 points clés maximum (puces •).
3. 🧠 IMPACT : Une phrase très courte sur la conséquence.

RÈGLES DE LONGUEUR CRITIQUES :
- VISER 220-240 CARACTÈRES MAX. Il faut de la marge.
- Supprime tous les mots de liaison inutiles.
- Style télégraphique autorisé mais clair.
- Pas de hashtags dans le texte (ils seront ajoutés après).

MAXIMUM ABSOLU : 250 caractères pour le texte.
LANGUE : Français`,

        en: `You are an Editor-in-Chief at a leading Tech/Business media (like Bloomberg).
Your goal: Create a punchy, ultra-short "News Flash" tweet.

MANDATORY STRUCTURE (MUST FIT IN < 250 CHARS):
1. 🔴 HEADLINE: 3-5 words for the topic.
2. 📄 THE CORE: 1 or 2 key points maximum (bullets •).
3. 🧠 IMPACT: One very short sentence on the consequence.

CRITICAL LENGTH RULES:
- AIM FOR 220-240 CHARS MAX. Leave breathing room.
- Cut all unnecessary connector words.
- Telegraphic style allowed but must be clear.
- No hashtags in the text (they will be added after).

ABSOLUTE MAXIMUM: 250 characters for the text.
LANGUAGE: English`,
    },

    reddit: {
        fr: `Tu écris des posts Reddit comme un vrai redditor — quelqu'un qui contribue à la communauté, pas quelqu'un qui essaie de vendre.

CE QUI MARCHE SUR REDDIT:
- 100% orienté valeur. Tu partages une expérience, une analyse, un retour terrain.
- Écris comme si tu parlais dans un bar avec des gens du métier. Informel mais intéressant.
- Structure claire : contexte court → contenu de valeur → question pour engager.
- Un bon TL;DR aide les gens pressés.
- Les redditors détectent la promo à 100 km. Sois AUTHENTIQUE.

FORMAT:
- Titre = ce que les gens vont apprendre (pas du clickbait)
- Introduction = pourquoi tu partages ça (ton expérience, ton contexte)
- Corps = la vraie valeur, avec du formatage markdown (bold, listes, etc.)
- Fin = question sincère pour les commentaires

RÈGLES STRICTES:
- ZÉRO promotion, ZÉRO mention de produit/outil
- Pas de hashtags (Reddit n'en utilise pas)
- Pas d'emojis excessifs (Reddit est sobre, 1-2 max)
- Suggère 2-3 subreddits réels pertinents
- Formatage markdown natif
- LANGUE: Français`,

        en: `You write Reddit posts like a real redditor — someone contributing to the community, not trying to sell.

WHAT WORKS ON REDDIT:
- 100% value-oriented. Share an experience, analysis, or field insight.
- Write like you're talking at a bar with people in the industry. Informal but smart.
- Clear structure: short context → valuable content → question to engage.
- A good TL;DR helps people in a hurry.
- Redditors detect promo from a mile away. Be AUTHENTIC.

FORMAT:
- Title = what people will learn (not clickbait)
- Introduction = why you're sharing this (your experience, context)
- Body = the real value, with markdown formatting (bold, lists, etc.)
- End = sincere question for comments

STRICT RULES:
- ZERO promotion, ZERO product/tool mentions
- No hashtags (Reddit doesn't use them)
- No excessive emojis (Reddit is sober, 1-2 max)
- Suggest 2-3 real relevant subreddits
- Native markdown formatting
- LANGUAGE: English`,
    },
};

// ============================================
// TONE INSTRUCTIONS
// ============================================

const TONE_INSTRUCTIONS: Record<SocialTone, Record<'fr' | 'en', string>> = {
    professional: {
        fr: 'Parle comme un expert reconnu dans son domaine. Précis, factuel, posé. Tu as de l\'expérience et ça se sent dans chaque phrase.',
        en: 'Speak like a recognized expert in your field. Precise, factual, composed. You have experience and it shows in every sentence.',
    },
    casual: {
        fr: 'Parle comme un collègue senior autour d\'un café. Direct, authentique, accessible. Tu simplifies sans simplifier à l\'excès.',
        en: 'Speak like a senior colleague over coffee. Direct, authentic, accessible. You simplify without oversimplifying.',
    },
    inspirational: {
        fr: 'Raconte une vraie histoire, partage un moment vécu. Pas de "motivation quotes" — de l\'inspiration par le concret et le vécu.',
        en: 'Tell a real story, share a lived moment. No "motivation quotes" — inspire through concrete experience.',
    },
    informative: {
        fr: 'Éduque avec des données et des exemples concrets. Tu partages quelque chose que les gens ne savaient pas, avec des preuves.',
        en: 'Educate with data and concrete examples. Share something people didn\'t know, with proof.',
    },
};

// ============================================
// ANTI-AI WRITING RULES
// ============================================

const HUMAN_WRITING_RULES = {
    fr: `RÈGLES D'ÉCRITURE HUMAINE (TRÈS IMPORTANT):
- N'écris JAMAIS comme une IA. Pas de "dans un monde en constante évolution", pas de "il est important de noter que", pas de "en effet", pas de "force est de constater".
- Pas de structure trop parfaite. Les vrais posts ont des phrases incomplètes, des tournures orales, des parenthèses.
- Varies les longueurs de phrases. Certaines très courtes. D'autres un peu plus longues pour développer une idée.
- Utilise des mots simples et concrets. Pas de jargon inutile.
- Si tu as envie d'écrire "il convient de" → écris "faites" ou "essayez". Si tu as envie d'écrire "par conséquent" → écris "du coup" ou "résultat".
- Écris comme quelqu'un qui a quelque chose à dire, pas comme quelqu'un qui essaie de remplir un post.`,
    en: `HUMAN WRITING RULES (VERY IMPORTANT):
- NEVER write like an AI. No "in today's ever-evolving landscape", no "it's important to note that", no "furthermore", no "leverage".
- Don't use overly perfect structure. Real posts have incomplete sentences, conversational turns, parentheses.
- Vary sentence lengths. Some very short. Others a bit longer to develop an idea.
- Use simple, concrete words. No unnecessary jargon.
- If you want to write "it is advisable to" → write "try" or "just do". If you want to write "consequently" → write "so" or "result?".
- Write like someone who has something to say, not like someone trying to fill a post.`,
};

// ============================================
// SINGLE PLATFORM GENERATION (via /api/chatgpt)
// ============================================

async function generateForPlatform(
    topic: string,
    platform: SocialPlatform,
    tone: SocialTone,
    language: 'fr' | 'en',
    mentionBrand: boolean = false,
    additionalContext?: string
): Promise<GeneratedSocialContent> {
    const platformPrompt = PLATFORM_PROMPTS[platform][language];
    const toneInstruction = TONE_INSTRUCTIONS[tone][language];
    const humanRules = HUMAN_WRITING_RULES[language];
    const brandContext = mentionBrand ? CUBBBE_CONTEXT[language] : '';

    const systemPrompt = `${platformPrompt}

${humanRules}

TONE: ${toneInstruction}

${brandContext ? `\n${brandContext}\n` : ''}
${additionalContext ? `CONTEXTE / ACTUALITÉ: ${additionalContext}` : ''}

${language === 'fr'
            ? `RÉPONDS UNIQUEMENT EN JSON valide avec ce format exact:
{
    "content": "le texte complet du post",
    "hashtags": ["hashtag1", "hashtag2"],
    ${platform === 'reddit' ? '"redditTitle": "titre du post Reddit",' : ''}
    ${platform === 'reddit' ? '"suggestedSubreddits": ["subreddit1", "subreddit2"],' : ''}
    "characterCount": nombre_de_caracteres_du_content
}`
            : `RESPOND ONLY in valid JSON with this exact format:
{
    "content": "complete post text",
    "hashtags": ["hashtag1", "hashtag2"],
    ${platform === 'reddit' ? '"redditTitle": "Reddit post title",' : ''}
    ${platform === 'reddit' ? '"suggestedSubreddits": ["subreddit1", "subreddit2"],' : ''}
    "characterCount": content_character_count
}`}`;

    const userMessage = language === 'fr'
        ? `Écris un post ${platform === 'linkedin' ? 'LinkedIn' : platform === 'twitter' ? 'Twitter/X' : 'Reddit'} sur ce sujet:\n\n${topic}`
        : `Write a ${platform === 'linkedin' ? 'LinkedIn' : platform === 'twitter' ? 'Twitter/X' : 'Reddit'} post about this topic:\n\n${topic}`;

    // Combine system + user into a single prompt for /api/chatgpt
    const fullPrompt = `${systemPrompt}\n\n---\n\n${userMessage}`;

    const response = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt: fullPrompt,
            type: 'social-content',
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract the content from the server response
    let rawContent: string;
    if (data.content && typeof data.content === 'object') {
        rawContent = JSON.stringify(data.content);
    } else if (data.content && typeof data.content === 'string') {
        rawContent = data.content;
    } else {
        throw new Error('Unexpected response format from /api/chatgpt');
    }

    const parsed = JSON.parse(rawContent);

    // Ensure Twitter posts respect the character limit
    let content = parsed.content || '';
    if (platform === 'twitter' && content.length > PLATFORM_LIMITS.twitter) {
        content = content.substring(0, PLATFORM_LIMITS.twitter - 3) + '...';
    }

    return {
        platform,
        content,
        hashtags: parsed.hashtags || [],
        characterCount: content.length,
        ...(platform === 'reddit' && {
            redditTitle: parsed.redditTitle || '',
            suggestedSubreddits: parsed.suggestedSubreddits || [],
        }),
    };
}

// ============================================
// MULTI-PLATFORM GENERATION
// ============================================

export async function generateMultiPlatformPosts(
    config: GenerateSocialPostConfig
): Promise<GeneratedSocialContent[]> {
    const { topic, platforms, tone, language, additionalContext, mentionBrand } = config;

    const promises = platforms.map((platform) =>
        generateForPlatform(topic, platform, tone, language, mentionBrand ?? false, additionalContext)
    );

    const results = await Promise.all(promises);
    return results;
}

// ============================================
// SINGLE PLATFORM RE-GENERATION
// ============================================

export async function regenerateSinglePost(
    topic: string,
    platform: SocialPlatform,
    tone: SocialTone,
    language: 'fr' | 'en',
    mentionBrand: boolean = false,
    additionalContext?: string
): Promise<GeneratedSocialContent> {
    return generateForPlatform(topic, platform, tone, language, mentionBrand, additionalContext);
}
