import { getOpenAIInstance } from '../lib/openai';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface AIArticleConfig {
    topic: string;
    tone?: string;
    keywords?: string;
    language?: string;
}

export interface SEOArticleConfig {
    topic: string;
    targetKeywords: string[];
    targetAudience: 'job_seekers' | 'hr_professionals' | 'career_coaches' | 'general';
    articleLength: 'short' | 'medium' | 'long';
    language: 'fr' | 'en';
    tone: 'professional' | 'casual' | 'authoritative' | 'friendly';
}

export interface GeneratedSEOArticle {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    suggestedKeywords: string[];
}

// ============================================
// CUBBBE SERVICES (for internal linking in articles)
// ============================================

const CUBBBE_SERVICES = {
    fr: {
        cvAnalysis: {
            name: 'Analyse de CV Cubbbe',
            description: 'Notre outil d\'analyse de CV IA évalue votre CV par rapport aux offres d\'emploi',
            url: '/cv-analysis'
        },
        cvRewrite: {
            name: 'Réécriture de CV IA',
            description: 'Optimisez automatiquement votre CV avec notre IA',
            url: '/cv-optimizer'
        },
        mockInterview: {
            name: 'Entretien Mock IA',
            description: 'Préparez vos entretiens avec notre simulateur IA en temps réel',
            url: '/mock-interview'
        },
        outreachCampaigns: {
            name: 'Campagnes d\'Outreach',
            description: 'Automatisez votre prospection avec des emails personnalisés IA',
            url: '/campaigns-auto'
        },
        jobBoard: {
            name: 'Job Board Intelligent',
            description: 'Trouvez des offres correspondant parfaitement à votre profil',
            url: '/jobs'
        },
        resumeBuilder: {
            name: 'Créateur de CV',
            description: 'Créez un CV professionnel en quelques minutes',
            url: '/resume-builder'
        },
        interviewPrep: {
            name: 'Préparation Entretien',
            description: 'Recevez des conseils personnalisés pour chaque entretien',
            url: '/upcoming-interviews'
        }
    },
    en: {
        cvAnalysis: {
            name: 'Cubbbe CV Analysis',
            description: 'Our AI CV analysis tool evaluates your resume against job postings',
            url: '/cv-analysis'
        },
        cvRewrite: {
            name: 'AI CV Rewrite',
            description: 'Automatically optimize your resume with our AI',
            url: '/cv-optimizer'
        },
        mockInterview: {
            name: 'AI Mock Interview',
            description: 'Prepare for interviews with our real-time AI simulator',
            url: '/mock-interview'
        },
        outreachCampaigns: {
            name: 'Outreach Campaigns',
            description: 'Automate your prospecting with AI-personalized emails',
            url: '/campaigns-auto'
        },
        jobBoard: {
            name: 'Smart Job Board',
            description: 'Find job postings that perfectly match your profile',
            url: '/jobs'
        },
        resumeBuilder: {
            name: 'Resume Builder',
            description: 'Create a professional resume in minutes',
            url: '/resume-builder'
        },
        interviewPrep: {
            name: 'Interview Preparation',
            description: 'Get personalized advice for each interview',
            url: '/upcoming-interviews'
        }
    }
};

// ============================================
// SEO ARTICLE GENERATION - HYPER OPTIMIZED
// ============================================

const AUDIENCE_DESCRIPTIONS = {
    job_seekers: 'des personnes en recherche d\'emploi qui veulent décrocher leur job idéal',
    hr_professionals: 'des professionnels RH et recruteurs',
    career_coaches: 'des coachs carrière et consultants en recrutement',
    general: 'un public général intéressé par les carrières et l\'emploi'
};

const AUDIENCE_DESCRIPTIONS_EN = {
    job_seekers: 'job seekers looking to land their dream job',
    hr_professionals: 'HR professionals and recruiters',
    career_coaches: 'career coaches and recruitment consultants',
    general: 'a general audience interested in careers and employment'
};

const WORD_COUNTS = {
    short: { min: 800, max: 1200, readTime: '5 min' },
    medium: { min: 1500, max: 2000, readTime: '8 min' },
    long: { min: 2500, max: 3500, readTime: '15 min' }
};

const TONE_INSTRUCTIONS = {
    professional: 'Professionnel et expert, utilise un vocabulaire précis et des données factuelles',
    casual: 'Décontracté et accessible, comme un ami qui donne des conseils',
    authoritative: 'Autoritaire et confiant, positionne-toi comme LE référent du sujet',
    friendly: 'Chaleureux et encourageant, motive le lecteur à passer à l\'action'
};

const TONE_INSTRUCTIONS_EN = {
    professional: 'Professional and expert, use precise vocabulary and factual data',
    casual: 'Casual and accessible, like a friend giving advice',
    authoritative: 'Authoritative and confident, position yourself as THE reference on the subject',
    friendly: 'Warm and encouraging, motivate the reader to take action'
};

/**
 * Generate a hyper-optimized SEO article using GPT-5.2
 */
export const generateSEOArticle = async (config: SEOArticleConfig): Promise<GeneratedSEOArticle> => {
    const openai = await getOpenAIInstance();
    const wordCount = WORD_COUNTS[config.articleLength];
    const isFrench = config.language === 'fr';
    const services = isFrench ? CUBBBE_SERVICES.fr : CUBBBE_SERVICES.en;

    const audienceDesc = isFrench
        ? AUDIENCE_DESCRIPTIONS[config.targetAudience]
        : AUDIENCE_DESCRIPTIONS_EN[config.targetAudience];

    const toneDesc = isFrench
        ? TONE_INSTRUCTIONS[config.tone]
        : TONE_INSTRUCTIONS_EN[config.tone];

    const servicesContext = isFrench ? `
## SERVICES CUBBBE À MENTIONNER (intègre 2-3 de ces outils de façon naturelle):
- **${services.cvAnalysis.name}** (${services.cvAnalysis.url}): ${services.cvAnalysis.description}
- **${services.cvRewrite.name}** (${services.cvRewrite.url}): ${services.cvRewrite.description}
- **${services.mockInterview.name}** (${services.mockInterview.url}): ${services.mockInterview.description}
- **${services.outreachCampaigns.name}** (${services.outreachCampaigns.url}): ${services.outreachCampaigns.description}
- **${services.jobBoard.name}** (${services.jobBoard.url}): ${services.jobBoard.description}
- **${services.resumeBuilder.name}** (${services.resumeBuilder.url}): ${services.resumeBuilder.description}

Intègre ces outils Cubbbe naturellement dans l'article comme solutions concrètes. Utilise le format markdown pour les liens: [Nom de l'outil](URL)
` : `
## CUBBBE SERVICES TO MENTION (naturally integrate 2-3 of these tools):
- **${services.cvAnalysis.name}** (${services.cvAnalysis.url}): ${services.cvAnalysis.description}
- **${services.cvRewrite.name}** (${services.cvRewrite.url}): ${services.cvRewrite.description}
- **${services.mockInterview.name}** (${services.mockInterview.url}): ${services.mockInterview.description}
- **${services.outreachCampaigns.name}** (${services.outreachCampaigns.url}): ${services.outreachCampaigns.description}
- **${services.jobBoard.name}** (${services.jobBoard.url}): ${services.jobBoard.description}
- **${services.resumeBuilder.name}** (${services.resumeBuilder.url}): ${services.resumeBuilder.description}

Naturally integrate these Cubbbe tools in the article as concrete solutions. Use markdown format for links: [Tool Name](URL)
`;

    const systemPrompt = isFrench ? `
Tu es un copywriter SEO d'élite pour "Cubbbe", une plateforme premium d'aide à la carrière propulsée par l'IA.
Ta mission: Écrire un article qui va DOMINER les résultats Google tout en promouvant subtilement les outils Cubbbe.

Tu maîtrises parfaitement:
- Les algorithmes de Google (E-E-A-T, Helpful Content, Featured Snippets)
- Le copywriting persuasif (AIDA, PAS, storytelling)
- L'optimisation on-page (title tags, meta descriptions, heading hierarchy)
- La psychologie du lecteur web (scanabilité, engagement, conversion)
` : `
You are an elite SEO copywriter for "Cubbbe", a premium AI-powered career assistance platform.
Your mission: Write an article that will DOMINATE Google search results while subtly promoting Cubbbe tools.

You have mastered:
- Google algorithms (E-E-A-T, Helpful Content, Featured Snippets)
- Persuasive copywriting (AIDA, PAS, storytelling)
- On-page optimization (title tags, meta descriptions, heading hierarchy)
- Web reader psychology (scannability, engagement, conversion)
`;

    const userPrompt = isFrench ? `
## BRIEF DE L'ARTICLE

**SUJET:** ${config.topic}
**MOTS-CLÉS CIBLES:** ${config.targetKeywords.join(', ')}
**AUDIENCE:** ${audienceDesc}
**LONGUEUR:** ${wordCount.min}-${wordCount.max} mots
**TON:** ${toneDesc}

${servicesContext}

## RÈGLES SEO CRITIQUES (À SUIVRE ABSOLUMENT)

### 1. TITRE (H1)
- Inclut le mot-clé principal NATURELLEMENT
- Entre 50-60 caractères
- Utilise un "power word" (ultime, secret, essentiel, efficace, prouvé...)
- Format accrocheur: chiffres, questions, "Comment...", "Les X meilleurs..."

### 2. PREMIER PARAGRAPHE (HOOK)
- Accroche émotionnelle ou statistique choc
- Mot-clé principal dans les 100 premiers mots
- Promesse de valeur claire
- Maximum 3 phrases courtes

### 3. STRUCTURE DES TITRES
- H2 pour les sections principales (5-7 sections)
- H3 pour les sous-sections
- Inclure des mots-clés dans 60% des titres
- Formuler certains comme des questions (pour featured snippets)

### 4. CORPS DE L'ARTICLE
- Paragraphes très courts (2-3 phrases max)
- Listes à puces et numérotées fréquentes
- Données chiffrées et statistiques récentes
- Exemples concrets et cas pratiques
- Transitions fluides entre sections

### 5. INTÉGRATION CUBBBE (OBLIGATOIRE)
- Mentionne 2-3 outils Cubbbe comme solutions
- Intègre-les naturellement, pas comme de la pub
- Utilise des CTA subtils vers les outils

### 6. SECTION FAQ (OBLIGATOIRE)
- 4-5 questions "People Also Ask"
- Réponses concises (40-60 mots max)
- Optimisé pour les featured snippets

### 7. CTA FINAL
- Encourage à essayer Cubbbe
- Rappelle la valeur gratuite

### 8. MÉTA DESCRIPTION
- Exactement 150-155 caractères
- Inclut le mot-clé principal
- Incitation au clic avec bénéfice clair

### 9. SLUG
- Tout en minuscules, tirets
- 3-5 mots max avec mot-clé principal

## FORMAT DE SORTIE (JSON STRICT)

Réponds UNIQUEMENT avec un JSON valide:

{
    "title": "Titre H1 optimisé SEO (50-60 chars)",
    "slug": "slug-seo-optimise",
    "excerpt": "Meta description 150-155 caractères avec mot-clé et CTA",
    "content": "Contenu complet en Markdown avec H2, H3, listes, liens Cubbbe, FAQ...",
    "suggestedKeywords": ["mot-clé 1", "mot-clé 2", "mot-clé 3"]
}
` : `
## ARTICLE BRIEF

**TOPIC:** ${config.topic}
**TARGET KEYWORDS:** ${config.targetKeywords.join(', ')}
**AUDIENCE:** ${audienceDesc}
**LENGTH:** ${wordCount.min}-${wordCount.max} words
**TONE:** ${toneDesc}

${servicesContext}

## CRITICAL SEO RULES (MUST FOLLOW)

### 1. TITLE (H1)
- Include the main keyword NATURALLY
- Between 50-60 characters
- Use a "power word" (ultimate, proven, essential, effective...)
- Catchy format: numbers, questions, "How to...", "The X best..."

### 2. FIRST PARAGRAPH (HOOK)
- Emotional hook or shocking statistic
- Main keyword in the first 100 words
- Clear value promise
- Maximum 3 short sentences

### 3. HEADING STRUCTURE
- H2 for main sections (5-7 sections)
- H3 for subsections
- Include keywords in 60% of headings
- Phrase some as questions (for featured snippets)

### 4. ARTICLE BODY
- Very short paragraphs (2-3 sentences max)
- Frequent bullet and numbered lists
- Recent data and statistics
- Concrete examples and case studies
- Smooth transitions between sections

### 5. CUBBBE INTEGRATION (MANDATORY)
- Mention 2-3 Cubbbe tools as solutions
- Integrate them naturally, not as ads
- Use subtle CTAs to the tools

### 6. FAQ SECTION (MANDATORY)
- 4-5 "People Also Ask" questions
- Concise answers (40-60 words max)
- Optimized for featured snippets

### 7. FINAL CTA
- Encourage trying Cubbbe
- Remind of free value

### 8. META DESCRIPTION
- Exactly 150-155 characters
- Includes main keyword
- Click incentive with clear benefit

### 9. SLUG (CRITICAL FOR SEO)
- All lowercase, hyphen-separated, no special characters
- 5-8 words including the MAIN KEYWORD and year if relevant
- Must be descriptive and match the title closely
- Examples: "comment-faire-un-bon-cv-2026-guide-complet", "reussir-entretien-embauche-conseils-experts"

## OUTPUT FORMAT (STRICT JSON)

Respond ONLY with valid JSON:

{
    "title": "SEO-optimized H1 title (50-60 chars)",
    "slug": "seo-optimized-slug",
    "excerpt": "Meta description 150-155 characters with keyword and CTA",
    "content": "Full content in Markdown with H2, H3, lists, Cubbbe links, FAQ...",
    "suggestedKeywords": ["keyword 1", "keyword 2", "keyword 3"]
}
`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const responseText = completion.choices[0].message.content || '{}';
        const parsed = JSON.parse(responseText) as GeneratedSEOArticle;

        // Clean up content - remove duplicate title if present
        if (parsed.content.startsWith(`# ${parsed.title}`)) {
            parsed.content = parsed.content.replace(/^# .+\n+/, '');
        }

        return parsed;
    } catch (error) {
        console.error('Error generating SEO article:', error);
        throw error;
    }
};

// ============================================
// LEGACY ARTICLE GENERATION (kept for compatibility)
// ============================================

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
            model: "gpt-5.2",
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

// ============================================
// IMAGE GENERATION - ULTRA MINIMALIST COVERS
// ============================================

export const generateAIImage = async (prompt: string): Promise<string | null> => {
    const openai = await getOpenAIInstance();

    try {
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: `Ultra-minimalist blog cover illustration.

Topic: "${prompt}"

STRICT STYLE:
- Soft, muted color palette (pastel tones, gentle gradients)
- ONE simple abstract shape or symbol centered
- 90% negative space (mostly solid background)
- Inspired by: Apple keynote slides, Notion covers, Stripe illustrations
- Aesthetic: calm, professional, premium, modern
- ABSOLUTELY NO: text, words, letters, people, faces, complex patterns
- Think: single floating circle with gradient, one curved line, minimal dot pattern
- Background: solid soft color (cream, light blue, pale pink, soft gray)

The simpler, the better. Less is more.`,
            n: 1,
            size: "1792x1024",
            quality: "hd",
            style: "natural"
        });

        return response.data[0]?.url || null;
    } catch (error) {
        console.error('Error generating image:', error);
        throw error;
    }
};

/**
 * Generate an ultra-minimalist cover image for SEO articles
 */
export const generateSEOCoverImage = async (title: string, keywords: string[]): Promise<string | null> => {
    const openai = await getOpenAIInstance();

    // Extract simple theme words
    const themeWords = keywords.slice(0, 2).join(' and ');

    try {
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: `Create an EXTREMELY minimalist editorial cover image.

Article theme: "${title}"
Keywords: ${themeWords}

MANDATORY STYLE RULES:
1. ULTRA SIMPLE - only 1-2 subtle visual elements max
2. Vast negative space - at least 80% empty
3. Soft, muted colors: dusty rose, soft sage, warm beige, muted blue, pale lavender
4. Gentle gradient or solid pastel background
5. NO complexity - think Apple product photos level of simplicity
6. Aesthetic: Notion, Linear, Vercel, Arc Browser
7. ZERO text, letters, words, typography
8. ZERO human faces or realistic people
9. ZERO busy patterns or geometric noise

Examples of acceptable elements:
- A single soft gradient sphere
- One elegant curved line
- Two overlapping transparent circles
- A subtle paper texture with one shape
- Minimal dot or line pattern (very sparse)

The image should feel: calm, sophisticated, breathable, premium, timeless.
Make it so simple that it almost feels empty - that's the goal.`,
            n: 1,
            size: "1792x1024",
            quality: "hd",
            style: "natural"
        });

        return response.data[0]?.url || null;
    } catch (error) {
        console.error('Error generating SEO cover image:', error);
        return null;
    }
};
