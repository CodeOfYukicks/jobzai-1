import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { notify } from '@/lib/notify';
import { recordCreditHistory } from '../lib/creditHistory';
import { trackPurchase } from '../lib/trackingEvents';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, completeProfile } = useAuth();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!sessionId) {
      notify.error('Invalid payment session');
      navigate('/billing');
      return;
    }

    let hasRedirected = false;
    let timeoutId: NodeJS.Timeout;
    let hasProcessedSession = false;
    let hasTrackedPurchase = false;

    // Function to manually process the session if webhook didn't fire
    const processSessionManually = async () => {
      if (hasProcessedSession) return;
      hasProcessedSession = true;

      try {
        const functionsUrl = window.location.hostname === 'localhost'
          ? 'https://us-central1-jobzai.cloudfunctions.net'
          : '';

        const url = functionsUrl
          ? `${functionsUrl}/processStripeSession`
          : '/api/stripe/process-session';

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            console.log('✅ Session processed manually');
            window.location.reload();
          }
        }
      } catch (error) {
        console.error('Error processing session manually:', error);
      }
    };

    // Listen for user updates (webhook will update the user document)
    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      async (docSnapshot) => {
        if (docSnapshot.exists() && !hasRedirected) {
          const data = docSnapshot.data();

          let shouldCompleteProfile = false;
          let pendingSubscription: any = null;
          let profileData: any = null;

          if (data?.pendingProfileCompletion && data?.pendingProfileData) {
            shouldCompleteProfile = true;
            profileData = data.pendingProfileData;
            pendingSubscription = data.pendingSubscription || {};
          }

          if (!shouldCompleteProfile) {
            const pendingFromStorage = localStorage.getItem('pendingSubscription');
            if (pendingFromStorage) {
              try {
                const subscriptionData = JSON.parse(pendingFromStorage);
                shouldCompleteProfile = true;
                profileData = subscriptionData.profileData || {};
                pendingSubscription = subscriptionData;
              } catch (error) {
                console.error('Error parsing pending subscription:', error);
              }
            }
          }

          if (!shouldCompleteProfile) {
            const pendingFromSession = sessionStorage.getItem('pendingSubscription');
            if (pendingFromSession) {
              try {
                const subscriptionData = JSON.parse(pendingFromSession);
                shouldCompleteProfile = true;
                profileData = subscriptionData.profileData || {};
                pendingSubscription = subscriptionData;
              } catch (error) {
                console.error('Error parsing pending subscription:', error);
              }
            }
          }

          if (data.paymentStatus === 'active' || data.lastPaymentDate || data.plan) {
            hasRedirected = true;

            // Track Purchase conversion event
            if (!hasTrackedPurchase) {
              hasTrackedPurchase = true;
              const subData = pendingSubscription || data.pendingSubscription || {};
              const purchaseValue = parseFloat(subData.price || subData.plan?.price || '0');
              if (purchaseValue > 0) {
                trackPurchase(purchaseValue, 'EUR');
              }
            }
            if (timeoutId) clearTimeout(timeoutId);

            if (shouldCompleteProfile && profileData && pendingSubscription) {
              try {
                const planId = pendingSubscription.planId || pendingSubscription.plan?.planId;
                const credits = pendingSubscription.credits || pendingSubscription.plan?.credits || 0;

                const userRef = doc(db, 'users', currentUser.uid);
                const userSnap = await getDoc(userRef);
                const currentCredits = userSnap.data()?.credits || 0;
                const creditChange = credits - currentCredits;

                await updateDoc(userRef, {
                  plan: planId,
                  credits: credits,
                  planSelectedAt: new Date().toISOString(),
                });

                if (creditChange !== 0) {
                  await recordCreditHistory(
                    currentUser.uid,
                    credits,
                    creditChange,
                    'subscription',
                    planId
                  );
                }

                await completeProfile({
                  ...profileData,
                  plan: planId,
                  credits: credits,
                  planSelectedAt: new Date().toISOString(),
                });

                await updateDoc(userRef, {
                  pendingProfileData: null,
                  pendingSubscription: null,
                  pendingProfileCompletion: false,
                });
                localStorage.removeItem('pendingSubscription');
                sessionStorage.removeItem('pendingSubscription');

                setTimeout(() => {
                  window.location.href = '/hub';
                }, 1000);

                notify.success('Payment successful! Your profile has been completed.');
              } catch (error) {
                console.error('Error completing profile:', error);
                notify.error('Payment successful but failed to complete profile.');
                setTimeout(() => {
                  window.location.href = '/hub';
                }, 2000);
              }
            } else {
              notify.success('Payment successful! Your subscription has been activated.');
              setTimeout(() => {
                navigate('/billing');
              }, 2000);
            }
          }
        }
      },
      (error) => {
        console.error('Error listening to user updates:', error);
      }
    );

    const processTimeout = setTimeout(() => {
      processSessionManually();
    }, 2000);

    timeoutId = setTimeout(async () => {
      if (!hasRedirected) {
        hasRedirected = true;
        unsubscribe();

        let shouldCompleteProfile = false;
        let pendingSubscription: any = null;
        let profileData: any = null;

        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData?.pendingProfileCompletion && userData?.pendingProfileData) {
              shouldCompleteProfile = true;
              profileData = userData.pendingProfileData;
              pendingSubscription = userData.pendingSubscription || {};
            }
          }

          if (!shouldCompleteProfile) {
            const pendingFromStorage = localStorage.getItem('pendingSubscription');
            if (pendingFromStorage) {
              try {
                const subscriptionData = JSON.parse(pendingFromStorage);
                shouldCompleteProfile = true;
                profileData = subscriptionData.profileData || {};
                pendingSubscription = subscriptionData;
              } catch (error) {
                console.error('Error parsing pending subscription:', error);
              }
            }
          }

          if (!shouldCompleteProfile) {
            const pendingFromSession = sessionStorage.getItem('pendingSubscription');
            if (pendingFromSession) {
              try {
                const subscriptionData = JSON.parse(pendingFromSession);
                shouldCompleteProfile = true;
                profileData = subscriptionData.profileData || {};
                pendingSubscription = subscriptionData;
              } catch (error) {
                console.error('Error parsing pending subscription:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error checking for pending profile:', error);
        }

        // Track Purchase conversion event (fallback path)
        if (!hasTrackedPurchase) {
          hasTrackedPurchase = true;
          const subData = pendingSubscription || {};
          const purchaseValue = parseFloat(subData.price || subData.plan?.price || '0');
          if (purchaseValue > 0) {
            trackPurchase(purchaseValue, 'EUR');
          }
        }

        if (shouldCompleteProfile && profileData && pendingSubscription) {
          try {
            const planId = pendingSubscription.planId || pendingSubscription.plan?.planId;
            const credits = pendingSubscription.credits || pendingSubscription.plan?.credits || 0;

            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);
            const currentCredits = userSnap.data()?.credits || 0;
            const creditChange = credits - currentCredits;

            await updateDoc(userRef, {
              plan: planId,
              credits: credits,
              planSelectedAt: new Date().toISOString(),
            });

            if (creditChange !== 0) {
              await recordCreditHistory(
                currentUser.uid,
                credits,
                creditChange,
                'subscription',
                planId
              );
            }

            await completeProfile({
              ...profileData,
              plan: planId,
              credits: credits,
              planSelectedAt: new Date().toISOString(),
            });

            await updateDoc(userRef, {
              pendingProfileData: null,
              pendingSubscription: null,
              pendingProfileCompletion: false,
            });
            localStorage.removeItem('pendingSubscription');
            sessionStorage.removeItem('pendingSubscription');

            setTimeout(() => {
              window.location.href = '/hub';
            }, 1000);

            notify.success('Payment successful! Your profile has been completed.');
          } catch (error) {
            console.error('Error completing profile:', error);
            notify.error('Payment successful but failed to complete profile.');
            setTimeout(() => {
              navigate('/hub');
            }, 2000);
          }
        } else {
          notify.success('Payment successful! Your account is being updated.');
          setTimeout(() => {
            navigate('/billing');
          }, 2000);
        }
      }
    }, 8000);

    return () => {
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
      if (processTimeout) clearTimeout(processTimeout);
    };
  }, [currentUser, sessionId, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#333234] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="mb-8"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Check className="h-8 w-8 text-green-500" />
          </div>
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Payment successful
        </h1>

        {/* Description */}
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {sessionStorage.getItem('pendingSubscription')
            ? "We're completing your profile and activating your subscription."
            : "Your subscription has been activated and credits added to your account."}
        </p>

        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Updating your account...</span>
        </div>
      </motion.div>
    </div>
  );
}
