import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export interface BlogSchedulerConfig {
    enabled: boolean;
    articlesPerDay: number;
    categories: string[];
    language: 'fr' | 'en';
    tone: 'professional' | 'casual' | 'authoritative' | 'friendly';
    lastRun: Date | null;
    nextScheduledRun: Date | null;
    totalGenerated: number;
    monthlyGenerated: number;
    monthlyLimit: number;
    currentMonth: string; // Format: "2025-12"
}

const DEFAULT_CONFIG: BlogSchedulerConfig = {
    enabled: false,
    articlesPerDay: 1,
    categories: ['Career Advice'],
    language: 'fr',
    tone: 'professional',
    lastRun: null,
    nextScheduledRun: null,
    totalGenerated: 0,
    monthlyGenerated: 0,
    monthlyLimit: 100,
    currentMonth: new Date().toISOString().slice(0, 7)
};

export function useBlogScheduler() {
    const [config, setConfig] = useState<BlogSchedulerConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Get user-specific doc ref for scheduler config
    const getDocRef = () => {
        const user = auth.currentUser;
        if (!user) return null;
        return doc(db, 'users', user.uid, 'settings', 'blog_scheduler');
    };

    // Load scheduler config
    useEffect(() => {
        // Wait for auth to be ready
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                loadConfig();
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const docRef = getDocRef();
            if (!docRef) {
                setLoading(false);
                return;
            }

            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();

                // Reset monthly counter if new month
                const currentMonth = new Date().toISOString().slice(0, 7);
                if (data.currentMonth !== currentMonth) {
                    data.monthlyGenerated = 0;
                    data.currentMonth = currentMonth;
                }

                setConfig({
                    ...DEFAULT_CONFIG,
                    ...data,
                    lastRun: data.lastRun?.toDate() || null,
                    nextScheduledRun: data.nextScheduledRun?.toDate() || null,
                });
            } else {
                // Create default config
                await setDoc(docRef, {
                    ...DEFAULT_CONFIG,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            }
        } catch (error) {
            console.error('Error loading scheduler config:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateConfig = async (updates: Partial<BlogSchedulerConfig>) => {
        setSaving(true);
        try {
            const docRef = getDocRef();
            if (!docRef) {
                throw new Error('User not authenticated');
            }

            // Try to update, if doc doesn't exist, create it
            try {
                await updateDoc(docRef, {
                    ...updates,
                    updatedAt: serverTimestamp(),
                });
            } catch {
                // Doc doesn't exist, create it
                await setDoc(docRef, {
                    ...DEFAULT_CONFIG,
                    ...updates,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            }

            setConfig(prev => ({ ...prev, ...updates }));
        } catch (error) {
            console.error('Error updating scheduler config:', error);
            throw error;
        } finally {
            setSaving(false);
        }
    };

    const toggleScheduler = async (enabled: boolean) => {
        await updateConfig({ enabled });
    };

    const setFrequency = async (articlesPerDay: number) => {
        await updateConfig({ articlesPerDay });
    };

    const setCategories = async (categories: string[]) => {
        await updateConfig({ categories });
    };

    const setLanguage = async (language: 'fr' | 'en') => {
        await updateConfig({ language });
    };

    const setTone = async (tone: BlogSchedulerConfig['tone']) => {
        await updateConfig({ tone });
    };

    const canGenerateMore = () => {
        return config.monthlyGenerated < config.monthlyLimit;
    };

    const remainingThisMonth = () => {
        return Math.max(0, config.monthlyLimit - config.monthlyGenerated);
    };

    return {
        config,
        loading,
        saving,
        toggleScheduler,
        setFrequency,
        setCategories,
        setLanguage,
        setTone,
        updateConfig,
        canGenerateMore,
        remainingThisMonth,
        reload: loadConfig,
    };
}
