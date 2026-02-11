import { useState } from 'react';
import {
    collection,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SocialPost, SocialPostData, SocialPlatform, SocialPostStatus } from '../types/socialPost';

const COLLECTION = 'social_posts';

export function useSocialPosts() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all posts
    const getAllPosts = async (): Promise<SocialPost[]> => {
        setLoading(true);
        try {
            const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            })) as SocialPost[];
        } catch (err: any) {
            console.error('Error fetching social posts:', err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Fetch posts by platform
    const getPostsByPlatform = async (platform: SocialPlatform): Promise<SocialPost[]> => {
        setLoading(true);
        try {
            const q = query(
                collection(db, COLLECTION),
                where('platform', '==', platform),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            })) as SocialPost[];
        } catch (err: any) {
            console.error('Error fetching posts by platform:', err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Fetch posts by status
    const getPostsByStatus = async (status: SocialPostStatus): Promise<SocialPost[]> => {
        setLoading(true);
        try {
            const q = query(
                collection(db, COLLECTION),
                where('status', '==', status),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            })) as SocialPost[];
        } catch (err: any) {
            console.error('Error fetching posts by status:', err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Fetch posts by group
    const getPostsByGroup = async (groupId: string): Promise<SocialPost[]> => {
        setLoading(true);
        try {
            const q = query(
                collection(db, COLLECTION),
                where('groupId', '==', groupId)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            })) as SocialPost[];
        } catch (err: any) {
            console.error('Error fetching posts by group:', err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Get single post by ID
    const getPostById = async (id: string): Promise<SocialPost | null> => {
        setLoading(true);
        try {
            const docRef = doc(db, COLLECTION, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as SocialPost;
            }
            return null;
        } catch (err: any) {
            console.error('Error fetching post by id:', err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Create a new post
    const createPost = async (postData: Partial<SocialPostData>): Promise<string> => {
        setLoading(true);
        try {
            const docRef = await addDoc(collection(db, COLLECTION), {
                ...postData,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });
            return docRef.id;
        } catch (err: any) {
            console.error('Error creating social post:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Update a post
    const updatePost = async (id: string, postData: Partial<SocialPostData>): Promise<void> => {
        setLoading(true);
        try {
            const docRef = doc(db, COLLECTION, id);
            await updateDoc(docRef, {
                ...postData,
                updatedAt: Timestamp.now(),
            });
        } catch (err: any) {
            console.error('Error updating social post:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Delete a post
    const deletePost = async (id: string): Promise<void> => {
        setLoading(true);
        try {
            await deleteDoc(doc(db, COLLECTION, id));
        } catch (err: any) {
            console.error('Error deleting social post:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        getAllPosts,
        getPostsByPlatform,
        getPostsByStatus,
        getPostsByGroup,
        getPostById,
        createPost,
        updatePost,
        deletePost,
    };
}
