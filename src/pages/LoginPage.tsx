﻿import { useState } from 'react';
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
    <div className="min-h-screen flex bg-gray-50">
      {/* Panneau de connexion (gauche) */}
      <div className="w-full lg:w-1/2 p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/95 backdrop-blur-xl shadow-xl rounded-3xl p-8">
            <div>
              <Link to="/" className="block text-center group">
                <FirebaseImage 
                  path="images/logo-dark.png"
                  alt="Jobz.ai Logo" 
                  className="h-12 mx-auto transform transition-transform group-hover:scale-105"
                />
              </Link>
              <h2 className="mt-8 text-center text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Sign in to your account
              </h2>
              <p className="mt-3 text-center text-sm text-gray-500">
                Don't have an account?{' '}
                <Link to="/signup" className="font-medium text-purple-600 hover:text-purple-500 transition-colors">
                  Create one
                </Link>
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="block w-full pl-11 pr-3 py-3 bg-gray-50/50 border border-gray-200 
                      rounded-xl text-gray-900 placeholder-gray-400 
                      focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500
                      transition-all duration-200"
                    placeholder="Email address"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="block w-full pl-11 pr-3 py-3 bg-gray-50/50 border border-gray-200 
                      rounded-xl text-gray-900 placeholder-gray-400
                      focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500
                      transition-all duration-200"
                    placeholder="Password"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="flex justify-end">
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
                  className="text-sm font-medium text-purple-600 hover:text-purple-500 transition-colors"
                >
                  Forgot your password?
                </button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/95 backdrop-blur-xl text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2 px-4 py-3
                  bg-white border border-gray-100 rounded-xl hover:bg-gray-50"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" className="mr-2">
                  <path
                    fill="#4285F4"
                    d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                  />
                  <path
                    fill="#34A853"
                    d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.192 0 7.556 0 9s.348 2.808.957 4.039l3.007-2.332z"
                  />
                  <path
                    fill="#EA4335"
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
                  />
                </svg>
                <span className="text-gray-700">Continue with Google</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 px-4 py-3
                  bg-gradient-to-r from-purple-600 to-indigo-600
                  hover:from-purple-700 hover:to-indigo-700
                  text-white font-medium rounded-xl
                  transform transition-all duration-200
                  hover:shadow-lg hover:shadow-purple-500/25
                  disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        </motion.div>
      </div>

      {/* Panneau latéral (droite) */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden lg:flex w-1/2 bg-[#8D75E6] flex-col items-center justify-center p-12 relative overflow-hidden"
      >
        {/* Effets de lumière subtils - ajustés pour le nouveau fond violet */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-t from-transparent to-white/[0.02]" />

        <div className="relative z-10 max-w-lg">
          <div className="mb-12">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-5xl font-bold text-white mb-2"
            >
              LET'S MAKE YOUR
            </motion.div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-6xl font-bold"
            >
              <span className="text-white">NEXT</span>{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
                CAREER
              </span>
            </motion.div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-6xl font-bold text-white"
            >
              MOVE
            </motion.div>
          </div>

          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-white/90 text-lg mb-12 leading-relaxed"
          >
            Join thousands of professionals who've found their dream jobs through our AI-powered platform. Let's discover opportunities that match your unique skills and aspirations.
          </motion.p>

          {/* Statistiques animées */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 }}
            className="grid grid-cols-2 gap-6"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="text-3xl font-bold text-white">20K+</div>
              <div className="text-white/70 text-sm">Active Users</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="text-3xl font-bold text-white">93%</div>
              <div className="text-white/70 text-sm">Success Rate</div>
            </div>
          </motion.div>
        </div>

        {/* Motif de points - ajusté pour le fond violet */}
        <div className="absolute inset-0 opacity-[0.08]" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.4) 1px, transparent 0)`,
            backgroundSize: '30px 30px'
          }}
        />
      </motion.div>
    </div>
  );
}
