import { useState, useEffect, useLayoutEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import FirebaseImage from '../components/FirebaseImage';
import { forceLightMode } from '../lib/theme';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { login, resetPassword, resendVerificationEmail, signInWithGoogle } = useAuth();

  // Force light mode on login page
  useLayoutEffect(() => {
    forceLightMode();
  }, []);

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
    <div className="min-h-screen flex bg-white">
      {/* Panneau de connexion (gauche) */}
      <div className="w-full lg:w-1/2 p-8 lg:p-16 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="bg-white">
            <div className="mb-12">
              <Link to="/" className="flex justify-center group mb-10">
                <FirebaseImage 
                  path="images/logo-only.png"
                  alt="JOBZ.AI Logo" 
                  className="h-12 w-auto transform transition-transform group-hover:scale-105"
                />
              </Link>
              <h2 className="text-4xl font-semibold text-gray-900 tracking-tight text-center">
                Sign in to your account
              </h2>
              <p className="mt-4 text-base text-gray-600 text-center">
                Don't have an account?{' '}
                <Link to="/signup" className="font-medium text-gray-900 hover:text-gray-700 transition-colors underline underline-offset-4">
                  Create one
                </Link>
              </p>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
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
                    className="block w-full pl-11 pr-4 py-3.5 bg-white border border-gray-300 
                      rounded-lg text-gray-900 placeholder-gray-400 
                      focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900
                      transition-all duration-150 text-[15px]
                      disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Email address"
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="block w-full pl-11 pr-11 py-3.5 bg-white border border-gray-300 
                      rounded-lg text-gray-900 placeholder-gray-400
                      focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900
                      transition-all duration-150 text-[15px]
                      disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Password"
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
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
                  className="text-sm font-medium text-gray-900 hover:text-gray-700 transition-colors"
                >
                  Forgot your password?
                </button>
              </div>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 text-[13px]">
                    Or continue with
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5
                  bg-white border border-gray-300 rounded-lg 
                  hover:bg-gray-50 text-gray-900 
                  transition-all duration-150 text-[15px] font-medium
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
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
                <span>Continue with Google</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 px-4 py-3.5
                  bg-gray-900 hover:bg-gray-800
                  text-white font-medium rounded-lg
                  transition-all duration-150 text-[15px]
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-900"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="hidden lg:flex w-1/2 bg-gradient-to-bl from-[hsl(var(--primary))] via-[#9B7FE8] to-[#A88FEA] flex-col items-center justify-center p-16 relative overflow-hidden"
      >
        {/* Effets de lumière animés (différents de signup) */}
        <motion.div 
          animate={{ 
            x: [0, -120, 0],
            y: [0, 60, 0],
            scale: [1, 1.4, 1]
          }}
          transition={{ 
            duration: 18, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute top-0 left-0 w-[450px] h-[450px] bg-white/12 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            x: [0, 90, 0],
            y: [0, -50, 0],
            scale: [1, 1.25, 1]
          }}
          transition={{ 
            duration: 22, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-200/15 rounded-full blur-3xl"
        />
        
        {/* Gradient overlay animé (direction différente) */}
        <motion.div 
          animate={{ 
            backgroundPosition: ['100% 100%', '0% 0%']
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity, 
            repeatType: "reverse",
            ease: "linear" 
          }}
          className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/5 to-transparent"
          style={{
            backgroundSize: '200% 200%'
          }}
        />
        
        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16"
          >
            <motion.h3 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-6xl font-semibold text-white tracking-tight mb-4"
            >
              Welcome
            </motion.h3>
            <motion.h3 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-6xl font-semibold text-white tracking-tight mb-4"
            >
              back
            </motion.h3>
            <motion.h3 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="text-6xl font-semibold bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent tracking-tight"
            >
              champion
            </motion.h3>
          </motion.div>

          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-white/95 text-lg leading-relaxed mb-16 font-light"
          >
            Continue your journey with AI-powered job applications. Track your progress, discover new opportunities, and land your dream role.
          </motion.p>

          {/* Statistiques avec effet hover (style différent) */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="grid grid-cols-2 gap-8"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -5, rotate: 1 }}
              className="bg-white/15 backdrop-blur-md rounded-3xl p-6 border border-white/30 shadow-lg"
            >
              <div className="text-5xl font-bold text-white mb-2">20K+</div>
              <div className="text-white/90 text-sm font-medium">Active Users</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -5, rotate: -1 }}
              className="bg-white/15 backdrop-blur-md rounded-3xl p-6 border border-white/30 shadow-lg"
            >
              <div className="text-5xl font-bold text-white mb-2">93%</div>
              <div className="text-white/90 text-sm font-medium">Success Rate</div>
            </motion.div>
          </motion.div>
        </div>

        {/* Pattern animé (direction différente) */}
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
