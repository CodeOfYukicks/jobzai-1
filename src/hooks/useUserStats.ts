import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import type { UserStats } from '../types/stats';

export function useUserStats() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (doc) => {
        if (doc.exists()) {
          setStats({
            activeCampaigns: doc.data().activeCampaigns || 0,
            responseRate: doc.data().responseRate || 0,
            newMatches: doc.data().newMatches || 0,
            totalApplications: doc.data().totalApplications || 0,
            templates: doc.data().templates || 0
          });
        }
        setLoading(false);
      },
      (error) => {
        // Handle permission errors gracefully
        if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
          console.warn('⚠️ Permission denied when loading user stats. This may be expected if Firestore rules restrict access.');
          setStats(null);
        } else {
          setError(error);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  return { stats, loading, error };
} 