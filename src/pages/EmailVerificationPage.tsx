import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, Loader2, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { sendEmailVerification } from 'firebase/auth';
import { forceLightMode } from '../lib/theme';

export default function EmailVerificationPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(60);
  const [isVerified, setIsVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Force light mode
  useEffect(() => {
    forceLightMode();
  }, []);

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
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md w-full bg-white text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center"
          >
            <CheckCircle2 className="h-10 w-10 text-white" />
          </motion.div>
          <div>
            <h2 className="text-4xl font-semibold text-gray-900 tracking-tight mb-4">
              Email Verified!
            </h2>
            <p className="text-base text-gray-600">
              Your email has been successfully verified. Redirecting you to complete your profile...
            </p>
          </div>
          <div className="flex justify-center">
            <Loader2 className="h-5 w-5 text-gray-900 animate-spin" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Panneau de formulaire (gauche) */}
      <div className="w-full lg:w-1/2 p-8 lg:p-16 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl p-8">
            {/* Icon and Title - Centered */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="mx-auto w-16 h-16 bg-gradient-to-br from-[hsl(var(--primary))] to-[#7B65D4] rounded-full flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20"
              >
                <Mail className="h-8 w-8 text-white" />
              </motion.div>
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight mb-2">
                Verify your email
              </h1>
              <p className="text-sm text-gray-600 mb-4">
                We've sent a verification link to
              </p>
              
              {/* Email Display - Centered and integrated with subtle color */}
              <div className="inline-block bg-gradient-to-r from-gray-50 to-purple-50/30 rounded-lg px-4 py-2.5 border border-gray-200">
                <p className="text-xs text-gray-500 mb-0.5 text-center">Email address</p>
                <p className="text-base font-semibold text-gray-900 text-center">
                  {currentUser?.email}
                </p>
              </div>
            </div>

            {/* Instructions - Centered with better spacing and subtle colors */}
            <div className="space-y-3 mb-6 max-w-md mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-[hsl(var(--primary))] to-[#7B65D4] rounded-full flex items-center justify-center mt-0.5 shadow-sm">
                  <span className="text-white font-semibold text-xs">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium mb-0.5 text-sm">
                    Check your inbox
                  </p>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    We've sent a verification link to your email address
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-[hsl(var(--primary))] to-[#7B65D4] rounded-full flex items-center justify-center mt-0.5 shadow-sm">
                  <span className="text-white font-semibold text-xs">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium mb-0.5 text-sm">
                    Click the verification link
                  </p>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Open the email and click on the verification button or link
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-[hsl(var(--primary))] to-[#7B65D4] rounded-full flex items-center justify-center mt-0.5 shadow-sm">
                  <span className="text-white font-semibold text-xs">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium mb-0.5 text-sm">
                    Get started
                  </p>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Once verified, you'll be redirected to complete your profile
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Resend Button - Centered */}
            <div className="mb-4 max-w-md mx-auto">
              <button
                onClick={handleResendEmail}
                disabled={timeLeft > 0 || isResending || !currentUser}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-150 text-sm
                  ${
                    timeLeft > 0 || isResending || !currentUser
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
              >
                {isResending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : timeLeft > 0 ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Resend in {timeLeft}s</span>
                  </>
                ) : !currentUser ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Please wait...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Resend verification email</span>
                  </>
                )}
              </button>
            </div>

            {/* Help Text - Centered with subtle color */}
            <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/30 rounded-lg p-3 border border-blue-100 mb-4 max-w-md mx-auto">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-[hsl(var(--primary))] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-900 mb-2">
                    Didn't receive the email?
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li className="flex items-start gap-1.5">
                      <span className="text-[hsl(var(--primary))] mt-0.5">•</span>
                      <span>Check your <strong className="text-gray-900">spam or junk folder</strong> first</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[hsl(var(--primary))] mt-0.5">•</span>
                      <span>Make sure you entered the correct email address</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[hsl(var(--primary))] mt-0.5">•</span>
                      <span>Wait a few minutes and try resending</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Auto-check indicator - Centered */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-4">
              <Loader2 className="h-3 w-3 animate-spin text-[hsl(var(--primary))]" />
              <span>Automatically checking for verification...</span>
            </div>

            {/* Back to login link - Centered */}
            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs text-gray-600 hover:text-[hsl(var(--primary))] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to login</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Panneau latéral (droite) - Style cohérent avec sign up/sign in */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="hidden lg:flex w-1/2 bg-gradient-to-bl from-[hsl(var(--primary))] via-[#9B7FE8] to-[#A88FEA] flex-col items-center justify-center p-16 relative overflow-hidden"
      >
        {/* Effets de lumière animés */}
        <motion.div 
          animate={{ 
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ 
            duration: 18, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute top-0 left-0 w-[450px] h-[450px] bg-white/10 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            x: [0, 90, 0],
            y: [0, -40, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-200/15 rounded-full blur-3xl"
        />
        
        <div className="relative z-10 max-w-lg text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12"
          >
            <h3 className="text-6xl font-semibold text-white tracking-tight mb-4">
              Almost there!
            </h3>
            <h3 className="text-6xl font-semibold bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent tracking-tight">
              One step away
            </h3>
          </motion.div>

          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-white/95 text-lg leading-relaxed mb-12 font-light"
          >
            Verify your email to unlock the full power of AI-powered job applications. Your journey to your dream job starts here.
          </motion.p>

          {/* Statistiques */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="grid grid-cols-2 gap-8"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white/15 backdrop-blur-md rounded-3xl p-6 border border-white/30 shadow-lg"
            >
              <div className="text-5xl font-bold text-white mb-2">20K+</div>
              <div className="text-white/90 text-sm font-medium">Active Users</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white/15 backdrop-blur-md rounded-3xl p-6 border border-white/30 shadow-lg"
            >
              <div className="text-5xl font-bold text-white mb-2">93%</div>
              <div className="text-white/90 text-sm font-medium">Success Rate</div>
            </motion.div>
          </motion.div>
        </div>

        {/* Pattern animé */}
        <motion.div 
          animate={{ 
            backgroundPosition: ['40px 40px', '0 0']
          }}
          transition={{ 
            duration: 25, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute inset-0 opacity-[0.12]" 
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.7) 2px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}
        />
      </motion.div>
    </div>
  );
}
