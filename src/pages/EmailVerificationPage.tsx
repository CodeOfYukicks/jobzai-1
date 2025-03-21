import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import ProfileCompletionFlow from '../components/ProfileCompletion/ProfileCompletionFlow';
import { sendEmailVerification } from 'firebase/auth';

export default function EmailVerificationPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(60);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (isVerified) {
      return;
    }

    const interval = setInterval(async () => {
      await currentUser.reload();
      if (currentUser.emailVerified && !isVerified) {
        setIsVerified(true);
        toast.success('Email verified successfully!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    }, 3000);

    const timer = setInterval(() => {
      setTimeLeft((time) => (time > 0 ? time - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [currentUser, navigate, isVerified]);

  const handleResendEmail = async () => {
    if (!currentUser) return;

    try {
      await sendEmailVerification(currentUser, {
        url: window.location.origin + '/dashboard', // URL de redirection apr├¿s v├®rification
        handleCodeInApp: false
      });
      
      setTimeLeft(60);
      toast.success('Verification email sent!');
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      toast.error(error.message || 'Failed to send verification email');
    }
  };

  return (
    <div className="min-h-screen hero-gradient animated-grid flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-lg text-center"
      >
        <div>
          <Mail className="mx-auto h-12 w-12 text-[#8D75E6]" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a verification link to <strong>{currentUser?.email}</strong>. Please check your inbox and click the link to verify your account.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleResendEmail}
            disabled={timeLeft > 0}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-[#8D75E6] bg-white border border-[#8D75E6] rounded-md hover:bg-[#8D75E6] hover:text-white transition-colors disabled:opacity-50"
          >
            {timeLeft > 0
              ? `Resend available in ${timeLeft}s`
              : 'Resend verification email'}
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Didn't receive the email? Check your spam folder or try another email address.
        </p>
      </motion.div>
    </div>
  );
}
