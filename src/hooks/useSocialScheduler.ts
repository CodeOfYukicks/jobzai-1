import { useState } from 'react';
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SocialPost } from '../types/socialPost';

const COLLECTION = 'social_posts';

export function useSocialScheduler() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Schedule a post for a specific date/time
    const schedulePost = async (postId: string, scheduledDate: Date): Promise<void> => {
        setLoading(true);
        try {
            const docRef = doc(db, COLLECTION, postId);
            await updateDoc(docRef, {
                status: 'scheduled',
                scheduledAt: Timestamp.fromDate(scheduledDate),
                updatedAt: Timestamp.now(),
            });
        } catch (err: any) {
            console.error('Error scheduling post:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Unschedule a post (move back to draft)
    const unschedulePost = async (postId: string): Promise<void> => {
        setLoading(true);
        try {
            const docRef = doc(db, COLLECTION, postId);
            await updateDoc(docRef, {
                status: 'draft',
                scheduledAt: null,
                updatedAt: Timestamp.now(),
            });
        } catch (err: any) {
            console.error('Error unscheduling post:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Reschedule a post to a new date/time
    const reschedulePost = async (postId: string, newDate: Date): Promise<void> => {
        return schedulePost(postId, newDate);
    };

    // Get all scheduled posts
    const getScheduledPosts = async (): Promise<SocialPost[]> => {
        setLoading(true);
        try {
            const q = query(
                collection(db, COLLECTION),
                where('status', '==', 'scheduled'),
                orderBy('scheduledAt', 'asc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            })) as SocialPost[];
        } catch (err: any) {
            console.error('Error fetching scheduled posts:', err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Get posts for a specific date range (for calendar view)
    const getPostsForDateRange = async (startDate: Date, endDate: Date): Promise<SocialPost[]> => {
        setLoading(true);
        try {
            // Get all posts that have a scheduledAt or publishedAt within the range
            const allPosts: SocialPost[] = [];

            // Fetch scheduled posts in range
            const scheduledQuery = query(
                collection(db, COLLECTION),
                where('scheduledAt', '>=', Timestamp.fromDate(startDate)),
                where('scheduledAt', '<=', Timestamp.fromDate(endDate))
            );
            const scheduledSnapshot = await getDocs(scheduledQuery);
            scheduledSnapshot.docs.forEach((d) => {
                allPosts.push({ id: d.id, ...d.data() } as SocialPost);
            });

            // Fetch published posts in range
            const publishedQuery = query(
                collection(db, COLLECTION),
                where('publishedAt', '>=', Timestamp.fromDate(startDate)),
                where('publishedAt', '<=', Timestamp.fromDate(endDate))
            );
            const publishedSnapshot = await getDocs(publishedQuery);
            publishedSnapshot.docs.forEach((d) => {
                // Avoid duplicates
                if (!allPosts.find((p) => p.id === d.id)) {
                    allPosts.push({ id: d.id, ...d.data() } as SocialPost);
                }
            });

            return allPosts;
        } catch (err: any) {
            console.error('Error fetching posts for date range:', err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Mark a scheduled post as published
    const markAsPublished = async (postId: string, platformPostId?: string): Promise<void> => {
        setLoading(true);
        try {
            const docRef = doc(db, COLLECTION, postId);
            await updateDoc(docRef, {
                status: 'published',
                publishedAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                ...(platformPostId && { platformPostId }),
            });
        } catch (err: any) {
            console.error('Error marking post as published:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        schedulePost,
        unschedulePost,
        reschedulePost,
        getScheduledPosts,
        getPostsForDateRange,
        markAsPublished,
    };
}
