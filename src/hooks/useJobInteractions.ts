/**
 * useJobInteractions Hook
 * 
 * Tracks user interactions with jobs for the feedback loop.
 * Provides save/unsave, dismiss, and view tracking functionality.
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';

type InteractionType = 'view' | 'click' | 'save' | 'unsave' | 'apply' | 'dismiss' | 'hide';
type InteractionSource = 'for_you' | 'explore' | 'search';

interface TrackOptions {
    source?: InteractionSource;
    matchScore?: number;
    position?: number;
    timeSpentMs?: number;
}

const API_BASE = 'https://us-central1-jobzai.cloudfunctions.net';

export function useJobInteractions() {
    const { currentUser, userData } = useAuth();
    const [savedJobs, setSavedJobs] = useState<string[]>([]);
    const [dismissedJobs, setDismissedJobs] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load saved/dismissed jobs from user data
    useEffect(() => {
        if (userData) {
            setSavedJobs(userData.savedJobs || []);
            setDismissedJobs(userData.dismissedJobs || []);
        }
    }, [userData]);

    // Track any interaction
    const trackInteraction = useCallback(async (
        jobId: string,
        action: InteractionType,
        options?: TrackOptions
    ) => {
        if (!currentUser?.uid) return;

        try {
            await fetch(`${API_BASE}/trackJobInteraction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.uid,
                    jobId,
                    action,
                    timeSpentMs: options?.timeSpentMs,
                    metadata: {
                        source: options?.source,
                        matchScore: options?.matchScore,
                        position: options?.position,
                    },
                }),
            });
        } catch (error) {
            console.error('Failed to track interaction:', error);
        }
    }, [currentUser?.uid]);

    // Save a job
    const saveJob = useCallback(async (jobId: string, options?: TrackOptions) => {
        if (!currentUser?.uid) return false;

        setIsLoading(true);
        try {
            // Optimistic update
            setSavedJobs(prev => [...prev, jobId]);
            
            // Update Firestore directly for faster response
            await updateDoc(doc(db, 'users', currentUser.uid), {
                savedJobs: arrayUnion(jobId)
            });

            // Track interaction in background
            trackInteraction(jobId, 'save', options);
            
            return true;
        } catch (error) {
            // Rollback on error
            setSavedJobs(prev => prev.filter(id => id !== jobId));
            console.error('Failed to save job:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [currentUser?.uid, trackInteraction]);

    // Unsave a job
    const unsaveJob = useCallback(async (jobId: string) => {
        if (!currentUser?.uid) return false;

        setIsLoading(true);
        try {
            // Optimistic update
            setSavedJobs(prev => prev.filter(id => id !== jobId));
            
            // Update Firestore
            await updateDoc(doc(db, 'users', currentUser.uid), {
                savedJobs: arrayRemove(jobId)
            });

            // Track interaction in background
            trackInteraction(jobId, 'unsave');
            
            return true;
        } catch (error) {
            // Rollback on error
            setSavedJobs(prev => [...prev, jobId]);
            console.error('Failed to unsave job:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [currentUser?.uid, trackInteraction]);

    // Toggle save state
    const toggleSave = useCallback(async (jobId: string, options?: TrackOptions) => {
        if (savedJobs.includes(jobId)) {
            return unsaveJob(jobId);
        } else {
            return saveJob(jobId, options);
        }
    }, [savedJobs, saveJob, unsaveJob]);

    // Dismiss a job (not interested)
    const dismissJob = useCallback(async (jobId: string, options?: TrackOptions) => {
        if (!currentUser?.uid) return false;

        setIsLoading(true);
        try {
            // Optimistic update
            setDismissedJobs(prev => [...prev, jobId]);
            
            // Update Firestore
            await updateDoc(doc(db, 'users', currentUser.uid), {
                dismissedJobs: arrayUnion(jobId)
            });

            // Track interaction in background
            trackInteraction(jobId, 'dismiss', options);
            
            return true;
        } catch (error) {
            // Rollback on error
            setDismissedJobs(prev => prev.filter(id => id !== jobId));
            console.error('Failed to dismiss job:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [currentUser?.uid, trackInteraction]);

    // Track a job view (with time spent)
    const trackView = useCallback((jobId: string, options?: TrackOptions) => {
        trackInteraction(jobId, 'view', options);
    }, [trackInteraction]);

    // Track a job click
    const trackClick = useCallback((jobId: string, options?: TrackOptions) => {
        trackInteraction(jobId, 'click', options);
    }, [trackInteraction]);

    // Track an apply action
    const trackApply = useCallback((jobId: string, options?: TrackOptions) => {
        trackInteraction(jobId, 'apply', options);
    }, [trackInteraction]);

    // Check if a job is saved
    const isJobSaved = useCallback((jobId: string) => {
        return savedJobs.includes(jobId);
    }, [savedJobs]);

    // Check if a job is dismissed
    const isJobDismissed = useCallback((jobId: string) => {
        return dismissedJobs.includes(jobId);
    }, [dismissedJobs]);

    return {
        // State
        savedJobs,
        dismissedJobs,
        isLoading,
        
        // Actions
        saveJob,
        unsaveJob,
        toggleSave,
        dismissJob,
        trackView,
        trackClick,
        trackApply,
        
        // Helpers
        isJobSaved,
        isJobDismissed,
    };
}




