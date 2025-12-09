import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { notify } from '@/lib/notify';
import { sendEmailVerification } from 'firebase/auth';

interface EmailVerificationStepProps {
  onBack: () => void;
  userEmail?: string;
}

export default function EmailVerificationStep({ onBack, userEmail }: EmailVerificationStepProps) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(60);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(async () => {
      await currentUser.reload();
      if (currentUser.emailVerified) {
        setIsVerified(true);
        notify.success('Email verified successfully!');
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
  }, [currentUser, navigate]);

  const handleResendEmail = async () => {
    if (!currentUser || timeLeft > 0) return;

    try {
      await sendEmailVerification(currentUser, {
        url: window.location.origin + '/dashboard',
        handleCodeInApp: false
      });
      setTimeLeft(60);
      notify.success('Verification email sent!');
    } catch (error: any) {
      notify.error(error.message || 'Failed to send verification email');
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto w-12 h-12 bg-[#8D75E6]/10 dark:bg-[#8D75E6]/20 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-[#8D75E6] dark:text-[#A78BFA]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">One Last Step!</h2>
        <p className="mt-2 text-gray-600">
          Please verify your email address to complete your registration
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <p className="text-sm text-gray-600 mb-4">
          We've sent a verification link to <strong>{userEmail}</strong>
        </p>

        <button
          onClick={handleResendEmail}
          disabled={timeLeft > 0}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-[#8D75E6] dark:bg-[#7C3AED] text-white rounded-lg hover:bg-[#7D65D6] dark:hover:bg-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${timeLeft > 0 ? 'animate-spin' : ''}`} />
          <span>
            {timeLeft > 0 ? `Resend in ${timeLeft}s` : 'Resend verification email'}
          </span>
        </button>
      </div>

      <button
        onClick={onBack}
        className="w-full px-4 py-2 text-gray-600 hover:text-gray-900"
      >
        Back
      </button>

      <p className="text-xs text-center text-gray-500 mt-4">
        Didn't receive the email? Check your spam folder or try another email address.
      </p>
    </div>
  );
} 
