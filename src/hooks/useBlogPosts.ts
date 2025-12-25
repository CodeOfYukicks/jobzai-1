import { useState, useEffect } from 'react';
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
    increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { BlogPost } from '../data/blogPosts';

export interface BlogPostData extends Omit<BlogPost, 'id'> {
    status: 'draft' | 'published';
    createdAt: any;
    updatedAt: any;
}

export function useBlogPosts() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all published posts (for public blog)
    const getPublishedPosts = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, 'blog_posts'),
                where('status', '==', 'published')
            );
            const querySnapshot = await getDocs(q);
            const posts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as BlogPost[];

            // Client-side sort to avoid Firestore Index requirement
            return posts.sort((a, b) => {
                // Sort by createdAt if available, otherwise by date string (less accurate but fallback)
                // Assuming createdAt is a Firestore Timestamp, convert to millis. 
                // However, we didn't type createdAt strictly on BlogPost interface, it relies on strictness.
                // Let's rely on the fact that we recently added createdAt.
                // If not, we just return posts.
                try {
                    return (b as any).createdAt?.toMillis() - (a as any).createdAt?.toMillis();
                } catch (e) {
                    return 0;
                }
            });
        } catch (err: any) {
            console.error("Error fetching published posts:", err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Fetch ALL posts (for admin)
    const getAllPosts = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'blog_posts'), orderBy('date', 'desc'));
            const querySnapshot = await getDocs(q);
            const posts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as (BlogPost & { status: string })[];
            return posts;
        } catch (err: any) {
            console.error("Error fetching all posts:", err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Get single post by Slug
    const getPostBySlug = async (slug: string) => {
        setLoading(true);
        try {
            const q = query(collection(db, 'blog_posts'), where('slug', '==', slug));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return { id: doc.id, ...doc.data() } as BlogPost;
            }
            return null;
        } catch (err: any) {
            console.error("Error fetching post by slug:", err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Create a new post
    const createPost = async (postData: Partial<BlogPostData>) => {
        setLoading(true);
        try {
            const docRef = await addDoc(collection(db, 'blog_posts'), {
                ...postData,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });
            return docRef.id;
        } catch (err: any) {
            console.error("Error creating post:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Update post
    const updatePost = async (id: string, postData: Partial<BlogPostData>) => {
        setLoading(true);
        try {
            const docRef = doc(db, 'blog_posts', id);
            await updateDoc(docRef, {
                ...postData,
                updatedAt: Timestamp.now(),
            });
        } catch (err: any) {
            console.error("Error updating post:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Delete post
    const deletePost = async (id: string) => {
        setLoading(true);
        try {
            await deleteDoc(doc(db, 'blog_posts', id));
        } catch (err: any) {
            console.error("Error deleting post:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Upload Image
    const uploadImage = async (file: File) => {
        setLoading(true);
        try {
            const storageRef = ref(storage, `blog/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            return url;
        } catch (err: any) {
            console.error("Error uploading image:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Increment view count for a post
    const incrementViews = async (postId: string) => {
        try {
            const docRef = doc(db, 'blog_posts', postId);
            await updateDoc(docRef, {
                views: increment(1)
            });
        } catch (err: any) {
            // Silent fail - don't interrupt user experience for view tracking
            console.error("Error incrementing views:", err);
        }
    };

    return {
        loading,
        error,
        getPublishedPosts,
        getAllPosts,
        getPostBySlug,
        createPost,
        updatePost,
        deletePost,
        uploadImage,
        incrementViews
    };
}
