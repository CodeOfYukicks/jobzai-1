import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import FirebaseImage from '../components/FirebaseImage';
import GoogleAuthButton from '../components/GoogleAuthButton';
import AnimatedGridPattern from '../components/ui/animated-grid-pattern';

export default function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  
  const navigate = useNavigate();
  const { signup, resendVerificationEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      setIsLoading(true);
      await signup(email, password);
      setShowVerificationMessage(true);
      toast.success('Account created! Please check your email to verify your account.');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create account');
      setShowVerificationMessage(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      toast.success('Verification email sent!');
    } catch (error) {
      console.error('Error resending verification:', error);
      toast.error('Failed to resend verification email');
    }
  };

  if (showVerificationMessage) {
    return (
      <div className="min-h-screen bg-[#8D75E6] dark:bg-[#2A2831] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-200">
        <AnimatedGridPattern 
          width={40} 
          height={40} 
          x={0}
          y={0}
          className="absolute inset-0 h-full w-full fill-white/[0.1] stroke-white/[0.1]"
          strokeDasharray="4 4"
          numSquares={40}
          maxOpacity={0.3}
          duration={3}
          repeatDelay={0.3}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg text-center"
        >
          <div>
            <Mail className="mx-auto h-12 w-12 text-[#8D75E6]" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Verify your email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              We've sent a verification link to <strong>{email}</strong>. Please check your inbox and click the link to verify your account.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleResendVerification}
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-[#8D75E6] bg-white border border-[#8D75E6] rounded-md hover:bg-[#8D75E6] hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Resend verification email
            </button>

            <Link
              to="/login"
              className="block w-full px-4 py-2 text-sm font-medium text-white bg-[#8D75E6] rounded-md hover:bg-[#7B65D4] transition-colors"
            >
              Continue to login
            </Link>
          </div>

          <p className="text-xs text-gray-500">
            Didn't receive the email? Check your spam folder or try another email address.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#8D75E6] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Pattern en arrière-plan avec z-index négatif */}
      <div className="absolute inset-0 z-0">
        <AnimatedGridPattern 
          width={40} 
          height={40} 
          x={0}
          y={0}
          className="h-full w-full fill-white/[0.1] stroke-white/[0.1]"
          strokeDasharray="4 4"
          numSquares={40}
          maxOpacity={0.3}
          duration={3}
          repeatDelay={0.3}
        />
      </div>

      {/* Formulaire avec z-index positif */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg relative z-10"
      >
        <div>
          <Link to="/" className="block text-center">
            <FirebaseImage 
              path="images/logo-dark.png"
              alt="Jobz.ai Logo" 
              className="h-12 mx-auto"
            />
          </Link>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-[#8D75E6] hover:text-[#6F58B8]">
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="sr-only">
                  First name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isLoading}
                    className="appearance-none relative block w-full px-3 py-2 pl-10 bg-white border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#8D75E6] focus:border-[#8D75E6] focus:z-10 sm:text-sm dark:bg-white dark:text-gray-900 dark:placeholder-gray-500 dark:border-gray-300"
                    placeholder="First name"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="sr-only">
                  Last name
                </label>
                <div className="relative">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isLoading}
                    className="appearance-none relative block w-full px-3 py-2 pl-10 bg-white border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#8D75E6] focus:border-[#8D75E6] focus:z-10 sm:text-sm dark:bg-white dark:text-gray-900 dark:placeholder-gray-500 dark:border-gray-300"
                    placeholder="Last name"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="appearance-none relative block w-full px-3 py-2 pl-10 bg-white border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#8D75E6] focus:border-[#8D75E6] focus:z-10 sm:text-sm dark:bg-white dark:text-gray-900 dark:placeholder-gray-500 dark:border-gray-300"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="appearance-none relative block w-full px-3 py-2 pl-10 bg-white border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#8D75E6] focus:border-[#8D75E6] focus:z-10 sm:text-sm dark:bg-white dark:text-gray-900 dark:placeholder-gray-500 dark:border-gray-300"
                  placeholder="Password"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters long
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className={`appearance-none relative block w-full px-3 py-2 pl-10 bg-white border ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-[#8D75E6] focus:border-[#8D75E6]'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:z-10 sm:text-sm dark:bg-white dark:text-gray-900 dark:placeholder-gray-500 dark:border-gray-300`}
                  placeholder="Confirm password"
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-xs text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Passwords do not match
                </p>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <GoogleAuthButton />
          
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex justify-center items-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <span>Create account</span>
            )}
          </button>

          <p className="text-xs text-center text-gray-500">
            By signing up, you agree to our{' '}
            <Link to="/terms" className="text-[#8D75E6] hover:text-[#6F58B8]">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-[#8D75E6] hover:text-[#6F58B8]">
              Privacy Policy
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
