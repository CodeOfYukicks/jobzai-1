import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
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
      (doc) => {
        if (doc.exists() && !hasRedirected) {
          const data = doc.data();
          // Check if payment was successful (webhook should have updated this)
          if (data.paymentStatus === 'active' || data.lastPaymentDate) {
            hasRedirected = true;
            if (timeoutId) clearTimeout(timeoutId);
            toast.success('Payment successful! Your subscription has been activated.');
            setTimeout(() => {
              navigate('/billing');
            }, 2000);
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
    timeoutId = setTimeout(() => {
      if (!hasRedirected) {
        hasRedirected = true;
        unsubscribe();
        toast.success('Payment successful! Your account is being updated.');
        setTimeout(() => {
          navigate('/billing');
        }, 2000);
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
          Thank you for your purchase. Your subscription has been activated and credits have been added to your account.
        </p>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Updating your account...</span>
        </div>

        <p className="text-sm text-gray-500">
          You will be redirected to your billing page shortly.
        </p>
      </motion.div>
    </div>
  );
}


