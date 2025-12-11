import { useEffect, useRef } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { JobApplication, OutreachMessage } from '../types/job';
import { notify } from '../lib/notify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes

/**
 * Global hook that checks for new Gmail replies in the background
 * This should be mounted once at the App level to run continuously
 */
export function useGmailReplyChecker() {
  const { currentUser } = useAuth();
  const lastCheckRef = useRef<number>(0);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (!currentUser) return;

    const checkRepliesForAllApplications = async () => {
      // Prevent concurrent checks
      if (isCheckingRef.current) {
        return;
      }

      const now = Date.now();
      // Prevent checking too frequently (minimum 60 seconds between checks)
      if (now - lastCheckRef.current < 60000) {
        return;
      }

      isCheckingRef.current = true;
      lastCheckRef.current = now;

      try {
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          console.log('[Gmail-Checker] No auth token available');
          return;
        }

        // Fetch all applications with gmailThreadId directly from Firestore
        const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
        const snapshot = await getDocs(applicationsRef);
        
        const appsWithThreads: JobApplication[] = [];
        snapshot.forEach((docSnap) => {
          const app = { id: docSnap.id, ...docSnap.data() } as JobApplication;
          if (app.gmailThreadId) {
            appsWithThreads.push(app);
          }
        });

        if (appsWithThreads.length === 0) {
          console.log('[Gmail-Checker] No applications with gmailThreadId');
          return;
        }

        console.log(`[Gmail-Checker] Checking ${appsWithThreads.length} applications for new replies...`);

        let newRepliesFound = 0;

        for (const app of appsWithThreads) {
          if (!app.gmailThreadId) continue;

          try {
            const response = await fetch(`${BACKEND_URL}/api/gmail/thread/${app.gmailThreadId}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              if (errorData.needsReconnect) {
                console.warn('[Gmail-Checker] Gmail token expired');
                return;
              }
              continue;
            }

            const data = await response.json();
            
            if (!data.success || !data.reply) {
              continue; // No reply found
            }

            // Check if this specific reply already exists
            const existingMessages = app.conversationHistory || [];
            const replyContent = data.reply.body.substring(0, 50).trim().toLowerCase();
            const replyAlreadyExists = existingMessages.some(msg => {
              if (msg.type !== 'received') return false;
              const existingContent = (msg.content || '').substring(0, 50).trim().toLowerCase();
              return existingContent === replyContent;
            });

            if (replyAlreadyExists) {
              continue;
            }

            // Parse the date
            let replySentAt: string;
            try {
              const parsedDate = new Date(data.reply.date);
              replySentAt = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
            } catch {
              replySentAt = new Date().toISOString();
            }

            console.log(`[Gmail-Checker] ✅ New reply found for ${app.contactName || app.companyName}!`);

            // Create new reply message (avoid undefined values)
            const newReplyMessage: Record<string, any> = {
              id: crypto.randomUUID(),
              type: 'received',
              channel: 'email',
              content: data.reply.body,
              sentAt: replySentAt,
              status: 'replied',
            };
            
            if (data.reply.subject) {
              newReplyMessage.subject = data.reply.subject;
            }

            const updatedHistory = [...existingMessages, newReplyMessage];

            // Prepare update
            const updates: Record<string, any> = {
              conversationHistory: updatedHistory,
              updatedAt: new Date().toISOString(),
            };

            if (app.status === 'contacted' || app.status === 'targets') {
              updates.status = 'replied';
            }

            // Update Firestore
            const appRef = doc(db, 'users', currentUser.uid, 'jobApplications', app.id);
            await updateDoc(appRef, updates);

            newRepliesFound++;
            
            // Create persistent notification + subtle feedback
            await notify.emailReply({
              contactName: app.contactName || app.companyName || 'Unknown',
              contactEmail: app.contactEmail,
              companyName: app.companyName,
              threadId: app.gmailThreadId,
              applicationId: app.id,
              showToast: true,
            });
          } catch (error) {
            console.error(`[Gmail-Checker] Error checking ${app.id}:`, error);
          }
        }

        if (newRepliesFound > 0) {
          console.log(`[Gmail-Checker] ✅ Found ${newRepliesFound} new replies`);
        }
      } catch (error) {
        console.error('[Gmail-Checker] Error:', error);
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Initial check after 5 seconds
    const initialDelay = setTimeout(() => {
      console.log('[Gmail-Checker] Starting background reply checker...');
      checkRepliesForAllApplications();
    }, 5000);

    // Periodic check every 2 minutes
    const interval = setInterval(() => {
      checkRepliesForAllApplications();
    }, CHECK_INTERVAL);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [currentUser]);
}

