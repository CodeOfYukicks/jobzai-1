import { Timestamp } from 'firebase/firestore';

export type SocialPlatform = 'linkedin' | 'twitter' | 'reddit';
export type SocialTone = 'professional' | 'casual' | 'inspirational' | 'informative';
export type SocialPostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

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
    // Twitter thread
    threadTweets?: string[];
}

export interface SocialPostData extends Omit<SocialPost, 'id'> { }

export interface GenerateSocialPostConfig {
    topic: string;
    platforms: SocialPlatform[];
    tone: SocialTone;
    language: 'fr' | 'en';
    additionalContext?: string;
    mentionBrand?: boolean;
    isThread?: boolean;
}

export interface GeneratedSocialContent {
    platform: SocialPlatform;
    content: string;
    hashtags: string[];
    characterCount: number;
    // Reddit-specific
    redditTitle?: string;
    suggestedSubreddits?: string[];
    // Twitter thread
    threadTweets?: string[];
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
