import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from '@/contexts/ToastContext';
import { recordCreditHistory } from '../lib/creditHistory';

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
      toast.error('Invalid payment session');
      navigate('/billing');
      return;
    }

    let hasRedirected = false;
    let timeoutId: NodeJS.Timeout;
    let hasProcessedSession = false;

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
            // Reload user data to get updated credits
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
          
          // Check if user is completing profile - get from Firestore first
          let shouldCompleteProfile = false;
          let pendingSubscription: any = null;
          let profileData: any = null;

          // First, check Firestore for pending profile data
          if (data?.pendingProfileCompletion && data?.pendingProfileData) {
            shouldCompleteProfile = true;
            profileData = data.pendingProfileData;
            pendingSubscription = data.pendingSubscription || {};
            console.log('✅ Pending profile completion found in Firestore:', { 
              hasProfileData: !!profileData, 
              profileDataKeys: profileData ? Object.keys(profileData) : [],
              pendingSubscription 
            });
          } else {
            console.log('❌ No pending profile completion in Firestore:', {
              hasPendingProfileCompletion: !!data?.pendingProfileCompletion,
              hasPendingProfileData: !!data?.pendingProfileData,
              pendingProfileData: data?.pendingProfileData
            });
          }

          // If not found in Firestore, try localStorage
          if (!shouldCompleteProfile) {
            const pendingFromStorage = localStorage.getItem('pendingSubscription');
            if (pendingFromStorage) {
              try {
                const subscriptionData = JSON.parse(pendingFromStorage);
                shouldCompleteProfile = true;
                profileData = subscriptionData.profileData || {};
                pendingSubscription = subscriptionData;
                console.log('Pending subscription found in localStorage:', subscriptionData);
              } catch (error) {
                console.error('Error parsing pending subscription from localStorage:', error);
              }
            }
          }

          // Last resort: try sessionStorage
          if (!shouldCompleteProfile) {
            const pendingFromSession = sessionStorage.getItem('pendingSubscription');
            if (pendingFromSession) {
              try {
                const subscriptionData = JSON.parse(pendingFromSession);
                shouldCompleteProfile = true;
                profileData = subscriptionData.profileData || {};
                pendingSubscription = subscriptionData;
                console.log('Pending subscription found in sessionStorage:', subscriptionData);
              } catch (error) {
                console.error('Error parsing pending subscription from sessionStorage:', error);
              }
            }
          }

          // Check if payment was successful (webhook should have updated this)
          if (data.paymentStatus === 'active' || data.lastPaymentDate || data.plan) {
            hasRedirected = true;
            if (timeoutId) clearTimeout(timeoutId);
            
            // If completing profile, update subscription and complete profile
            if (shouldCompleteProfile && profileData && pendingSubscription) {
              try {
                const planId = pendingSubscription.planId || pendingSubscription.plan?.planId;
                const credits = pendingSubscription.credits || pendingSubscription.plan?.credits || 0;
                
                console.log('🔄 Starting profile completion process:', {
                  hasProfileData: !!profileData,
                  profileDataKeys: profileData ? Object.keys(profileData) : [],
                  planId,
                  credits
                });
                
                // Update subscription and credits first
                const userRef = doc(db, 'users', currentUser.uid);
                const userSnap = await getDoc(userRef);
                const currentCredits = userSnap.data()?.credits || 0;
                const creditChange = credits - currentCredits;

                // Update subscription details first
                await updateDoc(userRef, {
                  plan: planId,
                  credits: credits,
                  planSelectedAt: new Date().toISOString(),
                });

                // Record credit history
                if (creditChange !== 0) {
                  await recordCreditHistory(
                    currentUser.uid,
                    credits,
                    creditChange,
                    'subscription',
                    planId
                  );
                }

                // Complete profile with all data including subscription info
                // This will set profileCompleted: true and navigate to /hub
                console.log('✅ Completing profile with data:', { 
                  profileDataKeys: profileData ? Object.keys(profileData) : [],
                  planId, 
                  credits 
                });
                
                await completeProfile({
                  ...profileData,
                  plan: planId,
                  credits: credits,
                  planSelectedAt: new Date().toISOString(),
                });

                // Clear pending data from Firestore and storage
                await updateDoc(userRef, {
                  pendingProfileData: null,
                  pendingSubscription: null,
                  pendingProfileCompletion: false,
                });
                localStorage.removeItem('pendingSubscription');
                sessionStorage.removeItem('pendingSubscription');
                
                // Force navigation to /hub after a delay to ensure context is updated
                console.log('✅ Profile completed, navigating to /hub...');
                setTimeout(() => {
                  window.location.href = '/hub';
                }, 1000);
                
                toast.success('Payment successful! Your profile has been completed. Thank you!');
              } catch (error) {
                console.error('❌ Error completing profile after payment:', error);
                toast.error('Payment successful but failed to complete profile. Please contact support.');
                setTimeout(() => {
                  window.location.href = '/hub';
                }, 2000);
              }
            } else {
              console.log('ℹ️ No pending profile completion, redirecting to billing');
              toast.success('Payment successful! Your subscription has been activated.');
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

    // Try to process session manually after 2 seconds if webhook hasn't updated
    const processTimeout = setTimeout(() => {
      processSessionManually();
    }, 2000);

    // Fallback: redirect after 8 seconds even if webhook hasn't updated
    timeoutId = setTimeout(async () => {
      if (!hasRedirected) {
        hasRedirected = true;
        unsubscribe();
        
        // Check if user is completing profile - get from Firestore first
        let shouldCompleteProfile = false;
        let pendingSubscription: any = null;
        let profileData: any = null;

        try {
          // First, check Firestore for pending profile data
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData?.pendingProfileCompletion && userData?.pendingProfileData) {
              shouldCompleteProfile = true;
              profileData = userData.pendingProfileData;
              pendingSubscription = userData.pendingSubscription || {};
              console.log('Pending profile completion found in Firestore (fallback):', { profileData, pendingSubscription });
            }
          }

          // If not found in Firestore, try localStorage
          if (!shouldCompleteProfile) {
            const pendingFromStorage = localStorage.getItem('pendingSubscription');
            if (pendingFromStorage) {
              try {
                const subscriptionData = JSON.parse(pendingFromStorage);
                shouldCompleteProfile = true;
                profileData = subscriptionData.profileData || {};
                pendingSubscription = subscriptionData;
                console.log('Pending subscription found in localStorage (fallback):', subscriptionData);
              } catch (error) {
                console.error('Error parsing pending subscription from localStorage:', error);
              }
            }
          }

          // Last resort: try sessionStorage
          if (!shouldCompleteProfile) {
            const pendingFromSession = sessionStorage.getItem('pendingSubscription');
            if (pendingFromSession) {
              try {
                const subscriptionData = JSON.parse(pendingFromSession);
                shouldCompleteProfile = true;
                profileData = subscriptionData.profileData || {};
                pendingSubscription = subscriptionData;
                console.log('Pending subscription found in sessionStorage (fallback):', subscriptionData);
              } catch (error) {
                console.error('Error parsing pending subscription from sessionStorage:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error checking for pending profile completion (fallback):', error);
        }
        
        // If completing profile, try to complete it
        if (shouldCompleteProfile && profileData && pendingSubscription) {
          try {
            const planId = pendingSubscription.planId || pendingSubscription.plan?.planId;
            const credits = pendingSubscription.credits || pendingSubscription.plan?.credits || 0;
            
            // Update subscription and credits first
            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);
            const currentCredits = userSnap.data()?.credits || 0;
            const creditChange = credits - currentCredits;

            // Update subscription details first
            await updateDoc(userRef, {
              plan: planId,
              credits: credits,
              planSelectedAt: new Date().toISOString(),
            });

            // Record credit history
            if (creditChange !== 0) {
              await recordCreditHistory(
                currentUser.uid,
                credits,
                creditChange,
                'subscription',
                planId
              );
            }

            // Complete profile with all data including subscription info
            // This will set profileCompleted: true and navigate to /hub
            console.log('✅ Completing profile with data (fallback):', { 
              profileDataKeys: profileData ? Object.keys(profileData) : [],
              planId, 
              credits 
            });
            
            await completeProfile({
              ...profileData,
              plan: planId,
              credits: credits,
              planSelectedAt: new Date().toISOString(),
            });

            // Clear pending data from Firestore and storage
            await updateDoc(userRef, {
              pendingProfileData: null,
              pendingSubscription: null,
              pendingProfileCompletion: false,
            });
            localStorage.removeItem('pendingSubscription');
            sessionStorage.removeItem('pendingSubscription');
            
            // Force navigation to /hub after a delay to ensure context is updated
            console.log('✅ Profile completed (fallback), navigating to /hub...');
            setTimeout(() => {
              window.location.href = '/hub';
            }, 1000);
            
            toast.success('Payment successful! Your profile has been completed. Thank you!');
          } catch (error) {
            console.error('Error completing profile:', error);
            toast.error('Payment successful but failed to complete profile. Please contact support.');
            setTimeout(() => {
              navigate('/hub');
            }, 2000);
          }
        } else {
          toast.success('Payment successful! Your account is being updated.');
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="mb-6"
        >
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
        </motion.div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Payment Successful!
        </h1>

        <p className="text-gray-600 mb-6">
          {sessionStorage.getItem('pendingSubscription') 
            ? "Thank you for your purchase! We're completing your profile and activating your subscription."
            : "Thank you for your purchase. Your subscription has been activated and credits have been added to your account."}
        </p>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Updating your account...</span>
        </div>

        <p className="text-sm text-gray-500">
          {sessionStorage.getItem('pendingSubscription')
            ? "You will be redirected to your dashboard shortly."
            : "You will be redirected to your billing page shortly."}
        </p>
      </motion.div>
    </div>
  );
}


