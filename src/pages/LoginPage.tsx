import { useState, useLayoutEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Eye, EyeOff, ArrowRight, Sparkles, Clock, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { notify } from '@/lib/notify';
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
      notify.error('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      await new Promise(resolve => setTimeout(resolve, 100));
      navigate('/hub');
    } catch (error: any) {
      console.error('Login error:', error);

      switch (error.code) {
        case 'auth/invalid-credential':
          notify.error('Invalid email or password');
          break;
        case 'auth/user-not-found':
          notify.error('No account found with this email');
          break;
        case 'auth/wrong-password':
          notify.error('Incorrect password');
          break;
        case 'auth/too-many-requests':
          notify.error('Too many failed attempts. Please try again later');
          break;
        default:
          if (error.message === 'Please verify your email before logging in') {
            notify.error('Please verify your email before logging in', {
              action: {
                label: 'Resend verification',
                onClick: async () => {
                  try {
                    await resendVerificationEmail();
                    notify.success('Verification email sent!');
                  } catch (err) {
                    notify.error('Failed to send verification email');
                  }
                },
              },
            });
          } else {
            notify.error('Failed to log in. Please try again');
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
      notify.success('Successfully signed in with Google!');
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      notify.error('Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (email) {
      try {
        await resetPassword(email);
        notify.success('Password reset email sent!');
      } catch (error) {
        notify.error('Failed to send reset email');
      }
    } else {
      notify.error('Please enter your email first');
    }
  };

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
              Welcome back
            </h1>
            <p className="mt-2 text-gray-500 text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-gray-900 font-medium hover:underline">
                Create one
              </Link>
            </p>
          </div>

          {/* Google Button - FIRST and PROMINENT */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5
              bg-white border-2 border-gray-200 rounded-xl 
              hover:border-gray-300 hover:bg-gray-50
              transition-all duration-200 text-[15px] font-medium
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="20" height="20" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.192 0 7.556 0 9s.348 2.808.957 4.039l3.007-2.332z" />
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
            </svg>
            Continue with Google
          </button>

          {/* Separator */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-gray-400 text-xs uppercase tracking-wider">
                or
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="block w-full pl-10 pr-4 py-3 bg-gray-50 border-0 
                  rounded-xl text-gray-900 placeholder-gray-400 
                  focus:outline-none focus:ring-2 focus:ring-gray-900
                  transition-all text-sm
                  disabled:opacity-50"
                placeholder="Email address"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="block w-full pl-10 pr-10 py-3 bg-gray-50 border-0 
                  rounded-xl text-gray-900 placeholder-gray-400 
                  focus:outline-none focus:ring-2 focus:ring-gray-900
                  transition-all text-sm
                  disabled:opacity-50"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full flex justify-center items-center gap-2 px-4 py-3.5
                bg-gray-900 hover:bg-gray-800
                text-white font-medium rounded-xl
                transition-all text-sm
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-gray-400">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="underline hover:text-gray-600">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
          </p>
        </motion.div>
      </div>

      {/* Side Panel - Right (Desktop Only) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="hidden lg:flex w-[55%] flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 30%, #2d1f4e 60%, #3b2a6b 100%)'
        }}
      >
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
              Your applications
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-violet-200">
                are waiting.
              </span>
            </h2>
            <p className="text-white/70 text-lg leading-relaxed">
              Pick up where you left off. Your AI-powered job search continues.
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
              { icon: Sparkles, text: 'New matches since your last visit', value: '12' },
              { icon: Clock, text: 'Applications sent this week', value: '47' },
              { icon: Shield, text: 'Response rate', value: '89%' },
            ].map((stat, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-xl px-5 py-4 border border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-purple-300" />
                  </div>
                  <span className="text-white/80 text-sm">{stat.text}</span>
                </div>
                <span className="text-white font-bold text-lg">{stat.value}</span>
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
            "Consistency is key. Keep applying, you're closer than you think."
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
