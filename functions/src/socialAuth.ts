import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';
import * as fetch from 'node-fetch';
import * as crypto from 'crypto';

// Initialize admin if not already (it is in index.ts, but good for portability)
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// ==========================================
// HELPERS
// ==========================================

async function getPlatformConfig(platform: string) {
    const doc = await db.collection('settings').doc(`social_${platform}`).get();
    if (!doc.exists) {
        throw new Error(`Configuration for ${platform} not found.`);
    }
    const data = doc.data();
    // For Twitter, clientSecret is optional (PKCE)
    if (platform !== 'twitter' && (!data?.credentials?.clientId || !data?.credentials?.clientSecret)) {
        throw new Error(`Client ID or Secret missing for ${platform}.`);
    }
    if (platform === 'twitter' && !data?.credentials?.clientId) {
        throw new Error(`Client ID missing for ${platform}.`);
    }
    return {
        clientId: data.credentials.clientId,
        clientSecret: data.credentials.clientSecret,
        ...data.credentials
    };
}

function getRedirectUri(req: any) {
    // Determine the function URL for the callback
    // In production, this is usually https://region-project.cloudfunctions.net/authCallback
    const projectId = process.env.GCLOUD_PROJECT;
    const region = 'us-central1'; // Or dynamic?
    // Fallback for emulator or custom
    if (req.hostname === 'localhost' || req.hostname === '127.0.0.1') {
        return `${req.protocol}://${req.get('host')}/authCallback`;
    }
    return `https://${region}-${projectId}.cloudfunctions.net/authCallback`;
}

// PKCE Helpers
function generateCodeVerifier() {
    return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string) {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// ==========================================
// 1. AUTH REDIRECT
// ==========================================

// ==========================================
// 1. AUTH REDIRECT
// ==========================================

export const authRedirect = functions.https.onRequest(async (req, res) => {
    // Basic CORS check
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.status(204).send('');
        return;
    }

    const platform = req.query.platform as string;

    if (!['linkedin', 'twitter', 'reddit'].includes(platform)) {
        res.status(400).send('Invalid platform');
        return;
    }

    try {
        const config = await getPlatformConfig(platform);
        const redirectUri = getRedirectUri(req);
        // Use random state for security
        const state = crypto.randomBytes(16).toString('hex');

        let authUrl = '';

        if (platform === 'linkedin') {
            const scope = 'w_member_social openid profile email w_organization_social r_organization_social rw_organization_admin';
            // Encode state to include platform for the callback
            const stateParam = `platform=${platform}&nonce=${state}`;
            authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(stateParam)}&scope=${encodeURIComponent(scope)}`;
        }
        else if (platform === 'twitter') {
            const scope = 'tweet.read tweet.write users.read offline.access';
            const codeVerifier = generateCodeVerifier();
            const codeChallenge = generateCodeChallenge(codeVerifier);

            // Store verifier in Firestore to retrieve it in callback (PKCE requirement)
            // Storing state as doc ID
            await db.collection('auth_states').doc(state).set({
                platform: 'twitter',
                codeVerifier,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Twitter OAuth 2.0 URL
            // Force consent to ensure we receive a refresh_token
            authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256&prompt=consent`;
        }
        else if (platform === 'reddit') {
            const scope = 'submit identity mysubreddits read';
            const stateParam = `platform=${platform}&nonce=${state}`;
            authUrl = `https://www.reddit.com/api/v1/authorize?client_id=${config.clientId}&response_type=code&state=${encodeURIComponent(stateParam)}&redirect_uri=${encodeURIComponent(redirectUri)}&duration=permanent&scope=${encodeURIComponent(scope)}`;
        }

        res.redirect(authUrl);

    } catch (error: any) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

// ==========================================
// 2. AUTH CALLBACK
// ==========================================

export const authCallback = functions.https.onRequest(async (req, res) => {
    // Basic CORS check
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.status(204).send('');
        return;
    }

    const code = req.query.code as string;
    const state = req.query.state as string; // This is either the full params string (LinkedIn/Reddit) or just the ID (Twitter)
    const error = req.query.error as string;

    if (error) {
        res.status(400).send(`Auth error: ${error}`);
        return;
    }

    if (!code || !state) {
        res.status(400).send('Missing code or state');
        return;
    }

    // Determine platform
    let platform = '';
    let codeVerifier = '';

    // Check if state is URLSearchParams style (LinkedIn/Reddit) or direct ID (Twitter)
    if (state.includes('platform=')) {
        const params = new URLSearchParams(state);
        platform = params.get('platform') || '';
    } else {
        // Assume it's a state ID for Twitter (or lookup in DB)
        const stateDoc = await db.collection('auth_states').doc(state).get();
        if (stateDoc.exists) {
            const data = stateDoc.data();
            platform = data?.platform;
            codeVerifier = data?.codeVerifier;
            // Cleanup: Delete the state doc
            await db.collection('auth_states').doc(state).delete();
        } else {
            // State not found or expired
            console.error(`State ${state} not found in auth_states`);
        }
    }

    if (!platform || !['linkedin', 'twitter', 'reddit'].includes(platform)) {
        res.status(400).send('Invalid or expired authentication state.');
        return;
    }

    try {
        const config = await getPlatformConfig(platform);
        const redirectUri = getRedirectUri(req);

        let accessToken = '';
        let refreshToken = '';
        let expiresIn = 0;
        let personUrn = '';

        // Exchange Code
        if (platform === 'linkedin') {
            const tokenUrl = `https://www.linkedin.com/oauth/v2/accessToken`;
            const body = new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: config.clientId,
                client_secret: config.clientSecret
            });

            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body
            });
            const data = await response.json();

            if (data.error) throw new Error(data.error_description || data.error);

            accessToken = data.access_token;
            expiresIn = data.expires_in;
            refreshToken = data.refresh_token;

            // Fetch Profile ID (Person URN)
            const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const profile = await profileRes.json();
            if (profile.sub) {
                personUrn = profile.sub;
            }
        }
        else if (platform === 'twitter') {
            // OAuth 2.0 PKCE Token Exchange
            const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
            const headers: any = {
                'Content-Type': 'application/x-www-form-urlencoded'
            };

            if (config.clientSecret) {
                const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
                headers['Authorization'] = `Basic ${auth}`;
            }

            const body = new URLSearchParams({
                code,
                grant_type: 'authorization_code',
                client_id: config.clientId,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier || '' // Must be the same verifier used in authRedirect
            });

            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers,
                body
            });

            const data = await response.json();
            console.log('Twitter Token Response:', JSON.stringify(data)); // DEBUG log

            if (data.error) throw new Error(data.error_description || JSON.stringify(data));

            if (!data.refresh_token) {
                console.error('Missing refresh_token in Twitter response!', data);
                throw new Error('Twitter did not return a refresh token. Please revoke access in Twitter Settings and try again.');
            }

            accessToken = data.access_token;
            refreshToken = data.refresh_token;
            expiresIn = data.expires_in;
        }
        else if (platform === 'reddit') {
            const tokenUrl = 'https://www.reddit.com/api/v1/access_token';
            const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
            const body = new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri
            });

            // Reddit requires User-Agent
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Jobzai/1.0.0'
                },
                body
            });
            const data = await response.json();

            if (data.error) throw new Error(data.error);

            accessToken = data.access_token;
            refreshToken = data.refresh_token;
            expiresIn = data.expires_in;
        }

        // Save to Firestore
        await db.collection('settings').doc(`social_${platform}`).update({
            'credentials.accessToken': accessToken,
            ...(refreshToken && { 'credentials.refreshToken': refreshToken }),
            ...(personUrn && { 'credentials.personUrn': personUrn }),
            ...(expiresIn && { 'credentials.expiresAt': Date.now() + (expiresIn * 1000) }),
            enabled: true,
            updatedAt: Date.now()
        });

        // Send a self-closing success page instead of redirecting
        // The parent window polls for popup.closed and reloads configs
        res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Connected!</title></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb;">
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
                    <h2 style="color: #111827; margin-bottom: 8px;">${platform.charAt(0).toUpperCase() + platform.slice(1)} Connected!</h2>
                    <p style="color: #6b7280; margin-bottom: 24px;">You can close this window now.</p>
                    <p style="color: #9ca3af; font-size: 12px;">This window will close automatically...</p>
                </div>
                <script>setTimeout(() => window.close(), 2000);</script>
            </body>
            </html>
        `);

    } catch (err: any) {
        console.error(err);
        res.status(500).send(`Authentication failed: ${err.message}`);
    }
});
