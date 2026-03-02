import { useState, useLayoutEffect, useMemo } from 'react';
import SEO from '../components/SEO';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Loader2, RefreshCw, Eye, EyeOff, Check, X, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { notify } from '@/lib/notify';
import { forceLightMode } from '../lib/theme';
import FirebaseImage from '../components/FirebaseImage';

export default function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const navigate = useNavigate();
  const { signup, resendVerificationEmail, signInWithGoogle } = useAuth();

  // Password validation criteria
  const passwordCriteria = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[^a-zA-Z0-9]/.test(password),
    };
  }, [password]);

  const isPasswordValid = useMemo(() => {
    return Object.values(passwordCriteria).every(Boolean);
  }, [passwordCriteria]);

  const passwordsMatch = useMemo(() => {
    return password && confirmPassword && password === confirmPassword;
  }, [password, confirmPassword]);

  // Force light mode on signup page
  useLayoutEffect(() => {
    forceLightMode();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      notify.error('Please fill in all fields');
      return;
    }

    if (!isPasswordValid) {
      notify.error('Password does not meet security requirements');
      return;
    }

    if (password !== confirmPassword) {
      notify.error('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await signup(email, password, firstName, lastName);
      setShowVerificationMessage(true);
      notify.success('Account created! Please check your email to verify your account.');
    } catch (error) {
      console.error('Signup error:', error);
      notify.error(error instanceof Error ? error.message : 'Failed to create account');
      setShowVerificationMessage(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      notify.success('Verification email sent!');
    } catch (error) {
      console.error('Error resending verification:', error);
      notify.error('Failed to resend verification email');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      navigate('/hub');
      notify.success('Successfully signed up with Google!');
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      notify.error('Failed to sign up with Google');
    } finally {
      setIsLoading(false);
    }
  };

  if (showVerificationMessage) {
    return (
      <div className="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0" style={{ backgroundImage: `url('/images/hero-bg.png')`, backgroundSize: 'cover', backgroundPosition: 'center top' }} />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-md w-full space-y-8 bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/50 text-center"
        >
          <div>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
              <Mail className="h-8 w-8 text-gray-900" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Check your email
            </h2>
            <p className="mt-3 text-gray-500 leading-relaxed">
              We've sent a verification link to <strong className="text-gray-900">{email}</strong>
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <button
              onClick={handleResendVerification}
              className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Resend email
            </button>

            <Link
              to="/login"
              className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-all"
            >
              Continue to login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6">
      <SEO
        title="Inscription – Cubbbe | Créez votre compte gratuitement"
        description="Créez votre compte Cubbbe et commencez à automatiser votre recherche d'emploi avec l'IA. Inscription gratuite."
        url="/signup"
      />

      {/* Background image */}
      <div className="absolute inset-0" style={{ backgroundImage: `url('/images/hero-bg.png')`, backgroundSize: 'cover', backgroundPosition: 'center top' }} />
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />

      {/* Centered form card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-7 sm:p-8 shadow-xl border border-white/50">
          {/* Logo */}
          <Link to="/" className="flex justify-center mb-6">
            <FirebaseImage
              path="images/logo-only.png"
              alt="Cubbbe Logo"
              className="h-9 w-auto"
            />
          </Link>

          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Create your account
            </h1>
            <p className="mt-1.5 text-gray-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-gray-900 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3
              bg-white border border-gray-200 rounded-xl 
              hover:border-gray-300 hover:bg-gray-50
              transition-all duration-200 text-sm font-medium
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.192 0 7.556 0 9s.348 2.808.957 4.039l3.007-2.332z" />
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
            </svg>
            Continue with Google
          </button>

          {/* Separator */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white/80 text-gray-400 text-xs uppercase tracking-wider">
                or
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 
                    rounded-xl text-gray-900 placeholder-gray-400 
                    focus:outline-none focus:ring-2 focus:ring-gray-900
                    transition-all text-sm"
                  placeholder="First name"
                />
              </div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 
                    rounded-xl text-gray-900 placeholder-gray-400 
                    focus:outline-none focus:ring-2 focus:ring-gray-900
                    transition-all text-sm"
                  placeholder="Last name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 
                  rounded-xl text-gray-900 placeholder-gray-400 
                  focus:outline-none focus:ring-2 focus:ring-gray-900
                  transition-all text-sm"
                placeholder="Email address"
              />
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className={`block w-full pl-10 pr-10 py-2.5 bg-gray-50 border-0 
                    rounded-xl text-gray-900 placeholder-gray-400 
                    focus:outline-none focus:ring-2 transition-all text-sm
                    ${password && !isPasswordValid ? 'ring-2 ring-red-400' : 'focus:ring-gray-900'}`}
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

              {/* Password Requirements */}
              {password && (passwordFocused || !isPasswordValid) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 flex flex-wrap gap-1.5"
                >
                  {[
                    { key: 'minLength', label: '8+ chars' },
                    { key: 'hasUpperCase', label: 'A-Z' },
                    { key: 'hasLowerCase', label: 'a-z' },
                    { key: 'hasNumber', label: '0-9' },
                    { key: 'hasSpecialChar', label: '!@#$' },
                  ].map((req) => (
                    <span
                      key={req.key}
                      className={`text-xs px-2 py-1 rounded-md transition-colors ${passwordCriteria[req.key as keyof typeof passwordCriteria]
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                        }`}
                    >
                      {passwordCriteria[req.key as keyof typeof passwordCriteria] && (
                        <Check className="w-3 h-3 inline mr-1" />
                      )}
                      {req.label}
                    </span>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`block w-full pl-10 pr-10 py-2.5 bg-gray-50 border-0 
                    rounded-xl text-gray-900 placeholder-gray-400 
                    focus:outline-none focus:ring-2 transition-all text-sm
                    ${confirmPassword && !passwordsMatch
                      ? 'ring-2 ring-red-400'
                      : confirmPassword && passwordsMatch
                        ? 'ring-2 ring-green-500'
                        : 'focus:ring-gray-900'}`}
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <X className="w-3 h-3" /> Passwords don't match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isPasswordValid || !passwordsMatch || !firstName || !lastName || !email}
              className="w-full flex justify-center items-center gap-2 px-4 py-3
                bg-gray-900 hover:bg-gray-800
                text-white font-medium rounded-xl
                transition-all text-sm
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Terms */}
          <p className="mt-5 text-center text-xs text-gray-400">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="underline hover:text-gray-600">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
          </p>
        </div>

        {/* Social proof below card */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="flex -space-x-1.5">
            {[
              'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=b6e3f4',
              'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike&backgroundColor=c0aede',
              'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&backgroundColor=ffd5dc',
            ].map((src, i) => (
              <div key={i} className="w-5 h-5 rounded-full border-2 border-white overflow-hidden bg-gray-100">
                <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
          <span className="text-xs text-gray-500">Join <strong className="text-gray-700">20,000+</strong> job seekers</span>
        </div>
      </motion.div>
    </div>
  );
}
