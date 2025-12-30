import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import OpenAI from 'openai';

// Initialize OpenAI client with Firestore API key
let openai: OpenAI | null = null;

export const getOpenAIApiKey = async (): Promise<string> => {
    try {
        // Get API key from Firestore (settings/openai)
        console.log('🔑 Attempting to retrieve OpenAI API key from Firestore...');
        const settingsDoc = await admin.firestore().collection('settings').doc('openai').get();

        if (settingsDoc.exists) {
            const data = settingsDoc.data();
            console.log('   Document exists, fields:', Object.keys(data || {}));
            const apiKey = data?.apiKey || data?.api_key;
            if (apiKey) {
                console.log('✅ OpenAI API key retrieved from Firestore (first 10 chars):', apiKey.substring(0, 10) + '...');
                return apiKey;
            } else {
                console.warn('⚠️  Document exists but apiKey field is missing. Available fields:', Object.keys(data || {}));
            }
        } else {
            console.warn('⚠️  Document settings/openai does not exist in Firestore');
        }
    } catch (error: any) {
        console.error('❌ Failed to retrieve API key from Firestore:', error);
        console.error('   Error message:', error?.message);
        console.error('   Error code:', error?.code);
    }

    // Fallback to environment variable
    if (process.env.OPENAI_API_KEY) {
        console.log('Using OpenAI API key from environment variable');
        return process.env.OPENAI_API_KEY;
    }

    // Fallback to Firebase config
    try {
        const config = functions.config();
        // Check both 'api_key' and 'key' for backwards compatibility
        const firebaseConfigKey = config.openai?.api_key || config.openai?.key;
        if (firebaseConfigKey) {
            console.log('✅ Using OpenAI API key from Firebase config (first 10 chars):', firebaseConfigKey.substring(0, 10) + '...');
            return firebaseConfigKey;
        }
    } catch (e) {
        console.warn('Could not access Firebase config:', e);
    }

    throw new Error('OpenAI API key not found in Firestore (settings/openai), environment, or Firebase config');
};

// Initialize OpenAI client lazily
export const getOpenAIClient = async (): Promise<OpenAI> => {
    if (!openai) {
        const apiKey = await getOpenAIApiKey();
        openai = new OpenAI({ apiKey });
    }
    return openai;
};
