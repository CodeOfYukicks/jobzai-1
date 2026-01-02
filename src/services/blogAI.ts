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
        // === HUB ===
        hub: {
            name: 'Hub Cubbbe',
            description: 'Votre centre de commande pour piloter votre recherche d\'emploi depuis un seul endroit',
            url: '/hub',
            category: 'hub'
        },
        // === APPLY ===
        jobBoard: {
            name: 'Job Board Intelligent',
            description: 'Trouvez des offres correspondant parfaitement à votre profil grâce à notre IA',
            url: '/jobs',
            category: 'apply'
        },
        autoPilot: {
            name: 'AutoPilot Cubbbe',
            description: 'Automatisez vos candidatures avec notre IA qui postule pour vous 24h/24',
            url: '/campaigns',
            category: 'apply'
        },
        outreachCampaigns: {
            name: 'Campagnes d\'Outreach',
            description: 'Automatisez votre prospection avec des emails personnalisés IA qui captent l\'attention des recruteurs',
            url: '/campaigns-auto',
            category: 'apply'
        },
        cvAnalysis: {
            name: 'Resume Lab - Analyse de CV',
            description: 'Notre outil d\'analyse de CV IA évalue et optimise votre CV par rapport aux offres d\'emploi',
            url: '/cv-analysis',
            category: 'apply'
        },
        // === TRACK ===
        applicationTracking: {
            name: 'Suivi des Candidatures',
            description: 'Gardez un œil sur toutes vos candidatures avec notre tableau de bord kanban intuitif',
            url: '/applications',
            category: 'track'
        },
        calendar: {
            name: 'Calendrier Cubbbe',
            description: 'Organisez vos entretiens et ne ratez plus jamais un rendez-vous important',
            url: '/calendar',
            category: 'track'
        },
        // === PREPARE ===
        interviewHub: {
            name: 'Interview Hub',
            description: 'Accédez à tous vos entretiens à venir et préparez-vous efficacement',
            url: '/upcoming-interviews',
            category: 'prepare'
        },
        mockInterview: {
            name: 'Entretien Mock IA',
            description: 'Préparez vos entretiens avec notre simulateur IA en temps réel qui vous donne un feedback instantané',
            url: '/mock-interview',
            category: 'prepare'
        },
        resumeBuilder: {
            name: 'Document Manager',
            description: 'Créez et gérez vos CV professionnels en quelques minutes avec nos templates premium',
            url: '/resume-builder',
            category: 'prepare'
        },
        // === IMPROVE ===
        professionalProfile: {
            name: 'Profil Professionnel',
            description: 'Créez un profil optimisé qui attire les recruteurs et met en valeur vos compétences',
            url: '/professional-profile',
            category: 'improve'
        },
        recommendations: {
            name: 'Recommandations IA',
            description: 'Recevez des conseils personnalisés basés sur votre profil pour améliorer votre stratégie',
            url: '/recommendations',
            category: 'improve'
        },
        dashboard: {
            name: 'Dashboard Analytics',
            description: 'Analysez vos performances de recherche d\'emploi et optimisez votre stratégie avec des données',
            url: '/dashboard',
            category: 'improve'
        }
    },
    en: {
        // === HUB ===
        hub: {
            name: 'Cubbbe Hub',
            description: 'Your command center to manage your entire job search from one place',
            url: '/hub',
            category: 'hub'
        },
        // === APPLY ===
        jobBoard: {
            name: 'Smart Job Board',
            description: 'Find job postings that perfectly match your profile with our AI matching',
            url: '/jobs',
            category: 'apply'
        },
        autoPilot: {
            name: 'Cubbbe AutoPilot',
            description: 'Automate your job applications with our AI that applies for you 24/7',
            url: '/campaigns',
            category: 'apply'
        },
        outreachCampaigns: {
            name: 'Outreach Campaigns',
            description: 'Automate your prospecting with AI-personalized emails that catch recruiters\' attention',
            url: '/campaigns-auto',
            category: 'apply'
        },
        cvAnalysis: {
            name: 'Resume Lab - CV Analysis',
            description: 'Our AI CV analysis tool evaluates and optimizes your resume against job postings',
            url: '/cv-analysis',
            category: 'apply'
        },
        // === TRACK ===
        applicationTracking: {
            name: 'Application Tracking',
            description: 'Keep track of all your applications with our intuitive kanban dashboard',
            url: '/applications',
            category: 'track'
        },
        calendar: {
            name: 'Cubbbe Calendar',
            description: 'Organize your interviews and never miss an important appointment again',
            url: '/calendar',
            category: 'track'
        },
        // === PREPARE ===
        interviewHub: {
            name: 'Interview Hub',
            description: 'Access all your upcoming interviews and prepare effectively',
            url: '/upcoming-interviews',
            category: 'prepare'
        },
        mockInterview: {
            name: 'AI Mock Interview',
            description: 'Prepare for interviews with our real-time AI simulator that gives instant feedback',
            url: '/mock-interview',
            category: 'prepare'
        },
        resumeBuilder: {
            name: 'Document Manager',
            description: 'Create and manage professional resumes in minutes with our premium templates',
            url: '/resume-builder',
            category: 'prepare'
        },
        // === IMPROVE ===
        professionalProfile: {
            name: 'Professional Profile',
            description: 'Create an optimized profile that attracts recruiters and showcases your skills',
            url: '/professional-profile',
            category: 'improve'
        },
        recommendations: {
            name: 'AI Recommendations',
            description: 'Get personalized advice based on your profile to improve your strategy',
            url: '/recommendations',
            category: 'improve'
        },
        dashboard: {
            name: 'Analytics Dashboard',
            description: 'Analyze your job search performance and optimize your strategy with data',
            url: '/dashboard',
            category: 'improve'
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
## SERVICES CUBBBE À MENTIONNER (intègre 4-5 de ces outils de façon naturelle):

### 🎯 APPLY (Postuler)
- **${services.jobBoard.name}** (${services.jobBoard.url}): ${services.jobBoard.description}
- **${services.autoPilot.name}** (${services.autoPilot.url}): ${services.autoPilot.description}
- **${services.outreachCampaigns.name}** (${services.outreachCampaigns.url}): ${services.outreachCampaigns.description}
- **${services.cvAnalysis.name}** (${services.cvAnalysis.url}): ${services.cvAnalysis.description}

### 📊 TRACK (Suivre)
- **${services.applicationTracking.name}** (${services.applicationTracking.url}): ${services.applicationTracking.description}
- **${services.calendar.name}** (${services.calendar.url}): ${services.calendar.description}

### 🎤 PREPARE (Préparer)
- **${services.interviewHub.name}** (${services.interviewHub.url}): ${services.interviewHub.description}
- **${services.mockInterview.name}** (${services.mockInterview.url}): ${services.mockInterview.description}
- **${services.resumeBuilder.name}** (${services.resumeBuilder.url}): ${services.resumeBuilder.description}

### 📈 IMPROVE (Améliorer)
- **${services.professionalProfile.name}** (${services.professionalProfile.url}): ${services.professionalProfile.description}
- **${services.recommendations.name}** (${services.recommendations.url}): ${services.recommendations.description}
- **${services.dashboard.name}** (${services.dashboard.url}): ${services.dashboard.description}

### 🏠 HUB
- **${services.hub.name}** (${services.hub.url}): ${services.hub.description}

## RÈGLES D'INTÉGRATION DES BACKLINKS (TRÈS IMPORTANT):
1. Intègre **4-5 outils Cubbbe** naturellement dans l'article comme solutions concrètes
2. Utilise le format markdown pour les liens: [Nom de l'outil](URL)
3. Ajoute **au moins 2 encadrés CTA stylisés** dans le corps de l'article avec ce format:
   > 💡 **Astuce Cubbbe:** [Texte encourageant avec lien vers l'outil]
4. Termine l'article par une section "**🚀 Outils Cubbbe recommandés**" listant 3-4 outils pertinents
5. Varie les outils mentionnés en fonction du sujet de l'article
` : `
## CUBBBE SERVICES TO MENTION (naturally integrate 4-5 of these tools):

### 🎯 APPLY
- **${services.jobBoard.name}** (${services.jobBoard.url}): ${services.jobBoard.description}
- **${services.autoPilot.name}** (${services.autoPilot.url}): ${services.autoPilot.description}
- **${services.outreachCampaigns.name}** (${services.outreachCampaigns.url}): ${services.outreachCampaigns.description}
- **${services.cvAnalysis.name}** (${services.cvAnalysis.url}): ${services.cvAnalysis.description}

### 📊 TRACK
- **${services.applicationTracking.name}** (${services.applicationTracking.url}): ${services.applicationTracking.description}
- **${services.calendar.name}** (${services.calendar.url}): ${services.calendar.description}

### 🎤 PREPARE
- **${services.interviewHub.name}** (${services.interviewHub.url}): ${services.interviewHub.description}
- **${services.mockInterview.name}** (${services.mockInterview.url}): ${services.mockInterview.description}
- **${services.resumeBuilder.name}** (${services.resumeBuilder.url}): ${services.resumeBuilder.description}

### 📈 IMPROVE
- **${services.professionalProfile.name}** (${services.professionalProfile.url}): ${services.professionalProfile.description}
- **${services.recommendations.name}** (${services.recommendations.url}): ${services.recommendations.description}
- **${services.dashboard.name}** (${services.dashboard.url}): ${services.dashboard.description}

### 🏠 HUB
- **${services.hub.name}** (${services.hub.url}): ${services.hub.description}

## BACKLINK INTEGRATION RULES (VERY IMPORTANT):
1. Naturally integrate **4-5 Cubbbe tools** in the article as concrete solutions
2. Use markdown format for links: [Tool Name](URL)
3. Add **at least 2 styled CTA boxes** in the article body with this format:
   > 💡 **Cubbbe Tip:** [Encouraging text with link to the tool]
4. End the article with a "**🚀 Recommended Cubbbe Tools**" section listing 3-4 relevant tools
5. Vary the tools mentioned based on the article topic
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

### 5. INTÉGRATION CUBBBE (OBLIGATOIRE - TRÈS IMPORTANT)
- Mentionne **4-5 outils Cubbbe** comme solutions tout au long de l'article
- Intègre-les naturellement dans le contexte, pas comme de la pub
- Ajoute **au moins 2 encadrés CTA stylisés** avec le format: > 💡 **Astuce Cubbbe:** [texte + lien]
- Termine par une section "**🚀 Outils Cubbbe recommandés**" avec 3-4 outils pertinents
- Utilise des liens markdown: [Nom de l'outil](URL)

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

### 5. CUBBBE INTEGRATION (MANDATORY - VERY IMPORTANT)
- Mention **4-5 Cubbbe tools** as solutions throughout the article
- Integrate them naturally in context, not as ads
- Add **at least 2 styled CTA boxes** with format: > 💡 **Cubbbe Tip:** [text + link]
- End with a "**🚀 Recommended Cubbbe Tools**" section listing 3-4 relevant tools
- Use markdown links: [Tool Name](URL)

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
