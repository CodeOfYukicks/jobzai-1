import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SocialPlatform, SocialPlatformConfig } from '../types/socialPost';

const SETTINGS_COLLECTION = 'settings';

export async function getSocialPlatformConfig(platform: SocialPlatform): Promise<SocialPlatformConfig | null> {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, `social_${platform}`);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
            return snapshot.data() as SocialPlatformConfig;
        } else {
            return null;
        }
    } catch (error) {
        console.error(`Error fetching config for ${platform}:`, error);
        return null;
    }
}

export async function saveSocialPlatformConfig(
    platform: SocialPlatform,
    credentials: SocialPlatformConfig['credentials']
): Promise<void> {
    const docRef = doc(db, SETTINGS_COLLECTION, `social_${platform}`);
    const config: SocialPlatformConfig = {
        platform,
        enabled: true,
        credentials,
        updatedAt: Date.now(),
    };

    try {
        await setDoc(docRef, config);
    } catch (error) {
        console.error(`Error saving config for ${platform}:`, error);
        throw error;
    }
}

export async function togglePlatformStatus(platform: SocialPlatform, enabled: boolean): Promise<void> {
    const docRef = doc(db, SETTINGS_COLLECTION, `social_${platform}`);
    try {
        await updateDoc(docRef, { enabled, updatedAt: Date.now() });
    } catch (error) {
        console.error(`Error toggling status for ${platform}:`, error);
        throw error;
    }
}
