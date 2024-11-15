import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import ProfileCompletionFlow from '../components/ProfileCompletion/ProfileCompletionFlow';

export default function EmailVerificationPage() {
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const { currentUser, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    // Check email verification status periodically
    const checkVerification = async () => {
      if (currentUser) {
        await currentUser.reload();
        if (currentUser.emailVerified) {
          setIsVerified(true);
          toast.success('Email verified successfully!');
        }
      }
    };

    const interval = setInterval(checkVerification, 3000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleResendEmail = async () => {
    if (countdown > 0) return;

    try {
      setIsResending(true);
      await resendVerificationEmail();
      toast.success('Verification email sent!');
      setCountdown(60); // Start 60-second countdown
    } catch (error) {
      console.error('Error resending verification:', error);
      toast.error('Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  // Show profile completion flow after verification
  if (isVerified) {
    return <ProfileCompletionFlow />;
  }

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
            disabled={isResending || countdown > 0}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-[#8D75E6] bg-white border border-[#8D75E6] rounded-md hover:bg-[#8D75E6] hover:text-white transition-colors disabled:opacity-50"
          >
            {isResending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {countdown > 0
              ? `Resend available in ${countdown}s`
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