import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, Loader2, CheckCircle2, ArrowLeft, Inbox, MousePointerClick, Rocket } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notify } from '@/lib/notify';
import { sendCustomVerificationEmail } from '../services/customAuthEmails';
import { forceLightMode } from '../lib/theme';
import FirebaseImage from '../components/FirebaseImage';

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
          notify.success('Email verified successfully!');
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
      notify.error('No user found. Please log in again.');
      navigate('/login');
      return;
    }

    if (timeLeft > 0) {
      console.log('Timer still active, cannot resend yet');
      notify.info(`Please wait ${timeLeft} seconds before resending`);
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
        notify.success('Your email is already verified!');
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
      console.log('Sending branded verification email to:', currentUser.email);

      // Use custom branded email via Brevo
      const result = await sendCustomVerificationEmail(
        currentUser.email || '',
        currentUser.displayName || undefined,
        window.location.origin + '/complete-profile'
      );

      if (result.success) {
        console.log('Branded verification email sent successfully via Brevo');
        setTimeLeft(60);
        notify.success('Verification email sent! Please check your inbox.', {
          duration: 5000,
          description: 'Check your spam folder if you don\'t see it'
        });
      } else {
        throw new Error(result.message || 'Failed to send verification email');
      }
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      notify.error(error.message || 'Failed to send verification email. Please try again.');
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
            className="mx-auto w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center"
          >
            <CheckCircle2 className="h-10 w-10 text-white" />
          </motion.div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">
              Email Verified!
            </h2>
            <p className="text-gray-500 text-sm">
              Redirecting you to complete your profile...
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
    <div className="min-h-screen flex bg-white">
      {/* Form Panel - Left */}
      <div className="w-full lg:w-[45%] min-h-screen flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[400px]"
        >
          {/* Logo */}
          <Link to="/" className="flex justify-center lg:justify-start mb-8">
            <FirebaseImage
              path="images/logo-only.png"
              alt="JOBZ.AI Logo"
              className="h-10 w-auto"
            />
          </Link>

          {/* Header */}
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
              Verify your email
            </h1>
            <p className="mt-2 text-gray-500 text-sm">
              We've sent a verification link to
            </p>
            <p className="mt-1 text-gray-900 font-medium text-sm">
              {currentUser?.email}
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-8">
            {[
              { icon: Inbox, title: 'Check your inbox', desc: 'Look for an email from us' },
              { icon: MousePointerClick, title: 'Click the link', desc: 'Open the verification link' },
              { icon: Rocket, title: 'Get started', desc: 'Complete your profile' },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium text-sm">{step.title}</p>
                  <p className="text-gray-400 text-xs">{step.desc}</p>
                </div>
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 font-medium text-xs">{index + 1}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Resend Button */}
          <button
            onClick={handleResendEmail}
            disabled={timeLeft > 0 || isResending || !currentUser}
            className={`w-full flex justify-center items-center gap-2 px-4 py-3.5
              font-medium rounded-xl transition-all text-sm
              ${timeLeft > 0 || isResending || !currentUser
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-900 hover:bg-gray-800 text-white'
              }`}
          >
            {isResending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : timeLeft > 0 ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Resend in {timeLeft}s
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Resend verification email
              </>
            )}
          </button>

          {/* Auto-check indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-6">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span>Automatically checking for verification</span>
          </div>

          {/* Help text */}
          <p className="text-center text-xs text-gray-400 mt-4">
            Can't find it? Check your spam folder
          </p>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to login
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Side Panel - Right (Desktop Only) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="hidden lg:flex w-[55%] flex-col items-center justify-center p-12 relative overflow-hidden"
      >
        {/* SVG Background */}
        <img
          src="/images/hero-bg.svg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Animated glow effects */}
        <motion.div
          animate={{
            x: [0, -50, 0],
            y: [0, 30, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, 40, 0],
            y: [0, -25, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-violet-600/20 rounded-full blur-[100px]"
        />

        {/* Content */}
        <div className="relative z-10 max-w-lg">
          {/* Welcome Headline */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-10"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              Almost there!
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-violet-200">
                One step away
              </span>
            </h2>
            <p className="text-white/70 text-lg leading-relaxed">
              Verify your email to unlock the full power of AI-powered job applications.
            </p>
          </motion.div>

          {/* Status Cards */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="space-y-4 mb-10"
          >
            {[
              { icon: Mail, text: 'Verification email sent', status: 'Done' },
              { icon: Inbox, text: 'Waiting for confirmation', status: 'Pending' },
              { icon: Rocket, text: 'Ready to launch', status: 'Next' },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-xl px-5 py-4 border border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-purple-300" />
                  </div>
                  <span className="text-white/80 text-sm">{item.text}</span>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${item.status === 'Done'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : item.status === 'Pending'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-white/10 text-white/50'
                  }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Motivational */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-white/50 text-sm italic"
          >
            "Your dream job is just a few clicks away."
          </motion.p>
        </div>

        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.8) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
      </motion.div>
    </div>
  );
}
