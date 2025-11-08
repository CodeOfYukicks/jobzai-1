import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, Loader2, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { sendEmailVerification } from 'firebase/auth';

export default function EmailVerificationPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(60);
  const [isVerified, setIsVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Si l'email est déjà vérifié, rediriger
    if (currentUser.emailVerified) {
      navigate('/complete-profile');
      return;
    }

    if (isVerified) {
      return;
    }

    // Vérifier périodiquement si l'email est vérifié
    const interval = setInterval(async () => {
      try {
        await currentUser.reload();
        if (currentUser.emailVerified && !isVerified) {
          setIsVerified(true);
          toast.success('Email verified successfully!');
          setTimeout(() => {
            navigate('/complete-profile');
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking email verification:', error);
      }
    }, 3000);

    // Timer pour le bouton de renvoi
    const timer = setInterval(() => {
      setTimeLeft((time) => (time > 0 ? time - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [currentUser, navigate, isVerified]);

  const handleResendEmail = async () => {
    console.log('handleResendEmail called', { 
      currentUser: !!currentUser, 
      timeLeft, 
      isResending,
      email: currentUser?.email 
    });

    // Vérifications préalables
    if (!currentUser) {
      console.error('No current user found');
      toast.error('No user found. Please log in again.');
      navigate('/login');
      return;
    }

    if (timeLeft > 0) {
      console.log('Timer still active, cannot resend yet');
      toast.info(`Please wait ${timeLeft} seconds before resending`);
      return;
    }

    if (isResending) {
      console.log('Email is already being sent');
      return;
    }

    // Vérifier si l'email est déjà vérifié
    try {
      await currentUser.reload();
      if (currentUser.emailVerified) {
        console.log('Email already verified');
        setIsVerified(true);
        toast.success('Your email is already verified!');
        setTimeout(() => {
          navigate('/complete-profile');
        }, 1500);
        return;
      }
    } catch (reloadError) {
      console.error('Error reloading user:', reloadError);
    }

    try {
      setIsResending(true);
      console.log('Sending verification email to:', currentUser.email);
      console.log('Redirect URL:', window.location.origin + '/complete-profile');
      
      await sendEmailVerification(currentUser, {
        url: window.location.origin + '/complete-profile',
        handleCodeInApp: false
      });
      
      console.log('Verification email sent successfully');
      setTimeLeft(60);
      toast.success('Verification email sent! Please check your inbox and spam folder.', {
        duration: 5000,
        description: 'If you don\'t see it, check your spam/junk folder'
      });
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Messages d'erreur plus spécifiques
      let errorMessage = 'Failed to send verification email. Please try again.';
      
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found. Please log in again.';
      } else if (error.code === 'auth/email-already-verified') {
        errorMessage = 'Email is already verified. Redirecting...';
        setIsVerified(true);
        setTimeout(() => {
          navigate('/complete-profile');
        }, 1500);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center"
          >
            <CheckCircle2 className="h-12 w-12 text-white" />
          </motion.div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Email Verified!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your email has been successfully verified. Redirecting you to complete your profile...
            </p>
          </div>
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 text-purple-600 dark:text-purple-400 animate-spin" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full"
      >
        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mx-auto w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4"
            >
              <Mail className="h-10 w-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Verify Your Email
            </h1>
            <p className="text-purple-100 text-base">
              We need to verify your email address to continue
            </p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Email Display */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email address</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentUser?.email}
              </p>
            </div>

            {/* Instructions */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white font-medium mb-1">
                    Check your inbox
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    We've sent a verification link to your email address
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white font-medium mb-1">
                    Click the verification link
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Open the email and click on the verification button or link
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white font-medium mb-1">
                    Get started
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Once verified, you'll be redirected to complete your profile
                  </p>
                </div>
              </div>
            </div>

            {/* Resend Button */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleResendEmail}
                disabled={timeLeft > 0 || isResending || !currentUser}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg
                  ${
                    timeLeft > 0 || isResending || !currentUser
                      ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed opacity-60'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl'
                  }`}
              >
                {isResending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : timeLeft > 0 ? (
                  <>
                    <RefreshCw className="h-5 w-5" />
                    <span>Resend in {timeLeft}s</span>
                  </>
                ) : !currentUser ? (
                  <>
                    <RefreshCw className="h-5 w-5" />
                    <span>Please wait...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5" />
                    <span>Resend Verification Email</span>
                  </>
                )}
              </button>
              {timeLeft === 0 && currentUser && !isResending && (
                <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
                  Click the button above to resend the verification email
                </p>
              )}
            </div>

            {/* Help Text */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                    Didn't receive the email?
                  </p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="font-semibold">⚠️ Important:</span>
                      <span>Check your <strong>spam or junk folder</strong> first!</span>
                    </li>
                    <li>• Emails from Firebase often end up in spam</li>
                    <li>• Make sure you entered the correct email address</li>
                    <li>• Wait a few minutes and try resending</li>
                    <li>• Add noreply@jobzai.firebaseapp.com to your contacts</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Auto-check indicator */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Automatically checking for verification...</span>
            </div>
          </div>
        </div>

        {/* Back to login link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors
              flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            <span>Back to login</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
