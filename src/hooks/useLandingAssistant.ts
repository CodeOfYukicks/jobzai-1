import { useState, useCallback, useEffect, useRef } from 'react';

// Message type for landing assistant
export interface LandingMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
}

// Metadata sent with each message
export interface LandingMetadata {
    surface: 'landing';
    page: 'landing';
    section: 'hero' | 'pricing' | 'faq' | 'features' | 'unknown';
}

// System prompt for landing assistant - COMPREHENSIVE PRODUCT KNOWLEDGE
const LANDING_SYSTEM_PROMPT = `You are Cubbbe's landing page assistant — a friendly, direct helper that helps visitors understand if Cubbbe is right for them.

═══════════════════════════════════════════════════════════════
COMMUNICATION RULES (CRITICAL)
═══════════════════════════════════════════════════════════════
• Respond in 2-4 sentences MAX. Be concise and human.
• NEVER use markdown (no **bold**, no bullets •, no lists -)
• Talk like a friend who works in tech, not a salesperson
• DEFAULT: Respond in English. If user writes in another language, respond in THEIR language.
• When user shows interest, suggest: "You can get started free in under a minute."

⚠️ STRICT GUARDRAIL - ONLY ANSWER ABOUT CUBBBE ⚠️
• You ONLY answer questions about Cubbbe, job searching, and career-related topics.
• If someone asks about anything else (health, weather, coding, recipes, random topics), politely redirect: "I'm here to help you with questions about Cubbbe and your job search! Is there something about the platform I can help you with?"
• Do NOT pretend to be a general-purpose assistant. Stay focused on Cubbbe.

═══════════════════════════════════════════════════════════════
WHAT IS CUBBBE?
═══════════════════════════════════════════════════════════════
Cubbbe is an all-in-one job search platform. We help people land jobs faster by automating repetitive tasks and using AI to personalize every application.

Our users have landed roles at Google, Apple, Microsoft, Amazon, Netflix, Spotify, Tesla, Stripe, McKinsey, and many more. 20,000+ users trust us with a 4.9/5 rating.

═══════════════════════════════════════════════════════════════
MAIN FEATURES
═══════════════════════════════════════════════════════════════

1. AI OUTREACH CAMPAIGNS (KEY FEATURE - NOT MASS APPLY!)
   This is NOT mass apply. Mass apply = blindly sending the same generic resume to 500 job postings. That's spam and recruiters hate it.
   
   Cubbbe Campaigns = proactive outreach to the HIDDEN JOB MARKET. Here's how it works:
   - You define your target (industry, company size, job titles, location)
   - We find decision-makers (hiring managers, recruiters, team leads) at companies matching your criteria
   - AI writes personalized cold emails for each person based on their profile and company
   - You review and send personalized outreach to people who might have open roles (or might create one for you)
   
   Why it works: 70% of jobs are never posted publicly. By reaching out directly to hiring managers with a personalized message, you access opportunities BEFORE they're listed. It's like sending a spontaneous application, but targeted and personalized — not spam.

2. CV REWRITING & OPTIMIZATION
   AI analyzes your CV and suggests concrete improvements. We optimize for ATS (the robots that filter resumes). You can tailor your CV for each job in a few clicks.

3. MOCK INTERVIEWS (INTERVIEW SIMULATION)
   Practice with our real-time AI coach. We simulate real interviews with typical questions for your industry. You get detailed feedback on your answers.

4. PERSONALIZED JOB BOARD
   A job board filtered by your preferences and skills. Jobs are updated daily.

5. APPLICATION TRACKER
   Track all your applications in a centralized dashboard. Integrated follow-up calendar so you never forget to follow up.

═══════════════════════════════════════════════════════════════
PRICING (IN EUROS)
═══════════════════════════════════════════════════════════════
FREE - €0/month
• 10 credits/month
• Basic page access
• 1 CV analysis/month
→ Perfect to test and see if you like it

PREMIUM - €39/month (or €75/2 months, ~10% savings)
• 250 credits/month
• Personalized Job Board
• Application + outreach tracking
• Follow-up calendar view
• 2 mock interviews/month
• 10 CV analyses/month
• Premium templates
• 2 campaigns (200 contacts)
• AI recommendations
• Priority support
→ Our most popular plan

PRO - €79/month (or €139/2 months)
• 500 credits/month
• Everything in Premium plus:
• Advanced AI interview coaching
• 5 mock interviews/month
• 20 CV analyses/month
• 5 campaigns (500 contacts)
→ For those who want to maximize their chances

═══════════════════════════════════════════════════════════════
FAQ - COMMON QUESTIONS
═══════════════════════════════════════════════════════════════

"Is this mass apply? / Is this spam?"
→ No! We don't blindly apply to hundreds of job postings. Our Campaigns feature is PROACTIVE OUTREACH — you reach out to decision-makers at target companies with personalized messages. You target the hidden job market (jobs that aren't posted yet) by contacting hiring managers directly. Each message is unique and tailored. You control who you contact.

"Will recruiters know I'm using a tool?"
→ No. The emails and CVs generated are personalized and natural. Nothing suggests automation.

"What types of jobs does this work for?"
→ All industries: tech, finance, consulting, marketing, design, sales, etc. Our AI adapts to your profile.

"Can I really start for free?"
→ Yes, 10 free credits without a credit card. You can test all features.

"How long to see results?"
→ Many users get responses within the first few days. On average, 3x more interviews than applying manually.

"Is my data secure?"
→ Yes, we never share your info. Everything is encrypted and hosted in Europe (Firebase/Google Cloud).

═══════════════════════════════════════════════════════════════
YOUR GOAL
═══════════════════════════════════════════════════════════════
Help visitors understand if Cubbbe is right for them. Answer honestly, don't oversell. If someone isn't in our target audience (e.g., already employed with no intention to move), say so kindly.`;

// Session storage key
const SESSION_STORAGE_KEY = 'cubbbe_landing_chat';

// Keywords that indicate high intent (trigger CTA)
const HIGH_INTENT_KEYWORDS = [
    'sign up', 'signup', 'start', 'try', 'begin', 'create account',
    'how do i start', 'get started', 'free trial', 'pricing', 'subscribe',
    'register', 'join', "i'm interested", 'i want to', 'let me try'
];

export function useLandingAssistant() {
    const [messages, setMessages] = useState<LandingMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showCTA, setShowCTA] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Load messages from sessionStorage on mount
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Convert timestamp strings back to Date objects
                const messagesWithDates = parsed.map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }));
                setMessages(messagesWithDates);
            }
        } catch (error) {
            console.error('Error loading chat from sessionStorage:', error);
        }
    }, []);

    // Save messages to sessionStorage whenever they change
    useEffect(() => {
        if (messages.length > 0) {
            try {
                sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(messages));
            } catch (error) {
                console.error('Error saving chat to sessionStorage:', error);
            }
        }
    }, [messages]);

    // Detect current section based on scroll position
    const detectSection = useCallback((): LandingMetadata['section'] => {
        if (typeof window === 'undefined') return 'unknown';

        const scrollY = window.scrollY;
        const viewportHeight = window.innerHeight;

        // Simple heuristic based on scroll position
        if (scrollY < viewportHeight * 0.8) return 'hero';
        if (scrollY < viewportHeight * 2) return 'features';
        if (scrollY < viewportHeight * 3) return 'pricing';
        return 'unknown';
    }, []);

    // Check if message indicates high intent
    const checkHighIntent = useCallback((text: string): boolean => {
        const lowerText = text.toLowerCase();
        return HIGH_INTENT_KEYWORDS.some(keyword => lowerText.includes(keyword));
    }, []);

    // Generate unique ID
    const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Send a message to the assistant
    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || isLoading) return;

        // Cancel any ongoing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const trimmedContent = content.trim();

        // Check for high intent
        if (checkHighIntent(trimmedContent)) {
            setShowCTA(true);
        }

        // Add user message
        const userMessage: LandingMessage = {
            id: generateId(),
            role: 'user',
            content: trimmedContent,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        // Create placeholder for assistant response
        const assistantMessageId = generateId();
        setMessages(prev => [...prev, {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
        }]);

        try {
            // Build conversation history - exclude welcome-only messages
            // Perplexity needs: system -> user -> assistant -> user...
            // Filter to only include actual conversation exchanges
            const conversationMessages = messages.filter((msg, idx) => {
                // Skip if it's just the welcome message with no user messages yet
                if (idx === 0 && msg.role === 'assistant' && messages.length === 1) {
                    return false;
                }
                return true;
            }).slice(-6);

            // Only include history if there's at least one user message
            const hasUserMessage = conversationMessages.some(m => m.role === 'user');
            const recentMessages = hasUserMessage ? conversationMessages.map(msg => ({
                role: msg.role,
                content: msg.content
            })) : [];

            // Get current section
            const section = detectSection();

            // Create abort controller
            abortControllerRef.current = new AbortController();

            // Build messages array for GPT
            const apiMessages = [
                {
                    role: 'system',
                    content: LANDING_SYSTEM_PROMPT
                },
                ...recentMessages,
                {
                    role: 'user',
                    content: trimmedContent
                }
            ];

            // Call chat-fast API (GPT-4o-mini - available locally)
            const response = await fetch('/api/chat-fast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: abortControllerRef.current.signal,
                body: JSON.stringify({
                    messages: apiMessages,
                    temperature: 0.7,
                    max_tokens: 300
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            // Extract response text from GPT format
            let responseText = '';
            if (data.choices?.[0]?.message?.content) {
                responseText = data.choices[0].message.content;
            } else if (data.error) {
                throw new Error(data.error);
            } else {
                responseText = "I'm sorry, I couldn't process that. Please try again.";
            }

            // Check if response indicates high intent (from assistant's response)
            if (responseText.toLowerCase().includes('get started') ||
                responseText.toLowerCase().includes('sign up') ||
                responseText.toLowerCase().includes('free')) {
                setShowCTA(true);
            }

            // Update assistant message with response
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                    ? { ...msg, content: responseText, isStreaming: false }
                    : msg
            ));

        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                // Request was cancelled, remove the placeholder
                setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
            } else {
                console.error('Error sending message:', error);
                // Update with error message
                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: "I'm having trouble connecting right now. Please try again.", isStreaming: false }
                        : msg
                ));
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [messages, isLoading, detectSection, checkHighIntent]);

    // Add the welcome message (called when chat opens for first time)
    const addWelcomeMessage = useCallback(() => {
        if (messages.length === 0) {
            const welcomeMessage: LandingMessage = {
                id: generateId(),
                role: 'assistant',
                content: "Hey 👋 I'm here to help you understand how Cubbbe can accelerate your job search. Ask me anything!",
                timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
        }
    }, [messages.length]);

    // Clear chat history and reset to welcome message
    const clearChat = useCallback(() => {
        const welcomeMessage: LandingMessage = {
            id: generateId(),
            role: 'assistant',
            content: "Hey 👋 I'm here to help you understand how Cubbbe can accelerate your job search. Ask me anything!",
            timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
        setShowCTA(false);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }, []);

    return {
        messages,
        isLoading,
        showCTA,
        sendMessage,
        addWelcomeMessage,
        clearChat,
    };
}
