import { onRequest } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import * as fetch from 'node-fetch';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// Duplicated helper to avoid imports from other files (simplification)
async function getPlatformConfig(platform: string) {
    const doc = await db.collection('settings').doc(`social_${platform}`).get();
    if (!doc.exists) {
        throw new Error(`Configuration for ${platform} not found.`);
    }
    const data = doc.data();
    // Allow manual token entry for Twitter if Client ID is missing but Access Token is present
    if (platform === 'twitter' && data?.credentials?.accessToken && !data?.credentials?.clientId) {
        return { ...data.credentials };
    }

    // For Twitter, clientSecret is optional (PKCE)
    if (platform !== 'twitter' && (!data?.credentials?.clientId || !data?.credentials?.clientSecret)) {
        // If tokens are present manually, maybe we can skip this check? 
        // But best practice is to require config.
        // For now, let's allow if accessToken exists, assuming manual entry or previous oauth.
        if (data?.credentials?.accessToken) return { ...data.credentials };

        throw new Error(`Client ID or Secret missing for ${platform}.`);
    }
    if (platform === 'twitter' && !data?.credentials?.clientId) {
        // Twitter needs at least Client ID
        if (data?.credentials?.accessToken) return { ...data.credentials };
        throw new Error(`Client ID missing for ${platform}.`);
    }
    return {
        clientId: data.credentials.clientId,
        clientSecret: data.credentials.clientSecret,
        ...data.credentials
    };
}

// Shared function for both HTTP and Scheduled triggers
export async function executePublish(
    platform: string,
    content: string,
    subreddit?: string,
    redditTitle?: string,
    images?: string[]
) {
    const config = await getPlatformConfig(platform);

    switch (platform) {
        case 'linkedin':
            return await publishToLinkedIn(content, config, images);
        case 'twitter':
            return await publishToTwitter(content, config, images);
        case 'reddit':
            return await publishToReddit(content, subreddit || '', redditTitle || '', config);
        default:
            throw new Error(`Platform ${platform} not supported`);
    }
}

export const publishPost = onRequest({ cors: true }, async (req, res) => {
    // Basic CORS check (handled by cors: true options generally, but Ensure Method)
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    const { platform, content, subreddit, redditTitle, images } = req.body;

    if (!platform || !content) {
        res.status(400).json({ success: false, error: 'Missing platform or content' });
        return;
    }

    try {
        const result = await executePublish(platform, content, subreddit, redditTitle, images);
        res.status(200).json(result);

    } catch (error: any) {
        console.error(`Error publishing to ${platform}:`, error);
        res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
    }
});

// ==========================================
// PLATFORM SPECIFIC LOGIC
// ==========================================

async function publishToLinkedIn(content: string, config: any, images?: string[]) {
    const { accessToken, personUrn, organizationId } = config;

    if (!accessToken || (!personUrn && !organizationId)) {
        throw new Error('LinkedIn Access Token or Person URN / Organization ID missing.');
    }

    const authorUrn = organizationId ? `urn:li:organization:${organizationId}` : `urn:li:person:${personUrn}`;
    const url = 'https://api.linkedin.com/v2/ugcPosts';

    const body = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
            'com.linkedin.ugc.ShareContent': {
                shareCommentary: { text: content },
                shareMediaCategory: 'NONE' // TODO: implement media upload
            }
        },
        visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
    }

    const data = await response.json();
    return { success: true, platformPostId: data.id };
}

async function publishToTwitter(content: string, config: any, images?: string[]) {
    let { accessToken, refreshToken, clientId, clientSecret } = config;

    if (!accessToken) {
        throw new Error('Twitter Access Token missing.');
    }

    const url = 'https://api.twitter.com/2/tweets';
    const body = { text: content };

    let response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    // Check for 401 or 403 (Token Expired or Invalid Type -> Try Refresh)
    if (!response.ok && (response.status === 401 || response.status === 403) && refreshToken && clientId) {
        console.log('Twitter token expired or invalid, attempting refresh...');
        try {
            const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
            const headers: any = {
                'Content-Type': 'application/x-www-form-urlencoded'
            };

            const refreshBody = new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: clientId
            });

            if (clientSecret) {
                const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
                headers['Authorization'] = `Basic ${auth}`;
            }

            const refreshResponse = await fetch(tokenUrl, {
                method: 'POST',
                headers,
                body: refreshBody
            });

            if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                accessToken = data.access_token;
                const newRefreshToken = data.refresh_token; // Twitter refreshes the refresh token too!

                // Save new tokens to DB
                await db.collection('settings').doc('social_twitter').update({
                    'credentials.accessToken': accessToken,
                    'credentials.refreshToken': newRefreshToken,
                    'credentials.updatedAt': Date.now()
                });

                // Retry request with new token
                response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                });
            } else {
                const refreshError = await refreshResponse.text();
                console.error('Failed to refresh Twitter token:', refreshError);
                throw new Error('Twitter session expired. Please reconnect your account in settings.');
            }
        } catch (err: any) {
            console.error('Error during Twitter token refresh:', err);
            // Re-throw if it's our intentional error
            if (err.message && err.message.includes('Twitter session expired')) {
                throw err;
            }
        }
    }

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
    }

    const data = await response.json();
    return { success: true, platformPostId: data.data.id };
}

async function publishToReddit(content: string, subreddit: string, title: string, config: any) {
    const { accessToken } = config;

    if (!accessToken) {
        throw new Error('Reddit Access Token missing.');
    }

    const url = 'https://oauth.reddit.com/api/submit';
    const params = new URLSearchParams();
    params.append('kind', 'self');
    params.append('sr', subreddit || 'u_me');
    params.append('title', title || content.substring(0, 50) + '...');
    params.append('text', content);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Jobzai/1.0.0'
        },
        body: params
    });

    if (!response.ok) {
        throw new Error('Failed to publish to Reddit');
    }

    const data = await response.json();
    if (data.json && data.json.errors && data.json.errors.length > 0) {
        throw new Error(data.json.errors[0][1] || 'Reddit API Error');
    }

    return {
        success: true,
        platformPostId: data.json?.data?.name
    };
}
