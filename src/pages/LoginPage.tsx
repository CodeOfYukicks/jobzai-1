import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import FirebaseImage from '../components/FirebaseImage';
import GoogleAuthButton from '../components/GoogleAuthButton';
import AnimatedGridPattern from '../components/ui/animated-grid-pattern';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login, resetPassword, resendVerificationEmail, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      // Wait for a brief moment to ensure auth state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      navigate('/hub');
    } catch (error: any) {
      console.error('Login error:', error);
      
      switch (error.code) {
        case 'auth/invalid-credential':
          toast.error('Invalid email or password');
          break;
        case 'auth/user-not-found':
          toast.error('No account found with this email');
          break;
        case 'auth/wrong-password':
          toast.error('Incorrect password');
          break;
        case 'auth/too-many-requests':
          toast.error('Too many failed attempts. Please try again later');
          break;
        default:
          if (error.message === 'Please verify your email before logging in') {
            toast.error('Please verify your email before logging in', {
              action: {
                label: 'Resend verification',
                onClick: async () => {
                  try {
                    await resendVerificationEmail();
                    toast.success('Verification email sent!');
                  } catch (err) {
                    toast.error('Failed to send verification email');
                  }
                },
              },
            });
          } else {
            toast.error('Failed to log in. Please try again');
          }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      navigate('/hub');
      toast.success('Successfully signed in with Google!');
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      toast.error('Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#8D75E6] dark:bg-[#2A2831] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-200">
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
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-[#8D75E6] hover:text-[#6F58B8]">
              Create one
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="appearance-none relative block w-full px-3 py-2 pl-10 bg-white border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#8D75E6] focus:border-[#8D75E6] focus:z-10 sm:text-sm dark:bg-white dark:text-gray-900 dark:placeholder-gray-500 dark:border-gray-300"
                  placeholder="Password"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="text-sm">
              <button 
                type="button"
                onClick={() => {
                  if (email) {
                    toast.promise(
                      resetPassword(email),
                      {
                        loading: 'Sending reset instructions...',
                        success: 'Password reset email sent!',
                        error: 'Failed to send reset email'
                      }
                    );
                  } else {
                    toast.error('Please enter your email first');
                  }
                }}
                className="font-medium text-[#8D75E6] hover:text-[#6F58B8]"
              >
                Forgot your password?
              </button>
            </div>
          </div>

          <div className="relative my-4">
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
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign in</span>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
