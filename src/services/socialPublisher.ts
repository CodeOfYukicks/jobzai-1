import { SocialPost } from '../types/socialPost';

// ==========================================
// PUBLISHER INTERFACE
// ==========================================

interface PublishResult {
    success: boolean;
    platformPostId?: string;
    error?: string;
}

export async function publishSocialPost(post: SocialPost): Promise<PublishResult> {
    const projectId = 'jobzai';
    const region = 'us-central1';

    // Determine if we are in development environment (localhost)
    // While developing, we often want to use the deployed functions if we aren't running emulators
    // The previous check assumed emulator was running on 5001.
    // Let's default to production URL for now to ensure it works for the user.
    // If they want to use emulators, they can uncomment or set an env var.

    // Construct URL - using production for stability since functions were deployed
    const functionUrl = `https://${region}-${projectId}.cloudfunctions.net/publishPost`;


    try {
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                platform: post.platform,
                content: post.content,
                subreddit: post.subreddit,
                redditTitle: post.redditTitle,
                images: post.images
            })
        });

        const text = await response.text();
        let data: any = {};
        try {
            data = JSON.parse(text);
        } catch (e) {
            // Text response
        }

        if (!response.ok) {
            const errorMessage = data.error || data.message || text || `Failed to publish to ${post.platform}`;
            throw new Error(errorMessage);
        }

        return {
            success: true,
            platformPostId: data.platformPostId
        };

    } catch (error: any) {
        console.error(`Error publishing to ${post.platform}:`, error);
        return { success: false, error: error.message || 'Unknown error occurred during publishing.' };
    }
}
