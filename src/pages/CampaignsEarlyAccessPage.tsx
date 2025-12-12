import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { notify } from '@/lib/notify';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { syncUserToBrevo } from '../services/brevo';
import { StickerLayer } from '../components/ui/StickerLayer';

// Sample job cards data
const jobCards = [
  { title: 'Software Engineer', company: 'Tech Company', icon: 'J' },
  { title: 'Product Manager', company: 'Startup Inc', icon: 'P' },
  { title: 'Data Scientist', company: 'AI Labs', icon: 'D' },
  { title: 'UX Designer', company: 'Design Studio', icon: 'U' },
  { title: 'Marketing Lead', company: 'Growth Co', icon: 'M' },
];

export default function CampaignsEarlyAccessPage() {
  const { currentUser, userData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Auto-rotate cards every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCardIndex((prev) => (prev + 1) % jobCards.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Check if user is already in the list on page load
  useEffect(() => {
    const checkIfAlreadySubmitted = async () => {
      if (!currentUser?.email) return;

      try {
        const earlyAccessRef = collection(db, 'campaignEarlyAccess');
        const q = query(earlyAccessRef, where('email', '==', currentUser.email.toLowerCase().trim()));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setIsSubmitted(true);
        }
      } catch (error) {
        console.error('Error checking early access status:', error);
      }
    };

    checkIfAlreadySubmitted();
  }, [currentUser]);

  const handleSubmit = async () => {
    if (!currentUser?.email) {
      notify.error('You must be logged in to request early access');
      return;
    }

    setIsSubmitting(true);

    try {
      // Vérifier si l'email existe déjà
      const earlyAccessRef = collection(db, 'campaignEarlyAccess');
      const q = query(earlyAccessRef, where('email', '==', currentUser.email.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);

      const isAlreadyInList = !querySnapshot.empty;

      if (!isAlreadyInList) {
        // Ajouter à la collection seulement si pas déjà présent
        await addDoc(earlyAccessRef, {
          email: currentUser.email.toLowerCase().trim(),
          userId: currentUser.uid,
          timestamp: serverTimestamp(),
          status: 'pending',
          notified: false
        });
      }

      // Sync to Brevo with CAMPAIGNS_EA = true (non-blocking)
      // Always sync to Brevo, even if already in list, to ensure the attribute is updated
      try {
        console.log('🔄 Syncing CAMPAIGNS_EA to Brevo for:', currentUser.email);
        await syncUserToBrevo(
          {
            email: currentUser.email || '',
            firstName: userData?.firstName || '',
            lastName: userData?.lastName || '',
            CAMPAIGNS_EA: true, // Boolean attribute for Campaigns Early Access
          },
          'campaigns_early_access_requested',
          {
            userId: currentUser.uid,
            requestedAt: new Date().toISOString(),
            alreadyInList: isAlreadyInList,
          }
        );
        console.log('✅ CAMPAIGNS_EA synced to Brevo successfully');
      } catch (brevoError) {
        console.error('❌ Brevo sync failed (non-critical):', brevoError);
        // Don't block the user if Brevo sync fails
      }

      if (isAlreadyInList) {
        notify.info('You\'re already on the early access list!');
      } else {
        notify.success('You\'ve been added to the early access list!');
      }
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting early access request:', error);
      notify.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      {/* Interactive draggable stickers */}
      <StickerLayer />
      
      <div className="min-h-screen flex items-center justify-center px-4 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl w-full text-center"
        >
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4"
          >
            AutoPilot
          </motion.h1>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6 max-w-2xl mx-auto space-y-2"
          >
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              <span className="font-semibold text-purple-600 dark:text-purple-400">Your job search, on cruise control.</span> AutoPilot finds opportunities that match your profile and applies for you — automatically, 24/7.
            </p>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              Wake up to interview invites. Our AI scouts the hidden job market, crafts personalized applications, and lands them in hiring managers' inboxes while you sleep.
            </p>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed">
              <span className="font-semibold text-gray-700 dark:text-gray-200">85% of opportunities</span> never hit job boards. AutoPilot gets you there first.
            </p>
          </motion.div>

          {/* Form or Success Message */}
          {!isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex justify-center items-center mb-8"
            >
              <motion.button
                onClick={handleSubmit}
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 rounded-xl bg-[#b7e219] hover:bg-[#a5cb17] border border-[#9fc015] text-gray-900 font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-900/70 border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Request Early Access</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="max-w-md mx-auto mb-8"
            >
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-semibold text-green-900 dark:text-green-100 mb-0.5">
                    You're on the list!
                  </h3>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    We'll notify you as soon as AutoPilot is ready for takeoff.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Visual Element - Job Application Card Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative max-w-md mx-auto"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`card-${currentCardIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="bg-white dark:bg-[#2b2a2c] rounded-xl p-4 shadow-lg border border-gray-200 dark:border-[#3d3c3e]"
              >
                <div className="flex items-center gap-3 mb-3">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#635BFF] to-[#7c75ff] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{jobCards[currentCardIndex].icon}</span>
                  </div>
                  
                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                      {jobCards[currentCardIndex].title}
                          </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                      {jobCards[currentCardIndex].company}
                    </p>
                  </div>
                  
                  {/* Applied Badge */}
                  <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 flex-shrink-0">
                    <Check className="h-4 w-4" />
                          <span className="text-xs font-medium">Applied</span>
                  </div>
                      </div>
                
                <div className="pt-3 border-t border-gray-100 dark:border-[#3d3c3e]">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Applied by AutoPilot while you slept
                        </p>
                </div>
                    </motion.div>
              </AnimatePresence>
            
            {/* Dots indicator */}
            <div className="flex justify-center gap-1.5 mt-4">
              {jobCards.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    index === currentCardIndex 
                      ? 'bg-[#635BFF] w-4' 
                      : 'bg-gray-300 dark:bg-[#4a494b]'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AuthLayout>
  );
}

