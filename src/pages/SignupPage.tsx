import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Loader2, RefreshCw, Eye, EyeOff, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
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

  // Calculate password strength (0-5)
  const passwordStrength = useMemo(() => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (passwordCriteria.hasUpperCase && passwordCriteria.hasLowerCase) strength++;
    if (passwordCriteria.hasNumber) strength++;
    if (passwordCriteria.hasSpecialChar) strength++;
    return strength;
  }, [password, passwordCriteria]);

  // Check if password meets all requirements
  const isPasswordValid = useMemo(() => {
    return Object.values(passwordCriteria).every(Boolean);
  }, [passwordCriteria]);

  // Check if passwords match
  const passwordsMatch = useMemo(() => {
    return password && confirmPassword && password === confirmPassword;
  }, [password, confirmPassword]);

  // Force light mode on signup page
  useEffect(() => {
    forceLightMode();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!isPasswordValid) {
      toast.error('Password does not meet security requirements');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await signup(email, password, firstName, lastName);
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

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      navigate('/hub');
      toast.success('Successfully signed up with Google!');
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      toast.error('Failed to sign up with Google');
    } finally {
      setIsLoading(false);
    }
  };

  if (showVerificationMessage) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md w-full space-y-8 bg-white text-center"
        >
          <div>
            <Mail className="mx-auto h-12 w-12 text-gray-900" />
            <h2 className="mt-8 text-4xl font-semibold text-gray-900 tracking-tight">
              Verify your email
            </h2>
            <p className="mt-4 text-base text-gray-600 leading-relaxed">
              We've sent a verification link to <strong className="text-gray-900">{email}</strong>. Please check your inbox and click the link to verify your account.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleResendVerification}
              className="flex items-center justify-center w-full px-4 py-3.5 text-[15px] font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-150"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Resend verification email
            </button>

            <Link
              to="/login"
              className="block w-full px-4 py-3.5 text-[15px] font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all duration-150"
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
    <div className="min-h-screen flex bg-white">
      {/* Panneau de formulaire (gauche) */}
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
                Create your account
              </h2>
              <p className="mt-4 text-base text-gray-600 text-center">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-gray-900 hover:text-gray-700 transition-colors underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  {/* First Name Input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-white border border-gray-300 
                        rounded-lg text-gray-900 placeholder-gray-400 
                        focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900
                        transition-all duration-150 text-[15px]"
                      placeholder="First name"
                    />
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  
                  {/* Last Name Input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-white border border-gray-300 
                        rounded-lg text-gray-900 placeholder-gray-400 
                        focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900
                        transition-all duration-150 text-[15px]"
                      placeholder="Last name"
                    />
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Email Input */}
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-white border border-gray-300 
                      rounded-lg text-gray-900 placeholder-gray-400 
                      focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900
                      transition-all duration-150 text-[15px]"
                    placeholder="Email address"
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>

                {/* Password Input */}
                <div>
                <div className="relative">
                  <input
                      type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                      className={`block w-full pl-11 pr-11 py-3.5 bg-white border rounded-lg 
                        text-gray-900 placeholder-gray-400 
                        focus:outline-none focus:ring-1 transition-all duration-150 text-[15px]
                        ${
                          password && !isPasswordValid
                            ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                            : password && isPasswordValid
                            ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                            : 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
                        }`}
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

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <motion.div
                            key={level}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: passwordStrength >= level ? 1 : 0 }}
                            transition={{ duration: 0.2, delay: level * 0.03 }}
                            className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                              passwordStrength >= level
                                ? passwordStrength <= 2
                                  ? 'bg-red-500'
                                  : passwordStrength <= 3
                                  ? 'bg-amber-500'
                                  : 'bg-green-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${
                        passwordStrength <= 2 ? 'text-red-600' :
                        passwordStrength <= 3 ? 'text-amber-600' :
                        'text-green-600'
                      }`}>
                        {passwordStrength <= 2 ? 'Weak password' :
                         passwordStrength <= 3 ? 'Medium password' :
                         'Strong password'}
                      </p>
                    </div>
                  )}

                  {/* Password Requirements */}
                  {password && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <p className="text-xs font-semibold text-gray-900 mb-3">
                        Password requirements:
                      </p>
                      <ul className="space-y-2 text-xs text-gray-600">
                        <li className={`flex items-center gap-2.5 transition-colors ${
                          passwordCriteria.minLength 
                            ? 'text-gray-900' 
                            : 'text-gray-500'
                        }`}>
                          {passwordCriteria.minLength ? (
                            <Check className="w-3.5 h-3.5 flex-shrink-0 text-green-600" />
                          ) : (
                            <X className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                          )}
                          <span>At least 8 characters</span>
                        </li>
                        <li className={`flex items-center gap-2.5 transition-colors ${
                          passwordCriteria.hasUpperCase && passwordCriteria.hasLowerCase
                            ? 'text-gray-900' 
                            : 'text-gray-500'
                        }`}>
                          {passwordCriteria.hasUpperCase && passwordCriteria.hasLowerCase ? (
                            <Check className="w-3.5 h-3.5 flex-shrink-0 text-green-600" />
                          ) : (
                            <X className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                          )}
                          <span>Uppercase and lowercase letters</span>
                        </li>
                        <li className={`flex items-center gap-2.5 transition-colors ${
                          passwordCriteria.hasNumber
                            ? 'text-gray-900' 
                            : 'text-gray-500'
                        }`}>
                          {passwordCriteria.hasNumber ? (
                            <Check className="w-3.5 h-3.5 flex-shrink-0 text-green-600" />
                          ) : (
                            <X className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                          )}
                          <span>At least one number</span>
                        </li>
                        <li className={`flex items-center gap-2.5 transition-colors ${
                          passwordCriteria.hasSpecialChar
                            ? 'text-gray-900' 
                            : 'text-gray-500'
                        }`}>
                          {passwordCriteria.hasSpecialChar ? (
                            <Check className="w-3.5 h-3.5 flex-shrink-0 text-green-600" />
                          ) : (
                            <X className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                          )}
                          <span>At least one special character (!@#$%^&*)</span>
                        </li>
                      </ul>
                    </motion.div>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div>
                <div className="relative">
                  <input
                      type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`block w-full pl-11 pr-11 py-3.5 bg-white border rounded-lg 
                        text-gray-900 placeholder-gray-400 
                        focus:outline-none focus:ring-1 transition-all duration-150 text-[15px]
                        ${
                          confirmPassword && !passwordsMatch
                            ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                            : confirmPassword && passwordsMatch
                            ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                            : 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
                        }`}
                    placeholder="Confirm password"
                  />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Match Indicator */}
                  {confirmPassword && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2.5 flex items-center gap-2"
                    >
                      {passwordsMatch ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">
                            Passwords match
                          </span>
                        </>
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5 text-red-600" />
                          <span className="text-xs text-red-600 font-medium">
                            Passwords do not match
                          </span>
                        </>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Séparateur */}
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

              {/* Boutons */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5
                  bg-white border border-gray-300 rounded-lg 
                  hover:bg-gray-50 text-gray-900 
                  transition-all duration-150 text-[15px] font-medium"
              >
                {/* Google SVG icon */}
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
                disabled={isLoading || !isPasswordValid || !passwordsMatch || !firstName || !lastName || !email}
                className="w-full flex justify-center items-center gap-2 px-4 py-3.5
                  bg-gray-900 hover:bg-gray-800
                  text-white font-medium rounded-lg
                  transition-all duration-150 text-[15px]
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-900"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create account</span>
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
        className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#8D75E6] via-[#7B65D4] to-[#6F58B8] flex-col items-center justify-center p-16 relative overflow-hidden"
      >
        {/* Effets de lumière animés */}
        <motion.div 
          animate={{ 
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            x: [0, -80, 0],
            y: [0, -40, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-300/20 rounded-full blur-3xl"
        />
        
        {/* Gradient overlay animé */}
        <motion.div 
          animate={{ 
            backgroundPosition: ['0% 0%', '100% 100%']
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            repeatType: "reverse",
            ease: "linear" 
          }}
          className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"
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
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-6xl font-semibold text-white tracking-tight mb-4"
            >
              Welcome to
            </motion.h3>
            <motion.h3 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-6xl font-semibold text-white tracking-tight mb-4"
            >
              your future
            </motion.h3>
            <motion.h3 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="text-6xl font-semibold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent tracking-tight"
            >
              career
            </motion.h3>
            </motion.div>

          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-white/95 text-lg leading-relaxed mb-16 font-light"
          >
            Join thousands of professionals who've transformed their job search with AI-powered personalized applications. Start your journey today.
          </motion.p>

          {/* Statistiques avec effet hover */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="grid grid-cols-2 gap-8"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <div className="text-5xl font-bold text-white mb-2">20K+</div>
              <div className="text-white/90 text-sm font-medium">Active Users</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <div className="text-5xl font-bold text-white mb-2">93%</div>
              <div className="text-white/90 text-sm font-medium">Success Rate</div>
            </motion.div>
          </motion.div>
        </div>

        {/* Pattern animé */}
        <motion.div 
          animate={{ 
            backgroundPosition: ['0 0', '40px 40px']
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute inset-0 opacity-[0.15]" 
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.6) 1.5px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </motion.div>
    </div>
  );
}
