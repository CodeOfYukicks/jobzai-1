import { Timestamp } from 'firebase/firestore';

export type SocialPlatform = 'linkedin' | 'twitter' | 'reddit';
export type SocialTone = 'professional' | 'casual' | 'inspirational' | 'informative';
export type SocialPostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type TweetTemplate = 'news_flash' | 'hot_take' | 'data_drop' | 'story_hook' | 'question_hook' | 'thread_opener';
export type ContentMode = 'news' | 'topic';

export interface SocialPost {
    id: string;
    // Content
    content: string;
    platform: SocialPlatform;
    tone: SocialTone;
    status: SocialPostStatus;
    // Reddit-specific
    subreddit?: string;
    redditTitle?: string;
    // Media & metadata
    images?: string[];
    hashtags: string[];
    characterCount: number;
    // Scheduling
    scheduledAt?: Timestamp;
    publishedAt?: Timestamp;
    // Grouping (posts created together for different platforms)
    groupId?: string;
    platformPostId?: string;
    // Timestamps
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface SocialPostData extends Omit<SocialPost, 'id'> { }

export interface GenerateSocialPostConfig {
    topic: string;
    platforms: SocialPlatform[];
    tone: SocialTone;
    language: 'fr' | 'en';
    additionalContext?: string;
    mentionBrand?: boolean;
    tweetTemplate?: TweetTemplate;
    contentMode?: ContentMode;
}

// Tweet template metadata for UI display
export const TWEET_TEMPLATES: Record<TweetTemplate, { label: string; icon: string; description: string; descriptionFr: string }> = {
    news_flash: {
        label: 'News Flash',
        icon: '🔴',
        description: 'Breaking news, ultra-short Bloomberg style',
        descriptionFr: 'Flash info ultra-court style Bloomberg',
    },
    hot_take: {
        label: 'Hot Take',
        icon: '🔥',
        description: 'Bold opinion, contrarian angle',
        descriptionFr: 'Opinion tranchée, angle contrarian',
    },
    data_drop: {
        label: 'Data Drop',
        icon: '📊',
        description: 'Lead with a stat, add context',
        descriptionFr: 'Stat percutante + contexte',
    },
    story_hook: {
        label: 'Story Hook',
        icon: '💬',
        description: 'Personal experience, "I just..."',
        descriptionFr: 'Expérience perso, "J\'ai..."',
    },
    question_hook: {
        label: 'Question',
        icon: '❓',
        description: 'Provocative question for engagement',
        descriptionFr: 'Question provocante → engagement',
    },
    thread_opener: {
        label: 'Thread',
        icon: '🧵',
        description: 'Tease a thread, "Here\'s what I found:"',
        descriptionFr: 'Teaser "Voici ce que j\'ai trouvé:"',
    },
};

// Content mode metadata for UI display
export const CONTENT_MODES: Record<ContentMode, { label: string; labelFr: string; icon: string; description: string; descriptionFr: string }> = {
    news: {
        label: 'News',
        labelFr: 'Actualité',
        icon: '📰',
        description: 'React to current/trending news',
        descriptionFr: 'Réagir à une actualité',
    },
    topic: {
        label: 'Topic',
        labelFr: 'Sujet',
        icon: '💡',
        description: 'Industry insight or thought leadership',
        descriptionFr: 'Insight sectoriel ou thought leadership',
    },
};

export interface GeneratedSocialContent {
    platform: SocialPlatform;
    content: string;
    hashtags: string[];
    characterCount: number;
    // Reddit-specific
    redditTitle?: string;
    suggestedSubreddits?: string[];
}

export interface BatchTweetResult {
    id: string; // unique local ID
    topic: string;
    template: TweetTemplate;
    content: GeneratedSocialContent;
}

export interface SocialPlatformConfig {
    platform: SocialPlatform;
    enabled: boolean;
    credentials: {
        accessToken?: string;
        refreshToken?: string;
        clientId?: string;
        clientSecret?: string;
        expiresAt?: number;
        // Reddit specific
        username?: string;
        password?: string;
        userAgent?: string;
        // LinkedIn specific
        // LinkedIn specific
        personUrn?: string;
        organizationId?: string;
    };
    updatedAt: number;
}

// Platform character limits
export const PLATFORM_LIMITS: Record<SocialPlatform, number> = {
    linkedin: 3000,
    twitter: 280,
    reddit: 40000,
};

// Platform display info
export const PLATFORM_INFO: Record<SocialPlatform, { name: string; color: string; bgColor: string; icon: string }> = {
    linkedin: { name: 'LinkedIn', color: '#0A66C2', bgColor: '#EBF4FF', icon: '💼' },
    twitter: { name: 'Twitter / X', color: '#1DA1F2', bgColor: '#E8F5FD', icon: '𝕏' },
    reddit: { name: 'Reddit', color: '#FF4500', bgColor: '#FFF0EB', icon: '🔴' },
};
